# WooCommerce spike checklist

**Goal:** in about 2 working days, decide with evidence whether to move the backend from Strapi to WooCommerce (headless, keeping the Next.js storefront).

**Why:** the store will be run day to day by a non-technical owner. Woo ships the order desk (refunds, shipping zones, emails, status flow, reports, invoices) that Strapi would need us to build. The risk is whether Woo fits our Egypt payments, bilingual catalog and headless storefront.

**Decision rule:** if every **Must pass** item passes, proceed to the migration plan. If any one fails with no workaround, stay on Strapi and finish its gaps.

## 0. Setup (half a day)

- [ ] Staging WordPress + WooCommerce on a throwaway host or local (Docker / LocalWP). Do not touch production.
- [ ] Currency EGP, country Egypt, prices stored with 2 decimals.
- [ ] Permalinks set to "Post name" (required for the REST API).
- [ ] Record versions of WordPress, WooCommerce, PHP and every plugin tested.

## 1. Payments — Must pass

- [ ] Install the Paymob WooCommerce plugin. Confirm it supports our Paymob account (integration ID and iframe).
- [ ] Card payment: test-mode order completes and the order becomes `processing`/`completed` through the Paymob webhook.
- [ ] Declined card: order ends `failed`, stock is not lost.
- [ ] Webhook signature (HMAC) is verified by the plugin. Note where it is configured.
- [ ] Cash on delivery enabled next to card, selectable at checkout.
- [ ] Refund a paid test order from the Woo admin. Does it call Paymob's refund API, or is it manual only?
- [ ] Headless flow: can the Next.js storefront start a payment and return from the Paymob page? Note whether it needs the Woo-hosted checkout page, a redirect, or the Store API.

## 2. Arabic and English catalog — Must pass

- [ ] Pick one: Polylang + Polylang for WooCommerce, WPML + WCML, or TranslatePress. Record license cost.
- [ ] 10 sample products with Arabic and English title, description and slug.
- [ ] Categories translated in both languages.
- [ ] REST API returns the right language per request (`?lang=ar`, or equivalent). Confirm the locale can be passed per call.
- [ ] Product attributes (color, size) translated.
- [ ] Order emails and customer-facing strings render correctly in Arabic (RTL).

## 3. Headless API fit — Must pass

- [ ] Auth for the storefront: JWT plugin or Application Passwords for the server proxy; customer login with their own token.
- [ ] A Next.js route handler calls the Woo REST API (`/wp-json/wc/v3`) with a server-only key. No keys in client code.
- [ ] Products list: pagination, filter by category, price range, color, sort. Compare against what `FiltersSection` needs today.
- [ ] Product detail: images, variations, stock status, localized fields, reviews.
- [ ] Cart and checkout: test the Store API (`/wp-json/wc/store/v1/cart`, `/checkout`) with a cart token. Confirm guest cart and the guest-to-user merge are possible.
- [ ] Coupon applied through the API and reflected in totals.
- [ ] Stock errors ("not enough stock") come back in a form the UI can show.
- [ ] CORS and cookies work for the storefront domain.
- [ ] Latency: product list responds in under about 500 ms on the chosen hosting, cached or not.
- [ ] Optional: try WPGraphQL + WooGraphQL and compare with REST.

## 4. Admin experience (store owner) — Must pass

Have the store owner do these on staging without help, and note where they get stuck.

- [ ] Add a product with images, price, sale price and stock.
- [ ] Find a new order and change its status.
- [ ] Print an invoice or packing slip (note the plugin used).
- [ ] Issue a full and a partial refund.
- [ ] Create a coupon (percent, fixed, minimum total, usage limit, expiry).
- [ ] Set a shipping rate for Cairo and another governorate.
- [ ] Read the order and sales report.
- [ ] Owner's verdict: easier, equal or harder than the Strapi admin?

## 5. Commerce behavior to match the Strapi backend

These are the guarantees the current backend already enforces. Test each in Woo.

- [ ] Two simultaneous orders for the last unit: only one succeeds (no oversell).
- [ ] Cancelling an order restocks exactly once.
- [ ] Coupon with `max_uses` stops at the limit under concurrent use.
- [ ] Double-click on "Place order" creates one order (idempotency).
- [ ] Coupon plus product discounts produce the same total as `evaluateCoupon` (coupon taken off the post-discount subtotal).
- [ ] Users can only read their own orders through the API.

## 6. Accounts and email

- [ ] Registration, login, forgot password and reset work end to end.
- [ ] Transactional emails send (order received, processing, completed, refunded). Configure SMTP or a mail service, and check delivery.
- [ ] Can existing Strapi users log in after import, or must they reset passwords? Test importing one bcrypt hash from `up_users.password` (Strapi uses bcrypt). If login fails, plan a forced reset email.

## 7. Operations

- [ ] Hosting plan, backup and restore tested once.
- [ ] Update path for WordPress core and plugins; who does it and how often.
- [ ] Security basics: login rate limit, 2FA for admins, the REST API not exposing customer data to anonymous users.
- [ ] Cost sheet: hosting + paid plugins (multilingual, Paymob if paid, invoices, shipping) per year.

## 8. Record the result

Fill in after the spike.

| Area | Pass / Fail / Workaround | Notes |
|---|---|---|
| Payments (Paymob, COD, refund) | | |
| Arabic / English catalog | | |
| Headless API (products, cart, checkout) | | |
| Owner admin experience | | |
| Stock / coupon / idempotency parity | | |
| Accounts and email | | |
| Operations and cost | | |

**Recommendation:** proceed to Woo migration / stay on Strapi.

**Blocking issues found:**

**Estimated yearly cost vs Strapi hosting:**
