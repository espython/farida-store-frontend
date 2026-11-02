import { describe, expect, it } from "vitest";
import { MAX_CONTACT_MESSAGE, validateContactMessage } from "./ContactMessage";

describe("validateContactMessage", () => {
  it("trims and accepts a complete message", () => {
    expect(validateContactMessage({ name: " Mona ", email: " m@x.io ", message: " مرحبا \n" })).toEqual({
      ok: true,
      message: { name: "Mona", email: "m@x.io", message: "مرحبا" },
    });
  });

  it("names the wrong fields with a rule code", () => {
    expect(validateContactMessage({ name: "", email: "nope", message: "a".repeat(MAX_CONTACT_MESSAGE + 1) })).toEqual({
      ok: false,
      errors: { name: "required", email: "invalid_email", message: "too_long" },
    });
    expect(validateContactMessage({ name: 5, email: null })).toEqual({
      ok: false,
      errors: { name: "required", email: "required", message: "required" },
    });
  });

  it("counts characters, so a long Arabic message is measured fairly", () => {
    expect(validateContactMessage({ name: "م", email: "m@x.io", message: "ع".repeat(MAX_CONTACT_MESSAGE) }).ok).toBe(true);
  });
});
