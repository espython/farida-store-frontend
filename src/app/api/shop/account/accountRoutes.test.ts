// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as profileRoute from "./profile/route";
import * as bookRoute from "./addresses/route";
import * as entryRoute from "./addresses/[id]/route";
import * as defaultRoute from "./addresses/[id]/default/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id: number) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 3600, data: { user: { id } } })}.sig`;
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const isMe = (url: unknown) => String(url).includes("/wp/v2/users/me");

const home = { firstName: "Mona", lastName: "Ali", address1: "5 Tahrir St", address2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "01012345678" };
const work = { ...home, address1: "9 Nile Corniche", city: "Maadi", state: "EGC", postcode: "11728" };

type Customer = Record<string, unknown> & { meta_data: { key: string; value: unknown }[] };

/** A tiny wc/v3/customers: GET and PUT (meta replaced by key, like Woo). `session` is who WordPress says the token is. */
const fakeWoo = (customers: Record<number, Customer>, session: { id: number } | "forged") =>
  vi.fn(async (url: string, init?: RequestInit) => {
    if (isMe(url)) {
      return session === "forged"
        ? respond({ code: "jwt_auth_invalid_token" }, 403)
        : respond({ id: session.id, name: "c_x", email: "m@x.io", first_name: "Mona", last_name: "Ali" });
    }
    const id = Number(/\/wc\/v3\/customers\/(\d+)/.exec(url)?.[1]);
    const c = customers[id];
    if (!c) return respond({ code: "woocommerce_rest_invalid_id" }, 404);
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      for (const m of body.meta_data ?? []) c.meta_data = [...c.meta_data.filter((x) => x.key !== m.key), m];
      for (const k of ["first_name", "last_name"]) if (k in body) c[k] = body[k];
      for (const k of ["shipping", "billing"]) if (k in body) c[k] = { ...(c[k] as object), ...body[k] };
    }
    return respond(c);
  });

const customer = (id: number): Customer => ({
  id,
  email: `c${id}@x.io`,
  first_name: "Mona",
  last_name: "Ali",
  // Registration leaves the billing email empty.
  billing: { email: "", phone: "" },
  shipping: { address_1: "" },
  meta_data: [],
});

