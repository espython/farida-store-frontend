// @vitest-environment node
import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { isValidWooSignature, isWooPing } from "./wooWebhook.server";

const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body, "utf8").digest("base64");

describe("isValidWooSignature", () => {
  const body = JSON.stringify({ id: 108, name: "قلاية هوائية" });

  it("accepts the signature Woo computes for the raw body", () => {
    expect(isValidWooSignature(body, sign(body, "s3cret"), "s3cret")).toBe(true);
  });

  it("rejects a wrong secret, a changed body, garbage and a missing header", () => {
    expect(isValidWooSignature(body, sign(body, "other"), "s3cret")).toBe(false);
    expect(isValidWooSignature(`${body} `, sign(body, "s3cret"), "s3cret")).toBe(false);
    expect(isValidWooSignature(body, "not-base64!", "s3cret")).toBe(false);
    expect(isValidWooSignature(body, null, "s3cret")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(isValidWooSignature(body, sign(body, ""), "")).toBe(false);
  });
});

describe("isWooPing", () => {
  it("matches only the creation ping body", () => {
    expect(isWooPing("webhook_id=7")).toBe(true);
    expect(isWooPing("webhook_id=7&x=1")).toBe(false);
    expect(isWooPing('{"id":7}')).toBe(false);
  });
});
