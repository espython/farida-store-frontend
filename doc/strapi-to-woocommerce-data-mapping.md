# Strapi → WooCommerce data mapping

> **Not used (2026-10-31).** Strapi holds only test data, so there is no data migration (Phase 7 dropped, M1–M4 closed). Kept for the field mapping as reference only.

Draft for the migration, built from the Strapi schemas in `../backend-admin/src/api/*/content-types/*/schema.json`. Only the local dev `data.db` was inspected (a handful of rows, not representative), so **row counts, data quality and the real shape of production products still have to be checked** before this is final. Items marked **decide** or **verify** need an answer first.

## Conventions

- **Money:** Strapi stores `price`, `total` and `line_total` as `biginteger` in **piastres** (seed data: `34900` = 349.00 EGP). Woo stores decimal strings. Convert with `value / 100` and format with 2 decimals.
- **Legacy IDs:** store the Strapi `id` in Woo meta (`_strapi_id`) on every migrated object, so the import is re-runnable and orders can reference products.
- **Dry run first:** the importer must support a dry run that reports counts and rejects rows without writing.

## Overview

| Strapi | WooCommerce | Effort |
|---|---|---|
| products-singular (+ localizations-singular) | Products (simple or variable) + translations | High |
| product_inventory, sizes, colors (stored on `categories-singular`) | Stock quantity, variation attributes | High |
| categories-singular (as real categories) | Product categories | Medium |
| discount | Sale price + sale schedule | Low |
| coupon | Coupons | Low |
| users-permissions user | Customers (WP users) | Medium |
| user-addresses-singular | Customer billing/shipping address | Low |
| order-details-singular + order-items-signular | Orders + line items | High |
| user-payments-singular | Not migrated (see below) | None |
| reviews-singular | Product reviews (comments) | Low |
| carts, cart-items, wishlists | Not migrated, rebuilt on demand | None |
| advertises, fast-ads, mini-ads | Not in Woo (see below) | Medium |
| contact-message | Form plugin or keep a small service | Low |

## Products

Strapi `products-singular` fields:

| Strapi field | Woo target | Notes |
|---|---|---|
| `title` | `name` | Default-language product name |
| `description` | `description` (and `short_description`) | |
| `slug` | `slug` | Keep identical to preserve URLs, or set up redirects |
| `sku` | `sku` | Must be unique in Woo. **verify** uniqueness in production |
| `price` | `regular_price` | Piastres / 100 |
| `thumbnail` | `images[0]` | Download from Strapi uploads and re-upload to the media library |
| `images` | `images[1..]` | Same |
| `type` (`none`/`sale`/`deal`/`best_seller`) | Tags, or a custom taxonomy | `sale` also implies a sale price (see Discount). `best_seller` can be a tag or a meta flag used by the storefront |
| `publishedAt` (draftAndPublish) | `status` | Published → `publish`, draft → `draft` |
| `categories` | `categories` | See Categories |
| `discount` | `sale_price` + `date_on_sale_to` | See Discount |
| `reviews` | Comments of type `review` | See Reviews |
| `colors`, `sizes`, `product_inventory` | Attributes / variations / stock | See next section |

### Translations (localizations)

Today an English product row has a `locale` field and a `localizations` oneToMany of `localizations-singular` rows (`title`, `description`, `slug`, `price`, `type`, `locale`, `colors`). The dev database also has an Arabic product row whose `locale` is `ar`. So translations can exist as child rows **and** as separate products. **verify** which one production uses.

Mapping with Polylang for WooCommerce (or WPML/WCML, per the spike):

- Create one Woo product per default-language product.
- For each localization row, create the translated product in the same translation group, with that row's `title`, `description` and `slug`.
- `price` on a localization row should match the parent. **verify**; if they differ, flag them in the dry-run report rather than silently choosing one.

### Stock, colors, sizes — the unusual part

In Strapi, stock and color/size are **not** separate entities. They are rows of the `categories-singular` type, linked three ways:

- `product_inventory` (oneToOne): one category row holding `available_in_stock`.
- `colors` (manyToMany) on products: `colors-signular` rows with `name`, `hex`, `locale`.
  - **Woo target convention (B3):** colours are terms of the `pa_color` attribute. The Strapi `hex` goes in the term **description** as `#rrggbb`; the storefront reads it from there (`/api/shop/colors`). Terms without a valid hex render without a swatch colour.
- `sizes` (oneToMany): more `categories-singular` rows.
- `categories` (manyToMany): the real product categories, from the same type.

The seed script (`scripts/seed.js`) also creates **one product per color** with its own SKU (for example `SEED-TEE-001` black and `SEED-TEE-002` white, same title). Checkout decrements `available_in_stock` on the product's own inventory row.

**Decide:** how to model this in Woo.