const req = (path: string, cookie: string, method = "GET", body?: unknown) =>
  new NextRequest(new URL(path, "http://localhost"), {
    method,
    headers: { cookie, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
const as = (id: number) => `credentials=${jwt(id)}`;
const keyCalls = (f: ReturnType<typeof vi.fn>) => f.mock.calls.filter(([u]) => !isMe(u));

describe("account routes", () => {
  let customers: Record<number, Customer>;
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    customers = { 9: customer(9), 10: customer(10) };
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads and renames the verified customer, private and uncached", async () => {
    vi.stubGlobal("fetch", fakeWoo(customers, { id: 9 }));
    const got = await profileRoute.GET(req("/api/shop/account/profile", as(9)), {});
    expect(got.headers.get("cache-control")).toBe("private, no-store");
    expect((await got.json()).profile).toEqual({ firstName: "Mona", lastName: "Ali", email: "c9@x.io" });

    const put = await profileRoute.PUT(req("/api/shop/account/profile", as(9), "PUT", { firstName: " Mariam ", lastName: "Hassan" }), {});
    expect((await put.json()).profile).toMatchObject({ firstName: "Mariam", lastName: "Hassan" });
    expect(customers[9].first_name).toBe("Mariam");

    const bad = await profileRoute.PUT(req("/api/shop/account/profile", as(9), "PUT", { firstName: "", lastName: "Hassan" }), {});
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toMatchObject({ code: "invalid_profile", details: { firstName: "required" } });
  });

  it("adds, edits, defaults and deletes addresses, keeping checkout's address in step", async () => {
    vi.stubGlobal("fetch", fakeWoo(customers, { id: 9 }));
    const add = async (address: object, makeDefault = false) =>
      (await (await bookRoute.POST(req("/api/shop/account/addresses", as(9), "POST", { address, makeDefault }), {})).json()).book;

    const one = await add({ ...home, phone: "+20 101 234 5678" });
    expect(one.addresses).toEqual([{ id: expect.stringMatching(/^[a-f0-9]{16}$/), address: home, isDefault: true }]);
    expect(customers[9].shipping).toMatchObject({ address_1: "5 Tahrir St", country: "EG", phone: "01012345678" });
    // Billing follows (as checkout saves it) and gets the account email.
    expect(customers[9].billing).toMatchObject({ address_1: "5 Tahrir St", email: "c9@x.io" });

    const two = await add(work);
    expect(two.addresses.map((a: { isDefault: boolean }) => a.isDefault)).toEqual([true, false]);
    const [homeId, workId] = two.addresses.map((a: { id: string }) => a.id);

    const def = await (await defaultRoute.POST(req(`/x`, as(9), "POST"), { params: { id: workId } })).json();
    expect(def.book.addresses.map((a: { isDefault: boolean }) => a.isDefault)).toEqual([false, true]);
    expect(customers[9].shipping).toMatchObject({ address_1: "9 Nile Corniche" });

    const edited = await (await entryRoute.PUT(req(`/x`, as(9), "PUT", { address: { ...work, address2: "Floor 2" } }), { params: { id: workId } })).json();
    expect(edited.book.addresses[1]).toMatchObject({ isDefault: true, address: { address2: "Floor 2" } });
    expect(customers[9].shipping).toMatchObject({ address_2: "Floor 2" });

    const removed = await (await entryRoute.DELETE(req(`/x`, as(9), "DELETE"), { params: { id: workId } })).json();
    expect(removed.book.addresses).toEqual([{ id: homeId, address: home, isDefault: true }]);
    expect(customers[9].shipping).toMatchObject({ address_1: "5 Tahrir St" });

    const got = await (await bookRoute.GET(req("/api/shop/account/addresses", as(9)), {})).json();
    expect(got.book).toEqual({ addresses: removed.book.addresses, limit: 10 });
  });

  it("checks the address with the domain rules before touching Woo", async () => {
    const f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    const res = await bookRoute.POST(req("/api/shop/account/addresses", as(9), "POST", { address: { ...home, phone: "0223456789", postcode: "1" } }), {});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatchObject({ code: "invalid_address", details: { phone: "phone_invalid", postcode: "postcode_invalid" } });
    expect(keyCalls(f)).toHaveLength(0);
  });

  it("refuses an eleventh address", async () => {
    customers[9].meta_data = [
      { key: "farida_address_book", value: JSON.stringify({ v: 1, entries: Array.from({ length: 10 }, (_, i) => ({ id: `entry${i}x`, address: home })) }) },
    ];
    vi.stubGlobal("fetch", fakeWoo(customers, { id: 9 }));
    const res = await bookRoute.POST(req("/api/shop/account/addresses", as(9), "POST", { address: work }), {});
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("address_book_full");
  });

  // Cross-customer access: the only customer id used is the verified one, and
  // address ids are looked up in that customer's book only.
  it("never reads or changes another customer's book", async () => {
    customers[10].meta_data = [{ key: "farida_address_book", value: JSON.stringify({ v: 1, entries: [{ id: "theirs01", address: work }] }) }];
    const before = JSON.stringify(customers[10]);
    const f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    const ctx = { params: { id: "theirs01" } };
    expect((await entryRoute.PUT(req("/x", as(9), "PUT", { address: home }), ctx)).status).toBe(404);
    expect((await entryRoute.DELETE(req("/x", as(9), "DELETE"), ctx)).status).toBe(404);
    expect((await defaultRoute.POST(req("/x", as(9), "POST"), ctx)).status).toBe(404);
    expect(JSON.stringify(customers[10])).toBe(before);
    expect(keyCalls(f).every(([u]) => String(u).includes("/wc/v3/customers/9"))).toBe(true);
    // Ids that cannot be ours are refused before any call.
    f.mockClear();
    expect((await entryRoute.DELETE(req("/x", as(9), "DELETE"), { params: { id: "../10" } })).status).toBe(404);
    expect(f).not.toHaveBeenCalled();
  });

  it("refuses a forged session before any call with the server keys", async () => {
    const f = fakeWoo(customers, "forged");
    vi.stubGlobal("fetch", f);
    const forged = as(10);
    expect((await profileRoute.GET(req("/x", forged), {})).status).toBe(401);
    expect((await bookRoute.GET(req("/x", forged), {})).status).toBe(401);
    expect((await bookRoute.POST(req("/x", forged, "POST", { address: home }), {})).status).toBe(401);
    expect((await defaultRoute.POST(req("/x", forged, "POST"), { params: { id: "primary" } })).status).toBe(401);
    expect(keyCalls(f)).toHaveLength(0);
  });

  it("refuses a valid token whose claims name someone else", async () => {
    const f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    expect((await profileRoute.GET(req("/x", as(10)), {})).status).toBe(401);
    expect(keyCalls(f)).toHaveLength(0);
  });

  it("needs a session", async () => {
    const f = fakeWoo(customers, { id: 9 });
    vi.stubGlobal("fetch", f);
    expect((await profileRoute.GET(req("/x", ""), {})).status).toBe(401);
    expect((await bookRoute.GET(req("/x", ""), {})).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });
});
