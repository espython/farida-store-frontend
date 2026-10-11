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
- `src/app/components/` – shared UI (product cards, filters, sliders, pagination).
- `src/app/api/` – Next route handlers:
  - `strapi/[...path]` – proxy to Strapi; adds the user's JWT (from the `credentials` cookie) or falls back to `STRAPI_API_TOKEN`. Client code should call `STRAPI_ENDPOINT` (`/api/strapi`, see `src/api/config.ts`), not Strapi directly.
  - `auth/session` – sets/clears the httpOnly `credentials` JWT cookie and a readable `logged_in` cookie.
  - `contact` – contact form (uses `CONTACT_SHARED_SECRET`).
- `src/stores/` – MobX stores, instantiated and exposed through context in `src/stores/index.tsx`. Add new stores there.
- `src/services/paymobService.ts` – Paymob payment integration.
- `src/middleware.ts` – auth redirects (protects `/user*`, `/order`, `/trackorder`, `/shipping`, `/confirmation`; bounces logged-in users off login/register) then next-intl routing.
- `messages/en.json`, `messages/ar.json` – translations. Locale prefix is always present (`/en/...`, `/ar/...`); use `Link`/`useRouter` from `src/navigation.ts`, not `next/link`.

## Conventions

- Every user-facing string goes in both `messages/en.json` and `messages/ar.json`. Mind RTL layout for Arabic.
- Components using stores or hooks need `"use client"`.
- Auth token is httpOnly; never read it from JS. Don't add Strapi tokens to client code.

## Environment variables

`NEXT_PUBLIC_STRAPI_API_ENDPOINT`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_HOST`, `CONTACT_SHARED_SECRET`, `NEXT_PUBLIC_PAYMOB_API_TOKEN`, `NEXT_PUBLIC_PAYMOB_IFRAME_ID`, `NEXT_PUBLIC_PAYMOB_INTEGRATION_ID`. No `.env` is committed.

## Workflow

PRs are auto-reviewed by Claude Code (`.github/workflows/claude-code-review.yml`); `@claude` mentions are handled by `claude.yml`. Default branch is `main`.