| Option | Description | Pros | Cons |
|---|---|---|---|
| A. Simple products | One Woo simple product per Strapi product, stock quantity from `available_in_stock` | Easiest, 1:1, IDs and SKUs preserved | Color variants stay separate products on the storefront |
| B. Variable products | Group products with identical title into one variable product with a Color attribute (and Size), one variation per Strapi product | Matches how shoppers and Woo expect variants | Needs grouping rules and review; page URLs change |

Recommendation: start with **A** for the first import (lowest risk), and move to **B** after the storefront is working, if the data allows it.

To distinguish the inventory row from real categories during export, use the relation (`product_inventory`), not the row's content.

### Discount

`discount`: `name`, `discount_percent`, `active`, `expiration`, linked oneToOne to a product.

- If `active` and not expired: `sale_price = regular_price * (100 - discount_percent) / 100`, rounded to the same rule checkout uses (`Math.round`, in piastres), then `/100`.
- `date_on_sale_to = expiration`.
- Expired or inactive: no sale price.

## Categories

Real product categories come from `categories-singular` rows reached through `product.categories`, with translations in `localizations-categories-signular` (`name`, `locale`).

- Create Woo product categories from the default-language rows, then add translated names in the multilingual plugin.
- Rows used only as inventory or colors/sizes (via `product_inventory`, `colors`, `sizes`) are **not** categories. **verify** by cross-checking relations (`scripts/verify-relations.js` may help).
- `thumbnail` becomes the category image.
- `hex`, `value`, `available_in_stock` are ignored for real categories.

## Customers

Strapi user (`up_users`): `username`, `email`, `password` (bcrypt), `confirmed`, `blocked`, `first_name`, `last_name`.

| Strapi | Woo / WordPress |
|---|---|
| `email` | `user_email` and `billing_email` |
| `username` | `user_login` |
| `first_name`, `last_name` | `first_name`, `last_name` |
| `confirmed = false` | Customer created, verification email re-sent (or confirm all) |
| `blocked = true` | Not imported, or imported with a blocked role. **decide** |
| `password` | **verify** in the spike whether the bcrypt hash can be imported directly. If not, import without a password and send a "set your password" email |
| `provider = google` | Link by email; the Google login plugin must match the existing user. **verify** |

Role: `customer`.

### Addresses

`user-addresses-singular` (`street`, `city`, `state`, `country`, `postal_code`, `phone`, `second_phone`). Woo holds one billing and one shipping address per customer natively.

- Most recent (or default) address → billing + shipping.
- Additional addresses → keep as customer meta, or use a multiple-addresses plugin if the storefront address book must stay. **decide**
- `second_phone` → meta (`_second_phone`).

## Orders

Order header (`order-details-singular`):

| Strapi | Woo order |
|---|---|
| `id` | meta `_strapi_id` |
| `user` | `customer_id` |
| `total` | `total` (piastres / 100) |
| `subtotal` | line items sum; check against `total + coupon_discount` |
| `coupon_code` | coupon line |
| `coupon_discount` | `discount_total` |
| `state`, `country`, `city`, `street`, `postal_code` | billing and shipping address fields |
| `phone`, `second_phone` | `billing.phone`, meta `_second_phone` |
| `order_notes` | `customer_note` |
| `payment_transaction_id` | `transaction_id` |
| `paymob_order_id` | meta `_paymob_order_id` |
| `paid_at` | `date_paid` |
| `createdAt` | `date_created` |
| `arrivedAt` | `date_completed` |
| `cancelled_at` | meta, plus a note |
| `idempotency_key` | not migrated (history only) |

### Status mapping

Strapi has two separate fields, Woo has one status plus `date_paid`.

| `status` | `payment_status` | Woo status |
|---|---|---|
| `placed` | `pending` | `pending` |
| `placed` | `cod` | `processing` |
| `placed` | `paid` | `processing` |
| `delivery` | any | custom `wc-out-for-delivery` (register it), or `on-hold` as a fallback |
| `arrived` | `paid` / `cod` | `completed` |
| `cancelled` | any | `cancelled` |
| any | `failed` | `failed` |
| any | `refunded` | `refunded` |

Payment method: `payment_status = cod` → `cod`; otherwise `paymob` (Paymob gateway ID, per the spike). Orders imported this way must **not** trigger emails or stock changes.

### Line items (`order-items-signular`)

| Strapi | Woo line item |
|---|---|
| `product_title` | `name` (snapshot, do not read from the product) |
| `product_sku` | meta `_sku` |
| `product` | `product_id` (look up by `_strapi_id`; may be deleted, then leave unset) |
| `quantity` | `quantity` |
| `unit_price` | `price` |
| `line_total` | `subtotal` (pre-coupon, as in Strapi) |
| `discount_amount` | `subtotal - total` |
| `tax_amount` | `total_tax` (currently always 0) |

Import with stock reduction disabled, so historic orders don't change stock. Set stock from the product import instead.

### Payments (`user-payments-singular`)

`provider_token`, `last_four`, `card_brand`, expiry. **Do not migrate saved payment tokens**; they belong to the Paymob integration and would not be valid in a new plugin. Keep `last_four` and `card_brand` only as order meta if wanted. **verify** whether any rows in production hold real tokens, and protect or delete that data.

