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

/**
 * Flatten to dotted leaf paths, e.g. {a:{b:'x'}} -> ['a.b'].
 * An array is treated as a single leaf: its contents are message values, not
 * sub-namespaces, so flattening it to numeric indices would produce
 * meaningless parity diffs.
 */
function leafKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    Array.isArray(v)
      ? [`${prefix}${k}`]
      : v !== null && typeof v === "object"
      ? leafKeys(v, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

function resolve(tree, dotted) {
  return dotted
    .split(".")
    .reduce((node, part) => (node == null ? undefined : node[part]), tree);
}

/**
 * Blank out comments while leaving string/template literals intact.
 *
 * Without this, prose that happens to contain a call shape is read as a call
 * site -- a comment saying `// used to be t("removed.key")` would be reported
 * as a missing key and fail the gate for no reason. Comment characters are
 * replaced with spaces rather than deleted so byte offsets, and therefore
 * reported line numbers, stay correct.
 *
 * Known limitation: a regex literal containing a quote or a `//` can confuse
 * the string tracking. The consequence is a mis-scan, not a crash, and there
 * is no such literal in src/ today.
 */
function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") (out += " "), i++;
      continue;
    }
    if (c === "/" && d === "*") {
      out += "  ";
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      out += "  ";
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      out += c;
      i++;
      while (i < n) {
        if (src[i] === "\\") {
          out += src.slice(i, i + 2);
          i += 2;
          continue;
        }
        out += src[i];
        if (src[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
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
  const cannotVerify = [];
  const collisionsByVar = new Map();
  // next-intl exposes the same namespace through several methods. All of them
  // take a message key, so all of them are resolved rather than excluded —
  // excluding them would make a future .rich("...") silently unchecked.
  const METHOD = "(?:rich|has|raw|markup)";

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const text = stripComments(raw);
    const rel = path.relative(ROOT, file);

    // const t = useTranslations("ns")  /  const t = useTranslations()
    const byVar = new Map();
    for (const m of text.matchAll(DECLARE)) {
      const existing = byVar.get(m[1]);
      if (existing && existing.ns !== m[3]) {
        // Two declarations of the same variable name in one file (e.g. two
        // exported components each doing `const t = useTranslations(...)`).
        // Picking the last one would check every call against the wrong
        // namespace, so neither is trusted and the variable is skipped.
        existing.ambiguous = true;
        if (!collisionsByVar.has(rel)) collisionsByVar.set(rel, []);
        collisionsByVar.get(rel).push(
          `${rel}: "${m[1]}" is declared as both "${existing.ns}" and "${m[3]}"`
        );
      } else if (!existing) {
        byVar.set(m[1], { ns: m[3], ambiguous: false });
      }
    }
    if (byVar.size === 0) continue;

    for (const [varName, { ns, ambiguous }] of byVar) {
      if (ambiguous) {
        // Two declarations of one variable name in a single file. Resolving
        // against either namespace would check calls against the wrong tree,
        // and *skipping* them would let a genuinely missing key pass silently.
        // Neither is acceptable, so the file is reported as unverifiable and
        // this check fails. The fix is trivial -- give one of them a
        // different variable name -- and unlike a genuinely dynamic key there
        // is no legitimate reason to leave this ambiguous.
        cannotVerify.push(...(collisionsByVar.get(rel) || []));
        continue;
      }
      const anyCall = new RegExp(
        `\\b${varName}(?:\\.${METHOD})?\\(([^)]{0,200})\\)`,
        "g"
      );
      for (const m of text.matchAll(anyCall)) {
        const arg = m[1].trim();
        if (!arg) continue;
        // A plain string literal, however it is wrapped or indented, is a
        // static lookup. Anything else cannot be resolved here.
        if (!/^['"]/.test(arg)) {
          dynamic += 1;
          continue;
        }
        const key = arg.slice(1, -1);
        const full = ns ? `${ns}.${key}` : key;
        checked += 1;
        for (const [label, tree] of [
          ["en", en],
          ["ar", ar],
        ]) {
          if (resolve(tree, full) === undefined) {
            missing.push(
              `${rel}: ${varName}("${key}") -> ${full} [missing in ${label}]`
            );
          }
        }
      }
    }
  }

  check(
    `${checked} static key lookups all resolve`,
    missing.length === 0,
    missing.join("\n          ")
  );
  check(
    "every translations variable resolves to exactly one namespace",
    cannotVerify.length === 0,
    cannotVerify
      .map((c) => `${c} -- rename one of them so this file can be verified`)
      .join("\n          ")
  );
  console.log(
    `  note  ${dynamic} lookup(s) use a non-literal key and are NOT verified here`
  );
  if (dynamic > 0) {
    console.log(
      `        (0 today. Convert to literals where the value set is known,` +
      ` the way SidebarResponsiveContent.tsx does.)`
    );
  }
}

// ---------------------------------- 3. backlog: hard-coded bilingual ternaries
section("backlog: hard-coded bilingual ternaries bypassing the catalogue");
{
  const offenders = [];
  for (const file of files) {
    const text = stripComments(fs.readFileSync(file, "utf8"));
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
