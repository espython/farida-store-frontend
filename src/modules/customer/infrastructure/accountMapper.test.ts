import { describe, expect, it } from "vitest";
import { toProfile } from "./accountMapper";

describe("profile.emailVerified", () => {
  const dto = { id: 7, email: "n@x.io", first_name: "Nour", last_name: "Ali" };
  it("is true once the confirmation meta is set", () => {
    expect(toProfile({ ...dto, meta_data: [{ key: "farida_email_verified", value: "1793700000" }] } as never).emailVerified).toBe(true);
    expect(toProfile({ ...dto, meta_data: [] } as never).emailVerified).toBe(false);
    expect(toProfile(dto as never).emailVerified).toBe(false);
  });
});
