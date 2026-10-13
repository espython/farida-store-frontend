# Roadmap: WooCommerce backend + RTK Query frontend

**Decision (2026-10-14):** replace Strapi completely with WooCommerce (headless). Keep the Next.js storefront and replace MobX with Redux Toolkit + RTK Query. The store is run day to day by a non-technical owner, which is why a ready-made order desk wins.

This roadmap supersedes the Strapi-specific parts of:
- `rtk-query-migration.md` – the store-by-store plan still applies, but endpoints point at Woo, not Strapi.
- `missing-features.md` – the backend items (refunds, shipping fees, email provider, status flow, admin) now come from Woo.

Companion docs: `woocommerce-spike-checklist.md` (acceptance checks for the Woo setup) and `strapi-to-woocommerce-data-mapping.md` (migration).

## Principles

- The browser never talks to WordPress directly or holds Woo keys. Everything goes through Next route handlers (a BFF), as the Strapi proxy does today.
- The BFF exposes a **small, explicit set of routes**, not a catch-all proxy. This avoids repeating the open-relay problem in the current `strapi/[...path]` route.
- RTK Query endpoints return **our own domain types** (`Product`, `Order`, `CartItem`), mapped from Woo in `transformResponse`. Components never see Woo's raw shape, so a future backend change touches one folder.
- Each epic is delivered in small PRs from `main`; the app stays working after every PR.

## Target architecture

```
Browser (React + RTK Query + Redux slices)
   │  fetch("/api/shop/...")
   ▼
Next route handlers (BFF)
   ├─ /api/shop/*   explicit routes → Woo REST + Store API (server-only keys, cart token)
   ├─ /api/auth/*   login/register/reset → WP JWT; httpOnly session cookie
   └─ /api/contact  contact form
   ▼
WordPress + WooCommerce (Paymob plugin, COD, Polylang/WPML, shipping zones, emails)
```

## Epics, sorted by priority

Priority: **P0** blocks everything, **P1** launch blocker, **P2** needed soon after, **P3** later.

### P0

**E1. Woo platform setup and acceptance** (blocks E3–E9)
- Staging WordPress + WooCommerce on managed hosting; backups; HTTPS.
- Plugins: Paymob, COD, multilingual (Polylang or WPML), JWT auth, transactional email (SMTP service), invoices.
- Shipping zones (Cairo and governorates), EGP currency, tax settings.
- Run the checks in `woocommerce-spike-checklist.md` and record the result table.
- Exit: all "Must pass" items pass, or a documented workaround exists.

**E2. Frontend foundation (backend-independent)**
- Install `@reduxjs/toolkit` and `react-redux`; per-request `makeStore()`; `StoreProvider`; typed hooks.
- `baseApi` with `fetchBaseQuery({ baseUrl: "/api/shop" })`, tag types, one 401 handler.
- Add `error.tsx`, `loading.tsx`, `global-error.tsx`.
- Remove committed `bash.exe.stackdump`; configure `images.remotePatterns` for the Woo media host; fix CLAUDE.md env list.
- Add a test runner (Vitest + Testing Library) and a CI job.

### P1 (launch blockers)

**E3. BFF layer for Woo**
- Replace `src/app/api/strapi/[...path]` with explicit routes: products, categories, search, cart, checkout, orders, account, reviews, coupons.
- Server-only env vars: `WC_BASE_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` (never `NEXT_PUBLIC_`).
- Auth: `/api/auth/session` keeps the httpOnly cookie; it stores the WP JWT; add refresh/expiry handling.
- Allowlist per route (methods and fields); anonymous requests can read the public catalog only.
- Locale passed on every catalog call.

**E4. Catalog on RTK Query + server rendering**
- `productsApi`, `categoriesApi`, `searchApi` with Woo → domain mappers (price, sale price, images, stock status, attributes, translations).
- Convert home, category and product pages to server components with ISR; `generateMetadata`, Open Graph, Product JSON-LD, `sitemap.ts`, `robots.ts`.
- Filters (price, color, sort, page) in a `filtersSlice`, synced to the URL.
- Delete `productsStore`, `categoriesStore`, `colorsStore`, `adsStore`, `searchBoxStore` as each moves.

