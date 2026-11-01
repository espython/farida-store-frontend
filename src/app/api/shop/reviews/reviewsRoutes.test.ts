// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as listRoute from "./route";
import * as mineRoute from "./mine/route";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (id: number) => `${b64({ alg: "HS256" })}.${b64({ iss: "wp", iat: 1, exp: Math.floor(Date.now() / 1000) + 3600, data: { user: { id } } })}.sig`;
const respond = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });
const as = (id: number) => `credentials=${jwt(id)}`;

type Stored = { id: number; product_id: number; reviewer: string; reviewer_email: string; rating: number; review: string; status: string; verified: boolean };
const CUSTOMERS: Record<number, { id: number; email: string; first_name: string; last_name: string }> = {
  9: { id: 9, email: "nour@example.test", first_name: "Nour", last_name: "wahba" },
  10: { id: 10, email: "sara@example.test", first_name: "Sara", last_name: "" },
};

/** Store API reviews/products, wc/v3 customers and reviews, users/me as `session`. */
const fakeWoo = (reviews: Stored[], session: { id: number } | "forged") =>
  vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const path = url.pathname.replace("/wp-json", "");
    if (path === "/wp/v2/users/me") {
      return session === "forged" ? respond({ code: "jwt_auth_invalid_token" }, 403) : respond({ id: session.id, name: "c", email: "x@x.io" });
    }
    if (path === "/wc/store/v1/products/reviews") {
      const list = reviews.filter((r) => r.status === "approved" && String(r.product_id) === url.searchParams.get("product_id"));
      return respond(
        list.map(({ reviewer_email: _e, status: _s, ...r }) => ({ ...r, review: `<p>${r.review}</p>`, date_created_gmt: "2026-11-01T10:00:00" })),
        200,
        { "x-wp-total": String(list.length), "x-wp-totalpages": "3" }
      );
    }
    const product = /^\/wc\/store\/v1\/products\/(\d+)$/.exec(path)?.[1];
    if (product) return product === "296" ? respond({ id: 296 }) : respond({ code: "woocommerce_rest_product_invalid_id" }, 404);
    const customer = /^\/wc\/v3\/customers\/(\d+)$/.exec(path)?.[1];
    if (customer) return respond(CUSTOMERS[Number(customer)]);
    if (path === "/wc/v3/products/reviews" && init?.method === "POST") {
      const b = JSON.parse(String(init.body));
      const r = { id: 500 + reviews.length, ...b, verified: b.reviewer_email === "nour@example.test" };
      reviews.push(r);
      return respond(r, 201);
    }
    if (path === "/wc/v3/products/reviews") {
      return respond(
        reviews.filter((r) => r.reviewer_email === url.searchParams.get("reviewer_email") && String(r.product_id) === url.searchParams.get("product"))
      );
    }
    return respond({ code: "rest_no_route" }, 404);
  });

const req = (path: string, cookie = "", method = "GET", body?: unknown) =>
  new NextRequest(new URL(path, "http://localhost"), {
    method,
    headers: { cookie, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
const post = (cookie: string, body: unknown) => listRoute.POST(req("/api/shop/reviews", cookie, "POST", body), {});
const good = { productId: "296", rating: 5, text: "Boils fast and looks great." };

describe("reviews routes", () => {
  let reviews: Stored[];
  beforeEach(() => {
    process.env.WC_BASE_URL = "https://woo.test";
    process.env.WC_CONSUMER_KEY = "ck";
    process.env.WC_CONSUMER_SECRET = "cs";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    reviews = [
      { id: 1, product_id: 296, reviewer: "Ali M.", reviewer_email: "ali@example.test", rating: 4, review: "Good &amp; solid", status: "approved", verified: false },
      { id: 2, product_id: 296, reviewer: "Held", reviewer_email: "held@example.test", rating: 1, review: "Waiting", status: "hold", verified: false },
    ];
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists a product's approved reviews as plain text, with paging", async () => {
    const fetchMock = fakeWoo(reviews, "forged");
    vi.stubGlobal("fetch", fetchMock);
    const res = await listRoute.GET(req("/api/shop/reviews?productId=296&page=2"), {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ page: 2, total: 1, totalPages: 3 });
    expect(body.items).toEqual([expect.objectContaining({ id: "1", text: "Good & solid", rating: 4, verified: false })]);
    expect(JSON.stringify(body)).not.toContain("@example.test");
    const u = new URL(fetchMock.mock.calls[0][0]);
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ product_id: "296", page: "2", per_page: "10", orderby: "date_gmt", order: "desc" });
    // Public: no session needed, and never the server keys.
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
    for (const q of ["", "?productId=abc", "?productId=0", "?productId=296&page=0", "?productId=296&page=101"]) {
      expect((await listRoute.GET(req(`/api/shop/reviews${q}`), {})).status).toBe(400);
    }
  });

  it("posts a held review as the verified customer, once", async () => {
    vi.stubGlobal("fetch", fakeWoo(reviews, { id: 9 }));
    const res = await post(as(9), { ...good, text: "  Boils fast and looks great.  " });
    expect(res.status).toBe(201);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect((await res.json()).review).toMatchObject({ status: "pending", rating: 5, verified: true, reviewer: "Nour W." });
    expect(reviews.at(-1)).toMatchObject({ status: "hold", reviewer: "Nour W.", reviewer_email: "nour@example.test", review: "Boils fast and looks great.", product_id: 296 });

    const mine = await mineRoute.GET(req("/api/shop/reviews/mine?productId=296", as(9)), {});
    expect((await mine.json()).review).toMatchObject({ status: "pending" });

    const again = await post(as(9), { ...good, text: "Something else entirely" });
    expect(again.status).toBe(409);
    expect((await again.json()).error.code).toBe("already_reviewed");
    expect(reviews.filter((r) => r.reviewer_email === "nour@example.test")).toHaveLength(1);
  });

  it("names a customer without a last name by first name, and never by email", async () => {
    vi.stubGlobal("fetch", fakeWoo(reviews, { id: 10 }));
    await post(as(10), good);
    expect(reviews.at(-1)?.reviewer).toBe("Sara");
  });

  it("checks the review before asking WordPress, and the product after", async () => {
    const fetchMock = fakeWoo(reviews, { id: 9 });
    vi.stubGlobal("fetch", fetchMock);
    const bad = await post(as(9), { ...good, rating: 9, text: "short" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toMatchObject({ code: "invalid_review", details: { rating: "rating_required", text: "text_too_short" } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await post(as(9), { ...good, productId: "297" })).status).toBe(404);
    expect(reviews).toHaveLength(2);
  });

  it("needs a session WordPress accepts", async () => {
    vi.stubGlobal("fetch", fakeWoo(reviews, "forged"));
    expect((await post(as(9), good)).status).toBe(401);
    expect((await post("", good)).status).toBe(401);
    expect((await mineRoute.GET(req("/api/shop/reviews/mine?productId=296", as(9)), {})).status).toBe(401);
    expect(reviews).toHaveLength(2);
  });

  it("maps WordPress's duplicate-comment refusal to already_reviewed", async () => {
    const base = fakeWoo(reviews, { id: 9 });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: RequestInit) =>
        init?.method === "POST" ? respond({ code: "woocommerce_rest_comment_duplicate" }, 409) : base(input, init)
      )
    );
    const res = await post(as(9), good);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("already_reviewed");
  });
});
