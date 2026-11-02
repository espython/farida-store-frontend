import { describe, expect, it } from "vitest";
import { toResetLink } from "./passwordReset";

describe("toResetLink", () => {
  it("accepts WordPress keys and logins", () => {
    expect(toResetLink("AbCdEfGhIjKlMnOpQrSt", "c_1a2b3c4d5e6f")).toEqual({ key: "AbCdEfGhIjKlMnOpQrSt", login: "c_1a2b3c4d5e6f" });
    expect(toResetLink("AbCdEfGh12", "nour@example.com")).not.toBeNull();
  });
  it("refuses anything else", () => {
    for (const [key, login] of [
      [null, "c_1"],
      ["AbCdEfGhIj", null],
      ["short", "c_1"],
      ["AbCdEfGh<script>", "c_1"],
      ["x".repeat(65), "c_1"],
      ["AbCdEfGhIj", ""],
      ["AbCdEfGhIj", "has space"],
      ["AbCdEfGhIj", "x".repeat(61)],
      [["AbCdEfGhIj"], "c_1"],
    ]) {
      expect(toResetLink(key, login)).toBeNull();
    }
  });
});
