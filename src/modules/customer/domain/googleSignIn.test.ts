import { describe, expect, it } from "vitest";
import { checkGoogleClaims } from "./googleSignIn";

const now = 1_800_000_000;
const expect_ = { clientId: "client-1.apps.googleusercontent.com", nonce: "n-123", nowSeconds: now };
const claims = (over: Record<string, unknown> = {}) => ({
  iss: "https://accounts.google.com",
  aud: "client-1.apps.googleusercontent.com",
  exp: now + 3600,
  nonce: "n-123",
  sub: "110248495921238986420",
  email: "Salma@Gmail.com",
  email_verified: true,
  given_name: " Salma ",
  family_name: "Kamal",
  ...over,
});

describe("checkGoogleClaims", () => {
  it("accepts Google's token for our client and attempt", () => {
    expect(checkGoogleClaims(claims(), expect_)).toEqual({
      ok: true,
      identity: { sub: "110248495921238986420", email: "salma@gmail.com", firstName: "Salma", lastName: "Kamal" },
    });
    expect(checkGoogleClaims(claims({ iss: "accounts.google.com", aud: ["other", expect_.clientId], email_verified: "true" }), expect_).ok).toBe(true);
  });

  it.each([
    ["another issuer", { iss: "https://evil.test" }, "failed"],
    ["another client", { aud: "other-client" }, "failed"],
    ["another attempt (nonce)", { nonce: "n-999" }, "failed"],
    ["no nonce", { nonce: undefined }, "failed"],
    ["expired", { exp: now - 120 }, "expired"],
    ["unverified email", { email_verified: false }, "unverified_email"],
    ["no email", { email: undefined }, "failed"],
    ["bad subject", { sub: "abc" }, "failed"],
  ])("refuses %s", (_case, over, error) => {
    expect(checkGoogleClaims(claims(over), expect_)).toEqual({ ok: false, error });
  });

  it("tolerates a minute of clock difference", () => {
    expect(checkGoogleClaims(claims({ exp: now - 30 }), expect_).ok).toBe(true);
  });

  it("refuses an empty expected nonce, so a missing cookie value can never match", () => {
    expect(checkGoogleClaims(claims({ nonce: "" }), { ...expect_, nonce: "" }).ok).toBe(false);
  });
});
