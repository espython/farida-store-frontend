// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "./errorMapping";
import { wooFetch } from "./wooClient.server";

const ok = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("wooFetch", () => {
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test/";
    process.env.WC_CONSUMER_KEY = "ck_x";
    process.env.WC_CONSUMER_SECRET = "cs_y";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds the URL, skips undefined query values and sends no keys by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok([{ id: 1 }]));
    vi.stubGlobal("fetch", fetchMock);
    const res = await wooFetch({
      path: "/wc/store/v1/products",
      query: { page: 2, search: undefined },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://woo.test/wp-json/wc/store/v1/products?page=2");
    expect(init.headers.Authorization).toBeUndefined();
    expect(res.data).toEqual([{ id: 1 }]);
  });

  it("rejects routes that are not allowlisted before any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(wooFetch({ method: "POST", path: "/wc/v3/orders" })).rejects.toBeInstanceOf(AppError);
    await expect(wooFetch({ path: "/wc/v3/customers" })).rejects.toBeInstanceOf(AppError);
    await expect(
      wooFetch({ method: "POST", path: "/wc/store/v1/products" })
    ).rejects.toBeInstanceOf(AppError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends basic auth with keys and disables caching", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await wooFetch({
      path: "/wc/v3/orders",
      auth: "keys",
      allowlist: [{ method: "GET", pattern: /^\/wc\/v3\/orders$/ }],
    });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("ck_x:cs_y").toString("base64")}`);
    expect(init.cache).toBe("no-store");
  });

  it("maps 404, auth failures and 5xx to safe errors", async () => {
    const cases: [number, string, number][] = [
      [404, "not_found", 404],
      [401, "upstream_error", 502],
      [500, "upstream_error", 502],
    ];
    for (const [upstream, code, status] of cases) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ message: "secret detail" }, upstream)));
      await expect(wooFetch({ path: "/wc/store/v1/products" })).rejects.toMatchObject({
        code,
        status,
        message: expect.not.stringContaining("secret"),
      });
    }
  });

  it("keeps Woo's machine-readable code for client errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        ok({ code: "woocommerce_rest_product_partially_out_of_stock", message: "Only 1 left" }, 400)
      )
    );
    await expect(wooFetch({ path: "/wc/store/v1/products" })).rejects.toMatchObject({
      code: "woocommerce_rest_product_partially_out_of_stock",
      status: 400,
    });
  });

  it("never caches a request that carries a customer's Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await wooFetch({ path: "/wc/store/v1/cart", headers: { Authorization: "Bearer jwt" }, next: { revalidate: 60 } });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    expect(fetchMock.mock.calls[0][1].next).toBeUndefined();
  });

  it("lets a request translate expected failures before the generic mapping", async () => {
    const mapError = (status: number) => (status === 403 ? new AppError("invalid_credentials", "Nope", 401) : undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ code: "x" }, 403)));
    await expect(wooFetch({ method: "POST", path: "/jwt-auth/v1/token", mapError })).rejects.toMatchObject({
      code: "invalid_credentials",
      status: 401,
    });
    // Anything the hook does not claim still gets the safe generic error.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({}, 500)));
    await expect(wooFetch({ method: "POST", path: "/jwt-auth/v1/token", mapError })).rejects.toMatchObject({
      code: "upstream_error",
      status: 502,
    });
  });

  it("allows only the customer routes A1/A4/O3 need, not wider WordPress or Woo admin paths", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => ok({})));
    for (const [method, path] of [
      ["GET", "/wc/v3/products/reviews"],
      ["POST", "/wc/v3/products/reviews"],
      ["GET", "/wc/store/v1/products/reviews"],
    ] as const) {
      await expect(wooFetch({ method, path, auth: "none" })).resolves.toBeDefined();
    }
    for (const [method, path] of [
      ["PUT", "/wc/v3/products/reviews/5"],
      ["DELETE", "/wc/v3/products/reviews/5"],
      ["POST", "/wc/v3/products/reviews/batch"],
      ["GET", "/wp/v2/comments"],
      ["GET", "/wp/v2/users"],
      ["GET", "/wc/v3/customers"],
      ["DELETE", "/wc/v3/customers/4"],
      ["POST", "/wc/v3/customers/4"],
      ["GET", "/wc/v3/customers/4/downloads"],
      ["POST", "/jwt-auth/v1/admin/settings"],
    ] as const) {
      await expect(wooFetch({ method, path })).rejects.toMatchObject({ status: 500 });
    }
  });

  it("maps aborts to 504 and network failures to 502", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    await expect(wooFetch({ path: "/wc/store/v1/products" })).rejects.toMatchObject({
      code: "upstream_timeout",
      status: 504,
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(wooFetch({ path: "/wc/store/v1/products" })).rejects.toMatchObject({
      code: "upstream_error",
      status: 502,
    });
  });

  it("fails clearly when WC_BASE_URL is missing", async () => {
    delete process.env.WC_BASE_URL;
    await expect(wooFetch({ path: "/wc/store/v1/products" })).rejects.toMatchObject({
      status: 500,
    });
  });
});
