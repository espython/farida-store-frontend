// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as route from "./route";

const req = (q = "") => new NextRequest(new URL(`/api/shop/promotions${q}`, "http://localhost"));

describe("/api/shop/promotions", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([
        { id: 2, placement: "announcement", text: "توصيل مجاني", image: null, link: "/products", order: 1 },
        { id: 3, placement: "mini", text: "عروض", image: null, link: null, order: 1 },
      ]))
    );
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns the promotions for the language, from the public WordPress route without keys", async () => {
    const res = await route.GET(req("?locale=ar"), {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      hero: [],
      announcements: [{ id: "2", placement: "announcement", text: "توصيل مجاني", image: null, link: { kind: "internal", href: "/products" } }],
      mini: [{ id: "3", placement: "mini", text: "عروض", image: null, link: null }],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(url).pathname).toBe("/wp-json/farida/v1/promos");
    expect(new URL(url).searchParams.get("lang")).toBe("ar");
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("defaults to English, refuses other languages, and hides upstream failures", async () => {
    await route.GET(req(), {});
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("lang")).toBe("en");
    expect((await route.GET(req("?locale=fr"), {})).status).toBe(400);
    fetchMock.mockImplementation(async () => new Response("<html>fatal</html>", { status: 500 }));
    const res = await route.GET(req(), {});
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("fatal");
    expect((await route.POST(req(), {})).status).toBe(405);
  });
});
