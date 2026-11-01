// Reviews spike for O3 (#254): posting with moderation, the public list, the
// verified-buyer flag and the rating aggregate, against the local staging stack.
//
//   node --env-file=.env.local spike-reviews.mjs
const BASE = process.env.WP_URL || "http://localhost:8080";
const { WC_KEY, WC_SECRET } = process.env;
if (!WC_KEY || !WC_SECRET) throw new Error("Missing WC_KEY / WC_SECRET (see README)");
const RUN = Date.now().toString(36);
const basic = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

const results = [];
const check = (name, ok, note = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  -- ${note}` : ""}`);
};
const info = (name, note) => console.log(`INFO  ${name}  -- ${note}`);

async function http(path, { method = "GET", body, keys = false } = {}) {
  const res = await fetch(`${BASE}/wp-json${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(keys ? { Authorization: basic } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

const cleanup = { reviews: [], orders: [], customers: [] };
try {
  const [product] = (await http("/wc/store/v1/products?per_page=1&_fields=id,name,average_rating,review_count")).json;
  const pid = product.id;
  info("product", `id ${pid}, average ${product.average_rating}, count ${product.review_count}`);

  // Two customers: a buyer (completed order) and someone who never bought it.
  const mk = async (tag) => {
    const r = await http("/wc/v3/customers", { method: "POST", keys: true, body: { email: `qa-o3-${tag}-${RUN}@example.test`, first_name: "Nour", last_name: tag, password: `Pw-${RUN}-${tag}-x9` } });
    cleanup.customers.push(r.json.id);
    return r.json;
  };
  const buyer = await mk("buyer");
  const visitor = await mk("visitor");
  const order = await http("/wc/v3/orders", { method: "POST", keys: true, body: { customer_id: buyer.id, status: "completed", billing: { email: buyer.email }, line_items: [{ product_id: pid, quantity: 1 }] } });
  cleanup.orders.push(order.json.id);
  check("buyer has a completed order", order.status === 201, `${order.status}`);

  const post = (c, rating, review, extra = {}) =>
    http("/wc/v3/products/reviews", { method: "POST", keys: true, body: { product_id: pid, reviewer: `${c.first_name} ${c.last_name}`, reviewer_email: c.email, rating, review, status: "hold", ...extra } });

  let r = await post(buyer, 5, `Great kettle <b>bold</b> <script>x</script> ${RUN}`);
  cleanup.reviews.push(r.json.id);
  check("review posted on hold", r.status === 201 && r.json.status === "hold", `${r.status} ${r.json.status}`);
  check("buyer is verified", r.json.verified === true, `${r.json.verified}`);
  info("stored review html", JSON.stringify(r.json.review));
  const buyerReview = r.json.id;

  r = await post(visitor, 2, `Not for me ${RUN}`);
  cleanup.reviews.push(r.json.id);
  check("visitor is not verified", r.json.verified === false, `${r.json.verified}`);
  const visitorReview = r.json.id;

  r = await post(visitor, 0, `zero ${RUN}`);
  info("rating 0", `${r.status} ${r.json?.code ?? r.json?.rating}`);
  if (r.json?.id) cleanup.reviews.push(r.json.id);
  r = await post(visitor, 9, `nine ${RUN}`);
  info("rating 9", `${r.status} ${r.json?.code ?? r.json?.rating}`);
  if (r.json?.id) cleanup.reviews.push(r.json.id);

  r = await post(buyer, 4, `Great kettle <b>bold</b> <script>x</script> ${RUN}`);
  info("same text again", `${r.status} ${r.json?.code ?? r.json?.id}`);
  if (r.json?.id) cleanup.reviews.push(r.json.id);

  const list = async () => (await http(`/wc/store/v1/products/reviews?product_id=${pid}&per_page=100`)).json;
  let pub = await list();
  check("held reviews are not public", !pub.some((x) => [buyerReview, visitorReview].includes(x.id)));

  // Own reviews (any status) by email: lets the BFF show "awaiting approval" and stop duplicates.
  r = await http(`/wc/v3/products/reviews?product=${pid}&reviewer_email=${encodeURIComponent(buyer.email)}&status=all`, { keys: true });
  check("own reviews found by email, any status", r.status === 200 && r.json.some((x) => x.id === buyerReview), `${r.status} ${r.json.length}`);
  r = await http(`/wc/v3/products/reviews?product=${pid}&reviewer_email=${encodeURIComponent(buyer.email)}`, { keys: true });
  info("default status filter", `${r.json.length} (status=approved by default?)`);

  // Approve both.
  for (const id of [buyerReview, visitorReview]) await http(`/wc/v3/products/reviews/${id}`, { method: "PUT", keys: true, body: { status: "approved" } });
  pub = await list();
  const shown = pub.find((x) => x.id === buyerReview);
  check("approved reviews are public", Boolean(shown) && pub.some((x) => x.id === visitorReview));
  info("store api review keys", Object.keys(shown ?? {}).join(","));
  info("store api review", JSON.stringify({ review: shown?.review, verified: shown?.verified, reviewer: shown?.reviewer, rating: shown?.rating, date: shown?.date_created }));
  check("store api has verified flag", shown?.verified === true && pub.find((x) => x.id === visitorReview)?.verified === false);
  check("store api has no email", !JSON.stringify(pub).includes("@example.test"));

  const after = (await http(`/wc/store/v1/products/${pid}?_fields=average_rating,review_count`)).json;
  info("aggregate after approval", `average ${after.average_rating}, count ${after.review_count}`);
  const approved = pub.filter((x) => x.rating > 0);
  const expected = approved.reduce((s, x) => s + x.rating, 0) / approved.length;
  check("average matches approved reviews", Math.abs(Number(after.average_rating) - expected) < 0.01 && after.review_count === pub.length, `${after.average_rating} vs ${expected.toFixed(2)}, ${after.review_count} vs ${pub.length}`);

  // Store API list ordering and paging.
  r = await http(`/wc/store/v1/products/reviews?product_id=${pid}&per_page=1&orderby=date_gmt&order=desc`);
  info("paging", `status ${r.status}, first ${r.json?.[0]?.id}`);
  const res = await fetch(`${BASE}/wp-json/wc/store/v1/products/reviews?product_id=${pid}&per_page=1`);
  info("paging headers", `X-WP-Total ${res.headers.get("x-wp-total")}, X-WP-TotalPages ${res.headers.get("x-wp-totalpages")}`);

  // Unpublishing brings the aggregate back.
  await http(`/wc/v3/products/reviews/${visitorReview}`, { method: "PUT", keys: true, body: { status: "hold" } });
  const back = (await http(`/wc/store/v1/products/${pid}?_fields=average_rating,review_count`)).json;
  info("aggregate after unapproving one", `average ${back.average_rating}, count ${back.review_count}`);
} finally {
  for (const id of cleanup.reviews) await http(`/wc/v3/products/reviews/${id}?force=true`, { method: "DELETE", keys: true });
  for (const id of cleanup.orders) await http(`/wc/v3/orders/${id}?force=true`, { method: "DELETE", keys: true });
  for (const id of cleanup.customers) await http(`/wc/v3/customers/${id}?force=true`, { method: "DELETE", keys: true });
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed} of ${results.length} passed`);
}
