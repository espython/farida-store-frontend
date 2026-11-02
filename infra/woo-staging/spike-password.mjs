// A2 spike: password reset through the farida-account mu-plugin, with mail caught by Mailpit.
//   node --env-file=.env.local spike-password.mjs
// Creates its own customer with a run id, deletes it after.
const BASE = process.env.WP_URL || "http://localhost:8080";
const MAIL = process.env.MAILPIT_URL || "http://localhost:8025";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");

const RUN = Date.now().toString(36);
const basic = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
let failed = 0;
const check = (name, ok, note = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};
async function http(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE}/wp-json${path}`, { method, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => null) };
}
const keys = { Authorization: basic };
const forgot = (body, headers = keys) => http("/wc-farida/v1/password/forgot", { method: "POST", body, headers });
const reset = (body, headers = keys) => http("/wc-farida/v1/password/reset", { method: "POST", body, headers });
const token = async (username, password) => (await http("/jwt-auth/v1/token", { method: "POST", body: { username, password } })).json?.token;
const me = async (t) => (await http("/wp/v2/users/me", { headers: { Authorization: `Bearer ${t}` } })).status;
const mails = async (to) => {
  const r = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
  // Only reset emails (Woo also sends a welcome email on account creation).
  return (r.messages ?? []).filter((m) => /Reset your password|إعادة تعيين كلمة المرور/.test(m.Subject));
};
const mailText = async (id) => (await (await fetch(`${MAIL}/api/v1/message/${id}`)).json()).Text;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const resetUrl = "http://localhost:3111/en/reset-password";

const email = `reset-${RUN}@example.com`;
const first = `Old-pass-${RUN}`;
const { json: customer } = await http("/wc/v3/customers", { method: "POST", headers: keys, body: { email, first_name: "Nour", password: first } });
const oldToken = await token(email, first);
check("customer signs in", (await me(oldToken)) === 200);

check("no keys → refused", (await forgot({ email, locale: "en", resetUrl }, {})).status === 401);
check("bad resetUrl → 400", (await forgot({ email, locale: "en", resetUrl: "http://evil.test/x" })).status === 400);
check("resetUrl with a query → 400", (await forgot({ email, locale: "en", resetUrl: `${resetUrl}?x=1` })).status === 400);

let r = await forgot({ email, locale: "en", resetUrl });
check("forgot → 202", r.status === 202);
await sleep(1500);
let list = await mails(email);
check("one email sent", list.length === 1, `${list.length}`);
const text = await mailText(list[0].ID);
const link = new URL(text.match(/https?:\/\/\S+/)[0]);
check("link goes to the storefront", link.origin + link.pathname === resetUrl);
check("greets by first name", text.startsWith("Hi Nour,"));
const key = link.searchParams.get("key");
const login = link.searchParams.get("login");

await forgot({ email, locale: "en", resetUrl });
await sleep(1000);
check("second request within a minute sends nothing", (await mails(email)).length === 1);

check("unknown email → same 202", (await forgot({ email: `nobody-${RUN}@example.com`, locale: "en", resetUrl })).status === 202);
const adminEmail = (await http("/wp/v2/users/1?context=edit", { headers: keys })).json?.email;
if (adminEmail) {
  const before = (await mails(adminEmail)).length;
  check("admin email → 202, nothing sent", (await forgot({ email: adminEmail, locale: "en", resetUrl })).status === 202 && (await mails(adminEmail)).length === before);
}

check("wrong key → 400", (await reset({ login, key: "x".repeat(20), password: "New-pass-123" })).status === 400);
check("short password → 400", (await reset({ login, key, password: "short" })).json?.code === "farida_weak_password");
const second = `New-pass-${RUN}`;
r = await reset({ login, key, password: second });
check("reset → 200 with the email", r.status === 200 && r.json?.email === email);
check("key is single use", (await reset({ login, key, password: `Other-${RUN}` })).status === 400);
check("old password refused", !(await token(email, first)));
// Signed out = anonymous; farida-hardening hides wp/v2/users from anonymous visitors, so 404
// (the storefront's getSession reads 401/403/404 as signed out).
check("token from before the reset is signed out", [401, 404].includes(await me(oldToken)), String(await me(oldToken)));
const newToken = await token(email, second);
check("new password signs in, new token works", (await me(newToken)) === 200);

// Arabic email
await sleep(61_000); // resend guard
await forgot({ email, locale: "ar", resetUrl: "http://localhost:3111/ar/reset-password" });
await sleep(1500);
list = await mails(email);
check("Arabic email", list.length === 2 && list[0].Subject.includes("إعادة تعيين كلمة المرور"), list[0]?.Subject);
// PHP reads "$name،" as one variable name (non-ASCII bytes are allowed in names): the name must survive.
check("Arabic email greets by first name", (await mailText(list[0].ID)).startsWith("مرحبًا Nour،"));

await http(`/wc/v3/customers/${customer.id}?force=true`, { method: "DELETE", headers: keys });
console.log(failed ? `\n${failed} failed` : "\nall passed");
