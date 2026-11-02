// Contact messages spike for B7 (#304): POST farida/v1/contact from
// infra/wordpress/mu-plugins/farida-contact.php, against the local staging stack.
//
//   node --env-file=.env.local spike-contact.mjs
import { execFileSync } from "node:child_process";

const BASE = process.env.WP_URL || "http://localhost:8080";
const SECRET = process.env.CONTACT_SHARED_SECRET;
if (!SECRET) throw new Error("Missing CONTACT_SHARED_SECRET (see README)");
const RUN = Date.now().toString(36);
const results = [];
const check = (name, ok, note = "") => {
  results.push({ ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};
// The local Apache sometimes drops a kept-alive socket after a wp-cli run: retry network errors.
const retry = async (fn, tries = 3) => {
  try {
    return await fn();
  } catch (e) {
    if (tries > 1) return retry(fn, tries - 1);
    throw e;
  }
};
const post = (body, secret = SECRET) =>
  retry(async () => {
    const res = await fetch(`${BASE}/wp-json/farida/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "X-Farida-Contact-Secret": secret } : {}) },
      body: JSON.stringify(body),
    });
    return { status: res.status, text: await res.text() };
  });
const wp = (...args) => execFileSync("docker", ["compose", "--profile", "tools", "run", "--rm", "-T", "wpcli", "wp", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const good = { name: "Mona QA", email: `qa-b7-${RUN}@example.test`, message: `أريد الاستفسار عن الضمان ${RUN}\nسطر ثانٍ`, locale: "ar" };
const created = [];
try {
  check("no secret 403", (await post(good, "")).status === 403);
  check("wrong secret 403", (await post(good, "x".repeat(48))).status === 403);
  const ok = await post(good);
  check("message saved 201", ok.status === 201, ok.text);
  const id = JSON.parse(ok.text).id;
  created.push(id);
  const row = JSON.parse(wp("post", "get", String(id), "--fields=post_status,post_content,post_type", "--format=json"));
  check("stored private with the message", row.post_status === "private" && row.post_type === "farida_contact" && row.post_content.includes(RUN) && row.post_content.includes("\n"));
  check("name, email and language stored", wp("post", "meta", "get", String(id), "_farida_contact_email") === good.email && wp("post", "meta", "get", String(id), "_farida_contact_locale") === "ar");

  const bad = await post({ ...good, email: `<script>${RUN}</script>` });
  check("invalid 400 without echoing input", bad.status === 400 && !bad.text.includes(RUN));
  check("too long message 400", (await post({ ...good, message: "a".repeat(2001) })).status === 400);
  const tags = await post({ ...good, name: `<b>Mona</b>`, message: `hi <script>alert(1)</script> ${RUN}` });
  created.push(JSON.parse(tags.text).id);
  const content = wp("post", "get", String(created.at(-1)), "--field=post_content");
  check("HTML stripped", tags.status === 201 && !content.includes("<script>") && wp("post", "meta", "get", String(created.at(-1)), "_farida_contact_name") === "Mona");

  const pub = await retry(() => fetch(`${BASE}/wp-json/wp/v2/farida_contact`));
  check("not on wp/v2", pub.status === 404);
  const page = await retry(() => fetch(`${BASE}/?post_type=farida_contact&p=${id}`, { redirect: "manual" }));
  check("no public page", !(await page.text()).includes(RUN));
  check("admins cannot create messages by hand", wp("eval", 'wp_set_current_user(1); echo current_user_can(get_post_type_object("farida_contact")->cap->create_posts) ? "yes" : "no";') === "no");
} finally {
  if (created.length) wp("post", "delete", ...created.map(String), "--force");
  console.log(`\n${results.filter((r) => r.ok).length} of ${results.length} passed`);
}
