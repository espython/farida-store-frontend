// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as forgotRoute from "./password/forgot/route";
import * as resetRoute from "./password/reset/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id = 7) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 86400, data: { user: { id } } })}.sig`;
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
let ip = 0;
// Each test gets its own visitor, so the in-memory limits don't leak between tests.
const post = (path: string, body: unknown, from = `10.0.0.${++ip}`) =>
  new NextRequest(new URL(path, "http://localhost"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "x-forwarded-for": from, "Content-Type": "application/json" },
  });
const setCookies = (res: Response): string[] => (res.headers as Headers & { getSetCookie(): string[] }).getSetCookie();
const link = { key: "AbCdEfGhIjKlMnOpQrSt", login: "c_1a2b3c4d5e6f" };

describe("/api/auth/password routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const calls = () => fetchMock.mock.calls.map(([url, init]) => ({ path: new URL(String(url)).pathname, body: init?.body ? JSON.parse(String(init.body)) : null }));
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn(async () => respond(202, { accepted: true }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("forgot", () => {
    it("asks WordPress to email a link to the storefront page in the visitor's language", async () => {
      const res = await forgotRoute.POST(post("/api/auth/password/forgot", { email: " Nour@Example.com ", locale: "ar" }), {});
      expect(res.status).toBe(202);
      expect(await res.json()).toEqual({ ok: true });
      expect(calls()).toEqual([
        { path: "/wp-json/wc-farida/v1/password/forgot", body: { email: "nour@example.com", locale: "ar", resetUrl: "http://localhost:3000/ar/reset-password" } },
      ]);
      expect(String(fetchMock.mock.calls[0][1].headers.Authorization)).toMatch(/^Basic /);
    });

    it("refuses an invalid email before calling WordPress", async () => {
      const res = await forgotRoute.POST(post("/api/auth/password/forgot", { email: "nope" }), {});
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatchObject({ code: "invalid_input", details: { email: "email_invalid" } });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("limits a visitor to 5 requests per 15 minutes", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) statuses.push((await forgotRoute.POST(post("/api/auth/password/forgot", { email: `a${i}@example.com` }, "10.9.9.9"), {})).status);
      expect(statuses).toEqual([202, 202, 202, 202, 202, 429]);
    });

    it("emails one address at most 3 times an hour, answering the same", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i++) statuses.push((await forgotRoute.POST(post("/api/auth/password/forgot", { email: "flood@example.com" }), {})).status);
      expect(statuses).toEqual([202, 202, 202, 202]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("reset", () => {
    it("sets the password, signs in with it and sets the session cookies", async () => {
      const token = jwt(7);
      fetchMock
        .mockResolvedValueOnce(respond(200, { email: "nour@example.com" }))
        .mockResolvedValueOnce(respond(200, { token, user_email: "nour@example.com", user_nicename: "n", user_display_name: "Nour" }));
      const res = await resetRoute.POST(post("/api/auth/password/reset", { ...link, password: "NewPass1" }), {});
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).not.toContain(token);
      expect(JSON.parse(text).session).toMatchObject({ customerId: "7", email: "nour@example.com" });
      expect(calls()).toEqual([
        { path: "/wp-json/wc-farida/v1/password/reset", body: { ...link, password: "NewPass1" } },
        { path: "/wp-json/jwt-auth/v1/token", body: { username: "nour@example.com", password: "NewPass1" } },
      ]);
      expect(setCookies(res)[0]).toMatch(/^credentials=.*HttpOnly/i);
    });

    it("applies the password rule before calling WordPress", async () => {
      const res = await resetRoute.POST(post("/api/auth/password/reset", { ...link, password: "alllower1" }), {});
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatchObject({ code: "invalid_input", details: { password: "password_needs_uppercase" } });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("refuses a malformed link without calling WordPress", async () => {
      const res = await resetRoute.POST(post("/api/auth/password/reset", { key: "a b", login: link.login, password: "NewPass1" }), {});
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("invalid_reset_link");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("reports a used or expired key as an invalid link, with no cookies", async () => {
      fetchMock.mockResolvedValueOnce(respond(400, { code: "farida_invalid_reset_key", message: "x" }));
      const res = await resetRoute.POST(post("/api/auth/password/reset", { ...link, password: "NewPass1" }), {});
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("invalid_reset_link");
      expect(setCookies(res)).toEqual([]);
    });

    it("accepts only POST", async () => {
      const res = await resetRoute.GET(new NextRequest(new URL("/api/auth/password/reset", "http://localhost")), {});
      expect(res.status).toBe(405);
    });
  });
});
