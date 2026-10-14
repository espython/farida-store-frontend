<?php
// Prints WC_KEY / WC_SECRET for a read_write consumer key (local spike only).
global $wpdb;
$ck = 'ck_' . wc_rand_hash();
$cs = 'cs_' . wc_rand_hash();
$wpdb->delete( $wpdb->prefix . 'woocommerce_api_keys', array( 'description' => 'spike' ) );
$wpdb->insert( $wpdb->prefix . 'woocommerce_api_keys', array(
	'user_id'         => 1,
	'description'     => 'spike',
	'permissions'     => 'read_write',
	'consumer_key'    => wc_api_hash( $ck ),
	'consumer_secret' => $cs,
	'truncated_key'   => substr( $ck, -7 ),
) );
echo "WC_KEY=$ck\nWC_SECRET=$cs\n";
