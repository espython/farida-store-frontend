# Local WooCommerce staging (spike)

Throwaway WordPress + WooCommerce for `doc/woocommerce-spike-checklist.md`. Local only; never deploy this compose file. Credentials are defaults (`admin` / `admin`).

```sh
cd infra/woo-staging
docker compose up -d
docker compose --profile tools run --rm wpcli sh /setup.sh   # idempotent
```

- Admin: http://localhost:8080/wp-admin
- Woo REST: `/wp-json/wc/v3` (needs consumer keys) · Store API: `/wp-json/wc/store/v1` (public, cart-token based)
- Reset everything: `docker compose --profile tools down -v`

`setup.sh` installs WooCommerce, Polylang, JWT Authentication for WP REST API and Paymob for WooCommerce; sets EGP / Egypt / 2 decimals / post-name permalinks; enables COD; creates English and Arabic languages and 5 sample products.

## Spike findings so far (2026-10-14)

Versions: WordPress 7.1.3, WooCommerce 11.2.1, Polylang 3.8.11, JWT Auth 1.5.0, Paymob for WooCommerce 4.1.15 (wp.org), PHP 8.2.

| Check | Result |
|---|---|
| Setup: EGP, Egypt, post-name permalinks | Pass |
| Paymob plugin installs from wp.org | Pass (installs and activates). Webhook, HMAC, refund and our account fit are NOT tested yet; need Paymob test keys |
| COD enabled | Configured; not yet exercised at checkout |
| Store API issues a `Cart-Token` | Pass (guest cart without cookies looks feasible) |
| `wc/v3` orders/products anonymous | 401 as expected |
| `wp/v2/users` anonymous | **200: lists users. Must be locked down before launch** (security basics) |
| Polylang languages en + ar | Created. Free Polylang has no WP-CLI; `lang` param on the Store API is not yet verified with translated products. Needs Polylang for WooCommerce (paid) or an alternative: decision pending |

### COD checks (`spike-cod.mjs`, 2026-10-14)

Run: `node --env-file=.env.local spike-cod.mjs` after creating keys once: `docker compose --profile tools run --rm wpcli wp eval-file /create-keys.php 2>/dev/null | grep '^WC_' > .env.local` (gitignored).

| Check | Result |
|---|---|
| REST: category + price range + sort + pagination | Pass |
| Guest cart with `Cart-Token` only | Pass |
| COD checkout creates an order (status `processing`) | Pass. Egypt state codes are `EGC`, `EGGZ`, ... not `C` |
| Stock decremented on order | Pass |
| Coupon off the sale price (800 - 10% = 720) | Pass |
| Over-stock error is machine readable | Pass (`woocommerce_rest_product_partially_out_of_stock`) |
| Two simultaneous orders for the last unit | Pass (exactly one succeeds) |
| Coupon `usage_limit=1` under concurrency | Pass (exactly one succeeds) |
| Cancel restocks exactly once | Pass |
| Anonymous cannot list orders | Pass (401) |
| Anonymous cannot enumerate users | Fixed by `farida-hardening` mu-plugin (was 200). **Ship it to production** |
| **Triple submit of one cart creates one order** | **FAIL: 3 orders.** Woo has no idempotency for concurrent identical checkouts. Workaround: the BFF checkout route takes an idempotency key (we already have `checkoutIdempotency.ts`) and rejects or replays duplicates, e.g. a per-key lock and a stored order id |

Notes for the BFF: Woo only accepts consumer-key auth over HTTPS (locally faked for `/wp-json/` by an mu-plugin); the BFF must filter orders by customer itself because keys are admin-level.

Still to do: translated sample products, Paymob sandbox flow, owner admin walk-through, hash import test, customer JWT login and order ownership, a Next route handler (B1) calling Woo.
