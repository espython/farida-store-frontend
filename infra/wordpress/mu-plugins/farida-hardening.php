<?php
/**
 * Plugin Name: Farida hardening
 * Description: Closes what the headless storefront does not need (W8 #233): user lookups, login-name leaks,
 *              XML-RPC, application passwords, and unlimited password guessing.
 * Version:     2.0.0
 *
 * Must-use plugin: copy to wp-content/mu-plugins/. No settings. Checked by
 * infra/woo-staging/spike-hardening.mjs.
 *
 * - wp/v2/users: only /users/me (the storefront checks sessions with it) unless the user can list users.
 * - Author archives and ?author=N return 404 to visitors (they reveal login names); oEmbed carries no author.
 * - XML-RPC off (it accepts passwords outside the login limits) and application passwords off (a second,
 *   long-lived credential that a password reset would not revoke; nothing here uses them).
 * - Login limit: after 10 wrong passwords for one account in 15 minutes, that account refuses every sign-in
 *   (wp-login, the JWT token route) until the 15 minutes are over. Per account, not per IP: the storefront
 *   signs everyone in from one server address. Someone could lock a customer out for 15 minutes on purpose;
 *   the storefront also limits per visitor, which makes that slow.
 */

defined( 'ABSPATH' ) || exit;

const FARIDA_LOGIN_MAX_FAILURES = 10;
const FARIDA_LOGIN_WINDOW       = 15 * MINUTE_IN_SECONDS;

// --- Users -------------------------------------------------------------------------------------------

add_filter( 'rest_endpoints', function ( $endpoints ) {
	if ( current_user_can( 'list_users' ) ) {
		return $endpoints;
	}
	foreach ( array_keys( $endpoints ) as $route ) {
		if ( 0 === strpos( $route, '/wp/v2/users' ) && '/wp/v2/users/me' !== $route ) {
			unset( $endpoints[ $route ] );
		}
	}
	return $endpoints;
} );

add_action( 'template_redirect', function () {
	if ( ( is_author() || isset( $_GET['author'] ) ) && ! current_user_can( 'list_users' ) ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		nocache_headers();
	}
}, 0 );

// ?author=N is turned into /author/<login>/ by the canonical redirect before template_redirect runs.
add_filter( 'redirect_canonical', function ( $redirect, $requested ) {
	return isset( $_GET['author'] ) ? false : $redirect;
}, 10, 2 );

add_filter( 'oembed_response_data', function ( $data ) {
	unset( $data['author_name'], $data['author_url'] );
	return $data;
} );

// --- Other credentials -------------------------------------------------------------------------------

add_filter( 'xmlrpc_enabled', '__return_false' );
add_filter( 'xmlrpc_methods', '__return_empty_array' );
add_filter( 'wp_headers', function ( $headers ) {
	unset( $headers['X-Pingback'] );
	return $headers;
} );
add_filter( 'wp_is_application_passwords_available', '__return_false' );

// --- Login limit -------------------------------------------------------------------------------------

/** One counter per account: the user's id when the name or email exists, else a hash of what was typed. */
function farida_login_key( $username ) {
	$username = trim( (string) $username );
	$user     = is_email( $username ) ? get_user_by( 'email', $username ) : get_user_by( 'login', $username );
	return 'farida_login_' . ( $user ? 'u' . $user->ID : 'h' . substr( md5( strtolower( $username ) ), 0, 16 ) );
}

add_filter( 'authenticate', function ( $user, $username ) {
	if ( '' === trim( (string) $username ) ) {
		return $user;
	}
	$failures = (int) get_transient( farida_login_key( $username ) );
	if ( $failures >= FARIDA_LOGIN_MAX_FAILURES ) {
		return new WP_Error( 'farida_too_many_attempts', __( 'Too many failed attempts. Try again in 15 minutes.', 'farida' ) );
	}
	return $user;
}, 99, 2 );

add_action( 'wp_login_failed', function ( $username, $error = null ) {
	if ( $error instanceof WP_Error && 'farida_too_many_attempts' === $error->get_error_code() ) {
		return; // already locked: don't extend
	}
	$key = farida_login_key( $username );
	$failures = (int) get_transient( $key );
	// The window starts at the first failure; set_transient would restart it, so keep its expiry.
	$timeout = (int) get_option( "_transient_timeout_$key" );
	$ttl     = $failures && $timeout > time() ? $timeout - time() : FARIDA_LOGIN_WINDOW;
	set_transient( $key, $failures + 1, $ttl );
}, 10, 2 );

// A good password clears the count (wp-login fires wp_login; the JWT route only runs authenticate).
add_filter( 'authenticate', function ( $user, $username ) {
	if ( $user instanceof WP_User ) {
		delete_transient( farida_login_key( $username ) );
	}
	return $user;
}, 100, 2 );