## Reviews

`reviews-singular`: `rating`, `description`, `allowed`, `product`, `user`.

- Create a WP comment of type `review` on the product.
- `rating` → `rating` comment meta.
- `description` → comment content.
- `user` → comment author (user ID, name and email).
- `allowed = true` → approved, otherwise held for moderation.
- Verified-buyer badge: Woo computes this from orders, so import orders first.
- Recalculate each product's average rating after import.

## Coupons

| Strapi `coupon` | Woo coupon |
|---|---|
| `code` | `code` (lowercased by Woo) |
| `type = percent` | `discount_type = percent` |
| `type = fixed` | `discount_type = fixed_cart`; value piastres / 100 (**verify** units for `fixed`) |
| `value` | `amount` |
| `active = false` | `status = draft` |
| `expiration` | `date_expires` |
| `min_order_total` | `minimum_amount` (piastres / 100) |
| `max_uses` | `usage_limit` |
| `uses_count` | `usage_count` |

Difference to check: Strapi takes the coupon off the **post-product-discount** subtotal. In Woo, set "exclude sale items" or test totals so both systems agree. Other Strapi rules to reproduce or consciously drop (`utils/coupons.ts`): percent is clamped to 0–100; a fixed coupon is capped at the subtotal; and a coupon that would bring a **card** order to zero is rejected ("cannot be used with card payment"), because Paymob cannot charge 0. Woo allows zero-total orders, so decide whether a free order is acceptable.

## Not migrated

- **Carts, cart items:** short-lived. The guest cart lives in `sessionStorage`; the server cart is rebuilt from the Store API. Accept losing server carts at cutover, and announce it.
- **Wishlists:** a wishlist plugin (for example YITH Wishlist or TI Wishlist) can be added. If the data matters, migrate `wishlist-items` to that plugin's tables or keep the storefront wishlist client-side. **decide**
- **Ads (`advertises`, `fast-ads`, `mini-ads`):** Woo has no equivalent. Options: keep these in a small Strapi (or JSON file) just for banners, use WordPress custom post types or ACF options pages, or a banner plugin. The text fields are per-locale strings and a media thumbnail, so a custom post type fits. **decide**
- **contact-message:** the frontend already posts to its own `/api/contact` route. Keep that, or use Contact Form 7 / WPForms in Woo.

## Media

1. Export all uploaded files from the Strapi `public/uploads` folder (or the configured provider).
2. Upload through the WordPress REST API (`/wp/v2/media`) or WP-CLI `media import`.
3. Keep a map `old_url → new_media_id`, so product and category images can be linked.
4. Check large originals and image formats (WebP), and set up thumbnail regeneration.

## URL continuity

- Existing storefront URLs follow `/{locale}/product/{id}` and `/{locale}/categories/{name}` (Strapi numeric ID). If the Next.js routes keep numeric IDs, the importer must preserve them in meta, and the storefront must resolve by `_strapi_id`. Better: switch to slug-based routes and add redirects from old IDs. **decide** with the SEO work.

## Import order

1. Media
2. Categories (and translations)
3. Products + stock (and translations), then sale prices
4. Customers + addresses
5. Coupons
6. Orders + line items (no emails, no stock changes), then refunds
7. Reviews
8. Recalculate: ratings, product counts, lookup tables (run the Woo "regenerate product lookup tables" tool)
9. Verify (below)

## Verification after import

- [ ] Counts match, per type, with the dry-run report (products, translations, categories, customers, orders, items, reviews, coupons).
- [ ] Sum of order totals by month matches Strapi.
- [ ] 20 random orders compared field by field, including coupon and refund cases.
- [ ] 20 random products compared: price, sale price, stock, images, both languages.
- [ ] Customers: one test login, one reset-password flow, one Google login.
- [ ] No migrated order sent an email or changed stock.
- [ ] Storefront pages load from Woo on staging for both `/en` and `/ar`.

## Cutover outline

1. Freeze: stop writes in Strapi (maintenance mode) for the final delta window.
2. Final import of orders, customers and stock changes since the dry run (delta by `updatedAt`).
3. Switch the storefront env to Woo; keep Strapi read-only for rollback for a defined period.
4. Redirect old URLs, submit the sitemap, and monitor errors and checkout for the first days.
5. Rollback plan: repoint to Strapi, then replay Woo orders created during the window into Strapi manually. Define who does this before cutover.

## Open questions

1. Are translations stored as `localizations` child rows, separate `locale` products, or both in production?
2. Do color variants exist as separate products in production (as the seed data suggests)?
3. Which rows of `categories-singular` are real categories vs inventory, colors, or sizes?
4. Are `user-payments` tokens present in production data, and what should happen to them?
5. How many users, orders and products are there in production, and how many registered through Google?
6. Does the store owner need the wishlist and the address book as they work today?
7. Are ads (`advertises`, `fast-ads`, `mini-ads`) edited often by the owner?
