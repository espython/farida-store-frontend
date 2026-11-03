# Local WooCommerce staging (spike)

Throwaway WordPress + WooCommerce for `doc/woocommerce-spike-checklist.md`. Local only; never deploy this compose file. Credentials are defaults (`admin` / `admin`).

```sh
cd infra/woo-staging
docker compose up -d
docker compose --profile tools run --rm wpcli sh /setup.sh   # idempotent
# With the contact secret from .env.local (B7), so the contact route accepts the storefront:
set -a; . ./.env.local; set +a; docker compose --profile tools run --rm -e CONTACT_SHARED_SECRET wpcli sh /setup.sh
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

It also copies Farida's own mu-plugins from `../wordpress/mu-plugins/` (hardening, account, order statuses, promotions, contact messages; see `../wordpress/README.md`), which **production WordPress needs too**.

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

### Contact messages checks (`spike-contact.mjs`, 2026-11-02, B7 #304)

Setup: `CONTACT_SHARED_SECRET` in `.env.local` (random, gitignored) and `setup.sh` run with it (above), which sets `FARIDA_CONTACT_SECRET` in wp-config. Run: `node --env-file=.env.local spike-contact.mjs` (11/11).

| Check | Result |
|---|---|
| `POST farida/v1/contact` without or with a wrong `X-Farida-Contact-Secret` | 403 (no secret configured in WordPress: 503) |
| Valid message | 201; a private `farida_contact` post with the message, name, email and language; shown under **Contact messages** in the admin (read-only view, mailto link) |
| Invalid email, too long message | 400, the input is not echoed |
| HTML in name or message | Stripped (`sanitize_text_field` / `sanitize_textarea_field`) |
| Public access | Not on `wp/v2`, no public page; admins cannot create messages by hand |
| Flood backstop | 200 messages per hour in WordPress, on top of the storefront's 5 per visitor per 15 minutes |
| Owner email | Not yet: comes with the mail service (W6 #231) |

### Promotions checks (`spike-content.mjs`, 2026-11-02, W7 #232)

Setup: `setup.sh` copies `infra/wordpress/mu-plugins/` (see `infra/wordpress/README.md`); `docker compose --profile tools run --rm wpcli sh /seed-content.sh` seeds the mock content (hero SVGs from `mock/.cache/banners`, announcement and mini-ad texts in both languages). Run: `node spike-content.mjs` (15/15).

| Check | Result |
|---|---|
| `GET farida/v1/promos?lang=en\|ar` | Public, `Cache-Control: public, max-age=60`; `{id, placement, text, image{url,width,height,alt}\|null, link\|null, order}` in admin order |
| Language | Each promotion is `all`, `en` or `ar`; none stored counts as `all`; `lang` missing or other than en/ar: 400 |
| Hidden | Drafts, and hero banners without an image |
| Links | Storefront paths (`/categories/...`) and `https://` only; `//host`, `http:`, `javascript:`, `data:` are dropped (admin save and route) |
| `wp/v2` | No `farida_promo` route; the post type is not readable (401) |
| Admin box (wp eval) | Saves placement, language, link; bad nonce or no `edit_post` capability: ignored; unknown values fall back to hero / all |
| SVG | WordPress cannot measure SVGs (width/height `null`); local-only `local-svg-uploads` allows the mock SVGs. Production banners are raster images |

### Review checks (`spike-reviews.mjs`, 2026-11-02, O3 #254)

| Check | Result |
|---|---|
| `POST wc/v3/products/reviews` with `status: "hold"` (server keys) | 201, held; not in the public list until approved |
| `verified` | Set by Woo: true when the reviewer email has a completed order for the product, false otherwise |
| Rating 0 or 9 | **Accepted by Woo**: the BFF checks 1–5 itself |
| Same text twice from one author | 409 `woocommerce_rest_comment_duplicate` (mapped to `already_reviewed`) |
| `GET wc/v3/products/reviews?product=&reviewer_email=&status=all` | Finds the customer's own review, held or approved (the default is approved only) |
| `GET wc/store/v1/products/reviews?product_id=` | Approved only, newest first, `X-WP-Total`/`X-WP-TotalPages`; no email; `review` is filtered HTML in `<p>` (the BFF sends plain text); past the last page or an unknown product: `[]` with 200 |
| Rating aggregate (`average_rating`, `review_count`) | Updates as soon as a review is approved or unapproved; the storefront shows it after its 60 s catalog cache |

### Wishlist checks (2026-11-01, O4 #255)

| Check | Result |
|---|---|
| `wc/store/v1/products?include=<ids>&orderby=include` | Returns those products in the given order; unknown ids are left out |
| `wc/store/v1/products/<unknown id>` | 404 (the BFF refuses to save it) |
| Wishlist in customer meta `farida_wishlist` (same mechanism as the address book, see the account checks) | Not on anonymous `wp/v2/users/<id>`; other meta keys untouched |
| No wishlist plugin | Not needed: ids on the customer, products read from the Store API |

