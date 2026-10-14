# Domain-Driven Design for the storefront

Status: **proposed, not yet implemented.** Extends `woocommerce-rtk-migration-plan.md` (section 3, target architecture).

## Why DDD here

The migration swaps the backend (Strapi → WooCommerce) and the state library (MobX → RTK Query). Without a boundary, Woo's shapes (`line_items`, `meta_data`, string prices) and RTK specifics would leak into 100+ components, and the next backend change would repeat this migration. DDD gives us that boundary:

- **Ubiquitous language:** the same words in code, issues and conversations with the store owner (Cart, Order, Coupon, Shipping address).
- **Bounded contexts:** each business area owns its types, rules and API calls, and exposes a small public surface.
- **Anti-corruption layer:** Woo DTOs are translated into our domain types in one place per context.
- **Testable rules:** pricing, coupons, cancellation and status mapping become pure functions with unit tests. Today they are spread across MobX stores and components.

This is **DDD-lite for a frontend**: types plus pure functions, no event sourcing, no repository interfaces for their own sake, no class hierarchies. If a pattern does not remove a real coupling, we do not add it.

## Bounded contexts

| Context | Owns | Upstream source (Woo) |
|---|---|---|
| **Catalog** | Product, Variant, Category, Attribute (color/size), StockStatus, Price/SalePrice, product search and filters | Products, categories, attributes (Store API / REST) |
| **Cart** | Cart, CartLine, applied Coupon, guest-vs-server cart, merge | Store API cart |
| **Checkout** | ShippingMethod, PaymentMethod (COD, Card), order notes, idempotency, payment return | Store API checkout, Paymob gateway |
| **Orders** | Order, OrderLine, OrderStatus, tracking, cancellation, return request | REST orders |
| **Customer** | Identity/session, Profile, Address book | JWT, customers |
| **Reviews** | Review, Rating, moderation state | Product reviews |
| **Wishlist** | Wishlist, WishlistItem (guest and user) | Wishlist plugin or user meta |
| **Content** | Banner, Ad, MiniAd, FastAd | Custom post type |
| **Storefront shell** (not a domain) | Layout, navigation, sidebars, modals, view style, toasts | – |
| **Shared kernel** | Money, Locale, Id types, Result/Error types, formatting, http error mapping | – |

### Context map (who may depend on whom)

```
Catalog  ◄── Cart ◄── Checkout ──► Orders
   ▲           ▲          │
   │           │          ▼
Wishlist    Customer ◄────┘ (addresses, identity)
Reviews ──► Catalog, Customer
Content (independent)
Shell ──► may use any context's public API
```

- Arrows mean "depends on the public API of". There are no cycles; Cart refers to Catalog only through a `ProductRef` (id, title, image, unit price snapshot).
- Cross-context reactions (for example *user logged in → merge guest cart*, *order placed → clear cart*) are handled with the RTK **listener middleware** reacting to the other context's public actions, not by one context importing another's internals.

## Layers inside a context

```
ui              React components, hooks used only by views        → depends on application, domain
application     RTK Query endpoints, slices, selectors, use-case hooks → depends on domain, infrastructure
infrastructure  BFF client, Woo DTOs, mappers (anti-corruption)  → depends on domain
domain          types, value objects, pure business rules         → depends on nothing
```

Dependency rule: **domain imports nothing** (no React, Redux, Next or `fetch`). Infrastructure may import domain. Application wires them. UI only talks to application and domain.

## Folder structure

```
src/
  app/                       Next routing only: thin pages/layouts that compose module UI
    [locale]/…
    api/shop/…               BFF route handlers; call modules' server-side infrastructure
  modules/
    catalog/
      domain/                Product.ts, Category.ts, StockStatus.ts, pricing.ts (+ *.test.ts)
      infrastructure/        wooProductDto.ts, productMapper.ts, catalogClient.server.ts
      application/           productsApi.ts, filtersSlice.ts, selectors.ts, useProducts.ts
      ui/                    ProductCard, ProductsSection, FiltersSection, …
      index.ts               public API of the context (only this may be imported elsewhere)
    cart/  checkout/  orders/  customer/  reviews/  wishlist/  content/
  shared/
    kernel/                  Money.ts, Locale.ts, Result.ts, AppError.ts
    infrastructure/          wooClient.server.ts (keys, timeouts), baseApi.ts, errorMapping.ts
    ui/                      feedback/ (PageSkeleton, error views), generic buttons, icons
    lib/                     formatting, hooks like useIsClient
  store/                     root composition only: makeStore(), StoreProvider, hooks
```

