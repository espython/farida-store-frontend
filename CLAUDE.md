# Farida Stores – Frontend

Storefront for a kitchen-appliances ecommerce shop (Arabic + English). Talks to the Strapi backend in the sibling repo `../backend-admin`.

## Commands

- `npm run dev` – dev server (http://localhost:3000)
- `npm run build` / `npm start` – production build / serve
- `npm run lint` – next lint
- No test suite is configured.

## Stack

Next.js 13 (App Router), React 18, TypeScript, Tailwind + NextUI, framer-motion, Swiper/react-slick, react-hook-form, react-toastify, MobX (`mobx-react-lite`), `next-intl`.

## Layout

- `src/app/[locale]/` – all pages, under `(auth)` (login, register) and `(pages)` (cart, order, payment-callback, trackorder, user*, wishlist, search, categories/[name], contact). Page-specific components live in a `components/` folder next to the page.
- `src/app/components/` and `src/components/` – shared UI (product cards, filters, sliders, pagination, cart sidebar). Two folders for historical reasons; the migration plan merges them.
- `src/app/api/` – Next route handlers:
  - `strapi/[...path]` – proxy to Strapi for features not yet on Woo; always uses `STRAPI_API_TOKEN` and refuses `auth`/`users` paths (Strapi has no users; the session is WordPress). Client code should call `STRAPI_ENDPOINT` (`/api/strapi`, see `src/api/config.ts`), not Strapi directly.
  - `auth/login`, `auth/register`, `auth/logout`, `auth/me` – customer auth on WooCommerce (`modules/customer`): WordPress JWT in the httpOnly `credentials` cookie plus a readable `logged_in` flag (both Max-Age = token expiry); registration through `wc/v3/customers` with the server keys; `me` verifies the token with WordPress and clears bad cookies. The UI uses `SignInForm`, `RegisterForm`, `AccountMenu`, `useSession()` and `useAuthActions()` from `@/modules/customer`.
  - `shop/cart`, `shop/cart/items`, `shop/cart/items/[productId]`, `shop/cart/merge` – a signed-in customer's saved cart on the Woo Store API (`modules/cart`), with their JWT and a `Cart-Token` kept in an httpOnly `cart_token` cookie bound to the customer id (the token reads the cart on its own). Guests' carts stay in the browser; `useCart()` switches by session and merges the guest cart after sign-in.
  - `shop/checkout` (+ `/address`, `/shipping-rate`, `/coupon`, `/order`) and `shop/orders/[id]` – signed-in checkout on the Store API (`modules/checkout`): Egyptian address (governorate codes, mobile format, 5-digit postcode Woo requires), Woo's shipping rates and totals, coupons, COD orders. `/order` needs an `Idempotency-Key`; orders are placed once per key and serialized per customer in memory (single Node instance; needs a shared store on multi-instance hosting). Card/Paymob is C3b.
  - `contact` – contact form (uses `CONTACT_SHARED_SECRET`).
  - `revalidate` – WooCommerce product webhook target; checks the `X-WC-Webhook-Signature` HMAC (`WC_WEBHOOK_SECRET`) and clears the `catalog` fetch-cache tag.
- `src/store/` – Redux Toolkit root composition (`makeStore`, typed hooks, `StoreProvider`). `baseApi` lives in `src/shared/infrastructure/`. New code follows `doc/woocommerce-rtk-migration-plan.md` and the architecture rules below.
- `src/stores/` – MobX stores (being migrated to `src/store/`), instantiated and exposed through context in `src/stores/index.tsx`. Add new stores there.
- `src/services/paymobService.ts` – Paymob payment integration.
- `src/middleware.ts` – auth redirects (protects `/user*`, `/order`, `/trackorder`, `/shipping`, `/confirmation`; bounces logged-in users off login/register) then next-intl routing.
- `messages/en.json`, `messages/ar.json` – translations. Locale prefix is always present (`/en/...`, `/ar/...`); use `Link`/`useRouter` from `src/navigation.ts`, not `next/link`.

## Architecture rules (DDD-lite, see `doc/ddd-architecture.md`)

- New code goes in `src/modules/<context>/{domain,infrastructure,application,ui}` and `src/shared/{kernel,infrastructure,ui,lib}`. Legacy code moves only when a migration task touches it.
- `domain` and `shared/kernel` import nothing from React, Redux, Next or other layers. `infrastructure` imports domain and shared only. `ui` never imports `infrastructure`.
- Modules import each other only via `@/modules/<name>` (its `index.ts`); inside a module use relative imports. Server code is exposed through `@/modules/<name>/index.server`, for `app/api` only.
- `*.server.ts` files are imported only from `app/api`, server components and `infrastructure`.
- Enforced by `no-restricted-imports` overrides in `.eslintrc.json`. Money is integer minor units (`shared/kernel/Money`).

## Conventions

- Every user-facing string goes in both `messages/en.json` and `messages/ar.json`. Mind RTL layout for Arabic.
- Components using stores or hooks need `"use client"`.
- Auth token is httpOnly; never read it from JS. Don't add Strapi tokens to client code.

## Environment variables

`NEXT_PUBLIC_STRAPI_API_ENDPOINT`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_HOST` (media host, also used for `images.remotePatterns`), `CONTACT_SHARED_SECRET`, `WC_BASE_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` (server-only, WooCommerce BFF), `WC_WEBHOOK_SECRET` (server-only; secret of the Woo product webhooks that call `/api/revalidate`), `NEXT_PUBLIC_SITE_URL` (public origin for canonical URLs, Open Graph and JSON-LD; defaults to `http://localhost:3000`), `NEXT_PUBLIC_PAYMOB_API_TOKEN`, `NEXT_PUBLIC_PAYMOB_IFRAME_ID`, `NEXT_PUBLIC_PAYMOB_INTEGRATION_ID`. No `.env` is committed.

## Workflow

PRs are auto-reviewed by Claude Code (`.github/workflows/claude-code-review.yml`); `@claude` mentions are handled by `claude.yml`. Default branch is `main`.
