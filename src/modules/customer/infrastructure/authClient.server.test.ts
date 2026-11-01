// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/kernel/AppError";
import { getSession, login, register } from "./authClient.server";
import { decodeJwtPayload } from "./sessionMapper";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const fakeJwt = (claims: Record<string, unknown>) => `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;
const inOneWeek = () => Math.floor(Date.now() / 1000) + 7 * 86400;
const token = (id: number | string = 7, exp = inOneWeek()) =>
  fakeJwt({ iss: "http://wp", iat: exp - 7 * 86400, exp, data: { user: { id } } });

const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("customer auth client", () => {
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

  const call = (i: number) => ({
    url: new URL(fetchMock.mock.calls[i][0]),
    init: fetchMock.mock.calls[i][1] as RequestInit,
  });

  it("signs in with the normalised email and maps the token to a session", async () => {
    const t = token(7);
    fetchMock.mockResolvedValueOnce(respond(200, { token: t, user_email: "s@x.io", user_nicename: "s", user_display_name: "Salma" }));
    const r = await login("  S@X.io ", "Secret1");
    expect(call(0).url.pathname).toBe("/wp-json/jwt-auth/v1/token");
    expect(JSON.parse(call(0).init.body as string)).toEqual({ username: "s@x.io", password: "Secret1" });
    expect(r.token).toBe(t);
    expect(r.session).toMatchObject({ customerId: "7", email: "s@x.io", displayName: "Salma" });
  });

  it("gives unknown email and wrong password the same error", async () => {
    for (const code of ["[jwt_auth] invalid_email", "[jwt_auth] incorrect_password", "[jwt_auth] invalid_username"]) {
      fetchMock.mockResolvedValueOnce(respond(403, { code, message: `The username <b>x</b> is not registered` }));
      const err = await login("x@y.io", "pw").catch((e) => e);
      expect(err).toBeInstanceOf(AppError);
      expect(err).toMatchObject({ code: "invalid_credentials", status: 401, message: "Invalid email or password" });
    }
  });

  it("keeps an outage distinct from bad credentials", async () => {
    fetchMock.mockResolvedValueOnce(respond(500, { code: "internal" }));
    await expect(login("x@y.io", "pw")).rejects.toMatchObject({ code: "upstream_error", status: 502 });
  });

  it("registers with the server keys and a non-email username, then signs in", async () => {
    fetchMock
      .mockResolvedValueOnce(respond(201, { id: 9, email: "n@x.io", first_name: "N", last_name: "X", role: "customer" }))
      .mockResolvedValueOnce(respond(200, { token: token(9), user_email: "n@x.io", user_nicename: "n", user_display_name: "N X" }));
    const r = await register({ email: "N@x.io", password: "Abc123", firstName: " N ", lastName: "X" });
    const create = call(0);
    expect(create.url.pathname).toBe("/wp-json/wc/v3/customers");
    expect((create.init.headers as Record<string, string>).Authorization).toMatch(/^Basic /);
    const body = JSON.parse(create.init.body as string);
    expect(body).toMatchObject({ email: "n@x.io", first_name: "N", last_name: "X" });
    expect(body.username).toMatch(/^c_[0-9a-f]{12}$/);
    expect(r.session.customerId).toBe("9");
  });

  it("maps a duplicate email to email_taken", async () => {
    fetchMock.mockResolvedValueOnce(respond(400, { code: "registration-error-email-exists", message: "exists" }));
    await expect(register({ email: "n@x.io", password: "Abc123", firstName: "N", lastName: "X" })).rejects.toMatchObject({
      code: "email_taken",
      status: 409,
    });
  });

  it("loads a session only when WordPress accepts the token and the ids match", async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { id: 7, name: "Salma", email: "s@x.io" }));
    const t = token(7);
    expect(await getSession(t)).toMatchObject({ customerId: "7", email: "s@x.io", displayName: "Salma" });
    expect((call(0).init.headers as Record<string, string>).Authorization).toBe(`Bearer ${t}`);

    fetchMock.mockResolvedValueOnce(respond(403, { code: "jwt_auth_invalid_token" }));
    expect(await getSession(token(7))).toBeNull();

    fetchMock.mockResolvedValueOnce(respond(200, { id: 8, name: "Other", email: "o@x.io" }));
    expect(await getSession(token(7))).toBeNull();

    // A deleted customer's token: WordPress answers users/me with 404.
    fetchMock.mockResolvedValueOnce(respond(404, { code: "rest_user_invalid_id" }));
    expect(await getSession(token(7))).toBeNull();
  });

  it("shows the customer's name, not the random internal username", async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { id: 7, name: "c_3f9a1b", email: "s@x.io", first_name: "Salma", last_name: "Kamal" }));
    expect((await getSession(token(7)))?.displayName).toBe("Salma Kamal");
    fetchMock.mockResolvedValueOnce(respond(200, { id: 7, name: "c_3f9a1b", email: "s@x.io", first_name: "", last_name: "" }));
    expect((await getSession(token(7)))?.displayName).toBe("c_3f9a1b");
  });

  it("rejects expired or malformed tokens without calling WordPress", async () => {
    expect(await getSession(token(7, Math.floor(Date.now() / 1000) - 5))).toBeNull();
    expect(await getSession("not-a-jwt")).toBeNull();
    expect(await getSession(fakeJwt({ exp: inOneWeek(), iat: 1 }))).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("decodes only well-formed claims", () => {
    expect(decodeJwtPayload(token(7))?.data.user.id).toBe(7);
    expect(decodeJwtPayload("a.b")).toBeNull();
    expect(decodeJwtPayload(fakeJwt({ exp: "soon", iat: 1, data: { user: { id: 1 } } }))).toBeNull();
  });
});
