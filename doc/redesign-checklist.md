# Kitchen Garden redesign checklist

Style B ("Kitchen Garden") from the design canvas, applied page by page. Layout rules: the spec sheet on the canvas (1280 px column, 16/32 px gutters, 4/3/2 product columns, 1:1 product images, 44 px targets, 56/72 px header).

Tick an item only when it meets **all** of the definition of done. `[~]` = colours follow the palette (token remap) but layout and components are still the old ones, or restyled in code but not yet checked in the browser (noted on the item).

## Definition of done (every item)

- [ ] Palette tokens only (`garden`, `cream`, `sand`, `line`, `saffron`); no raw hex, no leftover `mainPink` pink or NextUI `danger`/`secondary` colours
- [ ] Headings in `font-display`, body Cairo; sizes from the type scale (16/14 body, 20 price, 28/22 section, 44/28 hero)
- [ ] Inside `PageContainer` (or full-bleed on purpose); spacing from 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64
- [ ] Desktop (1440) and phone (390) checked in the browser; nothing hidden behind the phone tab bar
- [ ] English and Arabic checked; RTL mirrored with logical classes (`ms-`, `start-`, `end-`), numbers and "-15%" read correctly
- [ ] Every new string in `messages/en.json` and `messages/ar.json`
- [ ] Accessibility: real `button`/`a`/`label`, icon-only controls named, focus visible, contrast ≥ 4.5:1, targets ≥ 44 px
- [ ] Loading, empty and error states styled too
- [ ] Strapi mode still renders (default until cutover); Woo mode verified against staging
- [ ] Tests updated, `tsc`, `lint`, `verify:i18n`, both builds pass

---

## 0. Foundations

- [x] Palette tokens and legacy colour remap (`tailwind.config.js`)
- [x] Display fonts: Fraunces (Latin), El Messiri (Arabic) via `next/font` (`shared/ui/fonts.ts`)
- [x] `<html dir>` per locale, body cream background, subtle scrollbar
- [x] `PageContainer` (`shared/ui`)
- [x] `Money.toDisplay` ("3,490") for shop prices
- [x] Shared UI primitives in `shared/ui`: `Button` (primary / outline / ghost, 44 px), `Badge`, `Chip`, `SectionHeading`, `EmptyState`, `TextField` (label + error), so pages stop styling NextUI one by one
- [x] NextUI theme overrides (radius, primary colour) so Select, Checkbox, Modal, Pagination, Spinner, Breadcrumbs match without per-use classes
- [x] Toast style (`react-toastify`) in the palette, RTL position; one global `shared/ui/Toaster` (payment and payment-callback toasts were never shown before)
- [x] Swiper bullets/arrows in the palette (`--swiper-theme-color` done; check sizes)

## 1. Global chrome (every page)

- [x] `Navbar`: sticky, logo, nav links, search, icons
- [x] `NavLinks`, `NavIcons`, `NavMenuIcon`, `LanguageIcon`, `Icon`
- [x] `FullCartIcon`, `FullUserIcon`, `FullWishlistIcon`, `FullSearchIcon` (labels)
- [x] `shared/ui/BrandLogo`, `HeaderSearch`
- [x] `Cartdrop`, `CartDropProductsMenu`, `CartDropProduct`, `CartDropTotalPrice`, `EmptyCartDrop` (cart hover dropdown)
- [x] `UserDrop` (account hover dropdown)
- [x] `TopPositionedAds`, `ShowHideFastAdsButton` (announcement bar: check height 36 px, toggle button)
- [x] `SearchMenu`, `SearchBox`, `QuickSearchMenu`, `MiniSearchProduct`, `SearchBoxCommonSearches`, `catalog/ui/QuickSearch` (search overlay)
- [x] `Sidebar`, `SidebarContent`, `UserSidebarMenu`, `UserLoggedInUi` (menu drawer; one drawer for all sizes, Woo categories in Woo mode — it was empty before; `SidebarResponsiveContent` removed)
- [x] `CartSideBar`, `CartSideBarContent`, `CartSidebarHeader`, `CartSidebarProductsMenu`, `CartSidebarProduct`, `CartSidebarFooter`, `CartSidebarEmptyCart` (cart drawer)
- [x] `BottomNavigation` (phone tab bar)
- [x] `CartFloatingButton` (desktop only)
- [x] `GoTopFloatingButton` (position next to the cart button, phone clearance)
- [x] `Footer`, `shared/ui/PerksStrip`
- [x] `ConfirmMergeCart` (modal)
- [x] `LoadingOverlay`, `feedback/PageSkeleton`
- [x] Remove now-unused `IconCard`, `PaymentStatusIndicator` (no references)

