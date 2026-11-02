# WordPress add-ons for the Farida storefront

Files here are deployed to **every** WordPress that serves the storefront (staging and production). The local stack in `../woo-staging` installs them from `setup.sh`.

| File | Install to | What it does |
|---|---|---|
| `mu-plugins/farida-content.php` | `wp-content/mu-plugins/` | **Promotions** (W7 #232): one admin list for the home hero banners, the announcement bar and the category mini-ads. Each promotion has a placement, a language (both / English / Arabic), an optional link (a storefront path or an `https://` address) and, for banners, a featured image (16:9, JPEG/PNG/WebP). Order = "Order" under Page Attributes. The storefront reads `GET /wp-json/farida/v1/promos?lang=en\|ar` (published only; not on `wp/v2`). |
| `mu-plugins/farida-contact.php` | `wp-content/mu-plugins/` | **Contact messages** (B7 #304): the storefront's contact form messages, in the admin (read-only, newest first, with a mailto link). The storefront server posts them to `POST /wp-json/farida/v1/contact`. **Needs** `define( 'FARIDA_CONTACT_SECRET', '…' );` in `wp-config.php`, equal to the storefront's `CONTACT_SHARED_SECRET` (at least 16 characters); without it every message is refused. Email to the owner comes with the mail service (W6 #231). |

Must-use plugins load automatically and cannot be switched off from the admin. No other plugin is needed (no ACF, no Polylang).

Still in `../woo-staging/setup.sh` and needed on production too: the **Out for delivery** order status (`farida-order-statuses.php`) and `farida-hardening.php`. The `local-*` mu-plugins there are for the local stack only.
