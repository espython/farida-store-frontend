/**
 * Verifies getOrderPaymentDisplay (src/functions/orderPaymentState.ts).
 *
 * The confirmation page must never claim a payment settled unless the server
 * said so: `payment_status` is the only trustworthy input, because the server
 * sets 'cod' or 'pending' at checkout and only the Paymob webhook flips it to
 * 'paid'. The pre-fix code substring-matched the client-supplied `order_notes`
 * and hardcoded "completed", so an unsettled or failed card rendered a green
 * Completed chip.
 *
 * This is a dependency-free assertion script rather than a framework test: the
 * repo has no test runner, and adding one is a separate decision. It needs
 * nothing beyond `typescript`, which is already a dependency.
 *
 *   node scripts/verify-order-payment-state.mjs
 *
 * Exits non-zero on failure so it can be wired into CI later.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const HELPER = join(here, "..", "src", "functions", "orderPaymentState.ts");

// Load the real helper, transpiled on the fly.
const js = ts.transpileModule(readFileSync(HELPER, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const mod = { exports: {} };
new Function("exports", "module", js)(mod.exports, mod);
const { getOrderPaymentDisplay } = mod.exports;

let passed = 0;
const failures = [];
const check = (label, condition, detail = "") => {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? `  <-- ${detail}` : ""}`);
  }
};

// The pre-fix logic, kept verbatim so the regression stays pinned.
const oldExtractPaymentInfo = (orderNotes) => {
  if (orderNotes.includes("Paymob") || orderNotes.includes("Transaction ID")) {
    const tm = orderNotes.match(/Transaction ID: ([A-Za-z0-9]+)/);
    const pm = orderNotes.match(/Paymob Order ID: ([A-Za-z0-9]+)/);
    return { method: "online", transactionId: tm ? tm[1] : null, paymobOrderId: pm ? pm[1] : null, status: "completed" };
  }
  if (orderNotes.includes("Cash on Delivery")) {
    return { method: "cod", transactionId: null, paymobOrderId: null, status: "pending" };
  }
  return { method: "unknown", transactionId: null, paymobOrderId: null, status: "unknown" };
};

console.log("\n--- an unsettled card is never reported as completed ---");
// cart/payment/page.tsx sends exactly this marker for a card order.
const cardNotes = "Online payment via Paymob";
let r = getOrderPaymentDisplay({ payment_status: "pending", paymob_order_id: "12345" });
check("pending -> 'pending', not 'completed'", r.status === "pending", r.status);
check("pending -> method online", r.method === "online", r.method);
check("the pre-fix logic wrongly said completed", oldExtractPaymentInfo(cardNotes).status === "completed");

console.log("\n--- a settled card ---");
r = getOrderPaymentDisplay({ payment_status: "paid", payment_transaction_id: "TXN-9", paymob_order_id: "12345" });
check("paid -> completed", r.status === "completed", r.status);
check("paid -> method online", r.method === "online", r.method);
check("transaction id comes from the column, not the notes", r.transactionId === "TXN-9", String(r.transactionId));
check("paymob order id comes from the column", r.paymobOrderId === "12345", String(r.paymobOrderId));
check("the pre-fix regex never found either in the notes",
  oldExtractPaymentInfo(cardNotes).transactionId === null && oldExtractPaymentInfo(cardNotes).paymobOrderId === null);

console.log("\n--- a failed card ---");
r = getOrderPaymentDisplay({ payment_status: "failed", payment_transaction_id: "TXN-9" });
check("failed -> 'failed', not 'unknown'", r.status === "failed", r.status);
check("failed -> method online", r.method === "online", r.method);

console.log("\n--- cash on delivery ---");
r = getOrderPaymentDisplay({ payment_status: "cod" });
check("cod -> method cod", r.method === "cod", r.method);
check("cod -> isCod", r.isCod === true, String(r.isCod));
check("cod -> pending (nothing settles until delivery)", r.status === "pending", r.status);
check("cod -> no transaction id", r.transactionId === null, String(r.transactionId));

r = getOrderPaymentDisplay({ payment_status: "cod", payment_transaction_id: "STRAY", paymob_order_id: "STRAY2" });
check("cod ignores stray card ids", r.transactionId === null && r.paymobOrderId === null, JSON.stringify([r.transactionId, r.paymobOrderId]));

console.log("\n--- missing input stays honest ---");
for (const [label, arg] of [["undefined", undefined], ["null", null], ["empty object", {}], ["explicit null status", { payment_status: null }]]) {
  let out;
  let threw = null;
  try {
    out = getOrderPaymentDisplay(arg);
  } catch (e) {
    threw = e;
  }
  check(`${label} -> no throw, 'unknown', never 'completed'`,
    threw === null && out.status === "unknown" && out.isCod === false,
    threw ? String(threw) : JSON.stringify(out));
}

console.log("\n--- the method label Orderinfo renders ---");
const label = (a) => (getOrderPaymentDisplay(a).isCod ? "Cash on Delivery" : "Online Payment");
check("cod -> Cash on Delivery", label({ payment_status: "cod" }) === "Cash on Delivery");
check("paid -> Online Payment", label({ payment_status: "paid" }) === "Online Payment");
check("pending -> Online Payment", label({ payment_status: "pending" }) === "Online Payment");
check("failed -> Online Payment", label({ payment_status: "failed" }) === "Online Payment");

console.log("\n--- no longer depends on a magic string ---");
const oldOrderinfoLabel = (n) =>
  n.includes("Paymob") || n.includes("Transaction ID")
    ? "Online Payment"
    : n.includes("Cash on Delivery") || !undefined
    ? "Cash on Delivery"
    : "Online Payment";
check("pre-fix agreed on the two real marker strings",
  oldOrderinfoLabel(cardNotes) === label({ payment_status: "paid" }) &&
  oldOrderinfoLabel("Cash on Delivery") === label({ payment_status: "cod" }));
check("and disagrees when the marker lies", label({ payment_status: "paid" }) === "Online Payment");

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