### Customer account checks (`spike-account.mjs`, 2026-11-01, A4 #245)

| Check | Result |
|---|---|
| `wc/v3/customers/<id>` read and update with the server keys (names, `shipping`, `billing`, `meta_data`) | Pass |
| `meta_data` with the same key | Replaces the value (one row) |
| Address book meta (`farida_address_book`) on anonymous `wp/v2/users/<id>` | Not exposed (404 for customers without posts) |
| A customer's JWT on `wc/v3/customers/<id>` | 403: only the BFF with the server keys can read it |
| `shipping` saved on the customer → Store API cart `shipping_address` | Prefilled: checkout starts from the default address |
| Name change → `wp/v2/users/me` `first_name`/`last_name` | Updated; WP `name` stays the random username (the session prefers first + last name) |
| Email change to an address in use | 400 `woocommerce_rest_customer_invalid_email`. Email is not editable in A4 (needs a password re-check) |
| Registration leaves `billing.email` empty | The address book fills it with the account email when it writes billing |

### Customer orders checks (2026-11-01, O1 #252)

| Check | Result |
|---|---|
| `wc/v3/orders?customer=<id>` lists only that customer's orders, `X-WP-Total`/`X-WP-TotalPages` set | Pass |
| `customer=0` | **Returns guest orders.** The BFF refuses any id that is not a positive integer |
| Checkout drafts (`checkout-draft`, created by the Store API) in the default listing | Not listed |
| Custom status `out-for-delivery` (mu-plugin) settable over REST and included in the default listing | Pass |
| Unknown order id | 404 |
| Line items carry no product slug | Slugs come from `wc/store/v1/products?include=…` (cached); links are dropped if that fails |

### Checkout parity (`parity-checkout.mjs`, 2026-11-02, C4 #250)

Run with the dev server on :3111: `node --env-file=.env.local parity-checkout.mjs`. Unlike the spikes it goes through the storefront's own routes (BFF), so it checks what customers get; the Woo keys only set up data and compare. 20/20.

| Guarantee | Result |
|---|---|
| Double submit: 3 concurrent `POST /api/shop/checkout/order` with one Idempotency-Key, then a retry | One order id, one Woo order, stock reduced once |
| Two customers, last unit, concurrent | One order; the other gets **409 `out_of_stock`**; stock 0, never below. Found: Woo answers the loser **403** `woocommerce_product_not_enough_stock`, which the BFF read as "session expired" (would have signed them out); stock codes are now mapped first |
| Coupon with `usage_limit: 1`, two customers | Second refused with 400 `coupon_invalid`; Woo usage count 1 |
| Totals shown at checkout and on the order page vs the Woo order (shipping, fixed-cart coupon) | Equal to the minor unit |
| Cancel / full refund in the Woo admin | The order page and list show cancelled / refunded |

### Hardening audit (`spike-hardening.mjs`, 2026-11-02, W8 #233)

Run: `node --env-file=.env.local spike-hardening.mjs`. What anonymous visitors and signed-in customers reach on WordPress directly, bypassing the storefront. 21/21 after `farida-hardening.php` 2.0.

| Check | Before | After |
|---|---|---|
| Anonymous `wc/v3` customers, orders, reviews, system status | Refused | Refused |
| `?author=1` | Redirected to `/author/admin/` (login name) | 404 |
| oEmbed `author_name` | `admin` | Removed |
| XML-RPC `wp.getUsersBlogs` (password guessing outside the login form) | Answered | Method does not exist |
| Signed-in customer: `wp/v2/users`, `wp/v2/users/1` | Listed | Hidden (only `/users/me`) |
| Signed-in customer: write own `wc/v3/customers/<id>`, post a `wc/v3` review, call `wc-farida` | Refused (403) | Refused |
| 12 wrong passwords on the JWT token route | All "incorrect password" | Locked after 10 (`farida_too_many_attempts`) |
| Application passwords (a second credential a reset would not revoke) | Available | Off |

