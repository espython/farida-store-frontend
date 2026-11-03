// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as startRoute from "./google/start/route";
import * as callbackRoute from "./google/callback/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const wpJwt = (id = 7) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 86400, data: { user: { id } } })}.sig`;
const idToken = (over: Record<string, unknown> = {}) =>
  `${b64({ alg: "RS256" })}.${b64({
    iss: "https://accounts.google.com",
    aud: "client-1",
    exp: Math.floor(Date.now() / 1000) + 3600,
    nonce: "nonce-1",
    sub: "110248495921238986420",
    email: "salma@gmail.com",
    email_verified: true,
    given_name: "Salma",
    family_name: "Kamal",
    ...over,
  })}.sig`;
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const setCookies = (res: Response): string[] => (res.headers as Headers & { getSetCookie(): string[] }).getSetCookie();
const flow = (over: Record<string, unknown> = {}) =>
  `g_flow=${encodeURIComponent(JSON.stringify({ state: "state-1", verifier: "v".repeat(64), nonce: "nonce-1", locale: "ar", next: "/ar/cart/shipping", ...over }))}`;
const get = (path: string, cookie = "") => new NextRequest(new URL(path, "http://localhost"), { headers: { cookie, "x-forwarded-for": `10.4.0.${Math.floor(Math.random() * 250)}` } });
const callback = (query: string, cookie = flow()) => callbackRoute.GET(get(`/api/auth/google/callback?${query}`, cookie), {});

describe("Google sign-in routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-1";
    process.env.GOOGLE_CLIENT_SECRET = "secret-1";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  describe("start", () => {
    it("sends the visitor to Google with state, nonce and PKCE, remembering the attempt", async () => {
      const res = await startRoute.GET(get("/api/auth/google/start?locale=ar&next=%2Far%2Fcart%2Fshipping"), {});
      expect(res.status).toBe(307);
      const to = new URL(res.headers.get("location")!);
      expect(to.origin + to.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
      const q = Object.fromEntries(to.searchParams);
      expect(q).toMatchObject({ client_id: "client-1", response_type: "code", scope: "openid email profile", code_challenge_method: "S256", redirect_uri: "http://localhost:3000/api/auth/google/callback", hl: "ar" });
      const cookie = setCookies(res)[0];
      expect(cookie).toMatch(/^g_flow=.*HttpOnly/i);
      expect(cookie).toMatch(/Path=\/api\/auth\/google/);
      expect(cookie).toMatch(/SameSite=lax/i);
      const saved = JSON.parse(decodeURIComponent(cookie.split(";")[0].slice("g_flow=".length)));
      expect(saved).toMatchObject({ state: q.state, nonce: q.nonce, locale: "ar", next: "/ar/cart/shipping" });
      expect(q.code_challenge).not.toBe(saved.verifier);
    });

    it("drops an unsafe next", async () => {
      const res = await startRoute.GET(get("/api/auth/google/start?locale=en&next=%2F%2Fevil.test"), {});
      const cookie = setCookies(res)[0];
      expect(JSON.parse(decodeURIComponent(cookie.split(";")[0].slice(7))).next).toBeNull();
    });

    it("goes back to sign-in when Google is not configured", async () => {
      delete process.env.GOOGLE_CLIENT_SECRET;
      const res = await startRoute.GET(get("/api/auth/google/start?locale=en"), {});
      expect(res.headers.get("location")).toBe("http://localhost:3000/en/login?google=failed");
    });
  });

  describe("callback", () => {
    const googleThenWp = (wp: Response, token = idToken()) =>
      fetchMock.mockImplementation(async (url: string) => (String(url).startsWith("https://oauth2.googleapis.com") ? respond(200, { id_token: token }) : wp));

    it("signs in, sets the session and returns to the page that asked", async () => {
      googleThenWp(respond(200, { token: wpJwt(7), user_email: "salma@gmail.com", user_nicename: "c_x", user_display_name: "Salma Kamal" }));
      const res = await callback("code=c-1&state=state-1");
      expect(res.headers.get("location")).toBe("http://localhost:3000/ar/cart/shipping");
      const cookies = setCookies(res).join(" | ");
      expect(cookies).toMatch(/credentials=.*HttpOnly/i);
      expect(cookies).toMatch(/g_flow=;/);
      const [tokenCall, wpCall] = fetchMock.mock.calls;
      const form = new URLSearchParams(String(tokenCall[1].body));
      expect(Object.fromEntries(form)).toMatchObject({ code: "c-1", client_secret: "secret-1", code_verifier: "v".repeat(64), grant_type: "authorization_code" });
      expect(new URL(String(wpCall[0])).pathname).toBe("/wp-json/wc-farida/v1/google/login");
      expect(JSON.parse(String(wpCall[1].body))).toEqual({ sub: "110248495921238986420", email: "salma@gmail.com", firstName: "Salma", lastName: "Kamal" });
    });

    it.each([
      ["no attempt cookie", "code=c&state=state-1", "", "expired"],
      ["the customer said no", "error=access_denied&state=state-1", undefined, "cancelled"],
      ["a forged state", "code=c&state=other", undefined, "failed"],
      ["no code", "state=state-1", undefined, "failed"],
    ])("%s → back to sign-in, nothing exchanged", async (_case, query, cookie, reason) => {
      const res = await callback(query, cookie);
      expect(res.headers.get("location")).toMatch(new RegExp(`/login\\?google=${reason}$`));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(setCookies(res).some((c) => c.startsWith("credentials="))).toBe(false);
    });

    it.each([
      ["a token for another attempt (nonce)", idToken({ nonce: "other" }), "failed"],
      ["an unverified Google email", idToken({ email_verified: false }), "unverified_email"],
    ])("refuses %s before asking WordPress", async (_case, token, reason) => {
      googleThenWp(respond(200, {}), token);
      const res = await callback("code=c&state=state-1");
      expect(res.headers.get("location")).toBe(`http://localhost:3000/ar/login?google=${reason}`);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["farida_not_customer", 403, "staff"],
      ["farida_google_conflict", 409, "conflict"],
      ["boom", 500, "failed"],
    ])("WordPress %s → %s", async (code, status, reason) => {
      googleThenWp(respond(status, { code, message: "x" }));
      const res = await callback("code=c&state=state-1");
      expect(res.headers.get("location")).toBe(`http://localhost:3000/ar/login?google=${reason}`);
      expect(setCookies(res).some((c) => c.startsWith("credentials="))).toBe(false);
    });

    it("Google refusing the code → failed", async () => {
      fetchMock.mockResolvedValue(respond(400, { error: "invalid_grant" }));
      expect((await callback("code=c&state=state-1")).headers.get("location")).toBe("http://localhost:3000/ar/login?google=failed");
    });
  });
});
