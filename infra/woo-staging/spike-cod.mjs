// COD spike: runs the non-payment checks from doc/woocommerce-spike-checklist.md
// against the local staging stack. Needs infra/woo-staging/.env.local (WC_KEY, WC_SECRET).
//
//   node --env-file=.env.local spike-cod.mjs
//
// Creates its own products/coupons with a run id, so it is safe to re-run.
const BASE = process.env.WP_URL || "http://localhost:8080";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");

const RUN = Date.now().toString(36);
const basic = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

const results = [];
const check = (name, ok, note = "") => {
  results.push({ name, ok, note });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};

async function http(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE}/wp-json${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, headers: res.headers };
}
const admin = (path, opts = {}) =>
  http(`/wc/v3${path}`, { ...opts, headers: { Authorization: basic, ...opts.headers } });

// A guest shopper: own cart token + nonce, like one browser session.
async function shopper() {
  const first = await http("/wc/store/v1/cart");
  let token = first.headers.get("cart-token");
  let nonce = first.headers.get("nonce");
  const call = async (path, opts = {}) => {
    const r = await http(`/wc/store/v1${path}`, {
      ...opts,
      headers: { "Cart-Token": token, Nonce: nonce, ...opts.headers },
    });
    token = r.headers.get("cart-token") || token;
    nonce = r.headers.get("nonce") || nonce;
    return r;
  };
  return {
    add: (id, quantity = 1) => call("/cart/add-item", { method: "POST", body: { id, quantity } }),
    coupon: (code) => call("/cart/apply-coupon", { method: "POST", body: { code } }),
    cart: () => call("/cart"),
    checkout: (email) =>
      call("/checkout", {
        method: "POST",
        body: {
          billing_address: addr(email),
          shipping_address: addr(email),
          payment_method: "cod",
        },
      }),
  };
}
const addr = (email) => ({
  first_name: "Test", last_name: "Shopper", address_1: "1 Tahrir St", city: "Cairo",
  state: "EGC", postcode: "11511", country: "EG", email, phone: "01000000000",
});

const product = async (name, price, stock, extra = {}) =>
  (await admin("/products", {
    method: "POST",
    body: { name: `${name} ${RUN}`, type: "simple", regular_price: String(price),
      manage_stock: true, stock_quantity: stock, ...extra },
  })).json;
const stockOf = async (id) => (await admin(`/products/${id}`)).json.stock_quantity;
const coupon = async (code, extra) =>
  (await admin("/coupons", { method: "POST", body: { code: `${code}${RUN}`.toLowerCase(), ...extra } })).json;

// ---- 0. shipping zone for Egypt (needed for any checkout) -------------------
const zones = (await admin("/shipping/zones")).json;
if (!zones.some((z) => z.name === "Egypt")) {
  const z = (await admin("/shipping/zones", { method: "POST", body: { name: "Egypt" } })).json;
  await admin(`/shipping/zones/${z.id}/locations`, { method: "PUT", body: [{ code: "EG", type: "country" }] });
  await admin(`/shipping/zones/${z.id}/methods`, {
    method: "POST", body: { method_id: "flat_rate", settings: { cost: "50" } },
  });
}

// ---- 1. REST catalog queries -------------------------------------------------
const cat = (await admin("/products/categories", { method: "POST", body: { name: `Spike cat ${RUN}` } })).json;
for (const [i, price] of [100, 300, 500].entries())
  await product(`Cat item ${i}`, price, 5, { categories: [{ id: cat.id }] });
{
  const r = await admin(`/products?category=${cat.id}&per_page=2&page=1&orderby=price&order=desc&min_price=200`);
  check("REST: filter by category + price range + sort + pagination",
    r.status === 200 && r.json.length === 2 && Number(r.json[0].price) === 500,
    `total=${r.headers.get("x-wp-total")} pages=${r.headers.get("x-wp-totalpages")}`);
}

// ---- 2. guest cart, COD checkout, stock decrement ---------------------------
const p1 = await product("COD item", 1000, 10, { sale_price: "800" });
{
  const s = await shopper();
  const add = await s.add(p1.id, 2);
  check("Store API: guest cart works with Cart-Token only", add.status === 201 || add.status === 200, `status ${add.status}`);
  const co = await s.checkout(`cod-${RUN}@example.com`);
  check("COD checkout creates an order", co.status === 200 && co.json.order_id > 0,
    co.status === 200 ? `order ${co.json.order_id} status=${co.json.status}` : JSON.stringify(co.json).slice(0, 200));
  check("Stock decremented by quantity", (await stockOf(p1.id)) === 8, `stock=${await stockOf(p1.id)}`);
  check("COD order status is on-hold/processing", ["on-hold", "processing"].includes(co.json.status), co.json.status);
}

