# Kitchen Garden redesign checklist

Style B ("Kitchen Garden") from the design canvas, applied page by page. Layout rules: the spec sheet on the canvas (1280 px column, 16/32 px gutters, 4/3/2 product columns, 1:1 product images, 44 px targets, 56/72 px header).

Tick an item only when it meets **all** of the definition of done. `[~]` = colours follow the palette (token remap) but layout and components are still the old ones.

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
- [~] `catalog/ui/CategoryTitle` → `PageTitle` (heading done; breadcrumbs, alignment)
- [x] `FiltersSection`, `FilterButton`
- [~] `ProductsSection` (filter drawer backdrop and slide-in)
- [ ] `FilterSidebarContents`, `FilterSidebarLinks`, `catalog/ui/CategoryLinks`, `ColorsMenu`, `ColorChoice`, `catalog/ui/ColorOptions`, `PriceSlider` (filter drawer)
- [ ] `ActiveFilters`, `MiniActiveFilter` (active filter chips)
- [ ] `EmptyProducts`
- [ ] `Rating` (stars in the palette; used on product page and reviews)
- [ ] `ProductTypeLabel`

## 3. Pages

### Home `/`
- [x] Woo: hero, "Browse the kitchen", all products
- [~] Strapi: `MiniProducts`, `AdsSlider`, `ProductsSlider`, `SliderProduct` (palette only)
- [ ] Decide: keep or drop the banner slider once B5 brings ads from Woo

### Category `/categories/[name]`
- [x] Container, title, filter bar, grid
- [ ] `MiniAdsSection`, `MiniAdCard` (mini ad band)
- [ ] `loading.tsx`

### Search `/search`
- [x] Container, heading, filter bar, grid
- [ ] Results heading design ("Results for “kettle”" + count), no-results state
- [ ] `loading.tsx`

### Product `/product/[id]`
- [ ] Layout: gallery 7 cols / buy box 5 cols, sticky buy box on desktop; phone sticky add-to-cart bar (64 px)
- [ ] Woo: `WooProductPage`, `catalog/ui/ProductGallery`, `ProductDetails`, `BestSellers`
- [ ] Strapi: `ProductPageContainer`, `ImagesSection`, `ZoomedImage`, `DetailsSection`, `InformationSection`, `AddToCartButton`, `Breads`, `BestSellerMenu`, `BestProduct`
- [ ] Price ("15,900 EGP", old price, saffron discount badge), stock line, colour options
- [ ] Reviews: `ReviewsSection`, `UserReview`, `AddYourReviewSection`, `ReviewLoginCondition`, `ReviewSendedSuccesfuly`
- [ ] Trust bullets (shipping, returns, payments) as in `PerksStrip`
- [ ] `loading.tsx`, unknown product state

### Cart `/cart`
- [ ] `CartPageContainer`, `CartLayoutContainer`, `LayoutTabs`, `CartTab` (checkout steps)
- [ ] `CartContent`, `ProductsTable`, `ProductsTable2`, `CartTableHeader`, `CartTableProduct`, `CartProductCard` (phone), `QuantityCounter`
- [ ] `TotalPrice`, `TotalSingleCartProductPrice`, `CartFooter` (summary, prices via `Money.toDisplay`)
- [ ] `EmptyCart`, `loading.tsx`

### Shipping `/cart/shipping`
- [ ] `ShippingContent`, `ShippingForm`, `CustomizedInput` (form fields), `ShippingOrderAndPrice`, `ShippingRowDetails`, `OrderedItem`

### Payment `/cart/payment`
- [ ] `PaymentSummary`, `PaymentIframe` (frame container)

### Confirmation `/cart/confirmation`
- [ ] `ConfirmationPageContainer`, `Thanks`, `Orderinfo`, `InfoCard`, `PaymentDetails`, `OrderAddress`, `ItemsContainer`, `CompletedOrderedItem`, `NoOrder`
- [ ] `AddressesSelections`, `UserAddressSelection`, `AddressSelectionModal`

### Payment callback `/payment-callback`
- [ ] Success / failure / pending states

### Login `/login`, Register `/register`
- [ ] `LoginForm`, `RegisterForm` (fields, errors, Google button, links)
- [ ] Two-column layout on desktop (form + brand panel), single column on phone

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
- [ ] `PageContainer` (order), `OrderItemsContainer`, `OrderItem`

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
