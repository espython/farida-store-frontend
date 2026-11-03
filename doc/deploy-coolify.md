# Deploying on Contabo with Coolify (W1 #226)

Decision (2026-11-03): one Contabo Cloud VPS per environment, managed by a self-hosted [Coolify](https://coolify.io), with Cloudflare in front. No extra Nginx: Coolify's own proxy (Traefik) terminates HTTPS (Let's Encrypt) and routes the domains.

```
visitor ── Cloudflare (CDN, DDoS, TLS) ── Contabo VPS ── Traefik (Coolify proxy)
                                                          ├── shop.example.com      → storefront :3000  (Next, 1 instance)
                                                          └── admin.example.com     → wordpress  :80    (WooCommerce)
                                                                                       db (MariaDB, internal only)
                                                                                       backup (restic → off-site S3, nightly)
```

Everything is in `infra/production/docker-compose.yml`: one Coolify application per environment (production, staging), built from this repository.

## Constraints

- **One storefront instance.** Checkout idempotency, the order/address/wishlist locks and the rate limits are in memory (`src/app/api/...`). Never raise replicas or put a load balancer across two storefronts until those move to a shared store (Redis).
- **Build-time variables.** `WC_BASE_URL`, `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are baked into the build (browser bundle, image host allow-list). Changing one needs a redeploy, not just a restart.
- **Mail never leaves from the VPS.** Use a transactional provider over SMTP (W6 #231). Until then password reset and email confirmation do not reach customers.

## 1. Servers

- Production: Contabo **Cloud VPS 20** or larger (6 vCPU, 12 GB RAM), Ubuntu 24.04, region EU (Germany) — the nearest to Egypt.
- Staging: a smaller VPS added to the same Coolify as a remote server, or (lower budget) a second Coolify application on the production server. A separate server is safer: a staging mistake cannot take the shop down.

Harden each server before installing anything:

1. SSH keys only (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`), a non-root sudo user.
2. Firewall: allow 22 (ideally from your IPs only), 80 and 443. Coolify's dashboard (port 8000) only until it has its own domain, then close 8000.
3. Behind Cloudflare, allow 80/443 **only from [Cloudflare's IP ranges](https://www.cloudflare.com/ips/)**, and set `CLIENT_IP_HEADER=cf-connecting-ip`. Without the firewall, someone reaching the server directly could fake that header and dodge the login limits.
4. Docker publishes ports past `ufw`. That is why nothing in the compose file publishes a port; keep it that way (MariaDB is reachable only inside the stack).
5. `unattended-upgrades` on.

## 2. Coolify

1. Install: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash`.
2. Open `http://<ip>:8000`, create the admin account at once, turn on 2FA, set the instance domain (e.g. `coolify.example.com`), then close port 8000.
3. Sources: connect the GitHub repository (GitHub App, read-only).

## 3. The application

New Resource → Docker Compose → this repository, branch `main` (staging: the branch you test), **Docker Compose location** `/infra/production/docker-compose.yml`.

Domains (in the resource's service settings):

| Service | Domain | Port |
|---|---|---|
| storefront | `https://shop.example.com` | 3000 |
| wordpress | `https://admin.example.com` | 80 |
| db, backup | none | — |

Environment variables (Coolify → Environment Variables). Generate secrets with `openssl rand -base64 33`; keep every value in the password manager and nowhere else.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://shop.example.com` |
| `WC_BASE_URL` | `https://admin.example.com` |
| `WP_HOME` | `https://admin.example.com` (same as `WC_BASE_URL`) |
| `WP_ADMIN_EMAIL` | the owner's mailbox (first install only) |
| `WP_ENVIRONMENT_TYPE` | `production` or `staging` |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` | random |
| `JWT_AUTH_SECRET_KEY` | random (changing it signs every customer out) |
| `CONTACT_SHARED_SECRET` | random, 16+ characters (feeds both the storefront and WordPress's `FARIDA_CONTACT_SECRET`) |
| `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` | the Shop manager key, step 4 |
| `WC_WEBHOOK_SECRET` | random, step 4 |
| `CLIENT_IP_HEADER` | `cf-connecting-ip` behind Cloudflare (step 1.3), else empty |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | empty until Google sign-in is configured |
| `RESTIC_REPOSITORY` | e.g. `s3:https://s3.eu-central-003.backblazeb2.com/farida-backups/production` |
| `RESTIC_PASSWORD` | random — **without it the backups cannot be read**; store it outside the server |
| `BACKUP_S3_KEY_ID`, `BACKUP_S3_SECRET` | an application key limited to that bucket |
| `BACKUP_PING_URL` | optional, a [healthchecks.io](https://healthchecks.io) check URL (alerts when a night is missed) |
| `BACKUP_CRON`, `TZ` | defaults `30 1 * * *`, `Africa/Cairo` |

The first deploy needs `WC_CONSUMER_KEY`/`SECRET` set to anything (e.g. `pending`) so WordPress can come up; set the real key after step 4 and redeploy.

## 4. First-time WordPress setup

In Coolify, open the **wordpress** container's terminal:

```sh
farida-bootstrap
```

It installs WordPress (prints the `farida-admin` password once), WooCommerce, the JWT plugin and Two Factor, Arabic, EGP / Egypt / cash on delivery, and stops search engines from indexing WordPress itself. The Farida mu-plugins (`infra/wordpress/mu-plugins`) are part of the image and reinstalled on every deploy; there is nothing to copy.

Then, in wp-admin:

1. **Two Factor** for every staff account (Users → Profile).
2. **Storefront key:** `infra/wordpress/README.md` → Production setup (Shop manager user, Read/Write key). Put it in `WC_CONSUMER_KEY`/`WC_CONSUMER_SECRET`, redeploy.
3. **Webhooks** (WooCommerce → Settings → Advanced → Webhooks), four of them: topics *Product created*, *Product updated*, *Product deleted*, *Product restored*; delivery URL `https://shop.example.com/api/revalidate`; secret = `WC_WEBHOOK_SECRET`; status Active.
4. Store setup (W2 #227): shipping zones and rates per governorate, tax, the postcode rule.
5. **Mail** (W6 #231): an SMTP plugin with the provider's credentials; send a password reset to yourself to check.
6. Optional: restrict `admin.example.com/wp-admin` with Cloudflare Access or an IP allow-list (the storefront only uses `/wp-json`).

## 5. Cloudflare

- DNS: `shop`, `admin` (and `coolify`) as proxied A records to the VPS.
- SSL/TLS mode **Full (strict)** (Let's Encrypt certificates are on the origin).
- Cache rule: bypass cache for `/api/*` and `admin.example.com/*` except `/wp-content/uploads/*`. Next's own `Cache-Control` headers handle the rest.

## 6. Backups and restore

The **backup** service runs nightly: a consistent MariaDB dump plus `wp-content` (uploads, plugins, languages) into an encrypted restic repository in an off-site S3 bucket, keeping 14 daily, 8 weekly and 6 monthly snapshots, then `restic check`. Coolify itself backs up neither, and Contabo snapshots stay in the same data center.

From the **backup** container's terminal:

```sh
backup.sh                 # run one now (do it after setup)
restic snapshots          # list
restore.sh latest --yes   # put a snapshot back over the live site (database + wp-content)
```

**Restore drill (W1 acceptance, before launch, then every quarter):** on staging, add a test product, run `backup.sh`, delete the product and an uploaded image, `restore.sh latest --yes`, redeploy the wordpress service, check that both are back. Record the date in #226.

For a full server loss: new VPS → Coolify → same application and variables → deploy → `restore.sh latest --yes` → redeploy.

## 7. Deploying changes

- Merging to `main` redeploys production (Coolify webhook, or press Deploy). Staging follows its branch.
- A deploy rebuilds the storefront image and restarts it (a few seconds of downtime on one instance; customers' carts are in their browser or in Woo).
- WordPress, plugin and theme updates: from wp-admin on staging first, then production. Core minor updates are automatic.
- Logs: Coolify → the resource → Logs; the storefront logs to stdout.

## 8. Checklist (W1 #226)

- [ ] Production and staging reachable over HTTPS (storefront + admin)
- [ ] Origin firewalled to Cloudflare, `CLIENT_IP_HEADER` set
- [ ] Coolify and every staff account with 2FA
- [ ] Shop manager key in place, webhooks active (a product edit shows on the storefront within a minute)
- [ ] First backup in the bucket, restore drill passed (date: ____)
- [ ] `RESTIC_PASSWORD` and all secrets in the password manager
- [ ] Technical owner named: ____
