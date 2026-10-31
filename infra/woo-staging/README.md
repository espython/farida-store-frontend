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

## Product webhooks → `/api/revalidate`

Catalog reads are cached 60 s under the `catalog` tag. Woo webhooks for `product.created/updated/deleted/restored` call `/api/revalidate`, which checks the HMAC signature and clears that tag, so edits show on the next request.

Locally (after `setup.sh`, which installs the `local-webhooks` mu-plugin that lets WordPress post to `host.docker.internal:3000/3111`):

```sh
echo "WC_WEBHOOK_SECRET=$(openssl rand -hex 32)" >> .env.local   # once
# start Next with WC_WEBHOOK_SECRET set (it is in .env.local), then:
set -a; . ./.env.local; set +a
docker compose --profile tools run --rm -e WEBHOOK_SECRET="$WC_WEBHOOK_SECRET" wpcli sh /create-webhooks.sh
```

Woo queues deliveries in Action Scheduler; after a CLI edit run `docker compose --profile tools run --rm wpcli wp action-scheduler run --hooks=woocommerce_deliver_webhook_async` (admin edits trigger the queue on their own). Woo disables a webhook after 5 failed deliveries in a row: keep the Next app running or re-run the script.

Production: do NOT install `local-webhooks.php`. Set `WC_WEBHOOK_SECRET` on the Next host, then in WooCommerce > Settings > Advanced > Webhooks add four active webhooks (topics above), delivery URL `https://<site>/api/revalidate`, same secret, API version WP REST API Integration v3. Category edits have no Woo webhook topic and still wait for the 60 s cache.

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

### Customer cart checks (`spike-cart.mjs`, 2026-10-31, C2 #248)

Run: `node --env-file=.env.local spike-cart.mjs`. Creates its own customer.

| Check | Result |
|---|---|
| Store API cart with the customer's JWT (`Authorization: Bearer`) | Pass; the response carries a `Cart-Token` |
| Mutations with Bearer + `Cart-Token`, no `Nonce` | Pass. Without a `Cart-Token`: 401 `woocommerce_rest_missing_nonce` |
| Same customer from another "device" (Bearer, no token) | Pass: the saved cart comes back (cross-device), under a different token |
| `Cart-Token` alone, no JWT | **Reads that cart**: the token is a capability. Keep it httpOnly |
| Guest token + customer JWT together | **Shows the guest cart, not the customer's**: a token wins over the JWT. Bind the token cookie to the customer id and drop it at sign-in/out |
| Item shape | `key`, `id`, `quantity`, `prices` (minor units), `quantity_limits` {minimum, maximum, multiple_of, editable}; totals with `currency_minor_unit` 2 |
| Update / remove by item `key`; over-stock add | Pass; over-stock is 400 `woocommerce_rest_product_partially_out_of_stock` |

### Customer auth checks (`spike-auth.mjs`, 2026-10-31, A1 #242)

Run: `node --env-file=.env.local spike-auth.mjs` (same keys as below; `setup.sh` sets `JWT_AUTH_SECRET_KEY`). Creates its own customers with generated passwords.

| Check | Result |
|---|---|
| Register: `POST wc/v3/customers` with the server keys creates a `customer` | Pass |
| Duplicate email | Pass: 400 `registration-error-email-exists` |
| Sign in with email + password (`jwt-auth/v1/token`) | Pass; token carries the WP user id, lifetime **7 days** |
| Token accepted by `/wp/v2/users/me` (Authorization header reaches WP) | Pass |
| Customer token on `wc/v3` | 403, as wanted: the BFF reads customer data with the keys and checks ownership itself |
| Tampered signature | Rejected (403) |
| Unknown email vs wrong password | **Different codes** (`invalid_email` / `incorrect_password`) and a message naming the account. The BFF maps both to `invalid_credentials` |
| `wc/v3/orders?customer=<id>` | Pass: only that customer's orders; every order carries `customer_id` |
| Password change revokes old tokens | **No**: old token stays valid until expiry. The free plugin has no refresh or revoke endpoint |

Follow-ups: shorten the token lifetime with the plugin's `jwt_auth_expire` filter (W5); rate-limit sign-in at the host or WP level (W8); lock down anonymous `wp/v2/users` (below).

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

Still to do: translated sample products, Paymob sandbox flow, owner admin walk-through, hash import test, a Next route handler (B1) calling Woo. Customer JWT login and order ownership: done (above).
