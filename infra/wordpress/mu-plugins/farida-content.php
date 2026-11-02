<?php
/**
 * Plugin Name: Farida content (promotions)
 * Description: Hero banners, the announcement bar and category mini-ads for the Farida storefront (W7 #232).
 *              One "Promotions" list in the admin; the storefront reads GET /wp-json/farida/v1/promos?lang=en|ar.
 * Version:     1.0.0
 *
 * Must-use plugin: copy to wp-content/mu-plugins/ (staging: setup.sh; production: deploy the same file).
 * No dependencies (no ACF, no Polylang): the language is a field on each promotion.
 */

defined( 'ABSPATH' ) || exit;

const FARIDA_PROMO_TYPE       = 'farida_promo';
const FARIDA_PROMO_PLACEMENTS = array( 'hero', 'announcement', 'mini' );
const FARIDA_PROMO_LANGS      = array( 'all', 'en', 'ar' );

add_action( 'init', function () {
	register_post_type( FARIDA_PROMO_TYPE, array(
		'labels'          => array(
			'name'          => __( 'Promotions', 'farida' ),
			'singular_name' => __( 'Promotion', 'farida' ),
			'add_new_item'  => __( 'Add promotion', 'farida' ),
			'edit_item'     => __( 'Edit promotion', 'farida' ),
			'all_items'     => __( 'All promotions', 'farida' ),
		),
		'description'     => 'Hero banners, announcement bar messages and category mini-ads.',
		// Not public pages: only the admin list and the storefront route below.
		'public'          => false,
		'show_ui'         => true,
		'show_in_menu'    => true,
		'menu_position'   => 56,
		'menu_icon'       => 'dashicons-megaphone',
		'show_in_rest'    => false,
		'supports'        => array( 'title', 'thumbnail', 'page-attributes' ),
		'capability_type' => 'post',
		'map_meta_cap'    => true,
	) );

	$meta = array(
		'_farida_placement' => 'hero',
		'_farida_lang'      => 'all',
		'_farida_link'      => '',
	);
	foreach ( $meta as $key => $default ) {
		register_post_meta( FARIDA_PROMO_TYPE, $key, array(
			'type'          => 'string',
			'single'        => true,
			'default'       => $default,
			'show_in_rest'  => false,
			'auth_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		) );
	}
} );

/** Relative storefront paths ("/categories/blenders") or https URLs; anything else is dropped. */
function farida_promo_clean_link( $raw ) {
	$raw = trim( (string) $raw );
	if ( '' === $raw ) {
		return '';
	}
	if ( preg_match( '#^/(?!/)[A-Za-z0-9\-._~/%?=&]*$#', $raw ) ) {
		return $raw;
	}
	// Absolute links: https only (no "//host", http, javascript: or data:).
	if ( 0 !== stripos( $raw, 'https://' ) ) {
		return '';
	}
	$url = esc_url_raw( $raw, array( 'https' ) );
	return $url ? $url : '';
}

function farida_promo_field( $post_id, $key, $allowed, $default ) {
	$value = get_post_meta( $post_id, $key, true );
	return in_array( $value, $allowed, true ) ? $value : $default;
}

// ---------------------------------------------------------------------------
// Admin: one box with placement, language and link. Title = the text shown
// (announcement, mini-ad, banner alt text); featured image = the banner.
// ---------------------------------------------------------------------------

add_action( 'add_meta_boxes_' . FARIDA_PROMO_TYPE, function () {
	add_meta_box( 'farida_promo_details', __( 'Where it shows', 'farida' ), 'farida_promo_box', FARIDA_PROMO_TYPE, 'side', 'high' );
} );

function farida_promo_box( $post ) {
	wp_nonce_field( 'farida_promo_save', 'farida_promo_nonce' );
	$placement = farida_promo_field( $post->ID, '_farida_placement', FARIDA_PROMO_PLACEMENTS, 'hero' );
	$lang      = farida_promo_field( $post->ID, '_farida_lang', FARIDA_PROMO_LANGS, 'all' );
	$link      = get_post_meta( $post->ID, '_farida_link', true );
	$labels    = array(
		'hero'         => __( 'Home hero banner (needs a featured image, 16:9)', 'farida' ),
		'announcement' => __( 'Announcement bar (the title is the message)', 'farida' ),
		'mini'         => __( 'Category page mini-ad (the title is the message)', 'farida' ),
	);
	$langs     = array(
		'all' => __( 'Both languages', 'farida' ),
		'en'  => __( 'English only', 'farida' ),
		'ar'  => __( 'Arabic only', 'farida' ),
	);
	echo '<p><label for="farida_placement"><strong>' . esc_html__( 'Placement', 'farida' ) . '</strong></label><br><select id="farida_placement" name="farida_placement" style="width:100%">';
	foreach ( $labels as $value => $label ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $value ), selected( $placement, $value, false ), esc_html( $label ) );
	}
	echo '</select></p><p><label for="farida_lang"><strong>' . esc_html__( 'Language', 'farida' ) . '</strong></label><br><select id="farida_lang" name="farida_lang" style="width:100%">';
	foreach ( $langs as $value => $label ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $value ), selected( $lang, $value, false ), esc_html( $label ) );
	}
	echo '</select></p>';
	printf(
		'<p><label for="farida_link"><strong>%s</strong></label><br><input id="farida_link" name="farida_link" type="text" value="%s" placeholder="/categories/blenders" style="width:100%%"><br><span class="description">%s</span></p>',
		esc_html__( 'Link (optional)', 'farida' ),
		esc_attr( $link ),
		esc_html__( 'A storefront path like /categories/blenders, or an https:// address.', 'farida' )
	);
	echo '<p class="description">' . esc_html__( 'Order: use "Order" under Page Attributes (lower shows first). Only published promotions are shown.', 'farida' ) . '</p>';
}