## 2. Catalog building blocks

- [x] `catalog/ui/CatalogProductCard`
- [x] `catalog/ui/CatalogListing` (grid, pagination)
- [x] `catalog/ui/CategorySlider` (tiles), `HomeHero`
- [x] `catalog/ui/CategoryTitle` → `PageTitle` (heading done; breadcrumbs, alignment)
- [x] `FiltersSection`, `FilterButton`
- [x] `ProductsSection` (filter panel is now a fixed side drawer; fixes the panel clipped to the grid height)
- [x] `FilterSidebarContents`, `FilterSidebarLinks`, `catalog/ui/CategoryLinks`, `ColorsMenu`, `ColorChoice`, `catalog/ui/ColorOptions`, `PriceSlider` (filter drawer)
- [x] `ActiveFilters`, `MiniActiveFilter` (active filter chips; × deleted by translated label, so price chips and Arabic colour chips never cleared — fixed, with test)
- [x] `EmptyProducts`
- [x] `Rating` (stars in the palette; used on product page and reviews)
- [x] `ProductTypeLabel`

## 3. Pages

### Home `/`
- [x] Woo: hero, "Browse the kitchen", all products
- [~] Strapi: `MiniProducts`, `AdsSlider`, `ProductsSlider`, `SliderProduct` (palette only)
- [ ] Decide (owner): keep or drop the banner slider once B5 brings ads from Woo

### Category `/categories/[name]`
- [x] Container, title, filter bar, grid
- [x] `MiniAdsSection`, `MiniAdCard` (mini ad band)
- [x] `loading.tsx` (PageSkeleton)

### Search `/search`
- [x] Container, heading, filter bar, grid
- [x] Results heading design ("Results for “kettle”" + count), no-results state
- [x] `loading.tsx`

### Product `/product/[id]`
- [x] Layout: gallery 7 cols / buy box 5 cols, sticky buy box on desktop; phone sticky add-to-cart bar (64 px) — phone sticky bar on the Strapi page; Woo gets it with the cart (C1–C3)
- [x] Woo: `WooProductPage`, `catalog/ui/ProductGallery`, `ProductDetails`, `BestSellers`
- [~] Strapi: `ProductPageContainer`, `ImagesSection`, `ZoomedImage`, `DetailsSection`, `InformationSection`, `AddToCartButton`, `Breads`, `BestSellerMenu`, `BestProduct` — class-level restyle, NOT checked visually (mock Strapi has no products); `InformationSection` removed; best sellers showed the discounted price struck through — fixed
- [x] Price ("15,900 EGP", old price, saffron discount badge), stock line, colour options
- [x] Reviews: `ReviewsSection`, `UserReview`, `AddYourReviewSection`, `ReviewLoginCondition`, `ReviewSendedSuccesfuly` — Description tab printed "slkdslk" when empty — fixed
- [x] Trust bullets (shipping, returns, payments) as in `PerksStrip`
- [x] `loading.tsx`, unknown product state

### Cart `/cart`
- [x] `CartPageContainer`, `CartLayoutContainer`, `LayoutTabs`, `CartTab` (checkout steps) — one stepper (desktop numbered, phone "Step n of 4"); `CartTab` removed; cart renders after mount (hydration mismatch with a stored cart fixed)
- [x] `CartContent`, `ProductsTable`, `ProductsTable2`, `CartTableHeader`, `CartTableProduct`, `CartProductCard` (phone), `QuantityCounter` — 8/4 grid, row list with QuantityStepper; unused `ProductsTable` removed
- [x] `TotalPrice`, `TotalSingleCartProductPrice`, `CartFooter` (summary, prices via `Money.toDisplay`) — summary card; coupon field still has no behaviour (C3); unused `TotalSingleCartProductPrice` ($ prices) removed
- [x] `EmptyCart`, `loading.tsx`

### Shipping `/cart/shipping`
- [x] `ShippingContent`, `ShippingForm`, `CustomizedInput` (form fields), `ShippingOrderAndPrice`, `ShippingRowDetails`, `OrderedItem` — restyled (7/5 grid, labelled fields, summary card); checked with the mock user (`infra/woo-staging/mock/user-mock.mjs`); line totals were multiplied by quantity twice — fixed; shipping is a flat 100 EGP and the coupon box does nothing (C3)

