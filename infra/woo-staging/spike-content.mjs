// Promotions spike for W7 (#232): the farida/v1/promos route from
// infra/wordpress/mu-plugins/farida-content.php, against the local staging stack
// after setup.sh and seed-content.sh. Read-only except one temporary draft.
//
//   node spike-content.mjs
import { execFileSync } from "node:child_process";

const BASE = process.env.WP_URL || "http://localhost:8080";
const results = [];
const check = (name, ok, note = "") => {
  results.push({ ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};
const get = async (path, tries = 3) => {
  let res;
  try {
    res = await fetch(`${BASE}/wp-json${path}`);
  } catch (e) {
    if (tries > 1) return get(path, tries - 1); // the local Apache sometimes drops a kept-alive socket
    throw e;
  }
  return { status: res.status, json: await res.json().catch(() => null), cc: res.headers.get("cache-control") };
};
const wp = (...args) => execFileSync("docker", ["compose", "--profile", "tools", "run", "--rm", "-T", "wpcli", "wp", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const en = await get("/farida/v1/promos?lang=en");
const ar = await get("/farida/v1/promos?lang=ar");
check("public 200 per language, cacheable", en.status === 200 && ar.status === 200 && /max-age=60/.test(en.cc ?? ""), en.cc);
const by = (list, p) => list.filter((x) => x.placement === p);
check("seeded: 4 hero, 3 announcement, 2 mini per language", [en.json, ar.json].every((l) => by(l, "hero").length === 4 && by(l, "announcement").length === 3 && by(l, "mini").length === 2));
check("language filter", en.json.every((x) => !/[؀-ۿ]/.test(x.text)) && by(ar.json, "announcement").every((x) => /[؀-ۿ]/.test(x.text)));
check("admin order", JSON.stringify(by(en.json, "hero").map((x) => x.order)) === "[1,2,3,4]");
const hero = by(en.json, "hero")[0];
check("hero has image size and link", Boolean(hero.image?.url) && hero.image.width === 1600 && hero.image.height === 900 && hero.link === "/categories/blenders", JSON.stringify(hero));
check("shape has no internal fields", Object.keys(hero).sort().join() === "id,image,link,order,placement,text");
check("lang required, en|ar only", (await get("/farida/v1/promos")).status === 400 && (await get("/farida/v1/promos?lang=fr")).status === 400);
check("not exposed on wp/v2", (await get("/wp/v2/farida_promo")).status === 404 && [401, 404].includes((await get("/wp/v2/types/farida_promo")).status));

// A draft, a hero without image and an unsafe link stay out.
const draft = wp("post", "create", "--post_type=farida_promo", "--post_status=draft", "--post_title=Draft promo", "--porcelain");
const noImage = wp("post", "create", "--post_type=farida_promo", "--post_status=publish", "--post_title=No image hero", "--porcelain");
const badLink = wp("post", "create", "--post_type=farida_promo", "--post_status=publish", "--post_title=Bad link mini", "--porcelain");
try {
  wp("post", "meta", "update", noImage, "_farida_placement", "hero");
  wp("post", "meta", "update", badLink, "_farida_placement", "mini");
  wp("post", "meta", "update", badLink, "_farida_link", "javascript:alert(1)");
  const after = (await get("/farida/v1/promos?lang=en")).json;
  check("draft hidden", !after.some((x) => String(x.id) === draft));
  check("hero without image hidden", !after.some((x) => String(x.id) === noImage));
  check("no language stored counts as both", after.some((x) => String(x.id) === badLink));
  check("unsafe link dropped", after.find((x) => String(x.id) === badLink)?.link === null);
  for (const link of ["//evil.example", "http://plain.example", "data:text/html,x"]) {
    wp("post", "meta", "update", badLink, "_farida_link", link);
    const l = (await get("/farida/v1/promos?lang=ar")).json.find((x) => String(x.id) === badLink)?.link;
    check(`link ${link} dropped`, l === null, String(l));
  }
} finally {
  wp("post", "delete", draft, noImage, badLink, "--force");
}
console.log(`\n${results.filter((r) => r.ok).length} of ${results.length} passed`);