`src/store/` only combines what the modules export: `baseApi` plus each module's slices and listeners. Endpoints are added with `baseApi.injectEndpoints()` inside the module that owns them.

## Ubiquitous language (initial glossary)

| Term | Meaning in our code | Notes |
|---|---|---|
| **Money** | Integer minor units + currency (`{ amount: 34900, currency: "EGP" }`) | Avoids float errors and the inconsistent monetary types in issue #201. Woo decimal strings are converted in the mapper. |
| **Product / Variant** | A sellable item and its colour/size options | Replaces today's one-product-per-colour data. |
| **StockStatus** | `in_stock`, `low`, `out_of_stock` + quantity when known | |
| **Cart / CartLine** | Items the shopper intends to buy; line has a price snapshot | Guest cart and server cart share this type. |
| **Coupon** | Code + effect (percent or fixed), applied to the post-discount subtotal | Rules ported from the old backend (clamp 0–100, cap at subtotal). |
| **Order** | A placed purchase with lines, totals, addresses, status | |
| **OrderStatus** | `pending_payment`, `processing`, `out_for_delivery`, `delivered`, `cancelled`, `refunded`, `failed` | Mapping from Woo statuses lives in the Orders mapper. |
| **PaymentMethod** | `cod` or `card` | |
| **ShippingAddress** | Customer-supplied delivery address | Field names normalised (`state` vs `governorate`). |
| **Customer** | Authenticated shopper; session is never readable from JS | |

## Domain rules to extract and unit-test first

These already exist as scattered code or as backend behaviour that we are removing. Moving them into pure functions gives parity tests for free.

| Rule | Today | Target |
|---|---|---|
| Price after discount, rounding | `functions/getPriceAfterDiscount.ts` | `catalog/domain/pricing.ts` |
| Cart totals and quantity limits | `stores/cartStore.ts` | `cart/domain/cart.ts` |
| Coupon evaluation (clamp, cap, min total, expiry, max uses, zero-total card rule) | Strapi `utils/coupons.ts` | `cart/domain/coupon.ts` (client-side preview; Woo is authoritative) |
| Order cancellability (pending, failed, COD, not shipped) | Strapi `CANCELLABLE_PAYMENT_STATUSES` | `orders/domain/cancellation.ts` |
| Payment/order state interpretation | `functions/orderPaymentState.ts`, `utils/paymentValidation.ts` | `checkout/domain/paymentState.ts` |
| Checkout idempotency key | `functions/checkoutIdempotency.ts` | `checkout/domain/idempotency.ts` |
| Woo status → `OrderStatus` | – | `orders/infrastructure/statusMapper.ts` |

## Anti-corruption layer (example)

```ts
// modules/catalog/infrastructure/productMapper.ts
export const toProduct = (dto: WooProductDto, locale: Locale): Product => ({
  id: String(dto.id),
  slug: dto.slug,
  title: dto.name,
  price: Money.fromDecimal(dto.regular_price, "EGP"),
  salePrice: dto.on_sale ? Money.fromDecimal(dto.sale_price, "EGP") : null,
  stock: toStockStatus(dto.stock_status, dto.stock_quantity),
  images: dto.images.map(toImage),
  locale,
});
```

Rules: DTO types never leave `infrastructure/`. If a Woo field is missing or malformed, the mapper decides the fallback or throws an `AppError`; components never check.

## Enforcing the boundaries

- Each module exposes only `index.ts`. Other modules and `app/` import `@/modules/<name>` and nothing deeper.
- ESLint: `no-restricted-imports` (or `eslint-plugin-boundaries`) with these rules:
  1. `domain/**` may not import `react`, `react-redux`, `@reduxjs/toolkit`, `next/*`, or anything outside `domain` and `shared/kernel`.
  2. `infrastructure/**` may import `domain` and `shared` only.
  3. `ui/**` may not import `infrastructure`.
  4. Modules may not import another module's `domain`/`infrastructure`/`application`/`ui` folders directly.
  5. `*.server.ts` files may only be imported from `app/api` and server components.
