<?php
// Prints WC_KEY / WC_SECRET for the storefront's WooCommerce REST key (W8 #233).
//   docker compose --profile tools run --rm wpcli wp eval-file /create-keys.php 2>/dev/null | grep '^WC_'
//
// The key belongs to its own user, "farida-storefront", with the Shop manager role: it can manage the
// shop (orders, customers, products, reviews) but not plugins, settings, themes or staff accounts, as the
// admin can. Read/write because the storefront writes orders, customers and reviews. Running it again
// replaces the key. Production: create the same user and key in the admin (see infra/wordpress/README.md).
global $wpdb;

$login = 'farida-storefront';
$user  = get_user_by( 'login', $login );
if ( ! $user ) {
	$id = wp_insert_user( array(
		'user_login'   => $login,
		'user_email'   => 'storefront-api@farida.test',
		'user_pass'    => wp_generate_password( 64, true, true ), // never used: the key signs in
		'role'         => 'shop_manager',
		'display_name' => 'Storefront API',
	) );
	if ( is_wp_error( $id ) ) {
		fwrite( STDERR, $id->get_error_message() . "\n" );
		exit( 1 );
	}
	$user = get_user_by( 'id', $id );
}
$user->set_role( 'shop_manager' );

$table = $wpdb->prefix . 'woocommerce_api_keys';
$wpdb->delete( $table, array( 'description' => 'spike' ) ); // the old admin-owned key
$wpdb->delete( $table, array( 'description' => 'storefront' ) );

$ck = 'ck_' . wc_rand_hash();
$cs = 'cs_' . wc_rand_hash();
$wpdb->insert( $table, array(
	'user_id'         => $user->ID,
	'description'     => 'storefront',
	'permissions'     => 'read_write',
	'consumer_key'    => wc_api_hash( $ck ),
	'consumer_secret' => $cs,
	'truncated_key'   => substr( $ck, -7 ),
) );
echo "WC_KEY=$ck\nWC_SECRET=$cs\n";