add_action( 'save_post_' . FARIDA_PROMO_TYPE, function ( $post_id ) {
	if ( ! isset( $_POST['farida_promo_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['farida_promo_nonce'] ) ), 'farida_promo_save' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$placement = isset( $_POST['farida_placement'] ) ? sanitize_key( wp_unslash( $_POST['farida_placement'] ) ) : 'hero';
	$lang      = isset( $_POST['farida_lang'] ) ? sanitize_key( wp_unslash( $_POST['farida_lang'] ) ) : 'all';
	$link      = isset( $_POST['farida_link'] ) ? farida_promo_clean_link( wp_unslash( $_POST['farida_link'] ) ) : '';
	update_post_meta( $post_id, '_farida_placement', in_array( $placement, FARIDA_PROMO_PLACEMENTS, true ) ? $placement : 'hero' );
	update_post_meta( $post_id, '_farida_lang', in_array( $lang, FARIDA_PROMO_LANGS, true ) ? $lang : 'all' );
	update_post_meta( $post_id, '_farida_link', $link );
} );

add_filter( 'manage_' . FARIDA_PROMO_TYPE . '_posts_columns', function ( $cols ) {
	$date = $cols['date'] ?? null;
	unset( $cols['date'] );
	$cols['farida_placement'] = __( 'Placement', 'farida' );
	$cols['farida_lang']      = __( 'Language', 'farida' );
	$cols['menu_order']       = __( 'Order', 'farida' );
	if ( $date ) {
		$cols['date'] = $date;
	}
	return $cols;
} );

add_action( 'manage_' . FARIDA_PROMO_TYPE . '_posts_custom_column', function ( $col, $post_id ) {
	if ( 'farida_placement' === $col ) {
		echo esc_html( farida_promo_field( $post_id, '_farida_placement', FARIDA_PROMO_PLACEMENTS, 'hero' ) );
	} elseif ( 'farida_lang' === $col ) {
		echo esc_html( farida_promo_field( $post_id, '_farida_lang', FARIDA_PROMO_LANGS, 'all' ) );
	} elseif ( 'menu_order' === $col ) {
		echo (int) get_post_field( 'menu_order', $post_id );
	}
}, 10, 2 );

// ---------------------------------------------------------------------------
// Storefront: GET /wp-json/farida/v1/promos?lang=en|ar. Published only, in
// admin order; public (the same content is on the public site).
// ---------------------------------------------------------------------------

add_action( 'rest_api_init', function () {
	register_rest_route( 'farida/v1', '/promos', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'args'                => array(
			'lang' => array(
				'required'          => true,
				'type'              => 'string',
				'enum'              => array( 'en', 'ar' ),
				// Explicit: a custom sanitize callback would skip the enum check.
				'validate_callback' => 'rest_validate_request_arg',
			),
		),
		'callback'            => 'farida_promos_response',
	) );
} );

function farida_promos_response( WP_REST_Request $request ) {
	$lang  = $request->get_param( 'lang' );
	$posts = get_posts( array(
		'post_type'        => FARIDA_PROMO_TYPE,
		'post_status'      => 'publish',
		'posts_per_page'   => 100,
		'orderby'          => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
		'suppress_filters' => false,
		// No language stored (created outside the admin box) counts as "all".
		'meta_query'       => array(
			'relation' => 'OR',
			array(
				'key'     => '_farida_lang',
				'value'   => array( 'all', $lang ),
				'compare' => 'IN',
			),
			array(
				'key'     => '_farida_lang',
				'compare' => 'NOT EXISTS',
			),
		),
	) );
	$out = array();
	foreach ( $posts as $post ) {
		$placement = farida_promo_field( $post->ID, '_farida_placement', FARIDA_PROMO_PLACEMENTS, 'hero' );
		$image     = null;
		$thumb_id  = get_post_thumbnail_id( $post );
		if ( $thumb_id ) {
			$src = wp_get_attachment_image_src( $thumb_id, 'full' );
			if ( $src ) {
				// SVGs have no size in WordPress: null means "unknown".
				$image = array(
					'url'    => $src[0],
					'width'  => $src[1] ? (int) $src[1] : null,
					'height' => $src[2] ? (int) $src[2] : null,
					'alt'    => (string) get_post_meta( $thumb_id, '_wp_attachment_image_alt', true ),
				);
			}
		}
		// A banner without an image has nothing to show.
		if ( 'hero' === $placement && ! $image ) {
			continue;
		}
		$link  = farida_promo_clean_link( get_post_meta( $post->ID, '_farida_link', true ) );
		$out[] = array(
			'id'        => $post->ID,
			'placement' => $placement,
			'text'      => html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
			'image'     => $image,
			'link'      => $link ? $link : null,
			'order'     => (int) $post->menu_order,
		);
	}
	$response = rest_ensure_response( $out );
	$response->header( 'Cache-Control', 'public, max-age=60' );
	return $response;
}
