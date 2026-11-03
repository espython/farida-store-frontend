// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as registerRoute from "./register/route";
import * as resendRoute from "./email/resend/route";
import * as verifyRoute from "./email/verify/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id = 7) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 86400, data: { user: { id } } })}.sig`;
const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
let ip = 0;
const post = (path: string, body: unknown, cookie = "") =>
  new NextRequest(new URL(path, "http://localhost"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "x-forwarded-for": `10.6.0.${++ip}`, "Content-Type": "application/json", cookie },
  });
const route = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.map(([u, init]) => ({ path: new URL(String(u)).pathname, body: init?.body ? JSON.parse(String(init.body)) : null }));
const isMe = (u: unknown) => String(u).includes("/wp/v2/users/me");
const me = (id: number) => respond(200, { id, name: "Nour", email: "n@x.io", first_name: "Nour", last_name: "Ali" });

describe("email verification routes", () => {
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

  const signUp = { email: "n@x.io", password: "Secret1", firstName: "Nour", lastName: "Ali", locale: "ar" };

  it("sign-up emails a confirmation link in the customer's language", async () => {
    fetchMock
      .mockResolvedValueOnce(respond(201, { id: 7 }))
      .mockResolvedValueOnce(respond(200, { token: jwt(7), user_email: "n@x.io", user_nicename: "n", user_display_name: "Nour" }))
      .mockResolvedValueOnce(respond(202, { status: "sent" }));
    const res = await registerRoute.POST(post("/api/auth/register", signUp), {});
    expect(res.status).toBe(201);
    expect(route(fetchMock)[2]).toEqual({ path: "/wp-json/wc-farida/v1/email/send", body: { customerId: 7, locale: "ar", verifyUrl: "http://localhost:3000/ar/verify-email" } });
  });

  it("a failing confirmation email never fails the sign-up", async () => {
    fetchMock
      .mockResolvedValueOnce(respond(201, { id: 7 }))
      .mockResolvedValueOnce(respond(200, { token: jwt(7), user_email: "n@x.io", user_nicename: "n", user_display_name: "Nour" }))
      .mockResolvedValueOnce(respond(500, { code: "boom" }));
    expect((await registerRoute.POST(post("/api/auth/register", signUp), {})).status).toBe(201);
  });

  it("resend needs a verified session and reports what happened", async () => {
    expect((await resendRoute.POST(post("/api/auth/email/resend", { locale: "en" }), {})).status).toBe(401);
    fetchMock.mockImplementation(async (u: string) => (isMe(u) ? me(7) : respond(202, { status: "recent" })));
    const res = await resendRoute.POST(post("/api/auth/email/resend", { locale: "en" }, `credentials=${jwt(7)}`), {});
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ status: "recent" });
    expect(route(fetchMock).find((c) => c.path.endsWith("/email/send"))?.body).toMatchObject({ customerId: 7 });
  });

  it("verify needs no session; a malformed link never reaches WordPress", async () => {
    const bad = await verifyRoute.POST(post("/api/auth/email/verify", { id: "7", token: "nope" }), {});
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe("invalid_verify_link");
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(respond(400, { code: "farida_invalid_verify_token", message: "x" }));
    const expired = await verifyRoute.POST(post("/api/auth/email/verify", { id: "7", token: "AbCdEfGhIjKlMnOpQrSt" }), {});
    expect((await expired.json()).error.code).toBe("invalid_verify_link");

    fetchMock.mockResolvedValueOnce(respond(200, { verified: true }));
    const ok = await verifyRoute.POST(post("/api/auth/email/verify", { id: "7", token: "AbCdEfGhIjKlMnOpQrSt" }), {});
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ verified: true });
  });
});
