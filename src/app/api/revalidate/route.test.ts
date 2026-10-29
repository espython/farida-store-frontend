// @vitest-environment node
import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { POST } from "./route";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const SECRET = "whsec";
const body = JSON.stringify({ id: 108, slug: "qa-sale" });
const sign = (b: string, s = SECRET) => createHmac("sha256", s).update(b, "utf8").digest("base64");
const post = (b: string, headers: Record<string, string> = {}) =>
  POST(new NextRequest("http://localhost/api/revalidate", { method: "POST", body: b, headers }), undefined);

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    process.env.WC_WEBHOOK_SECRET = SECRET;
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(revalidateTag).mockClear();
  });

  it("drops the catalog cache on a signed delivery", async () => {
    const res = await post(body, { "x-wc-webhook-signature": sign(body), "x-wc-webhook-topic": "product.updated" });
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("catalog");
  });

  it("rejects a bad or missing signature without revalidating", async () => {
    expect((await post(body, { "x-wc-webhook-signature": sign(body, "nope") })).status).toBe(401);
    expect((await post(body)).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("answers Woo's unsigned creation ping without revalidating", async () => {
    const res = await post("webhook_id=3", { "content-type": "application/x-www-form-urlencoded" });
    expect(res.status).toBe(200);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("fails closed when the secret is not configured", async () => {
    delete process.env.WC_WEBHOOK_SECRET;
    expect((await post(body, { "x-wc-webhook-signature": sign(body, "") })).status).toBe(500);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("only serves POST", async () => {
    const { GET } = await import("./route");
    expect((await GET(new NextRequest("http://localhost/api/revalidate"), undefined)).status).toBe(405);
  });
});
