// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const req = (body: unknown, ip = "1.1.1.1") =>
  new NextRequest(new URL("/api/contact", "http://localhost"), {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const good = { name: "Mona", email: "mona@example.test", message: "Is the kettle in stock?", locale: "ar" };

describe("/api/contact", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let route: typeof import("./route");
  beforeEach(async () => {
    vi.resetModules(); // a fresh rate limiter per test
    route = await import("./route");
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.CONTACT_SHARED_SECRET = "s".repeat(32);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 9 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("saves the message in WordPress with the shared secret and the language", async () => {
    const res = await route.POST(req({ ...good, name: "  Mona  " }), {});
    expect(res.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(url).pathname).toBe("/wp-json/farida/v1/contact");
    expect(init.method).toBe("POST");
    expect(init.headers["X-Farida-Contact-Secret"]).toBe("s".repeat(32));
    expect(init.headers).not.toHaveProperty("Authorization");
    expect(JSON.parse(init.body)).toEqual({ name: "Mona", email: "mona@example.test", message: "Is the kettle in stock?", locale: "ar" });
  });

  it("rejects invalid input with field codes, never echoing it", async () => {
    const res = await route.POST(req({ name: "<script>xss</script>", email: "nope", message: "" }), {});
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(JSON.parse(text).error.details).toEqual({ email: "invalid_email", message: "required" });
    expect(text).not.toContain("xss");
    expect((await route.POST(req("not json"), {})).status).toBe(400);
    expect((await route.POST(req({ ...good, locale: "fr" }), {})).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits each visitor to 5 messages per 15 minutes", async () => {
    for (let i = 0; i < 5; i++) expect((await route.POST(req(good), {})).status).toBe(201);
    expect((await route.POST(req(good), {})).status).toBe(429);
    expect((await route.POST(req(good, "2.2.2.2"), {})).status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("fails closed: no secret is a 503, a refused secret or WordPress error a 502", async () => {
    delete process.env.CONTACT_SHARED_SECRET;
    expect((await route.POST(req(good), {})).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    process.env.CONTACT_SHARED_SECRET = "s".repeat(32);
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ code: "farida_contact_forbidden" }), { status: 403 }));
    expect((await route.POST(req(good, "3.3.3.3"), {})).status).toBe(502);
    fetchMock.mockImplementation(async () => new Response("<html>fatal</html>", { status: 500 }));
    const res = await route.POST(req(good, "4.4.4.4"), {});
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("fatal");
  });

  it("only accepts POST", async () => {
    expect((await route.GET(req(good), {})).status).toBe(405);
  });
});
