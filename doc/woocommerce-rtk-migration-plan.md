# Master plan: Strapi → WooCommerce and MobX → Redux Toolkit / RTK Query

Status: **approved direction, no code merged yet.** Last updated 2026-10-14.

This is the single complete plan. It replaces the Strapi-specific parts of `rtk-query-migration.md` and expands `woocommerce-roadmap.md`. Related docs: `woocommerce-spike-checklist.md` (acceptance checks), `strapi-to-woocommerce-data-mapping.md` (data migration), `missing-features.md` (feature gaps).

## 1. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-10-14 | Replace Strapi completely with WooCommerce as the backend | The store is run by a non-technical owner. Woo provides the order desk (refunds, shipping zones, status flow, emails, invoices, reports) that would otherwise be custom work in Strapi. |
| 2026-10-14 | Keep the Next.js storefront (headless Woo) | UI, Arabic/RTL and routing are already built. |
| 2026-10-14 | Replace MobX with Redux Toolkit + RTK Query | Caching, tag invalidation, typed endpoints, real error states; separates server data from UI state. |
| 2026-10-14 | Use **Woo REST (v3) + Store API** (not GraphQL) | No extra plugins, best documented, fits RTK Query. |
| 2026-10-14 | Evaluate **Polylang** (+ Polylang for WooCommerce) for Arabic/English | Cheaper than WPML. Final choice confirmed in epic E1. |
| 2026-10-14 | Start with backend-independent frontend work; no Woo instance exists yet | Avoids blocking on the backend. |
| 2026-10-14 | `react-redux` **8.1.x** with `@reduxjs/toolkit` 2.x | `react-redux` 9.3 failed to install (`ERESOLVE`): it requires `@types/react` ≥ 18.2.25 while the repo pins 18.2.7. v8.1 is supported by RTK 2. Revisit when the type packages are upgraded. |
| 2026-10-14 | `backend-admin` (Strapi) is **not deleted** until after cutover and a stable period | Needed for the data export and for rollback. |

## 2. Goals and non-goals

**Goals**
- WooCommerce is the only backend. No Strapi code, env var or doc remains in the frontend after cutover.
- MobX removed entirely. Server data in RTK Query; client/UI state in Redux slices.
- The storefront gets server-rendered catalog pages (SEO), error/loading boundaries, tests for cart and checkout, and a locked-down API surface.
- The store owner manages products, orders, refunds, coupons and shipping in the Woo admin without developer help.

**Non-goals (for this project)**
- Redesigning the UI.
- Rewriting Arabic/English content.
- Upgrading Next.js or React (tracked separately; do it after the migration, or before if it unblocks `react-redux` 9).

## 3. Target architecture

```
Browser (React + RTK Query + Redux slices)
   │  fetch("/api/shop/...")      ← only our own origin
   ▼
Next route handlers (BFF) – src/app/api
   ├─ /api/shop/*     explicit routes → Woo REST + Store API
   ├─ /api/auth/*     login / register / reset → WP JWT; httpOnly session cookie
   └─ /api/contact    contact form (unchanged)
   ▼
WordPress + WooCommerce
   Paymob plugin · COD · Polylang · shipping zones · email · invoices · JWT auth
```

Rules:
1. The browser never calls WordPress and never holds a Woo key. Keys are server-only env vars.
2. **No catch-all proxy.** The current `strapi/[...path]` route is an open relay for the service token. The BFF exposes a fixed list of routes, each with an allowed method list and input validation.
3. **Ownership is enforced in the BFF.** Woo REST with consumer keys can read any customer/order, so every account/order route checks that the id matches the JWT user.
4. RTK Query endpoints return our **domain types** (`Product`, `Category`, `Order`, `CartLine`, `Address`, `Review`) mapped from Woo in `transformResponse`. Components never see Woo's raw shape.
5. Locale is an argument of every catalog endpoint, so the cache is keyed per language.
6. The Redux store is created **per request** inside a client `StoreProvider` (never a module singleton).

### Folder structure

