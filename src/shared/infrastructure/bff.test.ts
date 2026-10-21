// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "./errorMapping";
import { defineRoute, parseJson, parseQuery } from "./bff";

const req = (url: string, init?: RequestInit) =>
  new NextRequest(new URL(url, "http://localhost"), init as never);

describe("defineRoute", () => {
  it("serves listed methods and returns a JSON 405 with Allow for the rest", async () => {
    const route = defineRoute({ GET: async () => new Response(JSON.stringify({ ok: true })) });
    expect((await route.GET(req("/x"), {})).status).toBe(200);
    const res = await route.POST(req("/x", { method: "POST" }), {});
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET");
    expect(await res.json()).toEqual({
      error: { code: "method_not_allowed", message: "Method not allowed" },
    });
  });

  it("answers OPTIONS with only the methods the route serves", async () => {
    const route = defineRoute({ GET: async () => new Response("x") });
    const res = await route.OPTIONS(req("/x", { method: "OPTIONS" }), {});
    expect(res.status).toBe(204);
    expect(res.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
  });

  it("maps AppError and unknown errors to the shared shape", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const route = defineRoute({
      GET: async () => {
        throw new AppError("not_found", "Not found", 404);
      },
      POST: async () => {
        throw new Error("boom with internals");
      },
    });
    const notFound = await route.GET(req("/x"), {});
    expect(notFound.status).toBe(404);
    expect(await notFound.json()).toEqual({ error: { code: "not_found", message: "Not found" } });
    const crash = await route.POST(req("/x", { method: "POST" }), {});
    expect(crash.status).toBe(500);
    expect(JSON.stringify(await crash.json())).not.toContain("internals");
  });
});

describe("validation", () => {
  it("parseQuery returns typed data or a 400 with issue paths", () => {
    const schema = z.object({ page: z.coerce.number().int().min(1) });
    expect(parseQuery(req("/x?page=3"), schema)).toEqual({ page: 3 });
    try {
      parseQuery(req("/x?page=0"), schema);
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toMatchObject({ status: 400, code: "validation_error" });
      expect((e as AppError).details).toEqual([expect.objectContaining({ path: "page" })]);
    }
  });

  it("parseJson rejects invalid JSON and oversized bodies", async () => {
    const schema = z.object({ a: z.string() });
    const post = (body: string) => req("/x", { method: "POST", body });
    await expect(parseJson(post('{"a":"b"}'), schema)).resolves.toEqual({ a: "b" });
    await expect(parseJson(post("{nope"), schema)).rejects.toMatchObject({ status: 400 });
    await expect(parseJson(post("x".repeat(100_001)), schema)).rejects.toMatchObject({
      status: 413,
    });
  });
});
