# Migration plan: MobX → Redux Toolkit + RTK Query

## Why

- Stores mix server data, UI flags, and fetch logic; ~35 raw `fetch` calls repeat long `populate[...]` strings.
- No caching or request dedupe; every mount refetches.
- Errors are swallowed (`.catch(() => {})`), so failures are silent.
- RTK Query gives caching, tag invalidation, `isLoading`/`isError`, typed endpoints, and an optional SSR prefetch path.

## Current scope

25 stores in `src/stores/`, 103 files reading `StoreContext`, 96 `observer()` wrappers.

| Kind | Stores | Target |
|---|---|---|
| Server data | products, categories, colors, ads, fastAds, orders, userAddresses, userWishlist, user profile (`users/me`), search | RTK Query endpoints |
| Client state | guest cart (sessionStorage), guest wishlist, cartSidebar, sidebar, filterSidebar, filtersDrop, productsView, userDrop, three modal stores, searchBox | Redux slices |
| Mixed | cart, user, loginForm, registerForm, payment | Split into query/mutation + small slice; form stores replaced by `react-hook-form` |

## Target structure

```
src/store/
  index.ts            makeStore(), typed hooks (useAppDispatch / useAppSelector)
  StoreProvider.tsx   client provider; creates the store per request
  api/
    baseApi.ts        createApi + fetchBaseQuery({ baseUrl: "/api/strapi" }), tagTypes, 401 handling
    productsApi.ts    getProducts, getProduct, getReviews, addReview
    categoriesApi.ts, adsApi.ts, colorsApi.ts
    cartApi.ts, wishlistApi.ts, ordersApi.ts, addressesApi.ts, userApi.ts, authApi.ts
  slices/
    cartSlice.ts      guest cart, synced to sessionStorage
    wishlistSlice.ts  guest wishlist
    uiSlice.ts        sidebars, modals, view style, filters drop
    filtersSlice.ts   price / color / sort / page
```

## Technical rules

- **Per-request store.** Create the store inside the client `StoreProvider` (e.g. `useRef`), never as a module singleton, so state does not leak between users on the server.
- **Hydration.** Load guest cart/wishlist from `sessionStorage` in an effect, not during render.
- **One cart hook.** `useCart()` picks the guest slice or the server cart by login state.
- **Strapi shape.** Flatten `data`/`attributes` and `localizations` once in `transformResponse`.
- **Populate presets.** Replace inline query strings with named constants per endpoint.
- **Locale.** Product, category and ad queries take `locale` as an argument so the cache is keyed per language.
- **401.** One handler in `baseQuery` clears the session (`DELETE /api/auth/session`) and redirects to login.
- **Tokens.** Never add Strapi tokens to client code; keep calling `STRAPI_ENDPOINT` (`/api/strapi`).
- **Proxy first.** Lock down `strapi/[...path]` with a path/method allowlist before routing everything through RTK Query.
- **Coexistence.** MobX and Redux providers run side by side until the last step.

## Steps (one PR per step, branched from `main`)

| # | PR | Contents | Risk |
|---|----|----------|------|
| 1 | Foundation | Add `@reduxjs/toolkit`, `react-redux`; `baseApi`, `makeStore`, `StoreProvider` next to the MobX provider. No behavior change. | Low |
| 2 | Catalog reads | products, categories, colors, ads → endpoints; migrate consumers; delete those stores. Biggest win (`productsStore` is 593 lines). | Low |
| 3 | UI slices | Sidebars, modals, view style, filters, fastAds, searchBox → `uiSlice` / `filtersSlice`. | Low |
| 4 | Auth and user | login, register, `users/me`, session → `authApi` / `userApi`; drop form stores in favor of `react-hook-form` + mutations. | Medium |
| 5 | Wishlist, addresses, orders | CRUD endpoints with tag invalidation. | Medium |
| 6 | Cart | Guest slice + server cart + merge flow (`ConfirmMergeCart`). Add tests for the slice and the merge. | High |
| 7 | Payment and cleanup | Move `paymentStore`; remove `mobx`, `mobx-react-lite`, `StoreContext`, all `observer()` wrappers. | Medium |

## Done when

- No imports from `mobx` or `mobx-react-lite`.
- `src/stores/` removed.
- `npm run build`, `npm run lint`, `verify:i18n` and `verify:payment` pass.
- Manual smoke test in both `/en` and `/ar`: browse, filter, search, wishlist, guest cart → login merge, address add, checkout, payment callback, order tracking.

## Problems found in the architecture review, with fixes

Each problem is mapped to the RTK step that resolves it, or to a separate workstream (W) that runs in parallel as its own PR.

### P1. Strapi proxy is an open relay for the service token — Critical
- **Problem:** `src/app/api/strapi/[...path]/route.ts` forwards any path and method, and attaches `STRAPI_API_TOKEN` to every anonymous request. Anyone can call `/api/strapi/<anything>` with that token's permissions. It also exports no `PATCH`.
- **Fix (W1, do before RTK step 1):**
  - Add an allowlist of path patterns and methods for anonymous requests (catalog GETs, `auth/local*`, public review reads).
  - Give `STRAPI_API_TOKEN` read-only permission on public collections only in Strapi.
  - Require the user JWT for everything else; return 401/403 otherwise.
  - Export `PATCH` if Strapi calls need it.