**REST key:** `create-keys.php` now issues the key for a `farida-storefront` **Shop manager** user instead of the admin. Every spike passes with it except two that fail for other reasons (`spike-cod` triple submit: Woo has no idempotency, the BFF's key handles it; `spike-cart` picks leftover products whose stock is held by those orders). Found: Woo returns customer `meta_data` to administrators only; `farida-account.php` adds back the storefront's keys.

### Google sign-in account checks (`spike-google.mjs`, 2026-11-03, A2 #243)

Run: `node --env-file=.env.local spike-google.mjs`. Stands in for the storefront after it checked Google's ID token. 13/13: keys required; malformed subject refused; a new Google user becomes a customer with a token that works like a password login's and a confirmed email; the same Google account signs into the same customer; an existing unconfirmed customer is linked, its password replaced and its old session signed out; a confirmed one keeps its password; a second Google account for that email gets 409; a staff email gets 403. (Test Google ids are random per run: an earlier version reused ids between runs and was flaky.)

### Email confirmation checks (`spike-email-verify.mjs`, 2026-11-03, A2 #243)

Run: `node --env-file=.env.local spike-email-verify.mjs` (about 65 s: it waits out the one-email-a-minute guard). 17/17: keys required; https/localhost link only; one email, then "recent" within a minute; wrong token or other id refused; verify sets `farida_email_verified` (visible with the shop-manager key) and the link can be opened twice; "verified" stops further emails; an email change clears the confirmation and kills old links; Arabic email keeps the first name.

### Password reset checks (`spike-password.mjs`, 2026-11-02, A2 #243)

Run: `node --env-file=.env.local spike-password.mjs` (about 70 s: it waits out the one-email-a-minute guard). Mail is caught by Mailpit (`docker compose up -d mailpit`, UI on http://localhost:8025; `local-mailpit.php` points `wp_mail` at it).

| Check | Result |
|---|---|
| Routes without the Woo keys | 401 |
| `resetUrl` not https (or localhost), or with a query | 400 |
| Forgot for a customer: one email with the storefront link, greeting by first name, en and ar | Pass |
| Second request within a minute | No second email (own timestamp: Woo's new-account email also issues a reset key) |
| Unknown email, or a staff account | Same 202, no email |
| Wrong key / short password | 400 |
| Reset → returns the email; key single use; old password refused | Pass |
| JWT issued before the reset | Signed out (`users/me` 404: anonymous, and `farida-hardening` hides `wp/v2/users`; the storefront reads 401/403/404 as signed out) |
| PHP `"$name،"` | Reads `،` as part of the variable name: interpolate as `{$name}` next to Arabic text |

### Cancellation and return checks (`spike-orders.mjs`, 2026-11-02, O2 #253)

Run: `node --env-file=.env.local spike-orders.mjs`. Creates its own product and orders, deletes them after.

| Check | Result |
|---|---|
| `PUT wc/v3/orders/<id>` `{status: "cancelled"}` on a Processing COD order | Pass; stock restored |
| Cancelling it a second time | No second restock (Woo's `_order_stock_reduced` flag) |
| Cancelling a Pending order (stock never reduced) | Stock unchanged |
| Private order note (`customer_note: false`) | Pass; shown to the owner only |
| Custom status `return-requested` (mu-plugin) settable over REST, listed by default | Pass; completion date and stock kept |
| Owner declines (back to Completed) | Pass; stock unchanged |
| A status the owner adds later reads as "placed" | The BFF refuses to cancel any status it does not know |

### Signed-in checkout checks (`spike-checkout.mjs`, 2026-10-31, C3 #249)

Run: `node --env-file=.env.local spike-checkout.mjs`. Creates its own customer, product and coupon.

| Check | Result |
|---|---|
| Egypt governorates | `wc/v3/data/countries/eg`: 27 states with codes (`EGC` Cairo, `EGGZ` Giza, …) |
| Address → shipping | `cart/update-customer` returns rates (staging: one flat rate, 50 EGP); `select-shipping-rate` puts it in the totals |
| Coupons | Unknown code: 400 `woocommerce_rest_cart_coupon_error`; valid percent coupon shows in `total_discount` |
| Payment methods | Staging offers only `cod` (Paymob needs sandbox keys, W3) |
| COD checkout | Order `processing`, note/shipping/coupon recorded, belongs to the customer; cart emptied; address saved to the customer |
| **Concurrent checkouts of one cart** | **Two orders.** The Store API does not dedupe; the BFF serializes per customer and replays per idempotency key. That lock is in-memory: one Next instance only (see W1) |
| Stock gone before checkout | 409 `woocommerce_rest_product_out_of_stock`, no order |
| Order read-back | `wc/v3/orders/{id}` with keys + ownership check; Store API `order/{id}?key&billing_email` also works |

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
| Anonymous cannot enumerate users | Fixed by `farida-hardening` mu-plugin (was 200; see the W8 audit). **Ship it to production** |
| **Triple submit of one cart creates one order** | **FAIL: 3 orders.** Woo has no idempotency for concurrent identical checkouts. Workaround: the BFF checkout route takes an idempotency key (we already have `checkoutIdempotency.ts`) and rejects or replays duplicates, e.g. a per-key lock and a stored order id |

Notes for the BFF: Woo only accepts consumer-key auth over HTTPS (locally faked for `/wp-json/` by an mu-plugin); the BFF must filter orders by customer itself because keys are admin-level.

Still to do: translated sample products, Paymob sandbox flow, owner admin walk-through, hash import test, a Next route handler (B1) calling Woo. Customer JWT login and order ownership: done (above).
