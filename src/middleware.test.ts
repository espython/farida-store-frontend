// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-intl/middleware", () => ({
  default: () => () => new Response(null, { status: 200, headers: { "x-i18n": "1" } }),
}));
import middleware from "./middleware";
import { NextResponse } from "next/server";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (exp: number) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp, data: { user: { id: 7 } } })}.sig`;
const now = () => Math.floor(Date.now() / 1000);
const req = (path: string, cookie?: string) => new NextRequest(new URL(path, "http://localhost:3000"), { headers: cookie ? { cookie } : {} });
const run = (path: string, cookie?: string) => middleware(req(path, cookie)) as NextResponse;
// Node's Headers has getSetCookie(); this TypeScript lib does not declare it yet.
const setCookies = (res: Response): string[] => (res.headers as Headers & { getSetCookie(): string[] }).getSetCookie();

describe("middleware", () => {
  it("redirects a guest to sign in, with next", () => {
    const res = run("/ar/userorders?page=2");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`http://localhost:3000/ar/login?next=${encodeURIComponent("/ar/userorders?page=2")}`);
  });

  it("lets a signed-in customer through to i18n routing", () => {
    const res = run("/en/userorders", `credentials=${token(now() + 3600)}`);
    expect(res.headers.get("x-i18n")).toBe("1");
  });

  it("treats an expired or unreadable token as signed out and drops the cookies", () => {
    for (const bad of [token(now() - 10), token(now() + 30), "garbage"]) {
      const res = run("/en/user", `credentials=${bad}; logged_in=1`);
      expect(res.headers.get("location")).toContain("/en/login?next=");
      const cleared = setCookies(res).join(" | ");
      expect(cleared).toMatch(/credentials=;/);
      expect(cleared).toMatch(/logged_in=;/);
    }
  });

  it("does not touch product pages whose slug looks like a protected path", () => {
    expect(run("/en/product/shipping-box").headers.get("x-i18n")).toBe("1");
  });

  it("sends a signed-in customer away from login to next", () => {
    const res = run("/en/login?next=%2Fen%2Fcart%2Fshipping", `credentials=${token(now() + 3600)}`);
    expect(res.headers.get("location")).toBe("http://localhost:3000/en/cart/shipping");
  });
});
