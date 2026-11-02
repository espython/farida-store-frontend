<?php
/**
 * Plugin Name: Farida order statuses
 * Description: The shop's own order statuses: "Out for delivery" (O1 #252) and "Return requested" (O2 #253).
 * Version:     1.1.0
 *
 * Must-use plugin: copy to wp-content/mu-plugins/. REST returns the statuses as
 * "out-for-delivery" and "return-requested".
 *
 * - Out for delivery: between Processing and Completed. The owner sets it when the courier
 *   leaves; the storefront's tracking shows it.
 * - Return requested: set by the storefront when a customer asks to return a delivered order
 *   (the reason is a private order note). The owner then refunds it in Woo (Refunded; restock
 *   the items in the refund) or declines it (back to Completed).
 * Stock is not touched by either status; both count as sales in the reports, like Completed.
 */

defined( 'ABSPATH' ) || exit;

/** REST/status slug => [label, status it is listed after]. */
function farida_order_statuses() {
	return array(
		'out-for-delivery' => array( _x( 'Out for delivery', 'Order status', 'farida' ), 'wc-processing' ),
		'return-requested' => array( _x( 'Return requested', 'Order status', 'farida' ), 'wc-completed' ),
	);
}

add_action( 'init', function () {
	foreach ( farida_order_statuses() as $slug => list( $label ) ) {
		register_post_status( "wc-$slug", array(
			'label'                     => $label,
			'public'                    => false,
			'exclude_from_search'       => false,
			'show_in_admin_all_list'    => true,
			'show_in_admin_status_list' => true,
			/* translators: %s: number of orders */
			'label_count'               => _n_noop( "$label <span class=\"count\">(%s)</span>", "$label <span class=\"count\">(%s)</span>", 'farida' ),
		) );
	}
} );

add_filter( 'wc_order_statuses', function ( $statuses ) {
	$after = array();
	foreach ( farida_order_statuses() as $slug => list( $label, $prev ) ) {
		$after[ $prev ][ "wc-$slug" ] = $label;
	}
	$out = array();
	foreach ( $statuses as $key => $label ) {
		$out[ $key ] = $label;
		if ( isset( $after[ $key ] ) ) {
			$out = array_merge( $out, $after[ $key ] );
		}
	}
	return $out;
} );

// Bulk action on the orders list (classic and HPOS screens). Only "out for delivery": a
// return is requested by the customer, never by the owner.
foreach ( array( 'bulk_actions-edit-shop_order', 'bulk_actions-woocommerce_page_wc-orders' ) as $hook ) {
	add_filter( $hook, function ( $actions ) {
		$actions['mark_out-for-delivery'] = __( 'Change status to out for delivery', 'farida' );
		return $actions;
	} );
}

add_filter( 'woocommerce_reports_order_statuses', function ( $statuses ) {
	return is_array( $statuses ) ? array_merge( $statuses, array_keys( farida_order_statuses() ) ) : $statuses;
} );