### P2. Client-rendered storefront: poor SEO and slow first load — High
- **Problem:** 142 of 256 files are `"use client"`; pages are thin shells around client containers that fetch in `useEffect`. No `generateMetadata`, `revalidate`, sitemap, robots or Product JSON-LD. The proxy uses `cache: "no-store"`.
- **Fix (W2, after RTK steps 1–2):**
  - Convert product, category and home pages to server components with `fetch` + ISR (`revalidate`).
  - Add `generateMetadata`, Open Graph tags, `sitemap.ts`, `robots.ts`, and Product JSON-LD.
  - Keep Redux/RTK for cart, wishlist, auth and UI state only.
  - Optionally prefetch RTK Query data on the server for these pages.
  - Allow caching in the proxy for allowlisted public GETs.

### P3. Stores mix responsibilities; raw `fetch` everywhere; swallowed errors — High
- **Problem:** Stores hold server data, UI toggles, form state and fetch logic. `productsStore` has 10 `fetch` calls with repeated `populate[...]` strings. Many `.catch((err) => {})` hide failures.
- **Fix:** This is the RTK migration itself (steps 1–7): endpoints with named populate presets, `transformResponse` for the Strapi shape, `isError`/`error` surfaced in the UI, a shared `baseQuery` with a 401 handler, and tag invalidation.

### P4. Middleware auth is fragile — Medium
- **Problem:** `src/middleware.ts` uses `pathname.includes("/user")`, `includes("/order")` and so on, so it can match unintended paths. It only checks that a `credentials` cookie exists, so an expired token passes until the first API call fails. The locale fallback is repeated five times, and `createMiddleware` is rebuilt on every request.
- **Fix (W3):**
  - Strip the locale, then match on explicit path prefixes (`/user`, `/order`, `/trackorder`, `/shipping`, `/confirmation`).
  - Build the next-intl handler once at module scope.
  - Extract one `redirectTo(path)` helper that applies the locale fallback.
  - Check JWT expiry (decode `exp`, no secret needed) in middleware; clear the cookie and redirect when expired.
  - Combine with the RTK 401 handler (step 4) for server-side rejections.

### P5. Duplicate and parallel code — Medium
- **Problem:** Two near-identical product cards (`ProductCard`, `RawProductCard`); two cart tables (`ProductsTable`, `ProductsTable2`); separate guest and user wishlist stores; guest vs user cart split; `selectionAddressModal` built from `AddressModalStore` (likely copy-paste); two shared component folders (`src/components`, `src/app/components`); `src/functions` and `src/utils` overlap.
- **Fix:**
  - RTK steps 5–6: single wishlist and cart hooks (`useWishlist()`, `useCart()`) hiding the guest/user split.
  - W4: merge each card and table pair into one component with props, delete the loser.
  - W4: pick one shared-components folder and one helpers folder; move files and update imports.
  - RTK step 3: the selection modal becomes a separate `uiSlice` field rather than a second store instance.

### P6. Housekeeping and stale docs — Low
- **Problem:** `bash.exe.stackdump` is committed. `next.config.js` is empty (no `images.remotePatterns`). CLAUDE.md lists `NEXT_PUBLIC_PAYMOB_API_TOKEN` and `NEXT_PUBLIC_PAYMOB_INTEGRATION_ID`, which the code says must not be public. `params` is awaited in the proxy route but read synchronously in pages (inconsistent Next version handling).
- **Fix (W5):**
  - `git rm bash.exe.stackdump` and add it to `.gitignore`.
  - Configure `images.remotePatterns` for the Strapi host.
  - Update CLAUDE.md: drop the two public Paymob vars, and describe the Redux structure after the migration.
  - Decide the Next upgrade path (14/15) and make `params` handling consistent.

### P7. Reliability: no tests, no error/loading boundaries — High
- **Problem:** No test suite (only two verify scripts). No `error.tsx` or `loading.tsx` anywhere, so failed fetches give blank pages. Payment and checkout have minimal coverage.
- **Fix (W6):**
  - Add `error.tsx`, `loading.tsx` and a root `global-error.tsx` for the locale layout and each route group.
  - Add a test runner (Vitest + Testing Library) and cover the cart slice and guest→user merge (before RTK step 6), cart totals, order creation, and the payment callback.
  - Run the tests and `verify:*` scripts in CI alongside the Claude review workflow.

### Missing features
See `missing-features.md` for the full list (password reset, order cancel/returns, legal pages, coupons, COD, analytics, and so on). They are built on the new RTK Query layer once steps 1–5 land, except the launch blockers that need no API layer (legal pages, `error.tsx`).

## Combined roadmap

| Order | Item | Type |
|---|---|---|
| 1 | P1 proxy lockdown (W1) | Security, standalone PR |
| 2 | P6 housekeeping (W5) and P7 error/loading boundaries (W6) | Small PRs |
| 3 | RTK step 1: foundation | Migration |
| 4 | RTK step 2: catalog reads | Migration |
| 5 | P2 server-rendered catalog and SEO (W2) | Rendering |
| 6 | RTK steps 3–5 | Migration |
| 7 | P4 middleware hardening (W3) | Auth |
| 8 | P7 test runner and cart tests, then RTK step 6 | Migration |
| 9 | P5 dedupe components and folders (W4), RTK step 7 cleanup | Cleanup |
| 10 | Missing features, launch blockers first | Features |

## Open items

- Whether to prefetch catalog endpoints on the server (ties into the SEO work in `missing-features.md`).
- Whether to add a test runner (none exists today) before step 6.
