#!/bin/sh
# One-time setup of a fresh production or staging WordPress (doc/deploy-coolify.md, step 4).
# Run from Coolify's terminal on the wordpress container:  farida-bootstrap
# Idempotent: safe to re-run. Asks nothing secret on the command line (admin password is generated
# and printed once; store it in the password manager).
set -eu
cd /var/www/html
wp() { command wp --allow-root --path=/var/www/html "$@"; }
trap 'chown -R www-data:www-data /var/www/html/wp-content' EXIT

: "${WP_HOME:?WP_HOME is not set}"
if ! wp core is-installed 2>/dev/null; then
  : "${WP_ADMIN_EMAIL:?set WP_ADMIN_EMAIL for the first install}"
  pass="$(head -c 24 /dev/urandom | base64 | tr -d '/+=' )"
  wp core install --url="$WP_HOME" --title="Farida Stores" --admin_user=farida-admin \
    --admin_password="$pass" --admin_email="$WP_ADMIN_EMAIL" --skip-email
  echo "Admin user: farida-admin   password (shown once): $pass"
fi

wp rewrite structure '/%postname%/'
wp plugin install woocommerce jwt-authentication-for-wp-rest-api two-factor --activate
wp plugin delete akismet hello 2>/dev/null || true
wp language core install ar || true
wp option update woocommerce_currency EGP
wp option update woocommerce_default_country EG
wp option update woocommerce_price_num_decimals 2
wp option update woocommerce_cod_settings '{"enabled":"yes","title":"Cash on delivery"}' --format=json
# Search engines index the storefront, never WordPress itself.
wp option update blog_public 0

echo
echo "Next: create the Shop manager REST key (infra/wordpress/README.md, Production setup),"
echo "turn on Two Factor for every staff account, and add the product webhooks (doc/deploy-coolify.md)."
wp plugin list --fields=name,version,status
