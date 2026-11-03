import { describe, expect, it } from "vitest";
import { toVerifyLink } from "./emailVerification";

describe("toVerifyLink", () => {
  it("accepts a customer id and a WordPress token", () => {
    expect(toVerifyLink("42", "AbCdEfGhIjKlMnOpQrStUvWxYz012345")).toEqual({ id: "42", token: "AbCdEfGhIjKlMnOpQrStUvWxYz012345" });
  });
  it.each([
    [null, "AbCdEfGhIjKlMnOp"],
    ["0", "AbCdEfGhIjKlMnOp"],
    ["4x", "AbCdEfGhIjKlMnOp"],
    ["42", "short"],
    ["42", "has-dash-AbCdEfGh"],
    ["42", "x".repeat(65)],
    [["42"], "AbCdEfGhIjKlMnOp"],
  ])("refuses %j / %j", (id, token) => {
    expect(toVerifyLink(id, token)).toBeNull();
  });
});
