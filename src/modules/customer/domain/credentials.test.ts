import { describe, expect, it } from "vitest";
import { emailError, normaliseEmail, passwordError, validateLogin, validateRegistration } from "./credentials";
import { isSessionExpired, secondsUntilExpiry } from "./Session";

describe("credentials", () => {
  it("normalises and checks emails", () => {
    expect(normaliseEmail("  Salma@Example.TEST ")).toBe("salma@example.test");
    expect(emailError("salma@example.test")).toBeNull();
    for (const bad of ["", "salma", "salma@", "@example.test", "salma@example", "sal ma@example.test", `${"a".repeat(250)}@x.io`]) {
      expect(emailError(bad)).toBe("email_invalid");
    }
  });

  it("applies the register form's password rule", () => {
    expect(passwordError("Abc123")).toBeNull();
    expect(passwordError("Ab1")).toBe("password_too_short");
    expect(passwordError("abc123")).toBe("password_needs_uppercase");
    expect(passwordError("Abcdef")).toBe("password_needs_number");
    expect(passwordError("A1" + "a".repeat(127))).toBe("password_too_long");
  });

  it("returns one code per invalid registration field", () => {
    expect(validateRegistration({ email: "a@b.co", password: "Abc123", firstName: "Salma", lastName: "Kamal" })).toEqual({});
    expect(validateRegistration({ email: "x", password: "short", firstName: " ", lastName: "K".repeat(61) })).toEqual({
      email: "email_invalid",
      password: "password_too_short",
      firstName: "name_required",
      lastName: "name_too_long",
    });
  });

  it("does not apply the password policy at sign-in", () => {
    expect(validateLogin("a@b.co", "weak")).toEqual({});
    expect(validateLogin("nope", "")).toEqual({ email: "email_invalid", password: "password_too_short" });
  });
});

describe("session expiry", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  const at = (secondsFromNow: number) => ({ expiresAt: Math.floor(now.getTime() / 1000) + secondsFromNow });

  it("counts down and treats the last minute as expired", () => {
    expect(secondsUntilExpiry(at(3600), now)).toBe(3600);
    expect(secondsUntilExpiry(at(-10), now)).toBe(0);
    expect(isSessionExpired(at(3600), now)).toBe(false);
    expect(isSessionExpired(at(60), now)).toBe(true);
    expect(isSessionExpired(at(-1), now)).toBe(true);
  });
});
