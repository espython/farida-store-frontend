// Cart spike for C2 (#248): Store API cart for signed-in customers (WP JWT)
// against the local staging stack. Needs .env.local (WC_KEY, WC_SECRET) and
// the JWT secret (setup.sh). Creates its own customer per run.
//
//   node --env-file=.env.local spike-cart.mjs
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

// Two in-stock products and one with low stock.
const products = (await http("/wc/v3/products?per_page=50&status=publish&stock_status=instock", { headers: { Authorization: basic } })).json;
const [p1, p2] = products.filter((p) => p.type === "simple");
const low = products.find((p) => p.manage_stock && p.stock_quantity > 0 && p.stock_quantity <= 5);

// A customer and their token.
const email = `qa-cart-${RUN}@example.test`;
const pw = randomBytes(12).toString("base64url") + "A1";
await http("/wc/v3/customers", { method: "POST", headers: { Authorization: basic }, body: { email, password: pw, username: `qa_cart_${RUN}` } });
const token = (await http("/jwt-auth/v1/token", { method: "POST", body: { username: email, password: pw } })).json.token;
const bearer = { Authorization: `Bearer ${token}` };

// 1. Signed-in cart over the Store API with the JWT.
const c0 = await http("/wc/store/v1/cart", { headers: bearer });
const cartToken = c0.headers.get("cart-token");
check("customer GET /cart with Bearer JWT", c0.status === 200, `status ${c0.status}`);
check("Store API returns a Cart-Token for the customer", !!cartToken);

// 2. Mutations: Cart-Token without Nonce.
const add1 = await http("/wc/store/v1/cart/add-item", { method: "POST", headers: { ...bearer, "Cart-Token": cartToken }, body: { id: p1.id, quantity: 2 } });
check("add-item with Bearer + Cart-Token and no Nonce", add1.status === 201 || add1.status === 200, `status ${add1.status} ${add1.json?.code ?? ""}`);
const noToken = await http("/wc/store/v1/cart/add-item", { method: "POST", headers: bearer, body: { id: p2.id, quantity: 1 } });
info("add-item with Bearer only (no Cart-Token, no Nonce)", `status ${noToken.status} ${noToken.json?.code ?? ""}`);

// 3. Another device: same customer, fresh request without the cart token.
const other = await http("/wc/store/v1/cart", { headers: bearer });
const otherIds = (other.json.items ?? []).map((i) => [i.id, i.quantity]);
check("same customer, no Cart-Token: sees the saved cart (cross-device)", otherIds.some(([id, q]) => id === p1.id && q >= 2), JSON.stringify(otherIds));
const otherToken = other.headers.get("cart-token");
info("Cart-Token on the second device", otherToken === cartToken ? "same token" : "different token (session id in token)");

// 4. The cart token alone, without the JWT, must not expose the customer's cart.
const stolen = await http("/wc/store/v1/cart", { headers: { "Cart-Token": cartToken } });
const stolenIds = (stolen.json.items ?? []).map((i) => i.id);
info("Cart-Token without JWT", `status ${stolen.status}, items ${JSON.stringify(stolenIds)} (token is a capability: keep it httpOnly)`);

// 5. Guest cart, then sign in: is it merged automatically?
const g0 = await http("/wc/store/v1/cart");
const guestToken = g0.headers.get("cart-token");
await http("/wc/store/v1/cart/add-item", { method: "POST", headers: { "Cart-Token": guestToken }, body: { id: p2.id, quantity: 1 } });
const afterLogin = await http("/wc/store/v1/cart", { headers: { ...bearer, "Cart-Token": guestToken } });
const afterIds = (afterLogin.json.items ?? []).map((i) => [i.id, i.quantity]);
info("guest Cart-Token + customer JWT together", `status ${afterLogin.status}, items ${JSON.stringify(afterIds)}`);

// 6. Response shape the mapper needs.
const shape = other.json;
const item = shape.items?.[0];
check(
  "cart shape: items[key,id,quantity,prices,quantity_limits], totals in minor units",
  item && item.key && item.prices?.price && item.quantity_limits?.maximum !== undefined && shape.totals?.total_price && shape.totals?.currency_minor_unit === 2,
  item ? `limits ${JSON.stringify(item.quantity_limits)}` : "no item"
);

// 7. Update and remove by item key; over-stock error.
const upd = await http("/wc/store/v1/cart/update-item", { method: "POST", headers: { ...bearer, "Cart-Token": cartToken }, body: { key: item.key, quantity: 3 } });
check("update-item by key", upd.status === 200 && upd.json.items.find((i) => i.key === item.key)?.quantity === 3, `status ${upd.status}`);
if (low) {
  const over = await http("/wc/store/v1/cart/add-item", { method: "POST", headers: { ...bearer, "Cart-Token": cartToken }, body: { id: low.id, quantity: low.stock_quantity + 5 } });
  check("over-stock add returns a coded 4xx", over.status >= 400 && typeof over.json.code === "string", `${over.status} ${over.json.code}`);
}
const rm = await http("/wc/store/v1/cart/remove-item", { method: "POST", headers: { ...bearer, "Cart-Token": cartToken }, body: { key: item.key } });
check("remove-item by key", rm.status === 200 && !rm.json.items.some((i) => i.key === item.key), `status ${rm.status}`);

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
