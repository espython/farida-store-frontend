<?php
/**
 * Plugin Name: Farida contact messages
 * Description: Stores the storefront's contact form messages in the admin ("Contact messages") (B7 #304).
 *              The storefront server posts them to POST /wp-json/farida/v1/contact with a shared secret.
 * Version:     1.0.0
 *
 * Must-use plugin: copy to wp-content/mu-plugins/. Needs the constant FARIDA_CONTACT_SECRET in
 * wp-config.php (the same value as CONTACT_SHARED_SECRET on the storefront); without it the route
 * refuses everything. Email notification comes with the mail service (W6 #231).
 */

defined( 'ABSPATH' ) || exit;

const FARIDA_CONTACT_TYPE = 'farida_contact';
// Same limits as the storefront (modules/content/domain/ContactMessage.ts).
const FARIDA_CONTACT_MAX_NAME    = 120;
const FARIDA_CONTACT_MAX_EMAIL   = 254;
const FARIDA_CONTACT_MAX_MESSAGE = 2000;
// Backstop if the storefront's per-visitor limit is bypassed or misconfigured.
const FARIDA_CONTACT_MAX_PER_HOUR = 200;

add_action( 'init', function () {
	register_post_type( FARIDA_CONTACT_TYPE, array(
		'labels'          => array(
			'name'          => __( 'Contact messages', 'farida' ),
			'singular_name' => __( 'Contact message', 'farida' ),
			'edit_item'     => __( 'Contact message', 'farida' ),
			'all_items'     => __( 'All messages', 'farida' ),
			'not_found'     => __( 'No messages yet.', 'farida' ),
		),
		'public'          => false,
		'show_ui'         => true,
		'show_in_menu'    => true,
		'menu_position'   => 57,
		'menu_icon'       => 'dashicons-email-alt',
		'show_in_rest'    => false,
		'supports'        => array( 'title' ),
		'capability_type' => 'post',
		'capabilities'    => array( 'create_posts' => 'do_not_allow' ), // only the storefront creates them
		'map_meta_cap'    => true,
	) );
} );

function farida_contact_len( $s ) {
	return function_exists( 'mb_strlen' ) ? mb_strlen( $s, 'UTF-8' ) : strlen( $s );
}

// ---------------------------------------------------------------------------
// Storefront route
// ---------------------------------------------------------------------------

add_action( 'rest_api_init', function () {
	register_rest_route( 'farida/v1', '/contact', array(
		'methods'             => 'POST',
		'permission_callback' => 'farida_contact_permission',
		'callback'            => 'farida_contact_create',
	) );
} );

/** Only the storefront server, which knows the shared secret. */
function farida_contact_permission( WP_REST_Request $request ) {
	if ( ! defined( 'FARIDA_CONTACT_SECRET' ) || strlen( (string) FARIDA_CONTACT_SECRET ) < 16 ) {
		return new WP_Error( 'farida_contact_unconfigured', 'Contact messages are not configured.', array( 'status' => 503 ) );
	}
	$given = (string) $request->get_header( 'x_farida_contact_secret' );
	if ( '' === $given || ! hash_equals( (string) FARIDA_CONTACT_SECRET, $given ) ) {
		return new WP_Error( 'farida_contact_forbidden', 'Forbidden.', array( 'status' => 403 ) );
	}
	return true;
}

