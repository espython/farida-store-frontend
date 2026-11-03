import { describe, expect, it } from "vitest";
import { tokenExpiry } from "./sessionToken";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

describe("tokenExpiry", () => {
  it("reads exp from a WordPress JWT (base64url, unpadded, non-ASCII claims)", () => {
    expect(tokenExpiry(`${b64({ alg: "HS256" })}.${b64({ exp: 1794248649, name: "منى ~?>" })}.sig`)).toBe(1794248649);
  });
  it("returns null for anything else", () => {
    for (const t of ["", "abc", "a.b.c", `x.${b64({ exp: "soon" })}.y`, `x.${b64({})}.y`, `x.${"A".repeat(5000)}.y`]) expect(tokenExpiry(t)).toBeNull();
  });
});
