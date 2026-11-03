// A2 spike: Google sign-in account handling in the farida-account mu-plugin (after the storefront server
// has checked Google's ID token, which this spike stands in for).
//   node --env-file=.env.local spike-google.mjs
// Creates its own customers with a run id, deletes them after.
const BASE = process.env.WP_URL || "http://localhost:8080";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");
const RUN = Date.now().toString(36);
const keys = { Authorization: "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64") };
let failed = 0;
const check = (name, ok, note = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};
async function http(path, { method = "GET", body, headers = keys } = {}) {
  const res = await fetch(`${BASE}/wp-json${path}`, { method, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => null) };
}
const google = (body, headers) => http("/wc-farida/v1/google/login", { method: "POST", body, headers });
const me = async (token) => http("/wp/v2/users/me", { headers: { Authorization: `Bearer ${token}` } });
const meta = async (id, key) => (await http(`/wc/v3/customers/${id}`)).json.meta_data?.find((m) => m.key === key)?.value;
const token = async (username, password) => (await http("/jwt-auth/v1/token", { method: "POST", body: { username, password }, headers: {} })).json?.token;
const cleanup = [];
// Google subject ids are 21 digits; random per run so runs never share an identity.
const RUN_SUB = Array.from({ length: 18 }, () => Math.floor(Math.random() * 10)).join("");
const sub = (n) => `1${RUN_SUB}${n}0`.slice(0, 21);

check("no keys → refused", (await google({ sub: sub(1), email: `g-${RUN}@example.com` }, {})).status === 401);
check("malformed sub → 400", (await google({ sub: "abc", email: `g-${RUN}@example.com` })).status === 400);

// New customer
const email = `g-${RUN}@example.com`;
let r = await google({ sub: sub(1), email, firstName: "Salma", lastName: "Kamal" });
check("new Google user → 200 with a token", r.status === 200 && typeof r.json.token === "string", JSON.stringify(r.json).slice(0, 80));
const meRes = await me(r.json.token);
check("the token works like a password login's", meRes.status === 200);
const newId = meRes.json?.id;
cleanup.push(newId);
check("created as a customer with the name", (await http(`/wc/v3/customers/${newId}`)).json.first_name === "Salma");
check("email marked confirmed (Google verified it)", Boolean(await meta(newId, "farida_email_verified")));
r = await google({ sub: sub(1), email });
check("same Google account again → same customer", (await me(r.json.token)).json?.id === newId);

// Existing customer, never confirmed: link and replace the password
const e2 = `gp-${RUN}@example.com`, pw = `Pw-${RUN}A1`;
const { json: c2 } = await http("/wc/v3/customers", { method: "POST", body: { email: e2, password: pw, username: `c_gp${RUN}` } });
cleanup.push(c2.id);
const oldToken = await token(e2, pw);
await new Promise((res) => setTimeout(res, 1100));
r = await google({ sub: sub(2), email: e2 });
check("existing unconfirmed customer → linked", r.status === 200 && (await me(r.json.token)).json?.id === c2.id);
check("its old password no longer works", !(await token(e2, pw)));
check("its old session is signed out", [401, 404].includes((await me(oldToken)).status));

// Existing confirmed customer: link, keep the password
const e3 = `gc-${RUN}@example.com`, pw3 = `Pw3-${RUN}A1`;
const { json: c3 } = await http("/wc/v3/customers", { method: "POST", body: { email: e3, password: pw3, username: `c_gc${RUN}` } });
cleanup.push(c3.id);
await http(`/wc/v3/customers/${c3.id}`, { method: "PUT", body: { meta_data: [] } });
await (await import("node:child_process")).execSync(`docker compose --profile tools run --rm wpcli wp user meta update ${c3.id} farida_email_verified ${Math.floor(Date.now() / 1000)} >/dev/null 2>&1`);
r = await google({ sub: sub(3), email: e3 });
check("existing confirmed customer → linked, password kept", r.status === 200 && Boolean(await token(e3, pw3)));
check("another Google account for that email → 409", (await google({ sub: sub(4), email: e3 })).json?.code === "farida_google_conflict");

// Staff
// The storefront's own API user is a shop manager (create-keys.php).
check("staff email → 403", (await google({ sub: sub(5), email: "storefront-api@farida.test" })).json?.code === "farida_not_customer");

for (const id of cleanup) await http(`/wc/v3/customers/${id}?force=true&reassign=0`, { method: "DELETE" });
console.log(failed ? `\n${failed} failed` : "\nall passed");
