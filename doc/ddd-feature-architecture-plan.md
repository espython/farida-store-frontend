# Plan: feature-based, full DDD architecture (after launch)

Status: **planned, starts after launch** (Phase 11). Until launch every task keeps following the DDD-lite rules in `ddd-architecture.md`. Epic [#307](https://github.com/espython/farida-store-frontend/issues/307), tasks in section 10.

## 1. Why, and why after launch

DDD-lite (types plus pure functions in `src/modules/<context>`) was chosen to move off Strapi and MobX without slowing the migration. It works, but it leaves gaps that grow with the codebase:

- **Rules spread over functions and reducers.** Nothing stops a component or another context from building an invalid `Cart` or `Order` by hand, because the domain is plain data.
- **No ports.** Use cases call RTK Query, the BFF or browser storage directly, so they can only be tested with mocked `fetch` or a real store.
- **Cross-context reactions are ad hoc.** "Signed in → merge guest cart" and "order placed → clear cart" need a deliberate event model, not one-off listeners.
- **Legacy code outside the modules.** About 66 shared component files (`src/app/components`, `src/components`), plus `functions/`, `utils/`, `hooks/`, `services/`, `contexts/` and `api/`.

Doing this after launch keeps the migration's scope fixed. It also means real usage, not guesses, decides which features need the richer model first.

## 2. Goals and non-goals

**Goals**
- Every business capability lives in one **feature** folder (`src/features/<feature>`) with explicit domain, application, infrastructure and UI layers.
- The domain is expressed with **aggregates, entities, value objects and domain events** that protect their own invariants.
- Use cases depend on **ports** (interfaces). Infrastructure provides **adapters** (BFF/RTK Query, Woo server client, browser storage, in-memory for tests).
- Features talk to each other only through their public API and **integration events**.
- The boundaries are enforced by lint and by architecture tests in CI.

**Non-goals**
- No event sourcing, CQRS buses or message brokers. Commands and queries are plain functions and hooks.
- No change in behaviour or UI. Each task ships as a refactor, verified by the existing tests.
- No backend change: WooCommerce stays the system of record.

## 3. Target structure

```
src/
  app/                          routing only: thin pages, layouts, route handlers (controllers)
  features/
    <feature>/
      domain/
        model/                  aggregates, entities, value objects (classes, immutable)
        events.ts               domain events the aggregates raise
        ports.ts                repository / gateway interfaces the domain needs
        policies/               pure rules that span aggregates (e.g. cancellation policy)
        errors.ts               domain errors
      application/
        commands/               use cases that change state (addToCart, placeOrder)
        queries/                use cases that read (getOrder, listProducts)
        snapshots.ts            serializable shapes for Redux / RTK Query + to/from domain
        state/                  slices, selectors, listener wiring
        hooks/                  React use-case hooks for the UI (useCart, useCheckout)
      infrastructure/
        adapters/               port implementations: http (BFF/RTK Query), woo (server), storage, memory
        dto/ + mappers/         anti-corruption layer (external shapes ↔ domain)
      ui/                       components; talk to application hooks only
      index.ts                  public client API
      index.server.ts           public server API (route handlers, server components)
  shared/
    kernel/                     building blocks: Entity, AggregateRoot, ValueObject, DomainEvent, Id, Result, Money, Locale
    infrastructure/             wooClient, baseApi, event bus adapter, error mapping
    ui/                         design-system components, feedback, layout
    lib/                        framework-free helpers (formatting)
  store/                        composition root only
```

`src/modules` is renamed to `src/features`, which answers open question 4 in `ddd-architecture.md`.

## 4. Building blocks

| Block | Shape | Example |
|---|---|---|
| **Value object** | Immutable class, validated in a static `create()` that returns `Result`, equality by value | `Money`, `Quantity`, `Email`, `PhoneNumber`, `ShippingAddress`, `CouponCode`, `Locale` |
| **Entity** | Identity plus behaviour, only reachable through its aggregate | `CartLine`, `OrderLine` |
| **Aggregate root** | The consistency boundary. All changes go through its methods, which enforce invariants and record domain events | `Cart`, `Checkout`, `Order`, `Customer`, `Wishlist` |
| **Domain event** | Immutable record of something that happened, named in the past tense | `ItemAddedToCart`, `CustomerSignedIn`, `OrderPlaced` |
| **Port** | Interface in `domain/ports.ts` describing what the domain needs from outside | `CartRepository`, `AuthGateway`, `OrderRepository`, `ProductCatalog` |
| **Adapter** | Port implementation in `infrastructure/adapters/` | `LocalStorageCartRepository`, `StoreApiCartRepository`, `InMemoryCartRepository` |
| **Use case** | A function taking its ports as arguments (dependency injection by parameter, no container) | `addToCart({ carts, catalog })(command)` |
| **Domain service / policy** | A pure function for rules that span aggregates | `cancellationPolicy(order, now)` |

### Classes and Redux

Redux and RTK Query need plain, serializable data, so aggregates never go into the store. The rule:

1. Domain objects live inside use cases.
2. Each aggregate has `toSnapshot()` and a static `fromSnapshot()`; snapshots are what slices and RTK Query caches hold.
3. Hooks read snapshots through selectors. Commands load the aggregate from a snapshot (or a repository), call its methods, save it, and dispatch the new snapshot and its events.
4. A test proves every aggregate round-trips through its snapshot.

### Events

- **Domain events** are recorded by aggregates and published by the use case after the save.
- **Integration events** are the subset that other features may consume. They are exported from the feature's `index.ts`, versioned, and carry only ids and snapshots.
- The event bus is a thin adapter over the RTK listener middleware (`shared/infrastructure/eventBus.ts`). Subscribers live in the consuming feature's `application/state/`.
- Examples: `CustomerSignedIn` → the cart feature merges the guest cart. `OrderPlaced` → cart cleared, orders refetched.

### Server side

Route handlers in `app/api` become thin controllers. They parse input, call a server use case from `index.server.ts` with Woo adapters, and map the result to HTTP. Ownership checks (customer id = order owner) are domain policies, not route code.

## 5. Features (bounded contexts)

| Feature | Aggregates / key objects | Ports | Notes |
|---|---|---|---|
| **catalog** | `Product` (read model), `Category`, `Price` VO, `StockLevel` VO | `ProductCatalog` | Query side only; no aggregate behaviour needed |
| **cart** | `Cart` aggregate, `CartLine`, `Quantity`, `CouponCode` | `CartRepository` (guest storage, server Store API), `ProductCatalog` (read) | Richest client-side domain; pilot feature |
| **identity** | `Session`, `Credentials` VO, `Email` VO | `AuthGateway`, `SessionStore` | Split out of `customer`: sign-in concerns only |
| **account** | `Customer` aggregate, `ShippingAddress` VO, address book | `CustomerRepository` | Profile and addresses |
| **checkout** | `Checkout` aggregate (lines, address, method, coupon, idempotency key), `PaymentMethod` VO | `CheckoutGateway`, `PaymentGateway` | Emits `OrderPlaced` |
| **orders** | `Order` aggregate (read + cancel/return), `OrderStatus` VO, `cancellationPolicy` | `OrderRepository` | Woo status mapping in the adapter |
| **reviews** | `Review`, `Rating` VO | `ReviewRepository` | |
| **wishlist** | `Wishlist` aggregate | `WishlistRepository` (guest storage, server) | |
| **content** | `Banner`, `Ad`, `ContactMessage` | `ContentSource`, `ContactInbox` | |
| **shell** (not a domain) | UI state slice, layout | – | Sidebars, modals, toasts |

## 6. Enforcement

- **eslint-plugin-boundaries** replaces the `no-restricted-imports` overrides (answers open question 3):
  - `domain` imports only `shared/kernel`.
  - `application` imports its own domain, `shared/kernel` and ports.
  - `infrastructure` implements ports.
  - `ui` imports application and domain types only.
  - Features import each other only through `index.ts` / `index.server.ts`.
- **dependency-cruiser** in CI for rules ESLint can't express: no cycles between features, no `shared` → `features` imports.
- **Architecture tests** (Vitest) per feature:
  - every port has an in-memory adapter
  - every aggregate round-trips through its snapshot
  - public API snapshot tests catch accidental exports
- A **feature generator** (`npm run gen:feature <name>`) creates the skeleton, `index.ts`, a README and an example test.

## 7. Tests

| Level | What | Tools |
|---|---|---|
| Domain | Aggregates, value objects, policies; no mocks | Vitest |
| Application | Use cases against in-memory adapters; events published | Vitest |
| Adapter contracts | The same contract suite runs against the in-memory adapter and the real one (mocked `fetch` for HTTP, jsdom for storage); optional run against local Woo staging | Vitest |
| UI | Hooks and components with the in-memory adapters | Testing Library |
| End to end | Browse → cart → checkout (COD) → order, en and ar | Playwright (added in this epic) |

## 8. Migration strategy

Strangler, one feature per PR, no behaviour change:

1. **Foundations first:** kernel building blocks, event bus, boundaries lint, generator, architecture tests (DF1–DF3).
2. **Pilot on cart** (DF4). It's the richest client-side domain and already has the most tests. Its PR sets the pattern the rest copy, and the ADR is updated with what was learned.
3. Then identity + account, checkout, orders, catalog, wishlist + reviews, content (DF5–DF10), in that order, because each one depends on the ones before it.
4. **Cross-feature events** replace remaining direct reactions (DF11). Server controllers are thinned (DF12).
5. **Legacy sweep** (DF13): anything still in `src/app/components`, `src/components`, `functions/`, `utils/`, `hooks/`, `services/`, `contexts/`, `api/` moves into a feature or `shared/`, and those folders are deleted.

Each task is done when the feature's old files are gone, its tests pass at every level above, and the boundaries lint has no exceptions for it.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Over-engineering simple features | Catalog and content stay query-side only; an aggregate is added only where there are invariants to protect |
| Class instances leaking into Redux | Snapshot rule (section 4) plus RTK's serializability check stays on; architecture test |
| Bundle size from class-heavy domain code | Measure per PR (`next build` output); value objects stay small, no reflection or decorators |
| Long-running refactor alongside new features | One feature per PR; new features start in the full pattern from the first task after the foundations |
| Learning curve | ADR, generator, the cart pilot as the reference implementation, per-feature README |

## 10. Epic and tasks

Phase 11 epic: **Feature-based full DDD architecture (post-launch)**, #307, under the post-launch epic #274.

| Task | Issue | Title |
|---|---|---|
| DF1 | #308 | ADR and conventions: full DDD after launch, snapshot rule, naming, feature README template |
| DF2 | #309 | Shared kernel building blocks and event bus |
| DF3 | #310 | Boundaries tooling: eslint-plugin-boundaries, dependency-cruiser, architecture tests, feature generator, rename `modules` → `features` |
| DF4 | #311 | Cart feature (pilot) |
| DF5 | #312 | Identity and account features |
| DF6 | #313 | Checkout feature |
| DF7 | #314 | Orders feature |
| DF8 | #315 | Catalog feature (query side) |
| DF9 | #316 | Wishlist and reviews features |
| DF10 | #317 | Content feature (banners, ads, contact) |
| DF11 | #318 | Integration events between features |
| DF12 | #319 | Thin server controllers over server use cases |
| DF13 | #320 | Legacy sweep: shared UI and helpers into features or `shared/` |
| DF14 | #321 | Test pyramid: adapter contract suites and Playwright end-to-end |