// ---- 3. coupon applied to post-discount subtotal -----------------------------
{
  const code = (await coupon("pct10", { discount_type: "percent", amount: "10" })).code;
  const s = await shopper();
  await s.add(p1.id, 1); // sale price 800
  const r = await s.coupon(code);
  const t = r.json.totals;
  // Items are 800.00 (sale), 10% off -> 80.00 discount, in minor units.
  check("Coupon comes off the sale price (800 -10% = 720)",
    r.status === 200 && Number(t.total_items) === 80000 && Number(t.total_discount) === 8000,
    `items=${t?.total_items} discount=${t?.total_discount} minor_unit=${t?.currency_minor_unit}`);
}

// ---- 4. stock error is machine readable --------------------------------------
{
  const p = await product("Scarce", 100, 1);
  const s = await shopper();
  const r = await s.add(p.id, 2);
  check("Over-stock add-to-cart returns a coded error", r.status >= 400 && !!r.json.code,
    `status ${r.status} code=${r.json.code}`);
}

// ---- 5. last unit, two shoppers at once --------------------------------------
{
  const p = await product("Last unit", 100, 1);
  const [a, b] = [await shopper(), await shopper()];
  await a.add(p.id); await b.add(p.id);
  const [ra, rb] = await Promise.all([a.checkout(`a-${RUN}@example.com`), b.checkout(`b-${RUN}@example.com`)]);
  const ok = [ra, rb].filter((r) => r.status === 200).length;
  check("Two simultaneous orders for the last unit: exactly one succeeds", ok === 1,
    `succeeded=${ok} statuses=${ra.status}/${rb.status} stock=${await stockOf(p.id)}`);
}

// ---- 6. coupon usage limit under concurrency ---------------------------------
{
  const p = await product("Coupon race", 100, 10);
  const code = (await coupon("once", { discount_type: "fixed_cart", amount: "10", usage_limit: 1 })).code;
  const [a, b] = [await shopper(), await shopper()];
  await a.add(p.id); await b.add(p.id);
  await a.coupon(code); await b.coupon(code);
  const [ra, rb] = await Promise.all([a.checkout(`ca-${RUN}@example.com`), b.checkout(`cb-${RUN}@example.com`)]);
  const ok = [ra, rb].filter((r) => r.status === 200).length;
  check("Coupon usage_limit=1 under concurrent checkout: exactly one order", ok === 1,
    `succeeded=${ok} statuses=${ra.status}/${rb.status}`);
}

// ---- 7. double click on Place order ------------------------------------------
{
  const p = await product("Double click", 100, 10);
  const s = await shopper();
  await s.add(p.id);
  const email = `dbl-${RUN}@example.com`;
  const rs = await Promise.all([s.checkout(email), s.checkout(email), s.checkout(email)]);
  const orders = (await admin(`/orders?search=${encodeURIComponent(email)}`)).json;
  check("Triple submit of one cart creates one order", orders.length === 1,
    `orders=${orders.length} statuses=${rs.map((r) => r.status).join("/")} stock=${await stockOf(p.id)}`);
}

// ---- 8. cancel restocks exactly once -----------------------------------------
{
  const p = await product("Cancel me", 100, 5);
  const s = await shopper();
  await s.add(p.id, 2);
  const co = await s.checkout(`cx-${RUN}@example.com`);
  const before = await stockOf(p.id);
  await admin(`/orders/${co.json.order_id}`, { method: "PUT", body: { status: "cancelled" } });
  const afterOnce = await stockOf(p.id);
  await admin(`/orders/${co.json.order_id}`, { method: "PUT", body: { status: "cancelled" } });
  const afterTwice = await stockOf(p.id);
  check("Cancel restocks exactly once", before === 3 && afterOnce === 5 && afterTwice === 5,
    `before=${before} afterCancel=${afterOnce} afterSecondCancel=${afterTwice}`);
}

// ---- 9. anonymous and customer access ----------------------------------------
{
  const anon = await http("/wc/v3/orders");
  check("Anonymous cannot list orders", anon.status === 401 || anon.status === 403, `status ${anon.status}`);
  const users = await http("/wp/v2/users");
  check("Anonymous cannot enumerate users (/wp/v2/users)", [401, 403, 404].includes(users.status),
    `status ${users.status} (known issue if 200)`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