### Payment `/cart/payment`
- [x] `PaymentSummary`, `PaymentIframe` (frame container) — restyled (radio cards, summary card), 37 inline en/ar strings moved to `paymentFlow`; checked with the mock user (iframe view not opened: needs Paymob keys). Totals disagree between steps: shipping step adds 100 EGP, payment adds 50 EGP + 14% tax (C3, business logic, left as is)

### Confirmation `/cart/confirmation`
- [x] `ConfirmationPageContainer`, `Thanks`, `Orderinfo`, `InfoCard`, `PaymentDetails`, `OrderAddress`, `ItemsContainer`, `NoOrder` — restyled (success card with track/continue links, 7/5 grid of white cards, `<dl>` fields, skeleton while the ownership check runs instead of a flash of "no order"), payment strings moved to messages, unused `CompletedOrderedItem` deleted; checked with the mock user
- [x] `AddressesSelections`, `UserAddressSelection`, `AddressSelectionModal` — Swiper replaced by a scrollable list of address cards, selected one marked, labels translated (were hard-coded English), close button mirrored for RTL; checked with the mock user

### Payment callback `/payment-callback`
- [~] Success / failure / pending states — one white status card (icon, display heading, actions, transaction details), 20 inline en/ar strings moved to `paymentCallback`; "View my orders" went to `/profile/orders`, which does not exist — now `/userorders`. Failed and pending checked in the browser (en/ar, desktop and phone); success needs a logged-in cart, NOT checked

### Login `/login`, Register `/register`
- [x] `LoginForm`, `RegisterForm` (fields, errors, Google button, links) — `TextField` + new `PasswordField` (real show/hide button; it was a hold-to-peek div), errors as text under the field, server error as an alert, form `onSubmit` (register's submit button also posted the form and reloaded the page), password hint now states the real rule (6+, one uppercase, one number); translated titles + `noindex`. Google button still does nothing (open decision, A2)
- [x] Two-column layout on desktop (form + brand panel), single column on phone (`AuthShell`); checked en/ar, 1440 and 390

### Account `/user`
- [ ] `UserPagesMenu`, `PageCard`

### Profile `/userprofile`
- [ ] `UserInformation`, `UserInfoCard`, `UserData`, `EditButton`, `EditProfileModal`, `ModalDataContainer`

### Addresses `/useraddresses`
- [ ] `UserAddressPageContainer`, `AddressesContainer`, `UserAddress`, `AddressCell`, `AddNewAddressModal`, `NewAddressForm`, `EmptyAddress`

### Orders `/userorders`
- [ ] `UserOrdersPageContainer`, `OrderCardsContainer`, `OrderCard`, `OrderCardInfo`, `EmptyOrders`, `loading.tsx`

### Order lookup `/order`, Order detail `/order/[id]`
- [ ] `OrderForm`
- [ ] `PageContainer` (order), `OrderItemsContainer`, `OrderItem` (`OrderItem`/`OrderItemsContainer` restyled with the confirmation step; page shell still old)

### Track order `/trackorder`, `/trackorder/[id]`
- [ ] `TrackOrderContainer`, `OrderReceived`, `OrderPaid`, `OrderShipped` (status timeline), `EmptyOrderTrack`

### Wishlist `/wishlist`
- [ ] `WishlistContent`, `WishListContainer`, `WishListSections`, `WishListItem` (reuse the product card look), `WishListFliters`, `FiltersDropMenu`, `WishListIsEmpty`, `LoginWarning`, `loading.tsx`

### Contact `/contact`
- [ ] `Welcoming`, `ComplaintForm`, `Branch`, `Map`

### System pages
- [ ] `[locale]/loading.tsx`, `[locale]/error.tsx`, `[locale]/not-found.tsx`, `app/global-error.tsx`

## 4. Strapi-only legacy (palette check only, deleted at cutover X4)

- [~] `ProductCard`, `RawProductCard`, `GridStyleView`, `RowStyleView`, `ProductsPagination`, `ProductsSlider`, `SliderProduct`, `MiniProducts`, `AdsSlider`
- [ ] Open the Strapi-mode home, category and product page once to confirm nothing is broken

## 5. Final QA

- [ ] Click through every route above in en and ar, desktop and phone
- [ ] Keyboard-only pass on header, filters, product page, cart and checkout
- [ ] Lighthouse (accessibility and SEO ≥ 90) on home, category, product
- [ ] No horizontal scroll at 360 px
- [ ] Before/after screenshots for the PR
