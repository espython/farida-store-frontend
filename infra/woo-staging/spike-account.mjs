// Account spike for A4 (#245): profile and address book on the Woo customer
// (wc/v3/customers with the server keys), against the local staging stack.
//
//   node --env-file=.env.local spike-account.mjs
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

const mk = async (tag) => {
  const email = `qa-account-${tag}-${RUN}@example.test`;
  const pw = randomBytes(12).toString("base64url") + "A1";
  const c = (await admin("/customers", { method: "POST", body: { email, password: pw, first_name: "Mona", last_name: "Account", username: `qa_ac_${tag}_${RUN}` } })).json;
  const jwt = (await http("/jwt-auth/v1/token", { method: "POST", body: { username: email, password: pw } })).json.token;
  return { id: c.id, email, pw, jwt };
};
const a = await mk("a");
const b = await mk("b");
info("customers", `a=${a.id} b=${b.id}`);

// 1. Profile read: which fields come back.
const got = await admin(`/customers/${a.id}`);
check("read customer with keys", got.status === 200, Object.keys(got.json).join(","));
info("billing/shipping on a new customer", JSON.stringify({ billing: got.json.billing, shipping: got.json.shipping }));

// 2. Profile update: names.
const upd = await admin(`/customers/${a.id}`, { method: "PUT", body: { first_name: "Mariam", last_name: "Edited" } });
check("update names", upd.status === 200 && upd.json.first_name === "Mariam", upd.json.first_name);
const me = await http("/wp/v2/users/me?context=edit&_fields=name,first_name,last_name", { headers: { Authorization: `Bearer ${a.jwt}` } });
info("users/me after the name change", JSON.stringify(me.json));

// 3. Email change to an address in use.
const dup = await admin(`/customers/${a.id}`, { method: "PUT", body: { email: b.email } });
info("email change to a taken address", `${dup.status} ${dup.json?.code}`);

// 4. Address book in customer meta (JSON string).
const book = JSON.stringify({ v: 1, defaultId: "x1", entries: [{ id: "x1", firstName: "Mona", lastName: "A", address1: "1 Nile St", address2: "", city: "Zamalek", state: "EGC", postcode: "11211", phone: "01001234567" }] });
const put = await admin(`/customers/${a.id}`, { method: "PUT", body: { meta_data: [{ key: "farida_address_book", value: book }] } });
const meta = (put.json.meta_data || []).find((m) => m.key === "farida_address_book");
check("meta written and returned", meta?.value === book);
const reread = (await admin(`/customers/${a.id}`)).json.meta_data.find((m) => m.key === "farida_address_book");
check("meta persists", reread?.value === book);
// Re-writing the same key must replace, not add a second row.
await admin(`/customers/${a.id}`, { method: "PUT", body: { meta_data: [{ key: "farida_address_book", value: "{}" }] } });
const rows = (await admin(`/customers/${a.id}`)).json.meta_data.filter((m) => m.key === "farida_address_book");
check("same key replaces the value", rows.length === 1 && rows[0].value === "{}", `${rows.length} rows`);
// _fields keeps the response small.
const narrow = await admin(`/customers/${a.id}?_fields=id,meta_data`);
check("_fields on customers", !("billing" in narrow.json) && "meta_data" in narrow.json, Object.keys(narrow.json).join(","));

// 5. Not public: anonymous users endpoint and another customer's JWT.
const pub = await http(`/wp/v2/users/${a.id}`);
check("meta not on public wp/v2/users", !JSON.stringify(pub.json).includes("farida_address_book"), `${pub.status}`);
const asB = await http(`/wc/v3/customers/${a.id}`, { headers: { Authorization: `Bearer ${b.jwt}` } });
check("customer JWT cannot read wc/v3/customers", asB.status === 401 || asB.status === 403, `${asB.status}`);

// 6. Default address in shipping/billing → the Store API cart starts from it.
const ship = { first_name: "Mona", last_name: "A", address_1: "1 Nile St", address_2: "", city: "Zamalek", state: "EGC", postcode: "11211", country: "EG", phone: "01001234567" };
const s = await admin(`/customers/${a.id}`, { method: "PUT", body: { shipping: ship, billing: { ...ship, email: a.email } } });
check("shipping + billing saved", s.status === 200 && s.json.shipping.address_1 === "1 Nile St" && s.json.billing.email === a.email);
const cart = await http("/wc/store/v1/cart", { headers: { Authorization: `Bearer ${a.jwt}` } });
check("Store API cart prefilled from customer", cart.json.shipping_address?.address_1 === "1 Nile St", JSON.stringify(cart.json.shipping_address));
info("shipping.phone", `customer=${s.json.shipping.phone ?? "(no field)"} cart=${cart.json.shipping_address?.phone}`);

// Cleanup.
for (const c of [a, b]) await admin(`/customers/${c.id}?force=true`, { method: "DELETE" });

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
