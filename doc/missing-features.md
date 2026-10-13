# Missing Ecommerce Features

Gap analysis of the storefront against a typical ecommerce web app.

**Method:** grepped `src/` and `messages/` for each feature (2026-10-13). "Missing" means no frontend code was found. Several items may already exist in the Strapi backend (`../backend-admin`), which was not reviewed. Items marked **verify** need a check of the backend or checkout code before work starts.

## Already implemented

- Catalog, categories, filters (price, color), sorting, search, ads/banners
- Product reviews and ratings
- Wishlist (guest + user), cart (guest + user, with merge)
- Shipping address book, checkout, card payment (Paymob), order history and tracking
- Login, register, Google login, contact form
- English + Arabic with RTL

## Priority 1 – Launch blockers

| # | Feature | Notes |
|---|---------|-------|
| 1 | Forgot / reset password | No flow exists; users who forget their password are locked out. Strapi supports `forgot-password` / `reset-password` endpoints. |
| 2 | Email verification on signup | No email confirmation handling. |
| 3 | Transactional emails | Order confirmation, shipped, password reset. Likely backend work (Strapi email provider) plus triggers. **verify** |
| 4 | Order cancellation | Only a translation string exists; no UI or API call. |
| 5 | Returns / refund requests | No flow. High-value products make this important. |
| 6 | Legal and policy pages | Privacy policy, terms, shipping policy, return policy, FAQ. |
| 7 | SEO basics | No `sitemap.xml`, `robots.txt`, `generateMetadata` per page, or Product JSON-LD. See the architecture review (pages are client-rendered). |
| 8 | `error.tsx` / `loading.tsx` | None exist anywhere under `src/app`. A failed fetch gives a blank page. |

## Priority 2 – Strongly expected

| # | Feature | Notes |
|---|---------|-------|
| 9 | Coupons / promo codes | Only a translation key; no input in cart or checkout. Needs backend support. **verify** |
| 10 | Stock handling | Stock fields are referenced in product components; no low-stock warning found. Confirm stock is validated at checkout and on the server. **verify** |
| 11 | Cash on delivery | Only card payment (Paymob) confirmed in checkout. COD is dominant in the Egyptian market. **verify** |
| 12 | Analytics and conversion tracking | No GA4, Meta Pixel, or purchase events. |
| 13 | Related / recommended products | Not on the product page. |
| 14 | Recently viewed products | Not found. |
| 15 | Shipping cost calculation | Cost by governorate/city and delivery estimate. Confirm whether it is more than a flat rate. **verify** |
| 16 | Invoices / receipts | Downloadable or printable invoice on order pages. |

## Priority 3 – Nice to have

- Newsletter signup
- Product comparison
- Back-in-stock notifications
- WhatsApp order / support button
- Social sharing on product pages
- Cookie consent banner
- Product Q&A
- Loyalty program / points
- PWA and push notifications

## Admin side (check `../backend-admin`)

- Order management and status updates
- Inventory management
- Coupon management
- Sales dashboard and reports

## Suggested order

1. Password reset, legal pages, `error.tsx` / `loading.tsx`
2. Order cancel and return requests, then transactional emails
3. Coupons, stock validation at checkout, COD if missing
4. SEO and analytics
5. Related products, recently viewed, shipping calculator

## Related findings (not features, from the architecture review)

- The Strapi proxy (`src/app/api/strapi/[...path]/route.ts`) attaches `STRAPI_API_TOKEN` to any anonymous request on any path. Add a path/method allowlist.
- Catalog pages are client-rendered through MobX stores; move catalog reads to server components with ISR.
- `bash.exe.stackdump` is committed in the repo root.
- CLAUDE.md lists `NEXT_PUBLIC_PAYMOB_API_TOKEN` and `NEXT_PUBLIC_PAYMOB_INTEGRATION_ID`, which the code says must not be public.
