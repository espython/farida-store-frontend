// A2 spike: email verification through the farida-account mu-plugin (non-blocking reminder), mail in Mailpit.
//   node --env-file=.env.local spike-email-verify.mjs
// Creates its own customer with a run id, deletes it after.
const BASE = process.env.WP_URL || "http://localhost:8080";
const MAIL = process.env.MAILPIT_URL || "http://localhost:8025";
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mails = async (to) =>
  ((await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json()).messages ?? []).filter((m) => /Confirm your email|تأكيد بريدك/.test(m.Subject));
const linkIn = async (id) => new URL((await (await fetch(`${MAIL}/api/v1/message/${id}`)).json()).Text.match(/https?:\/\/\S+/)[0]);
const send = (body, headers) => http("/wc-farida/v1/email/send", { method: "POST", body, headers });
const verify = (body) => http("/wc-farida/v1/email/verify", { method: "POST", body });
const verifiedMeta = async (id) => (await http(`/wc/v3/customers/${id}`)).json.meta_data?.find((m) => m.key === "farida_email_verified")?.value;
const verifyUrl = "http://localhost:3111/en/verify-email";

const email = `verify-${RUN}@example.com`;
const { json: c } = await http("/wc/v3/customers", { method: "POST", body: { email, password: `Ver-${RUN}A1`, first_name: "Hana", username: `c_v${RUN}` } });
check("no keys → refused", (await send({ customerId: c.id, locale: "en", verifyUrl }, {})).status === 401);
check("bad verifyUrl → 400", (await send({ customerId: c.id, locale: "en", verifyUrl: "http://evil.test/v" })).status === 400);
check("unknown customer → 404", (await send({ customerId: 99999999, locale: "en", verifyUrl })).status === 404);

let r = await send({ customerId: c.id, locale: "en", verifyUrl });
check("send → 202 sent", r.status === 202 && r.json.status === "sent");
check("second send within a minute → recent, no email", (await send({ customerId: c.id, locale: "en", verifyUrl })).json.status === "recent");
await sleep(1500);
const list = await mails(email);
check("one email", list.length === 1, `${list.length}`);
const link = await linkIn(list[0].ID);
check("link to the storefront page", link.origin + link.pathname === verifyUrl);
const id = link.searchParams.get("id"), token = link.searchParams.get("token");
check("unverified before", !(await verifiedMeta(c.id)));

check("wrong token → 400", (await verify({ id, token: "x".repeat(32) })).json?.code === "farida_invalid_verify_token");
check("other id → 400", (await verify({ id: Number(id) + 1, token })).status === 400);
r = await verify({ id, token });
check("verify → 200", r.status === 200 && r.json.verified === true);
check("meta shows verified (shop-manager key)", Boolean(await verifiedMeta(c.id)));
check("opening the link again → 200", (await verify({ id, token })).status === 200);
check("send after verified → verified, no email", (await send({ customerId: c.id, locale: "en", verifyUrl })).json.status === "verified");

await http(`/wc/v3/customers/${c.id}`, { method: "PUT", body: { email: `verify2-${RUN}@example.com` } });
check("email change clears verification", !(await verifiedMeta(c.id)));
check("old link no longer works", (await verify({ id, token })).status === 400);

await sleep(61_000);
await send({ customerId: c.id, locale: "ar", verifyUrl: "http://localhost:3111/ar/verify-email" });
await sleep(1500);
const ar = await mails(`verify2-${RUN}@example.com`);
const text = ar[0] && (await (await fetch(`${MAIL}/api/v1/message/${ar[0].ID}`)).json()).Text;
check("Arabic email greets by first name", ar.length === 1 && text.startsWith("مرحبًا Hana،"), ar[0]?.Subject);

await http(`/wc/v3/customers/${c.id}?force=true&reassign=0`, { method: "DELETE" });
console.log(failed ? `\n${failed} failed` : "\nall passed");
