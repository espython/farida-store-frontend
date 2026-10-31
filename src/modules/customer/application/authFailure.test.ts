import { describe, expect, it } from "vitest";
import { toAuthFailure } from "./authFailure";

describe("toAuthFailure", () => {
  it("keeps known domain codes and field errors from the BFF body", () => {
    expect(
      toAuthFailure({ status: 400, data: { error: { code: "invalid_input", details: { password: "password_too_short" } } } })
    ).toEqual({ code: "invalid_input", fields: { password: "password_too_short" } });
    expect(toAuthFailure({ status: 401, data: { error: { code: "invalid_credentials" } } })).toEqual({
      code: "invalid_credentials",
      fields: {},
    });
    expect(toAuthFailure({ status: 409, data: { error: { code: "email_taken" } } }).code).toBe("email_taken");
  });

  it("treats outages, network errors and unknown codes as unavailable", () => {
    expect(toAuthFailure({ status: 502, data: { error: { code: "upstream_error" } } }).code).toBe("unavailable");
    expect(toAuthFailure({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }).code).toBe("unavailable");
    expect(toAuthFailure({ message: "boom" }).code).toBe("unavailable");
    expect(toAuthFailure(undefined)).toEqual({ code: "unavailable", fields: {} });
  });
});
