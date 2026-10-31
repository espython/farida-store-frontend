// Auth spike for A1 (#242): customer JWT login and order ownership against the
// local staging stack. Needs .env.local (WC_KEY, WC_SECRET) and the JWT secret
// in wp-config (see README).
//
//   node --env-file=.env.local spike-auth.mjs
//
// Creates customers with a run id, so it is safe to re-run. Passwords are
// generated per run and never printed.
import { randomBytes } from "node:crypto";

const BASE = process.env.WP_URL || "http://localhost:8080";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");

const RUN = Date.now().toString(36);
const basic = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
const password = () => randomBytes(12).toString("base64url") + "A1";

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
  return { status: res.status, json };
}

const decode = (jwt) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());

// 1. Register: the BFF creates a Woo customer with the server-only keys.
const makeCustomer = async (tag) => {
  const email = `qa-${tag}-${RUN}@example.test`;
  const pw = password();
  const r = await http("/wc/v3/customers", {
    method: "POST",
    headers: { Authorization: basic },
    body: { email, first_name: "QA", last_name: tag, username: `qa-${tag}-${RUN}`, password: pw },
  });
  return { r, email, pw, id: r.json?.id };
};

const a = await makeCustomer("a");
check("register: POST wc/v3/customers creates a customer", a.r.status === 201 && a.r.json?.role === "customer", `status ${a.r.status}`);
const dup = await http("/wc/v3/customers", { method: "POST", headers: { Authorization: basic }, body: { email: a.email, password: password() } });
check("register: duplicate email is refused with a machine-readable code", dup.status === 400 && typeof dup.json?.code === "string", dup.json?.code);

// 2. Login with email (customers type their email, not a username).
const login = await http("/jwt-auth/v1/token", { method: "POST", body: { username: a.email, password: a.pw } });
const token = login.json?.token;
check("login: email + password returns a JWT", login.status === 200 && typeof token === "string", `status ${login.status}`);

if (token) {
  const payload = decode(token);
  const days = (payload.exp - payload.iat) / 86400;
  check("token: carries the WP user id and an expiry", String(payload.data?.user?.id) === String(a.id) && payload.exp > payload.iat, `lifetime ${days} days`);

  const validate = await http("/jwt-auth/v1/token/validate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  check("token: /token/validate accepts it (Authorization header reaches WP)", validate.status === 200, `status ${validate.status}`);

  const me = await http("/wp/v2/users/me?context=edit", { headers: { Authorization: `Bearer ${token}` } });
  check("token: /wp/v2/users/me resolves the customer", me.status === 200 && me.json?.id === a.id, `status ${me.status}`);

  const direct = await http(`/wc/v3/customers/${a.id}`, { headers: { Authorization: `Bearer ${token}` } });
  check("token: a customer token cannot use wc/v3 directly (BFF must use keys + ownership)", direct.status === 401 || direct.status === 403, `status ${direct.status}`);

  const tampered = token.slice(0, -4) + (token.endsWith("AAAA") ? "BBBB" : "AAAA");
  const bad = await http("/jwt-auth/v1/token/validate", { method: "POST", headers: { Authorization: `Bearer ${tampered}` } });
  check("token: a tampered signature is rejected", bad.status === 403 || bad.status === 401, `status ${bad.status}`);
}

// 3. Failure messages: must not reveal whether an account exists.
const wrongPw = await http("/jwt-auth/v1/token", { method: "POST", body: { username: a.email, password: "wrong-" + RUN } });
const unknown = await http("/jwt-auth/v1/token", { method: "POST", body: { username: `nobody-${RUN}@example.test`, password: "x" } });
check(
  "login failures: WP distinguishes unknown user from wrong password (BFF must hide it)",
  wrongPw.json?.code !== unknown.json?.code,
  `${wrongPw.status} ${wrongPw.json?.code} vs ${unknown.status} ${unknown.json?.code}`
);

// 4. Ownership: orders are filtered by customer id with the server keys.
const b = await makeCustomer("b");
const product = await http("/wc/v3/products", {
  method: "POST",
  headers: { Authorization: basic },
  body: { name: `QA auth ${RUN}`, regular_price: "100.00", status: "private" },
});
const order = await http("/wc/v3/orders", {
  method: "POST",
  headers: { Authorization: basic },
  body: { customer_id: a.id, payment_method: "cod", line_items: [{ product_id: product.json?.id, quantity: 1 }] },
});
const ofA = await http(`/wc/v3/orders?customer=${a.id}`, { headers: { Authorization: basic } });
const ofB = await http(`/wc/v3/orders?customer=${b.id}`, { headers: { Authorization: basic } });
check(
  "ownership: ?customer=<id> returns only that customer's orders",
  ofA.json?.some?.((o) => o.id === order.json?.id) && Array.isArray(ofB.json) && !ofB.json.some((o) => o.id === order.json?.id)
);
const one = await http(`/wc/v3/orders/${order.json?.id}`, { headers: { Authorization: basic } });
check("ownership: an order carries customer_id for the BFF's check", one.json?.customer_id === a.id);

// 5. Password change invalidates the old token?
if (token) {
  await http(`/wc/v3/customers/${a.id}`, { method: "PUT", headers: { Authorization: basic }, body: { password: password() } });
  const after = await http("/jwt-auth/v1/token/validate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  check("revocation: old token after a password change", true, after.status === 200 ? "STILL VALID (no revocation; rely on short expiry)" : `rejected (${after.status})`);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