**E5. Accounts and authentication**
- `authApi`: register, login, logout, forgot/reset password (Woo's built-in flow), Google login (plugin) and email verification.
- Replace `loginFormStore` and `registerFormStore` with `react-hook-form` + mutations.
- Harden `middleware.ts`: locale-stripped prefix matching, one redirect helper, build next-intl handler once, JWT expiry check.
- Profile and address book (`userApi`, `addressesApi`) on Woo customer billing/shipping fields.

**E6. Cart and checkout**
- Cart on the Woo Store API with a cart token; guest cart slice persisted to storage; guest-to-user merge.
- One `useCart()` hook; remove `cartStore` and its guest/user split.
- Checkout: shipping address, shipping method and cost, coupon input, COD and card, order notes, idempotency key.
- Paymob flow through Woo's gateway; payment callback page reads the order status from the BFF.
- Stock errors surfaced in the UI.
- Tests for the cart slice, merge and totals (Vitest).

**E7. Orders**
- Order history, order details, tracking steps mapped from Woo statuses (including the custom out-for-delivery status).
- Customer cancel while the order is cancellable (pending, failed, COD, not yet shipped).
- Refund and return flow: the owner handles them in the Woo admin; the storefront shows status and can open a return request (form → email, or a return-request plugin).
- Invoice download link.

**E8. Data migration** (see `strapi-to-woocommerce-data-mapping.md`)
- Export script from Strapi, import script to Woo (media, categories, products, stock, customers, coupons, orders, reviews), with dry run and a verification report.
- Resolve the open questions in the mapping doc against production data first.

**E9. Cutover and decommission**
- Freeze, final delta import, switch env, redirects for old URLs, sitemap submission, monitoring.
- Rollback plan with a named owner.
- After a stable period: remove Strapi code paths from the frontend, archive `backend-admin`, delete unused env vars (`NEXT_PUBLIC_STRAPI_API_ENDPOINT`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_PAYMOB_*`), and update CLAUDE.md.

**E10. Legal and trust pages**
- Privacy policy, terms, shipping policy, return policy, FAQ (both languages).

### P2

**E11. Remaining stores to slices (UI state)**
- Sidebars, modals, view style, filters dropdown, cart sidebar, fast ads, wishlist UI to `uiSlice`; wishlist backed by a Woo wishlist plugin API or kept client-side.
- Banners and ads (formerly `advertises`, `fast-ads`, `mini-ads`) via a WordPress custom post type or ACF options.
- Dedupe `ProductCard`/`RawProductCard`, `ProductsTable`/`ProductsTable2`, merge the two shared component folders and the `functions`/`utils` folders.
- Final cleanup: remove `mobx`, `mobx-react-lite`, `StoreContext`, all `observer()` wrappers.

**E12. Analytics and conversion tracking**
- GA4 and Meta Pixel with purchase events, consent banner.

**E13. Merchandising**
- Related products, recently viewed, low-stock badge, back-in-stock notifications.

### P3

**E14. Growth features**
- Newsletter, product comparison, WhatsApp button, social sharing, product Q&A, loyalty program, PWA and push notifications.

## Delivery order

| Order | Epic | Why |
|---|---|---|
| 1 | E1 Woo setup and acceptance | Everything else depends on a working backend and a go/no-go result |
| 2 | E2 Frontend foundation | Can run in parallel with E1 |
| 3 | E3 BFF layer | Needed before any endpoint can be written |
| 4 | E4 Catalog + SEO | Biggest user-visible and SEO win, read-only so low risk |
| 5 | E5 Accounts | Needed for the cart merge and orders |
| 6 | E6 Cart and checkout | Riskiest; tests first |
| 7 | E7 Orders | Builds on E5 and E6 |
| 8 | E8 Migration script (can start after E1 and the mapping questions) | Long lead time, dry runs over weeks |
| 9 | E10 Legal pages (small, any time before launch) | Launch blocker, no dependencies |
| 10 | E9 Cutover | After E4–E8 pass on staging |
| 11 | E11, E12, E13, then E14 | Post-launch |

## Definition of done (whole project)

- No imports from `mobx` or `mobx-react-lite`; `src/stores/` removed.
- No reference to Strapi in code, env or docs.
- `npm run build`, `npm run lint`, `verify:i18n`, `npm test` pass in CI.
- Smoke test passes in `/en` and `/ar`: browse, filter, search, guest cart → login merge, coupon, COD order, card order, payment callback, cancel, order tracking, password reset.
- The store owner completed an order, a refund and a product edit in the Woo admin without help.

## Risks

| Risk | Mitigation |
|---|---|
| Paymob plugin does not fit our account, or lacks webhook/refund support | E1 acceptance check first; fall back to a custom Paymob gateway plugin |
| Headless cart/checkout via Store API is awkward | Test early in E1; alternative is a thin custom WP plugin exposing cart/checkout endpoints |
| Multilingual plugin cost or API gaps | Choose in E1; pass `lang` explicitly on every call |
| Migration data quality (translations, color variants, inventory-as-category rows) | Dry run and mapping questions answered against production before E8 |
| Existing users cannot log in after import | Test hash import in E1; otherwise send forced reset emails |
| WordPress upkeep falls on a non-technical owner | Managed hosting with automatic updates and backups; named technical owner |
| Large change touches 100+ files | One PR per epic slice, behind the old stores until each slice is migrated |
