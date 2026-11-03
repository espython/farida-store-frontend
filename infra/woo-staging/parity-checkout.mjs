// C4 parity: the old backend's checkout guarantees, through the storefront's own routes (BFF) on a
// running dev server, against staging Woo. The Woo keys are used only to set up data and to compare.
//
//   1. a double submit (same Idempotency-Key, concurrent and repeated) creates one order
//   2. two customers racing for the last unit: one order, the other gets a clear refusal
//   3. a coupon limited to one use: the second customer is refused
//   4. the totals the storefront shows equal the Woo order
//   5. a cancel or refund in the Woo admin shows on the storefront
//
// Needs: docker stack up, dev server on :3111 (see README "How to resume"), .env.local.
//   node --env-file=.env.local parity-checkout.mjs
const APP = process.env.APP_URL || "http://localhost:3111";
const WP = process.env.WP_URL || "http://localhost:8080";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");
const RUN = Date.now().toString(36);
const basic = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

let failed = 0;
const check = (name, ok, note = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};
const admin = async (path, method = "GET", body) => {
  const res = await fetch(`${WP}/wp-json/wc/v3${path}`, { method, headers: { Authorization: basic, "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
  return res.json();
};
const minor = (decimal) => Math.round(Number(decimal) * 100);

/** One shopper with their own cookie jar and visitor address (the routes rate-limit per visitor). */
async function shopper(label) {
  const jar = new Map();
  const ip = `10.250.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const call = async (method, path, body, headers = {}) => {
    const res = await fetch(APP + path, {
      method,
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip, cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), ...headers },
      body: body && JSON.stringify(body),
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const [k, v] = [pair.slice(0, i), pair.slice(i + 1)];
      v ? jar.set(k, v) : jar.delete(k);
    }
    return { status: res.status, json: await res.json().catch(() => null) };
  };
  const email = `c4-${label}-${RUN}@example.com`;
  const reg = await call("POST", "/api/auth/register", { email, password: `C4pass${RUN.slice(-4)}A1`, firstName: "Parity", lastName: label });
  if (reg.status !== 201) throw new Error(`register ${label}: ${reg.status} ${JSON.stringify(reg.json)}`);
  return { call, email, customerId: reg.json.session.customerId };
}

const address = { firstName: "Mona", lastName: "Ali", address1: "5 Tahrir St", address2: "", city: "Dokki", state: "EGGZ", postcode: "12611", phone: "01012345678" };

/** Cart → address → first shipping rate → (coupon). Returns the checkout the customer sees. */
async function readyToOrder(s, productId, quantity, coupon) {
  const add = await s.call("POST", "/api/shop/cart/items", { productId: String(productId), quantity });
  if (add.status >= 400) return { error: add };
  const a = await s.call("PUT", "/api/shop/checkout/address", { address });
  if (a.status >= 400) return { error: a };
  const rate = a.json.checkout.shippingRates[0];
  if (rate && !rate.selected) await s.call("PUT", "/api/shop/checkout/shipping-rate", { rateId: rate.id });
  if (coupon) {
    const c = await s.call("POST", "/api/shop/checkout/coupon", { code: coupon });
    if (c.status >= 400) return { error: c };
  }
  return { checkout: (await s.call("GET", "/api/shop/checkout")).json.checkout };
}
const place = (s, key) => s.call("POST", "/api/shop/checkout/order", { paymentMethod: "cod", note: "" }, { "Idempotency-Key": key });

// Fixtures: a product with plenty of stock, one with a single unit, a single-use coupon.
const plenty = await admin("/products", "POST", { name: `C4 kettle ${RUN}`, type: "simple", regular_price: "450", manage_stock: true, stock_quantity: 50 });
const lastUnit = await admin("/products", "POST", { name: `C4 last unit ${RUN}`, type: "simple", regular_price: "300", manage_stock: true, stock_quantity: 1 });
const coupon = await admin("/coupons", "POST", { code: `c4once${RUN}`, discount_type: "percent", amount: "10", usage_limit: 1 });
const stockOf = async (id) => (await admin(`/products/${id}`)).stock_quantity;
const ordersOf = async (customerId) => (await admin(`/orders?customer=${customerId}&per_page=20`)).filter((o) => o.status !== "checkout-draft");

console.log("# 1. Double submit");
{
  const s = await shopper("double");
  await readyToOrder(s, plenty.id, 2);
  const key = `${s.customerId}_c4-${RUN}`;
  const [a, b, c] = await Promise.all([place(s, key), place(s, key), place(s, key)]);
  const again = await place(s, key);
  const ids = new Set([a, b, c, again].map((r) => r.json?.orderId));
  check("three concurrent submits and a retry answer with one order id", ids.size === 1 && [...ids][0], JSON.stringify([...ids]));
  const orders = await ordersOf(s.customerId);
  check("Woo has exactly one order", orders.length === 1, `${orders.length}`);
  check("stock reduced once", (await stockOf(plenty.id)) === 48, `${await stockOf(plenty.id)}`);
}

console.log("\n# 2. Last unit");
{
  const [s1, s2] = await Promise.all([shopper("race1"), shopper("race2")]);
  const [r1, r2] = await Promise.all([readyToOrder(s1, lastUnit.id, 1), readyToOrder(s2, lastUnit.id, 1)]);
  check("both carts hold the last unit before checkout", !r1.error && !r2.error, JSON.stringify([r1.error?.json, r2.error?.json]));
  const [p1, p2] = await Promise.all([place(s1, `${s1.customerId}_c4r-${RUN}`), place(s2, `${s2.customerId}_c4r-${RUN}`)]);
  const ok = [p1, p2].filter((p) => p.status === 200);
  const refused = [p1, p2].find((p) => p.status !== 200);
  check("exactly one order is placed", ok.length === 1, `${p1.status} ${p2.status}`);
  // Woo answers the loser 403 woocommerce_product_not_enough_stock: it must reach the shopper as
  // "out of stock", not as a session problem (a 401 signs them out).
  check("the other is told it is out of stock (409 out_of_stock)", refused?.status === 409 && refused.json?.error?.code === "out_of_stock", `${refused?.status} ${refused?.json?.error?.code}`);
  check("stock ends at 0, never below", (await stockOf(lastUnit.id)) === 0, `${await stockOf(lastUnit.id)}`);
}

console.log("\n# 3. Single-use coupon");
{
  const [s1, s2] = await Promise.all([shopper("coupon1"), shopper("coupon2")]);
  const r1 = await readyToOrder(s1, plenty.id, 1, coupon.code);
  check("first customer applies the coupon", !r1.error && r1.checkout.totals.discount.amount === 4500, JSON.stringify(r1.error?.json ?? r1.checkout?.totals.discount));
  const p1 = await place(s1, `${s1.customerId}_c4c-${RUN}`);
  check("first order with the coupon is placed", p1.status === 200, `${p1.status}`);
  const r2 = await readyToOrder(s2, plenty.id, 1, coupon.code);
  const p2 = r2.error ? null : await place(s2, `${s2.customerId}_c4c-${RUN}`);
  const refused = r2.error ?? (p2 && p2.status !== 200 ? p2 : null);
  check("second customer is refused as coupon_invalid", refused?.status === 400 && refused.json?.error?.code === "coupon_invalid", `${refused?.status} ${refused?.json?.error?.code}`);
  check("coupon used once in Woo", (await admin(`/coupons/${coupon.id}`)).usage_count === 1);
}

console.log("\n# 4. Totals");
{
  const s = await shopper("totals");
  const t = await admin("/coupons", "POST", { code: `c4tot${RUN}`, discount_type: "fixed_cart", amount: "75" });
  const r = await readyToOrder(s, plenty.id, 3, t.code);
  const shown = r.checkout.totals;
  const p = await place(s, `${s.customerId}_c4t-${RUN}`);
  const woo = await admin(`/orders/${p.json.orderId}`);
  check("total", shown.total.amount === minor(woo.total), `${shown.total.amount} vs ${minor(woo.total)}`);
  check("shipping", shown.shipping.amount === minor(woo.shipping_total), `${shown.shipping.amount} vs ${minor(woo.shipping_total)}`);
  check("discount", shown.discount.amount === minor(woo.discount_total), `${shown.discount.amount} vs ${minor(woo.discount_total)}`);
  const page = (await s.call("GET", `/api/shop/orders/${p.json.orderId}`)).json.order;
  check("the order page shows the same total", page.totals.total.amount === minor(woo.total));
  check("and items = lines before coupons", page.totals.items.amount === minor(woo.line_items.reduce((n, l) => n + Number(l.subtotal), 0)));

  console.log("\n# 5. Changes in the Woo admin");
  await admin(`/orders/${p.json.orderId}`, "PUT", { status: "cancelled" });
  check("cancel in Woo shows as cancelled", (await s.call("GET", `/api/shop/orders/${p.json.orderId}`)).json.order.status === "cancelled");
  const s2 = await shopper("refund");
  await readyToOrder(s2, plenty.id, 1);
  const p2 = await place(s2, `${s2.customerId}_c4f-${RUN}`);
  await admin(`/orders/${p2.json.orderId}`, "PUT", { status: "completed" });
  const refund = await admin(`/orders/${p2.json.orderId}/refunds`, "POST", { amount: (await admin(`/orders/${p2.json.orderId}`)).total, api_refund: false, restock_items: true });
  check("Woo refund created", Boolean(refund.id), JSON.stringify(refund.code ?? ""));
  check("full refund shows as refunded", (await s2.call("GET", `/api/shop/orders/${p2.json.orderId}`)).json.order.status === "refunded");
  const list = (await s2.call("GET", "/api/shop/orders?page=1")).json.orders.orders;
  check("and in the order list", list.find((o) => o.id === p2.json.orderId)?.status === "refunded");
}

await admin(`/products/${plenty.id}?force=true`, "DELETE");
await admin(`/products/${lastUnit.id}?force=true`, "DELETE");
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
