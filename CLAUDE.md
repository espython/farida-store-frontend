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
  - `strapi/[...path]` – proxy to Strapi; adds the user's JWT (from the `credentials` cookie) or falls back to `STRAPI_API_TOKEN`. Client code should call `STRAPI_ENDPOINT` (`/api/strapi`, see `src/api/config.ts`), not Strapi directly.
  - `auth/session` – sets/clears the httpOnly `credentials` JWT cookie and a readable `logged_in` cookie.
  - `contact` – contact form (uses `CONTACT_SHARED_SECRET`).
- `src/store/` – Redux Toolkit root composition (`makeStore`, typed hooks, `StoreProvider`). `baseApi` lives in `src/shared/infrastructure/`. New code follows `doc/woocommerce-rtk-migration-plan.md` and the architecture rules below.
- `src/stores/` – MobX stores (being migrated to `src/store/`), instantiated and exposed through context in `src/stores/index.tsx`. Add new stores there.
- `src/services/paymobService.ts` – Paymob payment integration.
- `src/middleware.ts` – auth redirects (protects `/user*`, `/order`, `/trackorder`, `/shipping`, `/confirmation`; bounces logged-in users off login/register) then next-intl routing.
- `messages/en.json`, `messages/ar.json` – translations. Locale prefix is always present (`/en/...`, `/ar/...`); use `Link`/`useRouter` from `src/navigation.ts`, not `next/link`.

## Architecture rules (DDD-lite, see `doc/ddd-architecture.md`)

- New code goes in `src/modules/<context>/{domain,infrastructure,application,ui}` and `src/shared/{kernel,infrastructure,ui,lib}`. Legacy code moves only when a migration task touches it.
- `domain` and `shared/kernel` import nothing from React, Redux, Next or other layers. `infrastructure` imports domain and shared only. `ui` never imports `infrastructure`.
- Modules import each other only via `@/modules/<name>` (its `index.ts`); inside a module use relative imports.
- `*.server.ts` files are imported only from `app/api`, server components and `infrastructure`.
- Enforced by `no-restricted-imports` overrides in `.eslintrc.json`. Money is integer minor units (`shared/kernel/Money`).

## Conventions

- Every user-facing string goes in both `messages/en.json` and `messages/ar.json`. Mind RTL layout for Arabic.
- Components using stores or hooks need `"use client"`.
- Auth token is httpOnly; never read it from JS. Don't add Strapi tokens to client code.

## Environment variables

`NEXT_PUBLIC_STRAPI_API_ENDPOINT`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_HOST` (media host, also used for `images.remotePatterns`), `CONTACT_SHARED_SECRET`, `WC_BASE_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` (server-only, WooCommerce BFF), `NEXT_PUBLIC_PAYMOB_API_TOKEN`, `NEXT_PUBLIC_PAYMOB_IFRAME_ID`, `NEXT_PUBLIC_PAYMOB_INTEGRATION_ID`. No `.env` is committed.

## Workflow

PRs are auto-reviewed by Claude Code (`.github/workflows/claude-code-review.yml`); `@claude` mentions are handled by `claude.yml`. Default branch is `main`.
