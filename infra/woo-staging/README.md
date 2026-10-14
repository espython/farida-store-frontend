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

Still to do: consumer keys + server-side proxy call, translated sample products, checkout through the Store API, Paymob sandbox flow, stock/coupon/idempotency parity, owner admin walk-through, hash import test.
