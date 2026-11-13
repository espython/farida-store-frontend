# WordPress add-ons for the Farida storefront

Files here are deployed to **every** WordPress that serves the storefront (staging and production). The local stack in `../woo-staging` installs them from `setup.sh`; the hosted WordPress image (`../production/wordpress`, `doc/deploy-coolify.md`) bakes them in and reinstalls them on every deploy.

| File | Install to | What it does |
|---|---|---|
| `mu-plugins/farida-hardening.php` | `wp-content/mu-plugins/` | **Hardening** (W8 #233): `wp/v2/users` only answers `/users/me` (the storefront's session check) to anyone who cannot list users; author archives and `?author=N` give 404 and oEmbed carries no author (both revealed login names); XML-RPC and application passwords are off; after 10 wrong passwords in 15 minutes an account refuses every sign-in (wp-login and the JWT token route) for the rest of the 15 minutes. Checked by `infra/woo-staging/spike-hardening.mjs`. |
| `mu-plugins/farida-order-statuses.php` | `wp-content/mu-plugins/` | **Order statuses** (O1 #252, O2 #253): **Out for delivery** (between Processing and Completed, with a bulk action; the owner sets it when the courier leaves, the storefront's tracking shows it) and **Return requested** (after Completed; set by the storefront when a customer asks to return a delivered order within 14 days, with the reason in a private order note). The owner refunds a return (Refunded; restock the items in the refund) or declines it (back to Completed). REST statuses `out-for-delivery`, `return-requested`. |
| `mu-plugins/farida-account.php` | `wp-content/mu-plugins/` | **Password reset** (A2 #243, W5 #230): `POST /wp-json/wc-farida/v1/password/forgot` emails a customer a reset link to the storefront (1 hour, single use; same answer for unknown emails; at most one email a minute per account; staff accounts are never reset here) and `…/password/reset` sets the new password. No settings: the storefront calls them with its WooCommerce REST keys (the `wc-` namespace lets Woo authenticate them; the key's user needs `manage_woocommerce`). Also signs out every JWT issued before a password change, and confirms emails (`…/email/send`, `…/email/verify`: a 48-hour link, at most one a minute; a reminder only, nothing is blocked; changing the email clears it; Users > All Users shows an **Email verified** column), and signs in Google users (`…/google/login`, called by the storefront after it checked Google's token: linked customer, else the customer with that email, else a new one; staff refused; issues the JWT plugin's own token, so it needs `JWT_AUTH_SECRET_KEY` like the plugin). Email goes through `wp_mail`, so production needs the mail service (W6 #231). |
| `mu-plugins/farida-content.php` | `wp-content/mu-plugins/` | **Promotions** (W7 #232): one admin list for the home hero banners, the announcement bar and the category mini-ads. Each promotion has a placement, a language (both / English / Arabic), an optional link (a storefront path or an `https://` address) and, for banners, a featured image (16:9, JPEG/PNG/WebP). Order = "Order" under Page Attributes. The storefront reads `GET /wp-json/farida/v1/promos?lang=en\|ar` (published only; not on `wp/v2`). |
| `mu-plugins/farida-contact.php` | `wp-content/mu-plugins/` | **Contact messages** (B7 #304): the storefront's contact form messages, in the admin (read-only, newest first, with a mailto link). The storefront server posts them to `POST /wp-json/farida/v1/contact`. **Needs** `define( 'FARIDA_CONTACT_SECRET', '…' );` in `wp-config.php`, equal to the storefront's `CONTACT_SHARED_SECRET` (at least 16 characters); without it every message is refused. Email to the owner comes with the mail service (W6 #231). |

Must-use plugins load automatically and cannot be switched off from the admin. No other plugin is needed (no ACF, no Polylang).

The `local-*` mu-plugins written by `../woo-staging/setup.sh` are for the local stack only.

## Production setup (W8 #233)

**The storefront's REST key.** Never use an administrator's key.

1. Users > Add New: username `farida-storefront`, a real mailbox the owner reads, role **Shop manager**, a long random password (it is never used to sign in; keep it in the password manager anyway).
2. Sign in as that user (or, as admin, WooCommerce > Settings > Advanced > REST API > Add key and pick the user `farida-storefront`), description `storefront`, permissions **Read/Write**.
3. Put the consumer key and secret in the storefront host's environment as `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` and in the password manager. Nowhere else: not in the repository, chat, email or tickets.
4. If a key leaks: revoke it in the same screen, create a new one, update the host and redeploy.

A shop manager can run the shop (orders, customers, products, reviews) but not install plugins, change settings or manage staff. Woo only shows customer meta to administrators; `farida-account.php` adds back the storefront's own two keys (address book, wishlist) for shop managers.

**Admin accounts.** Before launch, each staff account gets two-factor sign-in, e.g. the **Two Factor** plugin from WordPress.org (authenticator app). The login limit above also covers `wp-login.php`. Keep staff accounts few, named per person, and never shared.