function farida_contact_create( WP_REST_Request $request ) {
	$body    = $request->get_json_params();
	$name    = isset( $body['name'] ) && is_string( $body['name'] ) ? trim( sanitize_text_field( $body['name'] ) ) : '';
	$email   = isset( $body['email'] ) && is_string( $body['email'] ) ? trim( $body['email'] ) : '';
	$message = isset( $body['message'] ) && is_string( $body['message'] ) ? trim( sanitize_textarea_field( $body['message'] ) ) : '';
	$locale  = isset( $body['locale'] ) && in_array( $body['locale'], array( 'en', 'ar' ), true ) ? $body['locale'] : '';

	if ( '' === $name || '' === $message || farida_contact_len( $name ) > FARIDA_CONTACT_MAX_NAME
		|| farida_contact_len( $message ) > FARIDA_CONTACT_MAX_MESSAGE
		|| strlen( $email ) > FARIDA_CONTACT_MAX_EMAIL || ! is_email( $email ) ) {
		// Never echo the input back.
		return new WP_Error( 'farida_contact_invalid', 'Invalid message.', array( 'status' => 400 ) );
	}

	$hour = 'farida_contact_hour_' . gmdate( 'YmdH' );
	$seen = (int) get_transient( $hour );
	if ( $seen >= FARIDA_CONTACT_MAX_PER_HOUR ) {
		return new WP_Error( 'farida_contact_busy', 'Too many messages, try again later.', array( 'status' => 429 ) );
	}
	set_transient( $hour, $seen + 1, HOUR_IN_SECONDS );

	$excerpt = function_exists( 'mb_substr' ) ? mb_substr( $message, 0, 60, 'UTF-8' ) : substr( $message, 0, 60 );
	$id      = wp_insert_post( array(
		'post_type'    => FARIDA_CONTACT_TYPE,
		'post_status'  => 'private', // never public, visible in the admin
		'post_title'   => $name . ': ' . $excerpt,
		'post_content' => $message,
		'meta_input'   => array(
			'_farida_contact_name'   => $name,
			'_farida_contact_email'  => sanitize_email( $email ),
			'_farida_contact_locale' => $locale,
		),
	), true );
	if ( is_wp_error( $id ) ) {
		return new WP_Error( 'farida_contact_failed', 'Could not save the message.', array( 'status' => 500 ) );
	}
	return new WP_REST_Response( array( 'id' => $id ), 201 );
}

// ---------------------------------------------------------------------------
// Admin: read-only view (name, email, language, date, message) and list columns.
// ---------------------------------------------------------------------------

add_action( 'add_meta_boxes_' . FARIDA_CONTACT_TYPE, function () {
	add_meta_box( 'farida_contact_view', __( 'Message', 'farida' ), 'farida_contact_box', FARIDA_CONTACT_TYPE, 'normal', 'high' );
} );

function farida_contact_box( $post ) {
	$email  = get_post_meta( $post->ID, '_farida_contact_email', true );
	$locale = get_post_meta( $post->ID, '_farida_contact_locale', true );
	echo '<table class="form-table" role="presentation"><tbody>';
	printf( '<tr><th>%s</th><td>%s</td></tr>', esc_html__( 'Name', 'farida' ), esc_html( get_post_meta( $post->ID, '_farida_contact_name', true ) ) );
	printf( '<tr><th>%s</th><td><a href="%s">%s</a></td></tr>', esc_html__( 'Email', 'farida' ), esc_url( 'mailto:' . $email ), esc_html( $email ) );
	printf( '<tr><th>%s</th><td>%s</td></tr>', esc_html__( 'Language', 'farida' ), esc_html( 'ar' === $locale ? 'العربية' : ( 'en' === $locale ? 'English' : '—' ) ) );
	printf( '<tr><th>%s</th><td>%s</td></tr>', esc_html__( 'Received', 'farida' ), esc_html( get_the_date( 'Y-m-d H:i', $post ) ) );
	printf( '<tr><th>%s</th><td><div dir="auto" style="white-space:pre-wrap">%s</div></td></tr>', esc_html__( 'Message', 'farida' ), esc_html( $post->post_content ) );
	echo '</tbody></table>';
}

add_filter( 'manage_' . FARIDA_CONTACT_TYPE . '_posts_columns', function ( $cols ) {
	return array(
		'cb'                   => $cols['cb'] ?? '',
		'title'                => __( 'Message', 'farida' ),
		'farida_contact_email' => __( 'Email', 'farida' ),
		'date'                 => __( 'Received', 'farida' ),
	);
} );

add_action( 'manage_' . FARIDA_CONTACT_TYPE . '_posts_custom_column', function ( $col, $post_id ) {
	if ( 'farida_contact_email' === $col ) {
		echo esc_html( get_post_meta( $post_id, '_farida_contact_email', true ) );
	}
}, 10, 2 );
