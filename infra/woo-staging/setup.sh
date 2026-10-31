#!/bin/sh
# Runs inside the wpcli container. Idempotent: safe to re-run.
set -eu
URL="${WP_URL:-http://localhost:8080}"


if ! wp core is-installed 2>/dev/null; then
  wp core install --url="$URL" --title="Farida Stores (staging)" \
    --admin_user=admin --admin_password=admin --admin_email=admin@example.com --skip-email
fi

wp rewrite structure '/%postname%/'
wp plugin install woocommerce --activate
wp plugin install polylang --activate
wp plugin install jwt-authentication-for-wp-rest-api --activate
# The JWT plugin issues no tokens without a signing secret (A1). Random per
# staging install, kept in wp-config only; --quiet so it is not echoed.
if ! wp config has JWT_AUTH_SECRET_KEY 2>/dev/null; then
  wp config set JWT_AUTH_SECRET_KEY "$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')" --type=constant --quiet
fi

# Paymob: try the wp.org plugin; the spike records whether it fits our account.
wp plugin install paymob-for-woocommerce --activate || echo "WARN: Paymob plugin not installed from wp.org; install manually and record it."

# Local only: Woo accepts consumer-key auth over HTTPS only. Pretend REST calls are HTTPS
# (not the browser admin, so cookies keep working). Never do this on a real host.
mkdir -p wp-content/mu-plugins
cat > wp-content/mu-plugins/local-rest-https.php <<'PHP'
<?php
if ( isset( $_SERVER['REQUEST_URI'] ) && false !== strpos( $_SERVER['REQUEST_URI'], '/wp-json/' ) ) {
	$_SERVER['HTTPS'] = 'on';
	// Media is still served over plain http locally; keep image URLs loadable.
	add_filter( 'wp_get_attachment_url', function ( $url ) {
		return set_url_scheme( $url, 'http' );
	}, PHP_INT_MAX );
}
PHP

# Local only: WordPress refuses to send webhooks to private hosts and non-standard ports.
# Let Woo deliver to the Next dev server on the Docker host (create-webhooks.sh).
cat > wp-content/mu-plugins/local-webhooks.php <<'PHP'
<?php
add_filter( 'http_request_host_is_external', function ( $external, $host ) {
	return $external || 'host.docker.internal' === $host;
}, 10, 2 );
add_filter( 'http_allowed_safe_ports', function ( $ports ) {
	return array_merge( $ports, array( 3000, 3111 ) );
} );
PHP

# Hardening that must also ship to production: hide the user list from anonymous visitors.
cat > wp-content/mu-plugins/farida-hardening.php <<'PHP'
<?php
add_filter( 'rest_endpoints', function ( $endpoints ) {
	if ( ! is_user_logged_in() ) {
		foreach ( array_keys( $endpoints ) as $route ) {
			if ( 0 === strpos( $route, '/wp/v2/users' ) ) {
				unset( $endpoints[ $route ] );
			}
		}
	}
	return $endpoints;
} );
PHP

wp option update woocommerce_currency EGP
wp option update woocommerce_default_country EG
wp option update woocommerce_price_num_decimals 2
wp option update woocommerce_cod_settings '{"enabled":"yes","title":"Cash on delivery"}' --format=json

wp language core install ar || true
# Polylang has no wp-cli commands in the free plugin, so create languages in PHP.
wp eval '
$m = PLL()->model;
foreach ( [["name"=>"English","slug"=>"en","locale"=>"en_US","rtl"=>0,"term_group"=>0],
           ["name"=>"العربية","slug"=>"ar","locale"=>"ar","rtl"=>1,"term_group"=>1]] as $l ) {
  if ( ! $m->get_language( $l["slug"] ) ) { $m->add_language( $l ); }
}
'

# Sample catalog so the API has something to return.
if [ "$(wp wc product list --user=admin --format=count 2>/dev/null || echo 0)" = "0" ]; then
  wp wc product_cat create --name="Blenders" --user=admin >/dev/null
  for i in 1 2 3 4 5; do
    wp wc product create --name="Sample product $i" --type=simple \
      --regular_price="$((i * 450)).00" --manage_stock=true --stock_quantity=10 \
      --description="Sample $i" --user=admin >/dev/null
  done
fi

echo "WordPress:  $URL/wp-admin  (admin / admin)"
echo "Woo REST:   $URL/wp-json/wc/v3   Store API: $URL/wp-json/wc/store/v1"
wp plugin list --fields=name,version,status
wp core version
