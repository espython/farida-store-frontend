// Checkout spike for C3 (#249): signed-in COD checkout on the Store API, with
// the customer's JWT + Cart-Token, against the local staging stack.
//
//   node --env-file=.env.local spike-checkout.mjs
import { randomBytes } from "node:crypto";

const BASE = process.env.WP_URL || "http://localhost:8080";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");
const RUN = Date.now().toString(36);
const basic = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

const results = [];
const check = (name, ok, note = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};
const info = (name, note) => console.log(`INFO  ${name}  -- ${note}`);

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
const admin = (path, opts = {}) => http(`/wc/v3${path}`, { ...opts, headers: { Authorization: basic, ...(opts.headers || {}) } });

// Customer, token, cart token, one product in the cart.
const email = `qa-checkout-${RUN}@example.test`;
const pw = randomBytes(12).toString("base64url") + "A1";
const customer = (await admin("/customers", { method: "POST", body: { email, password: pw, first_name: "Mona", last_name: "Checkout", username: `qa_co_${RUN}` } })).json;
const jwt = (await http("/jwt-auth/v1/token", { method: "POST", body: { username: email, password: pw } })).json.token;
let cartToken = (await http("/wc/store/v1/cart", { headers: { Authorization: `Bearer ${jwt}` } })).headers.get("cart-token");
const store = async (path, opts = {}) => {
  const r = await http(`/wc/store/v1${path}`, { ...opts, headers: { Authorization: `Bearer ${jwt}`, "Cart-Token": cartToken, ...(opts.headers || {}) } });
  cartToken = r.headers.get("cart-token") || cartToken;
  return r;
};
const product = (await admin("/products", { method: "POST", body: { name: `Checkout item ${RUN}`, type: "simple", regular_price: "500", manage_stock: true, stock_quantity: 5 } })).json;
await store("/cart/add-item", { method: "POST", body: { id: product.id, quantity: 2 } });

// 1. Egypt governorates.
const eg = await admin("/data/countries/eg");
const states = eg.json.states ?? [];
check("Egypt states from wc/v3/data/countries/eg", states.length > 20 && states.some((s) => s.code === "EGC"), `${states.length} states, e.g. ${JSON.stringify(states.slice(0, 2))}`);

// 2. Address → shipping rates.
const address = { first_name: "Mona", last_name: "Checkout", address_1: "12 El Nasr St", address_2: "Apt 4", city: "Nasr City", state: "EGC", postcode: "11765", country: "EG", phone: "01001234567" };
const upd = await store("/cart/update-customer", { method: "POST", body: { billing_address: { ...address, email }, shipping_address: address } });
const pkg = upd.json.shipping_rates?.[0];
check("update-customer returns shipping rates for the address", upd.status === 200 && pkg?.shipping_rates?.length > 0, pkg ? JSON.stringify(pkg.shipping_rates.map((r) => [r.rate_id, r.name, r.price, r.selected])) : `status ${upd.status}`);
const rate = pkg?.shipping_rates?.[0];
const sel = await store("/cart/select-shipping-rate", { method: "POST", body: { package_id: pkg?.package_id ?? 0, rate_id: rate?.rate_id } });
check("select-shipping-rate; totals include shipping", sel.status === 200 && Number(sel.json.totals.total_shipping) > 0, `shipping ${sel.json.totals?.total_shipping}, total ${sel.json.totals?.total_price}`);

// 3. Coupons.
const code = `save10${RUN}`.toLowerCase();
await admin("/coupons", { method: "POST", body: { code, discount_type: "percent", amount: "10" } });
const bad = await store("/cart/apply-coupon", { method: "POST", body: { code: "nope-" + RUN } });
check("unknown coupon: coded 4xx", bad.status >= 400 && typeof bad.json.code === "string", `${bad.status} ${bad.json.code}`);
const good = await store("/cart/apply-coupon", { method: "POST", body: { code } });
check("coupon applies; discount in totals", good.status === 200 && Number(good.json.totals.total_discount) === 10000, `discount ${good.json.totals?.total_discount}, total ${good.json.totals?.total_price}`);
const cartBefore = good.json;
info("cart payment methods", JSON.stringify(cartBefore.payment_methods));

// 4 + 5. Place the order twice at once.
const body = { billing_address: { ...address, email }, shipping_address: address, payment_method: "cod", customer_note: "Call before delivery" };
const [a, b] = await Promise.all([store("/checkout", { method: "POST", body }), store("/checkout", { method: "POST", body })]);
const ids = [a, b].filter((r) => r.status === 200).map((r) => r.json.order_id);
info("two simultaneous checkouts", `statuses ${a.status}/${b.status} ${[a, b].map((r) => r.json?.code || r.json?.order_id).join(" / ")}`);
// Finding (2026-10-31): the Store API does NOT dedupe truly concurrent
// checkouts of one cart; both create an order. The BFF serializes per
// customer and replays results per idempotency key (modules/checkout).
info("concurrent checkouts of one cart", new Set(ids).size === 1 ? "one order" : `${new Set(ids).size} orders ${JSON.stringify(ids)}: the BFF must dedupe`);
const placed = a.status === 200 ? a.json : b.json;
check("COD order placed: processing, totals with shipping and coupon", placed.status === "processing" && placed.order_key, `#${placed.order_id} ${placed.status} key ${String(placed.order_key).slice(0, 12)}…`);
const after = await store("/cart");
check("cart emptied after checkout", after.json.items.length === 0);

// 6. Read back for the confirmation page.
const order = (await admin(`/orders/${placed.order_id}`)).json;
check("order belongs to the customer; note, shipping, coupon recorded",
  order.customer_id === customer.id && order.customer_note === "Call before delivery" && Number(order.shipping_total) > 0 && order.coupon_lines?.length === 1,
  `customer ${order.customer_id}, total ${order.total}, shipping ${order.shipping_total}, discount ${order.discount_total}`);
const storeOrder = await http(`/wc/store/v1/order/${placed.order_id}?key=${placed.order_key}&billing_email=${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${jwt}` } });
info("Store API GET /order/{id}?key&billing_email", `status ${storeOrder.status} ${storeOrder.json?.code ?? ""}`);

// 7. Address saved on the customer (A4 can prefill from it).
const cust = (await admin(`/customers/${customer.id}`)).json;
check("address saved to the customer for next time", cust.shipping?.address_1 === address.address_1 && cust.billing?.phone === address.phone);

// 8. Stock error at checkout.
const scarce = (await admin("/products", { method: "POST", body: { name: `Scarce ${RUN}`, type: "simple", regular_price: "100", manage_stock: true, stock_quantity: 1 } })).json;
await store("/cart/add-item", { method: "POST", body: { id: scarce.id, quantity: 1 } });
await admin(`/products/${scarce.id}`, { method: "PUT", body: { stock_quantity: 0 } });
const oos = await store("/checkout", { method: "POST", body });
check("stock gone before checkout: coded error, no order", oos.status >= 400 && typeof oos.json.code === "string", `${oos.status} ${oos.json.code}`);

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