- CI runs lint, so violations fail PRs.
- Domain tests (Vitest, pure functions, no DOM) are the first tests written for each context.

## Mapping from today's code

| Today | Goes to |
|---|---|
| `stores/productsStore`, `categoriesStore`, `colorsStore`, `searchBoxStore` | `modules/catalog` (application + infrastructure) |
| `stores/cartStore`, `cartSidebarStore` | `modules/cart` (UI flag stays in shell) |
| `stores/ordersStore`, `paymentStore`, `services/paymobService`, `utils/paymentValidation` | `modules/checkout` and `modules/orders` |
| `stores/userStore`, `loginFormStore`, `registerFormStore`, `userAddressesStore`, `functions/credentials`, `hooks/useAuth` | `modules/customer` |
| `stores/userWishlist`, `wishListStore` | `modules/wishlist` |
| `stores/adsStore`, `fastAdsStore` | `modules/content` |
| review code in `userStore` and product page components | `modules/reviews` |
| sidebars, modal stores, view style, filters drop | shell `uiSlice` in `src/store` |
| `app/components/*` (cards, filters, pagination, sliders) | `modules/catalog/ui` |
| `app/[locale]/(pages)/<page>/components/*` | the owning module's `ui/`, page files stay in `app/` |
| `src/components/*` (navbar, footer, icons, cart drop) | `shared/ui` or the owning module's `ui/` |
| `functions/`, `utils/` | the owning module's `domain/` or `shared/lib` |
| `components/feedback/PageSkeleton` (F2) | `shared/ui/feedback` |

## Adoption strategy (strangler, not big-bang)

1. **D1 – scaffolding:** create `modules/` and `shared/`, add the shared kernel (`Money`, `Locale`, `AppError`), the ESLint boundary rules, and move `baseApi` to `shared/infrastructure`. No behavior change.
2. **New code starts in modules.** Catalog (B2/B3), then Customer, Cart, Checkout, Orders each get their module as their epic is implemented.
3. **Legacy code moves when it is touched** by a migration task; there is no separate mass move. Remaining files (shell, shared UI) are relocated in the Phase 8 cleanup.
4. **Domain first per context:** write the pure types and rules plus tests, then the mapper, then the endpoints, then the UI.

## Impact on the existing plan

- Master plan folder structure (section 3) is superseded by this layout; `src/store/domain/` and `src/store/api/*Api.ts` become module-owned.
- **D1: Module structure, shared kernel and boundary lint rules** ([#276](https://github.com/espython/farida-store-frontend/issues/276), P1, Phase 1) is a task under the existing Foundations epic (#225) and blocks B2. No new epic: DDD is how the existing tasks are built. Each task issue carries a "Module placement" note.
- Task scopes change from "store → slice" to "context → module": B2/B3 build `modules/catalog`; A1–A4 build `modules/customer`; C1–C4 build `modules/cart` and `modules/checkout`; O1–O4 build `modules/orders`, `reviews`, `wishlist`; B5 builds `modules/content`.
- F1 stays as merged (`src/store/` root composition). `baseApi.ts` moves in D1.
- F2 (`components/feedback`) moves to `shared/ui/feedback` in D1 or Phase 8.

## Risks and trade-offs

| Risk | Mitigation |
|---|---|
| Over-engineering for a small team | DDD-lite only: pure functions and types, no abstract repositories; drop a layer folder if it would be empty |
| Folder churn and merge conflicts while 25 stores are still being migrated | Strangler approach; new code only in modules; mass relocation deferred to Phase 8 |
| Contexts too granular (Wishlist, Reviews) | They can start as folders inside Catalog/Customer and be promoted if they grow |
| Team unfamiliar with the rules | Boundary lint rules and a short CONTRIBUTING section in CLAUDE.md |
| Duplicated types between domain and DTOs | Intentional: that duplication is the anti-corruption layer |

## Open questions

1. Is a separate **Pricing/Promotions** context warranted (discounts, coupons, shipping rates), or do they stay inside Catalog and Cart?
2. Should **Wishlist** and **Reviews** be full modules from day one or sub-folders of Catalog/Customer?
3. Do we adopt `eslint-plugin-boundaries` or plain `no-restricted-imports`?
4. Is `src/modules` the preferred name, or `src/features`?
