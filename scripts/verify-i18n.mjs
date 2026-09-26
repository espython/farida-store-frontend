/**
 * i18n verification harness for #193.
 *
 * Run with:  npm run verify:i18n
 *
 * Two checks, both of which have caught real bugs in this repo:
 *
 *   1. Every leaf key in messages/en.json exists in messages/ar.json and vice
 *      versa. en.json shipped a `branches. times2` key with a leading space in
 *      the key name while ar.json had `branches.times2`, so the English lookup
 *      silently missed and the branch-hours headings rendered empty.
 *
 *   2. Every statically-resolvable `t("...")` call in src/ actually resolves
 *      against both catalogues. A missing key is a runtime render of `undefined`
 *      or a next-intl error, never a build failure, so nothing else catches it.
 *
 * Keys built at runtime (template literals, variables) cannot be resolved
 * statically; they are counted and reported rather than silently ignored, so
 * the number of unverified lookups is always visible.
 *
 * Plain Node script, no dependencies, exits non-zero on failure so it can be a
 * CI gate. It also reports the remaining hard-coded bilingual ternaries as
 * backlog (#193 remediation step 2) without failing on them.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

let pass = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? `\n          ${detail}` : ''}`);
  }
}
function section(t) {
  console.log(`\n--- ${t} ---`);
}

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const en = readJson("messages/en.json");
const ar = readJson("messages/ar.json");

/** Flatten to dotted leaf paths, e.g. {a:{b:'x'}} -> ['a.b']. */
function leafKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === "object"
      ? leafKeys(v, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

function resolve(tree, dotted) {
  return dotted
    .split(".")
    .reduce((node, part) => (node == null ? undefined : node[part]), tree);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

const files = walk(SRC);

// ------------------------------------------------------- 1. catalogue parity
section("en.json and ar.json have identical leaf keys");
{
  const enKeys = leafKeys(en);
  const arKeys = leafKeys(ar);
  const arSet = new Set(arKeys);
  const enSet = new Set(enKeys);

  const onlyEn = enKeys.filter((k) => !arSet.has(k));
  const onlyAr = arKeys.filter((k) => !enSet.has(k));

  check(
    `${enKeys.length} English keys, all present in Arabic`,
    onlyEn.length === 0,
    onlyEn.map((k) => `en-only: ${JSON.stringify(k)}`).join("\n          ")
  );
  check(
    `${arKeys.length} Arabic keys, all present in English`,
    onlyAr.length === 0,
    onlyAr.map((k) => `ar-only: ${JSON.stringify(k)}`).join("\n          ")
  );
}

// --------------------------------------- 2. every t("...") key actually resolves
section("every static t(\"...\") lookup resolves in both catalogues");
{
  // const t = useTranslations("ns")  /  const t = useTranslations()
  const DECLARE =
    /(?:const|let|var)\s+(\w+)\s*(?::[^=]*?)?=\s*useTranslations\(\s*(['"])([^'"]*)\2\s*\)/g;

  let checked = 0;
  let dynamic = 0;
  const missing = [];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);

    const namespaces = new Map();
    for (const m of text.matchAll(DECLARE)) {
      namespaces.set(m[1], m[3]);
    }
    if (namespaces.size === 0) continue;

    for (const [varName, ns] of namespaces) {
      // Direct calls only: `.rich(` / `.has(` are deliberately not matched, and
      // a template literal or variable key cannot be resolved statically.
      const call = new RegExp(
        `\\b${varName}\\(\\s*(['"])([^'"\\n]+)\\1`,
        "g"
      );
      for (const m of text.matchAll(call)) {
        const key = m[2];
        const full = ns ? `${ns}.${key}` : key;
        checked += 1;
        for (const [label, tree] of [
          ["en", en],
          ["ar", ar],
        ]) {
          if (resolve(tree, full) === undefined) {
            missing.push(`${rel}: ${varName}("${key}") -> ${full} [missing in ${label}]`);
          }
        }
      }

      // Same variable, but the argument is not a plain string literal.
      const dynamicCall = new RegExp(
        `\\b${varName}\\(\\s*(?!['"])[^)]{0,60}\\)`,
        "g"
      );
      for (const _ of text.matchAll(dynamicCall)) dynamic += 1;
    }
  }

  check(
    `${checked} static key lookups all resolve`,
    missing.length === 0,
    missing.join("\n          ")
  );
  console.log(
    `  note  ${dynamic} lookup(s) use a non-literal key and are NOT verified here`
  );
}

// ---------------------------------- 3. backlog: hard-coded bilingual ternaries
section("backlog: hard-coded bilingual ternaries bypassing the catalogue");
{
  const offenders = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const n = (text.match(/locale === ["']ar["']/g) || []).length;
    if (n > 0) offenders.push([path.relative(ROOT, file), n]);
  }
  const total = offenders.reduce((a, [, n]) => a + n, 0);
  console.log(
    `  note  ${total} occurrence(s) across ${offenders.length} file(s) still hard-coded.`
  );
  for (const [f, n] of offenders.sort((a, b) => b[1] - a[1])) {
    console.log(`          ${String(n).padStart(3)}  ${f}`);
  }
  console.log(
    `  note  not a failure: #193 remediation step 2 is a separate pass. This`
  );
  console.log(`        list exists so the backlog cannot quietly grow.`);
}

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) process.exitCode = 1;