```
src/
  store/
    index.ts              makeStore(), RootState, AppDispatch
    hooks.ts              useAppDispatch / useAppSelector
    StoreProvider.tsx     client provider
    api/
      baseApi.ts          createApi, fetchBaseQuery("/api/shop"), tagTypes, 401 handler
      productsApi.ts  categoriesApi.ts  searchApi.ts  reviewsApi.ts
      cartApi.ts      checkoutApi.ts    ordersApi.ts  couponsApi.ts
      authApi.ts      accountApi.ts     addressesApi.ts  contentApi.ts (banners, ads)
    slices/
      cartSlice.ts  wishlistSlice.ts  uiSlice.ts  filtersSlice.ts  checkoutSlice.ts
    domain/
      types.ts            Product, Order, ... (our shapes)
      mappers/            wooProduct.ts, wooOrder.ts, wooCustomer.ts, ...
  app/api/
    shop/…                BFF routes (see section 7)
    auth/…                session + login/register/reset
    contact/route.ts
  lib/woo/
    client.ts             server-only fetch to Woo (keys, timeouts, error mapping)
    storeApi.ts           Cart-Token handling
```

## 4. Environment variables

| Old | New | Notes |
|---|---|---|
| `NEXT_PUBLIC_STRAPI_API_ENDPOINT` | removed | |
| `STRAPI_API_TOKEN` | removed | |
| – | `WC_BASE_URL` | server-only, e.g. `https://shop.example.com` |
| – | `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` | server-only, **read/write only the scopes needed**; never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_HOST` | `NEXT_PUBLIC_MEDIA_HOST` | image host for `next/image` `remotePatterns` |
| `NEXT_PUBLIC_PAYMOB_API_TOKEN`, `NEXT_PUBLIC_PAYMOB_INTEGRATION_ID` | removed | Paymob secrets move into the Woo Paymob plugin. The code already says these must not be public. |
| `NEXT_PUBLIC_PAYMOB_IFRAME_ID` | decided in E6 | Only needed if the iframe is rendered by the storefront; otherwise the Woo gateway handles it. |
| `CONTACT_SHARED_SECRET` | unchanged | |

## 5. Phases and work breakdown

Estimates are rough, for one developer, and exclude waiting time on hosting and plugin purchases.

### Phase 0 – Documentation and decisions (now)
- [x] Architecture review, missing-features list, Woo spike checklist, data mapping, this plan.
- [ ] Commit the docs and open a PR.
- [ ] Create GitHub epics/issues from section 5 and add them to the project board, sorted by priority.

### Phase 1 – Foundations (backend-independent) · P0 · ~1 week
**F1. Redux/RTK foundation** (own PR)
- Install `@reduxjs/toolkit@^2.2` and `react-redux@^8.1`.
- Create `src/store/index.ts`, `hooks.ts`, `StoreProvider.tsx`, `api/baseApi.ts` with empty endpoint set and tag types.
- Mount `StoreProvider` next to the MobX provider in `src/app/[locale]/layout.tsx`. No behavior change.
- Accept: build and lint pass; the app renders unchanged; a dummy selector works in a client component.

**F2. Error and loading boundaries** (own PR)
- `error.tsx` and `loading.tsx` for the locale layout and each route group; `global-error.tsx`.
- Accept: a thrown error in a page shows a localized fallback (en/ar) instead of a blank page.

**F3. Housekeeping** (own PR)
- Remove committed `bash.exe.stackdump` and ignore it.
- `images.remotePatterns` in `next.config.js`.
- Fix CLAUDE.md (env list, structure notes).
- Accept: `npm run build` passes.

**F4. Test runner** (own PR)
- Add Vitest + Testing Library + jsdom; `npm test`; CI job in the repo workflows.
- First tests: `getPriceAfterDiscount`, `orderPaymentState`, `checkoutIdempotency`.
- Accept: CI runs tests.

**F5. Legal pages** (own PR)
- Privacy, terms, shipping, returns, FAQ in en/ar (content from the owner), linked from the footer.
- Accept: `verify:i18n` passes; pages render in both locales and RTL.

### Phase 2 – WooCommerce platform (epic E1) · P0 · ~1–2 weeks, runs in parallel with Phase 1
- W1. Managed hosting, HTTPS, staging + production, backups.
- W2. Install WooCommerce; EGP; Egypt shipping zones and rates; tax settings.
- W3. Paymob plugin + COD; webhook configured; test-mode orders.
- W4. Polylang (+ WooCommerce add-on): Arabic and English for products, categories, attributes, emails.
- W5. JWT auth plugin; password-reset flow plugin/endpoint; email verification; Google login plugin.
- W6. Transactional email through SMTP service; Arabic templates; invoice/packing-slip plugin.
- W7. Custom post type (or ACF options) for banners/ads/mini-ads/fast-ads.
- W8. Create REST consumer keys with least privilege; document them in a password manager, not in the repo.
- W9. Run `woocommerce-spike-checklist.md` and record results.
- Accept: every "Must pass" item in the checklist passes, or a workaround is documented and approved.

### Phase 3 – BFF and catalog · P1 · ~2 weeks
**B1. Woo client + BFF scaffolding**
- `lib/woo/client.ts` (server-only), error mapping, timeouts, request logging without secrets.
- Route-level allowlist helper, input validation, shared error shape.
**B2. Catalog endpoints + mappers**
- `GET /api/shop/products` (filters: category, price range, color, sort, page, locale), `GET /api/shop/products/:slug`, `GET /api/shop/categories`, `GET /api/shop/search`.
- Catalog reads can use the public Store API (`/wc/store/v1/products`) to avoid keys; REST v3 where more fields are needed.
- Mappers → `Product`, `Category` with sale price, images, stock status, attributes, translations.
**B3. RTK catalog endpoints and consumers**
- `productsApi`, `categoriesApi`, `searchApi`; `filtersSlice` synced to URL.
- Migrate `ProductsSection`, `FiltersSection`, `MiniProducts`, sliders, search menu, category and product pages.
- Delete `productsStore`, `categoriesStore`, `colorsStore`, `searchBoxStore` as each moves.
**B4. Server-rendered catalog and SEO**
- Home, category and product pages as server components with ISR (`revalidate`) and tag-based revalidation on product updates (Woo webhook → `/api/revalidate`).
- `generateMetadata`, Open Graph, Product JSON-LD, `sitemap.ts`, `robots.ts`; per-locale alternates (hreflang).
- Accept: view-source of a product page contains title, price and JSON-LD; Lighthouse SEO ≥ 90.
**B5. Banners and ads**
- `contentApi` for ads/mini-ads/fast-ads from the custom post type; delete `adsStore`, `fastAdsStore`.

### Phase 4 – Accounts · P1 · ~1.5 weeks
**A1. Auth BFF + session**
- `POST /api/auth/login` (WP JWT), `/register` (creates Woo customer), `/logout`, `/refresh`.
- Keep the httpOnly `credentials` cookie and the readable `logged_in` flag; add expiry handling.
**A2. authApi + forms**
- `authApi` mutations; replace `loginFormStore` and `registerFormStore` with `react-hook-form`.
- Forgot/reset password pages; email verification page; Google login wiring.
**A3. Middleware hardening**
- Strip locale, match explicit prefixes (`/user`, `/order`, `/trackorder`, `/cart/shipping`, `/cart/confirmation`), one redirect helper, next-intl handler built once, JWT `exp` check.
**A4. Profile and addresses**
- `accountApi`, `addressesApi` on Woo customer billing/shipping fields (and meta for extra addresses); ownership checks in the BFF.
- Delete `userStore` (profile parts), `userAddressesStore`.
- Accept: a user can register, verify, log in, reset a password, edit profile and manage addresses; cross-user access returns 403 in tests.

### Phase 5 – Cart and checkout · P1 · ~2–3 weeks (highest risk)
**C1. Cart slice and tests first**
- `cartSlice` (guest lines in storage), selectors for totals; Vitest coverage for add/remove/quantity/totals/discount.
**C2. Server cart via Store API**
- `/api/shop/cart` routes handle the `Cart-Token` (stored in an httpOnly cookie); add/update/remove items; coupons.
- `useCart()` hides guest vs server; guest → user merge (keep the `ConfirmMergeCart` UX).
**C3. Checkout**
- Shipping address and method with cost; COD and card selector; order notes; idempotency key (reuse `checkoutIdempotency`).
- `POST /api/shop/checkout` → Woo order; Paymob redirect/iframe through the Woo gateway; stock and coupon errors mapped to localized messages.
- `payment-callback` page polls order status from the BFF; reuse `orderPaymentState`.
**C4. Parity tests**
- Double-submit creates one order; last-unit race; coupon limit; totals match the Woo order.
- Delete `cartStore`, `ordersStore`, `paymentStore`, `paymobService` where replaced.
- Accept: COD and card orders succeed on staging in en and ar; refund and cancel from the Woo admin reflect on the storefront.

### Phase 6 – Orders and wishlist · P1/P2 · ~1.5 weeks
- O1. Order list/detail/tracking from Woo statuses (incl. custom out-for-delivery status); invoice link.
- O2. Customer cancel for cancellable orders; return-request form.
- O3. Reviews: `reviewsApi` (list, add) with moderation; verified-buyer badge.
- O4. Wishlist: decide plugin (with API) or user-meta endpoint; `wishlistSlice` for guests; delete `wishListStore`, `userWishlist`.

### Phase 7 – Data migration · P1 · ~2 weeks, starts after W9
- M1. Answer the open questions in `strapi-to-woocommerce-data-mapping.md` against production data.
- M2. Export script (Strapi → JSON) and import script (JSON → Woo) with dry run and verification report.
- M3. Repeated rehearsals on staging; compare counts, totals, 20-sample spot checks.
- M4. Customer password strategy (hash import vs forced reset email) tested.

### Phase 8 – UI state and cleanup · P2 · ~1 week
- U1. Sidebars, modals, view style, filters drop, cart sidebar → `uiSlice`.
- U2. Dedupe `ProductCard`/`RawProductCard`, `ProductsTable`/`ProductsTable2`; merge the two shared component folders and `functions`/`utils`.
- U3. Remove `mobx`, `mobx-react-lite`, `StoreContext`, all `observer()` wrappers.
- Accept: `grep -r mobx src` finds nothing.

### Phase 9 – Cutover and decommission · P1 · ~1 week + stabilization
- X1. Freeze plan, final delta import, switch env, redirects from old URLs, submit sitemap.
- X2. Monitoring (errors, checkout success rate), first-week watch.
- X3. Rollback runbook with a named owner (repoint env to Strapi, replay new orders).
- X4. After a stable period: delete Strapi code paths, old env vars and docs; archive `backend-admin`.

### Phase 10 – Post-launch · P2/P3
- Analytics and conversion tracking (GA4, Meta Pixel, cookie consent).
- Related and recently viewed products; low-stock badge; back-in-stock alerts.
- Newsletter, comparison, WhatsApp button, sharing, Q&A, loyalty, PWA.

## 6. Priority summary (for the project board)

| Priority | Items |
|---|---|
| **P0** | F1 RTK foundation · W1–W9 Woo setup and acceptance |
| **P1** | F2 boundaries · F3 housekeeping · F4 tests · F5 legal pages · B1–B5 BFF and catalog · A1–A4 accounts · C1–C4 cart and checkout · O1–O3 orders and reviews · M1–M4 migration · X1–X4 cutover |
| **P2** | O4 wishlist · U1–U3 UI state and cleanup · analytics · merchandising |
| **P3** | Growth features |

## 7. Strapi endpoint → Woo mapping

Taken from the frontend's actual calls (`grep` of `STRAPI_ENDPOINT` in `src/`).

| Frontend call today | Used by | Woo target | BFF route |
|---|---|---|---|
| `GET /products?populate…&pagination…` | productsStore | Store API `GET /wc/store/v1/products` (+ `lang`) | `GET /api/shop/products` |
| `GET /products/:id?populate…` | productsStore | `GET /wc/store/v1/products/:id` or REST `/wc/v3/products?slug=` | `GET /api/shop/products/:slug` |
| `GET /products?filters[$or]…` (search) | searchBoxStore | `GET /wc/store/v1/products?search=` | `GET /api/shop/search` |
| `GET /categories…` (list, by name) | categoriesStore | `GET /wc/store/v1/products/categories` | `GET /api/shop/categories` |
| `GET /colors…` | colorsStore | Attribute terms: `/wc/store/v1/products/attributes/:id/terms` | `GET /api/shop/attributes/color` |
| `GET /advertises`, `/mini-ads` (`locale`) | adsStore, fastAdsStore | WP REST custom post type `/wp/v2/ads` | `GET /api/shop/content/ads` |
| `POST /auth/local` | loginFormStore | JWT plugin `POST /jwt-auth/v1/token` | `POST /api/auth/login` |
| `POST /auth/local/register` | registerFormStore | `POST /wc/v3/customers` (server key) | `POST /api/auth/register` |
| `POST /carts`, `POST /wishlists` (on register) | registerFormStore | not needed (Woo creates carts lazily) | – |
| `GET /users/me?populate=*` | userStore | `GET /wc/v3/customers/:id` (id from JWT) | `GET /api/shop/account` |
| `PUT /users/:id` | userStore | `PUT /wc/v3/customers/:id` | `PUT /api/shop/account` |
| `GET /users/me?populate=user_addresses` | userAddressesStore | customer billing/shipping + meta | `GET /api/shop/account/addresses` |
| `POST/DELETE /user-addresses` | ordersStore, userAddressesStore | `PUT /wc/v3/customers/:id` (billing/shipping/meta) | `/api/shop/account/addresses` |
| `GET /users/me?populate[cart]…` | cartStore | Store API `GET /wc/store/v1/cart` (Cart-Token) | `GET /api/shop/cart` |
| `POST/PUT/DELETE /cart-items` | userStore | Store API `/cart/add-item`, `/cart/update-item`, `/cart/remove-item` | `/api/shop/cart/items` |
| `GET/POST /wishlist-items`, `/users/me?populate[wishlist]…` | userWishlist | wishlist plugin API or user-meta endpoint | `/api/shop/wishlist` |
| `POST /reviews` | userStore | `POST /wc/v3/products/reviews` | `POST /api/shop/reviews` |
| `POST /order-details/checkout` | ordersStore, payment page | Store API `POST /wc/store/v1/checkout` (or REST order create) | `POST /api/shop/checkout` |
| `GET /users/me?[populate][order_details]…` | ordersStore | `GET /wc/v3/orders?customer=:id` | `GET /api/shop/orders` |
| `GET /order-details/:id` | order pages | `GET /wc/v3/orders/:id` (ownership check) | `GET /api/shop/orders/:id` |
| `POST /order-details/:id/cancel` (backend only; UI missing) | – | `PUT /wc/v3/orders/:id` status `cancelled` (rules in BFF) | `POST /api/shop/orders/:id/cancel` |
| Coupon on checkout (backend only; UI missing) | – | Store API `POST /cart/apply-coupon` | `POST /api/shop/cart/coupon` |
| `POST /order-details/initiate-payment`, `payment-webhook` | paymentStore | Woo Paymob gateway + plugin webhook | handled by Woo; callback page reads order status |

## 8. Store-by-store disposition (25 MobX stores)

| MobX store | Becomes | Phase |
|---|---|---|
| productsStore (10 fetches) | `productsApi` + `filtersSlice` | 3 |
| categoriesStore | `categoriesApi` | 3 |
| colorsStore | `productsApi` attribute endpoint | 3 |
| searchBoxStore | `searchApi` + `uiSlice` | 3 |
| adsStore, fastAdsStore | `contentApi` | 3 |
| productsViewStore | `uiSlice` | 8 |
| loginFormStore, registerFormStore | `authApi` + `react-hook-form` | 4 |
| userStore (profile, reviews, cart-item calls) | `accountApi`, `reviewsApi`, `cartApi` | 4–6 |
| userAddressesStore | `addressesApi` | 4 |
| cartStore | `cartSlice` + `cartApi` + `useCart()` | 5 |
| ordersStore | `checkoutApi` + `ordersApi` | 5–6 |
| paymentStore | `checkoutApi` + `checkoutSlice` | 5 |
| userWishlist, wishListStore | `wishlistSlice` + wishlist endpoints | 6 |
| cartSidebarStore, sidebarStore, filterSidebarStore, filtersDropMenuStore, userDropStore | `uiSlice` | 8 |
| addressModalStore, selectionAddressModalStore, editProfileModalStore | `uiSlice` (modal state) | 8 |

Note: `selectionAddressModal` is currently `new AddressModalStore()`; it becomes its own `uiSlice` field.

## 9. Testing strategy

- **Unit (Vitest):** mappers (Woo → domain), cart slice, price/discount helpers, order status mapping.
- **BFF route tests:** ownership checks, allowlists, input validation, error mapping, with Woo mocked.
- **Parity tests on staging** (manual script or Playwright): no oversell, one order per double-submit, coupon limits, refund visible on the storefront.
- **Existing scripts kept:** `verify:i18n`, `verify:payment` (update `verify:payment` once statuses change).
- **CI:** build, lint, tests, verify scripts on every PR.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Paymob plugin does not fit our account, or lacks refunds/webhook | High | Check in W3/W9 first; fallback is a small custom gateway plugin |
| Store API cart/checkout needs nonces or cookies that are awkward headless | High | Prove cart-token flow in W9 before building C2; fallback is a thin WP plugin exposing cart/checkout endpoints |
| Consumer keys read any customer's data | High | Keys server-only; ownership checks in BFF; tests for cross-user access |
| Polylang API gaps (language param, translated attributes) | Medium | Verify in W4/W9; pass `lang` explicitly |
| Migration data quality (translations, color variants stored as separate products, inventory rows that are categories) | High | Answer open questions in M1; dry runs |
| Users cannot log in after import | Medium | Test hash import; else forced reset emails |
| Shared public cache + auth in server components | Medium | Cache only anonymous catalog data; never cache with auth headers |
| Large change across ~100 consumer files | Medium | One slice per PR; MobX and Redux coexist until Phase 8 |
| WordPress upkeep falls on a non-technical owner | Medium | Managed hosting, automatic updates, backups, named technical owner |
| `react-redux` 8 + `@types/react` 18.2.7 are old | Low | Plan a dependency upgrade after cutover |

## 11. Open questions

1. Hosting provider and budget for managed WordPress? Who is the technical owner?
2. Which Polylang add-on tier, and which invoice/shipping/wishlist plugins are approved?
3. Production data: translation model, color-variant model, user and order counts (see the mapping doc).
4. Google login: keep it, and if so which WP plugin?
5. Do we keep the saved-address book (multiple addresses) or move to billing/shipping only?
6. Cutover date and acceptable downtime window.
7. Should the Next.js upgrade (14/15) happen before Phase 3 to allow `react-redux` 9 and better caching APIs?

## 12. Progress tracker

- [x] Phase 0: architecture review, missing features, spike checklist, data mapping, master plan
- [ ] Phase 0: commit docs, create issues and project board
- [ ] Phase 1: foundations (F1–F5)
- [ ] Phase 2: Woo platform (W1–W9)
- [ ] Phase 3: BFF and catalog (B1–B5)
- [ ] Phase 4: accounts (A1–A4)
- [ ] Phase 5: cart and checkout (C1–C4)
- [ ] Phase 6: orders and wishlist (O1–O4)
- [ ] Phase 7: data migration (M1–M4)
- [ ] Phase 8: UI state and cleanup (U1–U3)
- [ ] Phase 9: cutover and decommission (X1–X4)
- [ ] Phase 10: post-launch
