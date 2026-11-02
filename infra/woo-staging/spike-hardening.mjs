// W8 audit: what anonymous visitors and signed-in customers can reach on WordPress directly
// (bypassing the storefront BFF). Every check states the secure expectation.
//   node --env-file=.env.local spike-hardening.mjs
// Creates its own customer with a run id, deletes it after.
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
async function req(path, { method = "GET", body, headers = {}, redirect = "manual" } = {}) {
  const res = await fetch(`${BASE}${path}`, { method, redirect, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, location: res.headers.get("location") };
}
const denied = (s) => [401, 403, 404].includes(s);

// A customer with a known password, signed in with the JWT plugin like the storefront does.
const email = `w8-${RUN}@example.com`, password = `W8-pass-${RUN}`;
const { json: cust } = await req("/wp-json/wc/v3/customers", { method: "POST", headers: keys, body: { email, password, first_name: "W8", username: `c_w8${RUN}` } });
const token = (await req("/wp-json/jwt-auth/v1/token", { method: "POST", body: { username: email, password } })).json?.token;
const jwt = { Authorization: `Bearer ${token}` };
check("setup: customer token", Boolean(token));
const adminSlug = "admin";

console.log("\n# Anonymous");
for (const p of ["/wp-json/wc/v3/customers", "/wp-json/wc/v3/orders", `/wp-json/wc/v3/customers/${cust.id}`, "/wp-json/wc/v3/products/reviews", "/wp-json/wc/v3/system_status"]) {
  check(`anonymous ${p} refused`, denied((await req(p)).status));
}
check("anonymous wp/v2/users hidden", denied((await req("/wp-json/wp/v2/users")).status));
check("anonymous wp/v2/users/1 hidden", denied((await req("/wp-json/wp/v2/users/1")).status));
const author = await req("/?author=1");
check("?author=1 does not reveal a login name", !(author.location ?? "").includes("/author/"), author.location ?? String(author.status));
const oembed = await req(`/wp-json/oembed/1.0/embed?url=${encodeURIComponent(`${BASE}/?p=1`)}`);
check("oEmbed carries no author", !oembed.json || (!oembed.json.author_name && !oembed.json.author_url), JSON.stringify(oembed.json?.author_name ?? null));
const xml = await req("/xmlrpc.php", { method: "POST", headers: { "Content-Type": "text/xml" }, body: undefined });
const xmlCall = await fetch(`${BASE}/xmlrpc.php`, { method: "POST", headers: { "Content-Type": "text/xml" }, body: `<?xml version="1.0"?><methodCall><methodName>wp.getUsersBlogs</methodName><params><param><value>${adminSlug}</value></param><param><value>wrong</value></param></params></methodCall>` }).then((r) => r.text());
check("XML-RPC off", /XML-RPC services are disabled|does not exist|faultCode>\s*<value><int>405/.test(xmlCall) || xml.status === 403 || xml.status === 404, xmlCall.slice(0, 120).replace(/\s+/g, " "));
check("anonymous comments list hides emails", !(await req("/wp-json/wp/v2/comments?per_page=5")).text.includes("@"));

console.log("\n# Signed-in customer, calling WordPress directly");
check("customer: users list hidden", denied((await req("/wp-json/wp/v2/users", { headers: jwt })).status));
check("customer: other user hidden", denied((await req("/wp-json/wp/v2/users/1", { headers: jwt })).status));
check("customer: users/me still works (the BFF needs it)", (await req("/wp-json/wp/v2/users/me", { headers: jwt })).status === 200);
check("customer: wc/v3 orders refused", denied((await req("/wp-json/wc/v3/orders", { headers: jwt })).status));
check("customer: wc/v3 customers list refused", denied((await req("/wp-json/wc/v3/customers", { headers: jwt })).status));
const own = await req(`/wp-json/wc/v3/customers/${cust.id}`, { method: "PUT", headers: jwt, body: { meta_data: [{ key: "farida_wishlist", value: "x".repeat(10) }] } });
check("customer: cannot write own Woo customer directly (only via the BFF rules)", denied(own.status), String(own.status));
const review = await req("/wp-json/wc/v3/products/reviews", { method: "POST", headers: jwt, body: { product_id: 1, review: "direct", reviewer: "x", reviewer_email: email, rating: 5, status: "approved" } });
check("customer: cannot post a review directly", denied(review.status), String(review.status));
check("customer: wc-farida routes refused", denied((await req("/wp-json/wc-farida/v1/password/forgot", { method: "POST", headers: jwt, body: { email, locale: "en", resetUrl: "https://x.test/r" } })).status));

console.log("\n# Brute force");
let last;
for (let i = 0; i < 12; i++) last = await req("/wp-json/jwt-auth/v1/token", { method: "POST", body: { username: email, password: `wrong-${i}` } });
check("token endpoint locks an account after repeated failures", last.status === 429 || /too_many/.test(last.json?.code ?? ""), `${last.status} ${last.json?.code}`);

await req(`/wp-json/wc/v3/customers/${cust.id}?force=true&reassign=0`, { method: "DELETE", headers: keys });
console.log(failed ? `\n${failed} failed` : "\nall passed");
