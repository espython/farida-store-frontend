// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as loginRoute from "./login/route";
import * as registerRoute from "./register/route";
import * as logoutRoute from "./logout/route";
import * as meRoute from "./me/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = () => Math.floor(Date.now() / 1000) + 7 * 86400;
const jwt = (id = 7) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: exp(), data: { user: { id } } })}.sig`;
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

const post = (path: string, body?: unknown, cookie?: string) =>
  new NextRequest(new URL(path, "http://localhost"), {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: cookie ? { cookie } : {},
  });
const get = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, "http://localhost"), { headers: cookie ? { cookie } : {} });

// Node's Headers has getSetCookie(); this TypeScript lib does not declare it yet.
const setCookies = (res: Response): string[] => (res.headers as Headers & { getSetCookie(): string[] }).getSetCookie();

describe("/api/auth routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("login sets the httpOnly token and readable flag for the token's lifetime, never returns the token", async () => {
    const token = jwt(7);
    fetchMock.mockResolvedValueOnce(respond(200, { token, user_email: "s@x.io", user_nicename: "s", user_display_name: "Salma" }));
    const res = await loginRoute.POST(post("/api/auth/login", { email: "s@x.io", password: "Secret1" }), {});
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain(token);
    expect(JSON.parse(text).session).toMatchObject({ customerId: "7", email: "s@x.io" });

    const [cred, flag] = setCookies(res);
    expect(cred).toMatch(/^credentials=/);
    expect(cred).toMatch(/HttpOnly/i);
    expect(cred).toMatch(/SameSite=lax/i);
    expect(Number(/Max-Age=(\d+)/.exec(cred)![1])).toBeGreaterThan(6 * 86400);
    expect(flag).toMatch(/^logged_in=1/);
    expect(flag).not.toMatch(/HttpOnly/i);
  });

  it("login failures are generic and set no cookies", async () => {
    fetchMock.mockResolvedValueOnce(respond(403, { code: "[jwt_auth] invalid_email", message: "not registered" }));
    const res = await loginRoute.POST(post("/api/auth/login", { email: "who@x.io", password: "x" }), {});
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { code: "invalid_credentials", message: "Invalid email or password" } });
    expect(setCookies(res)).toEqual([]);
  });

  it("login rejects malformed input before calling WordPress", async () => {
    const res = await loginRoute.POST(post("/api/auth/login", { email: "nope", password: "" }), {});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatchObject({ code: "invalid_input", details: { email: "email_invalid" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("register validates with the domain rules, then creates and signs in", async () => {
    const weak = await registerRoute.POST(
      post("/api/auth/register", { email: "n@x.io", password: "weak", firstName: "N", lastName: "X" }),
      {}
    );
    expect(weak.status).toBe(400);
    expect((await weak.json()).error.details).toEqual({ password: "password_too_short" });

    fetchMock
      .mockResolvedValueOnce(respond(201, { id: 9, email: "n@x.io", first_name: "N", last_name: "X", role: "customer" }))
      .mockResolvedValueOnce(respond(200, { token: jwt(9), user_email: "n@x.io", user_nicename: "n", user_display_name: "N X" }));
    const res = await registerRoute.POST(
      post("/api/auth/register", { email: "n@x.io", password: "Abc123", firstName: "N", lastName: "X" }),
      {}
    );
    expect(res.status).toBe(201);
    expect((await res.json()).session.customerId).toBe("9");
    expect(setCookies(res)[0]).toMatch(/^credentials=/);
  });

  it("register reports a taken email as 409", async () => {
    fetchMock.mockResolvedValueOnce(respond(400, { code: "registration-error-email-exists" }));
    const res = await registerRoute.POST(
      post("/api/auth/register", { email: "n@x.io", password: "Abc123", firstName: "N", lastName: "X" }),
      {}
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("email_taken");
  });

  it("me returns the verified customer, or 401 and clears a bad token", async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { id: 7, name: "Salma", email: "s@x.io" }));
    const ok = await meRoute.GET(get("/api/auth/me", `credentials=${jwt(7)}`), {});
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("private, no-store");
    expect((await ok.json()).session.email).toBe("s@x.io");

    fetchMock.mockResolvedValueOnce(respond(403, { code: "jwt_auth_invalid_token" }));
    const bad = await meRoute.GET(get("/api/auth/me", `credentials=${jwt(7)}`), {});
    expect(bad.status).toBe(401);
    expect(setCookies(bad).join(";")).toMatch(/credentials=;.*Max-Age=0/);

    const none = await meRoute.GET(get("/api/auth/me"), {});
    expect(none.status).toBe(401);
    expect(setCookies(none)).toEqual([]);
  });

  it("logout clears both cookies and other methods get 405", async () => {
    const res = await logoutRoute.POST(post("/api/auth/logout"), {});
    expect(res.status).toBe(200);
    const cookies = setCookies(res);
    expect(cookies.some((c) => /^credentials=;/.test(c) && /Max-Age=0/.test(c))).toBe(true);
    expect(cookies.some((c) => /^logged_in=;/.test(c) && /Max-Age=0/.test(c))).toBe(true);
    expect((await loginRoute.GET(get("/api/auth/login"), {})).status).toBe(405);
  });
});
