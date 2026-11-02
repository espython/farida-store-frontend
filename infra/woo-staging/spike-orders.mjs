// O2 spike: customer cancellation and return requests over wc/v3 (server keys).
//   node --env-file=.env.local spike-orders.mjs
// Creates its own product and orders with a run id, so it is safe to re-run.
const BASE = process.env.WP_URL || "http://localhost:8080";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");

const RUN = Date.now().toString(36);
const basic = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
const check = (name, ok, note = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);

async function admin(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}/wp-json/wc/v3${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: basic },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}
const stock = async (id) => (await admin(`/products/${id}`)).json.stock_quantity;

const { json: product } = await admin("/products", {
  method: "POST",
  body: { name: `O2 spike ${RUN}`, type: "simple", regular_price: "100", manage_stock: true, stock_quantity: 10 },
});

const newOrder = async (status) =>
  (
    await admin("/orders", {
      method: "POST",
      body: {
        payment_method: "cod",
        status: "pending",
        customer_id: 0,
        line_items: [{ product_id: product.id, quantity: 3 }],
        billing: { first_name: "Spike", last_name: RUN, country: "EG", phone: "01000000000" },
      },
    }).then(async ({ json }) => (status === "pending" ? json : (await admin(`/orders/${json.id}`, { method: "PUT", body: { status } })).json))
  );

// 1. Cancel a processing COD order: stock comes back once.
const o = await newOrder("processing");
check("processing reduces stock", (await stock(product.id)) === 7, `stock ${await stock(product.id)}`);
const c1 = await admin(`/orders/${o.id}`, { method: "PUT", body: { status: "cancelled" } });
check("PUT status cancelled", c1.status === 200 && c1.json.status === "cancelled");
check("cancel restores stock", (await stock(product.id)) === 10, `stock ${await stock(product.id)}`);
await admin(`/orders/${o.id}`, { method: "PUT", body: { status: "cancelled" } });
check("second cancel does not restore again", (await stock(product.id)) === 10, `stock ${await stock(product.id)}`);

// 2. Cancel a pending order (stock never reduced): no stock change.
const p = await newOrder("pending");
await admin(`/orders/${p.id}`, { method: "PUT", body: { status: "cancelled" } });
check("cancel of pending leaves stock", (await stock(product.id)) === 10, `stock ${await stock(product.id)}`);

// 3. Private order note (owner-only) for the audit trail.
const n = await admin(`/orders/${o.id}/notes`, { method: "POST", body: { note: "Cancelled by the customer", customer_note: false } });
check("private order note", n.status === 201 && n.json.customer_note === false);

// 4. Return request on a delivered order: custom status (mu-plugin farida-order-statuses).
const d = await newOrder("completed");
const r = await admin(`/orders/${d.id}`, { method: "PUT", body: { status: "return-requested" } });
check("PUT status return-requested", r.status === 200 && r.json.status === "return-requested", `${r.status} ${r.json?.status ?? r.json?.code}`);
check("completion date kept", Boolean(r.json?.date_completed), String(r.json?.date_completed));
check("return-requested keeps stock", (await stock(product.id)) === 7, `stock ${await stock(product.id)}`);
const list = await admin(`/orders?include=${d.id}`);
check("return-requested in default listing", list.json.some((x) => x.id === d.id));
const back = await admin(`/orders/${d.id}`, { method: "PUT", body: { status: "completed" } });
check("owner declines: back to completed, stock unchanged", back.json.status === "completed" && (await stock(product.id)) === 7);

// Cleanup
for (const id of [o.id, p.id, d.id]) await admin(`/orders/${id}?force=true`, { method: "DELETE" });
await admin(`/products/${product.id}?force=true`, { method: "DELETE" });
