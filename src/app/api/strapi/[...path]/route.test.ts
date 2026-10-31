// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const call = async (path: string, cookie?: string) => {
  const { GET } = await import("./route");
  const req = new NextRequest(new URL(`/api/strapi/${path}`, "http://localhost"), {
    headers: cookie ? { cookie } : {},
  });
  return GET(req, { params: Promise.resolve({ path: path.split("/") }) });
};

describe("/api/strapi proxy", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_STRAPI_API_ENDPOINT", "https://strapi.test/api");
    vi.stubEnv("STRAPI_API_TOKEN", "service-token");
    fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("refuses Strapi auth and user routes without calling Strapi", async () => {
    for (const path of ["auth/local", "auth/local/register", "users/me", "users", "users/7"]) {
      expect((await call(path)).status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("always sends the service token, never the customer's WordPress token", async () => {
    const res = await call("advertises", "credentials=wp.jwt.token");
    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe("Bearer service-token");
  });
});
