# Project documentation

Planning documents for moving the store from Strapi to WooCommerce and from MobX to Redux Toolkit / RTK Query.

| Doc | Purpose |
|---|---|
| [woocommerce-rtk-migration-plan.md](woocommerce-rtk-migration-plan.md) | **Master plan**: decisions, architecture, phases, endpoint mapping, store-by-store disposition, risks, progress tracker |
| [woocommerce-roadmap.md](woocommerce-roadmap.md) | Shorter epic-level roadmap, sorted by priority |
| [woocommerce-spike-checklist.md](woocommerce-spike-checklist.md) | Acceptance checks for the WooCommerce setup (payments, Arabic/English, headless API, owner admin) |
| [strapi-to-woocommerce-data-mapping.md](strapi-to-woocommerce-data-mapping.md) | Field-by-field data migration mapping and cutover outline |
| [rtk-query-migration.md](rtk-query-migration.md) | Original MobX → RTK Query plan and the architecture problems found. Strapi-specific parts are superseded by the master plan |
| [missing-features.md](missing-features.md) | Ecommerce feature gap list. Backend items are now covered by WooCommerce |

When two documents disagree, the master plan wins.
