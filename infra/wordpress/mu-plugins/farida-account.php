<?php
/**
 * Plugin Name: Farida account
 * Description: Password reset for the headless storefront (A2 #243, W5 #230), and sign-out of old tokens after a password change.
 * Version:     1.0.0
 *
 * Must-use plugin: copy to wp-content/mu-plugins/. No settings: the storefront server calls the routes
 * with the WooCommerce REST keys it already has (the "wc-" namespace lets Woo authenticate them), and the
 * key's user needs manage_woocommerce.
 *
 * - POST /wp-json/wc-farida/v1/password/forgot  { email, locale: en|ar, resetUrl }
 *   Emails a reset link (resetUrl?key=…&login=…) to a customer with that email. Always answers 202, so it
 *   never tells whether an account exists. Staff accounts reset through wp-login.php, not here.
 * - POST /wp-json/wc-farida/v1/password/reset   { login, key, password }
 *   Sets the new password if the key is valid (1 hour, single use) and returns the account email, so the
 *   storefront can sign the customer in.
 * - JWT tokens issued before the user's last password change are treated as signed out (the JWT plugin
 *   has no revocation), so a reset ends every other session.
 *
 * - Customer responses carry the storefront's own meta (address book, wishlist) for the shop-manager REST
 *   key; Woo shows customer meta to administrators only.
 *
 * - POST /wp-json/wc-farida/v1/email/send     { customerId, locale: en|ar, verifyUrl }
 *   Emails the customer a link (verifyUrl?id=…&token=…) to confirm their email, valid 48 hours, at most one
 *   email a minute. Nothing is blocked while unconfirmed (owner decision 2026-11-03): it only tells the shop
 *   the address is real. Answers { status: sent | recent | verified }.
 * - POST /wp-json/wc-farida/v1/email/verify   { id, token }
 *   Confirms the email if the token matches (and the email has not changed since it was sent).
 *   Changing a user's email clears the confirmation. Users > All Users shows an "Email verified" column.
 *
 * Email goes through wp_mail: production needs the mail service (W6 #231).
 */

defined( 'ABSPATH' ) || exit;

const FARIDA_RESET_KEY_TTL      = HOUR_IN_SECONDS;
const FARIDA_RESET_RESEND_AFTER = 60; // seconds between two emails to the same account
const FARIDA_PASSWORD_MIN       = 6;  // same as the storefront (modules/customer/domain/credentials.ts)
const FARIDA_PASSWORD_MAX       = 128;
const FARIDA_PASSWORD_CHANGED   = 'farida_password_changed_at';
const FARIDA_RESET_SENT         = 'farida_reset_sent_at';

add_action( 'rest_api_init', function () {
	$args = array(
		'methods'             => 'POST',
		'permission_callback' => function () {
			return current_user_can( 'manage_woocommerce' );
		},
	);
	register_rest_route( 'wc-farida/v1', '/password/forgot', $args + array( 'callback' => 'farida_password_forgot' ) );
	register_rest_route( 'wc-farida/v1', '/password/reset', $args + array( 'callback' => 'farida_password_reset' ) );
	register_rest_route( 'wc-farida/v1', '/email/send', $args + array( 'callback' => 'farida_email_send' ) );
	register_rest_route( 'wc-farida/v1', '/email/verify', $args + array( 'callback' => 'farida_email_verify' ) );
} );

/** Customers only: an admin or shop manager must never be reset from the storefront. */
function farida_is_customer( WP_User $user ) {
	return ! user_can( $user, 'edit_posts' ) && ! user_can( $user, 'manage_woocommerce' );
}

/** Only an https link, or a local one for development. */
function farida_valid_reset_url( $url ) {
	$parts = wp_parse_url( (string) $url );
	if ( empty( $parts['scheme'] ) || empty( $parts['host'] ) || isset( $parts['query'] ) || isset( $parts['fragment'] ) ) {
		return false;
	}
	if ( 'https' === $parts['scheme'] ) {
		return true;
	}
	return 'http' === $parts['scheme'] && in_array( $parts['host'], array( 'localhost', '127.0.0.1' ), true );
}

function farida_password_forgot( WP_REST_Request $request ) {
	$email     = sanitize_email( (string) $request->get_param( 'email' ) );
	$locale    = 'ar' === $request->get_param( 'locale' ) ? 'ar' : 'en';
	$reset_url = (string) $request->get_param( 'resetUrl' );
	if ( ! farida_valid_reset_url( $reset_url ) ) {
		return new WP_Error( 'farida_bad_reset_url', 'resetUrl must be an https address without a query', array( 'status' => 400 ) );
	}
	$accepted = new WP_REST_Response( array( 'accepted' => true ), 202 );

	$user = $email ? get_user_by( 'email', $email ) : false;
	if ( ! $user || ! farida_is_customer( $user ) ) {
		return $accepted;
	}
	// Emailed in the last minute: don't send again (double click, or someone hammering the form). Our own
	// timestamp: Woo also issues reset keys (the new-account email), which must not block this one.
	$sent = (int) get_user_meta( $user->ID, FARIDA_RESET_SENT, true );
	if ( $sent && time() - $sent < FARIDA_RESET_RESEND_AFTER ) {
		return $accepted;
	}
	update_user_meta( $user->ID, FARIDA_RESET_SENT, time() );
	$key = get_password_reset_key( $user );
	if ( is_wp_error( $key ) ) {
		return $accepted;
	}
	$link = add_query_arg( array( 'key' => $key, 'login' => rawurlencode( $user->user_login ) ), $reset_url );
	$site = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
	$name = $user->first_name ? $user->first_name : '';

	if ( 'ar' === $locale ) {
		$subject = "[{$site}] إعادة تعيين كلمة المرور";
		$body    = ( $name ? "مرحبًا {$name}،" : 'مرحبًا،' ) . "\n\n"
			. "طلب أحدهم إعادة تعيين كلمة مرور حسابك في {$site}.\n"
			. "لاختيار كلمة مرور جديدة، افتح هذا الرابط خلال ساعة:\n\n{$link}\n\n"
			. "إذا لم تطلب ذلك، تجاهل هذه الرسالة؛ ستبقى كلمة مرورك كما هي.\n";
	} else {
		$subject = "[{$site}] Reset your password";
		$body    = ( $name ? "Hi {$name}," : 'Hi,' ) . "\n\n"
			. "Someone asked to reset the password for your {$site} account.\n"
			. "To choose a new password, open this link within an hour:\n\n{$link}\n\n"
			. "If you didn't ask for this, ignore this email; your password stays the same.\n";
	}
	if ( ! wp_mail( $user->user_email, $subject, $body ) ) {
		error_log( 'farida-account: reset email to user ' . $user->ID . ' failed' );
	}
	return $accepted;
}

function farida_password_reset( WP_REST_Request $request ) {
	$login    = (string) $request->get_param( 'login' );
	$key      = (string) $request->get_param( 'key' );
	$password = (string) $request->get_param( 'password' );
	$invalid  = new WP_Error( 'farida_invalid_reset_key', 'The reset link is invalid or has expired', array( 'status' => 400 ) );

	if ( '' === $login || '' === $key || strlen( $key ) > 64 || strlen( $login ) > 60 ) {
		return $invalid;
	}
	$len = mb_strlen( $password );
	if ( $len < FARIDA_PASSWORD_MIN || $len > FARIDA_PASSWORD_MAX ) {
		return new WP_Error( 'farida_weak_password', 'Password length is out of range', array( 'status' => 400 ) );
	}
	$user = check_password_reset_key( $key, $login );
	if ( is_wp_error( $user ) || ! farida_is_customer( $user ) ) {
		return $invalid;
	}
	reset_password( $user, $password ); // clears the key: single use
	return new WP_REST_Response( array( 'email' => $user->user_email ), 200 );
}

add_filter( 'password_reset_expiration', function () {
	return FARIDA_RESET_KEY_TTL;
} );

// Remember when the password changed (reset, profile, admin)…
add_action( 'wp_set_password', function ( $password, $user_id ) {
	update_user_meta( $user_id, FARIDA_PASSWORD_CHANGED, time() );
}, 10, 2 );

// …and treat a JWT issued before that as signed out. Runs after the JWT plugin (priority 10) has
// verified the signature and returned the token's user.
add_filter( 'determine_current_user', function ( $user_id ) {
	if ( ! $user_id ) {
		return $user_id;
	}
	$header = $_SERVER['HTTP_AUTHORIZATION'] ?? ( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '' );
	if ( 0 !== strpos( (string) $header, 'Bearer ' ) ) {
		return $user_id;
	}
	$parts = explode( '.', substr( (string) $header, 7 ) );
	if ( 3 !== count( $parts ) ) {
		return $user_id;
	}
	$claims = json_decode( base64_decode( strtr( $parts[1], '-_', '+/' ) ), true );
	$iat    = is_array( $claims ) && isset( $claims['iat'] ) ? (int) $claims['iat'] : 0;
	$token_user = (int) ( $claims['data']['user']['id'] ?? 0 );
	if ( $token_user !== (int) $user_id ) {
		return $user_id; // signed in some other way (keys, cookie)
	}
	$changed = (int) get_user_meta( (int) $user_id, FARIDA_PASSWORD_CHANGED, true );
	return $changed && $iat < $changed ? 0 : $user_id;
}, 20 );

// Woo returns a customer's meta_data to administrators only, but the storefront's REST key belongs to a
// shop manager (W8 #233). Add back exactly the storefront's own keys, for users who manage the shop.
const FARIDA_CUSTOMER_META_KEYS = array( 'farida_address_book', 'farida_wishlist', 'farida_email_verified' );

add_filter( 'woocommerce_rest_prepare_customer', function ( $response, $user ) {
	if ( wc_current_user_has_role( 'administrator' ) || ! current_user_can( 'manage_woocommerce' ) || ! $user instanceof WP_User ) {
		return $response; // admins already get meta_data; nobody else should
	}
	$data = $response->get_data();
	$meta = array();
	foreach ( FARIDA_CUSTOMER_META_KEYS as $key ) {
		$value = get_user_meta( $user->ID, $key, true );
		if ( '' !== $value ) {
			$meta[] = array( 'key' => $key, 'value' => $value );
		}
	}
	$data['meta_data'] = $meta;
	$response->set_data( $data );
	return $response;
}, 10, 2 );

// --- Email verification ------------------------------------------------------------------------------

const FARIDA_VERIFY_TTL         = 48 * HOUR_IN_SECONDS;
const FARIDA_VERIFY_RESEND_WAIT = 60;
const FARIDA_EMAIL_VERIFIED     = 'farida_email_verified'; // epoch seconds when confirmed
const FARIDA_EMAIL_VERIFY       = 'farida_email_verify';   // { hash, email, exp } of the pending link
const FARIDA_EMAIL_VERIFY_SENT  = 'farida_email_verify_sent';

function farida_email_send( WP_REST_Request $request ) {
	$id        = (int) $request->get_param( 'customerId' );
	$locale    = 'ar' === $request->get_param( 'locale' ) ? 'ar' : 'en';
	$verify_url = (string) $request->get_param( 'verifyUrl' );
	if ( ! farida_valid_reset_url( $verify_url ) ) {
		return new WP_Error( 'farida_bad_verify_url', 'verifyUrl must be an https address without a query', array( 'status' => 400 ) );
	}
	$user = $id > 0 ? get_user_by( 'id', $id ) : false;
	if ( ! $user || ! farida_is_customer( $user ) ) {
		return new WP_Error( 'farida_not_found', 'No such customer', array( 'status' => 404 ) );
	}
	if ( get_user_meta( $user->ID, FARIDA_EMAIL_VERIFIED, true ) ) {
		return new WP_REST_Response( array( 'status' => 'verified' ), 200 );
	}
	$sent = (int) get_user_meta( $user->ID, FARIDA_EMAIL_VERIFY_SENT, true );
	if ( $sent && time() - $sent < FARIDA_VERIFY_RESEND_WAIT ) {
		return new WP_REST_Response( array( 'status' => 'recent' ), 202 );
	}
	$token = wp_generate_password( 32, false, false );
	update_user_meta( $user->ID, FARIDA_EMAIL_VERIFY, array(
		'hash'  => hash( 'sha256', $token ),
		'email' => strtolower( $user->user_email ),
		'exp'   => time() + FARIDA_VERIFY_TTL,
	) );
	update_user_meta( $user->ID, FARIDA_EMAIL_VERIFY_SENT, time() );

	$link = add_query_arg( array( 'id' => $user->ID, 'token' => $token ), $verify_url );
	$site = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
	$name = $user->first_name ? $user->first_name : '';
	if ( 'ar' === $locale ) {
		$subject = "[{$site}] تأكيد بريدك الإلكتروني";
		$body    = ( $name ? "مرحبًا {$name}،" : 'مرحبًا،' ) . "\n\n"
			. "لتأكيد أن هذا البريد الإلكتروني خاص بحسابك في {$site}، افتح هذا الرابط خلال يومين:\n\n{$link}\n\n"
			. "إذا لم تنشئ حسابًا لدينا، تجاهل هذه الرسالة.\n";
	} else {
		$subject = "[{$site}] Confirm your email";
		$body    = ( $name ? "Hi {$name}," : 'Hi,' ) . "\n\n"
			. "To confirm this email belongs to your {$site} account, open this link within two days:\n\n{$link}\n\n"
			. "If you didn't create an account with us, ignore this email.\n";
	}
	if ( ! wp_mail( $user->user_email, $subject, $body ) ) {
		error_log( 'farida-account: verification email to user ' . $user->ID . ' failed' );
	}
	return new WP_REST_Response( array( 'status' => 'sent' ), 202 );
}

function farida_email_verify( WP_REST_Request $request ) {
	$id      = (int) $request->get_param( 'id' );
	$token   = (string) $request->get_param( 'token' );
	$invalid = new WP_Error( 'farida_invalid_verify_token', 'The confirmation link is invalid or has expired', array( 'status' => 400 ) );
	$user    = $id > 0 ? get_user_by( 'id', $id ) : false;
	if ( ! $user || ! farida_is_customer( $user ) || '' === $token || strlen( $token ) > 64 ) {
		return $invalid;
	}
	$pending = get_user_meta( $user->ID, FARIDA_EMAIL_VERIFY, true );
	if ( ! is_array( $pending ) || empty( $pending['hash'] )
		|| ! hash_equals( (string) $pending['hash'], hash( 'sha256', $token ) )
		|| (int) ( $pending['exp'] ?? 0 ) < time()
		|| strtolower( $user->user_email ) !== ( $pending['email'] ?? '' ) ) {
		return $invalid;
	}
	// The link stays valid until it expires, so opening it twice answers the same.
	if ( ! get_user_meta( $user->ID, FARIDA_EMAIL_VERIFIED, true ) ) {
		update_user_meta( $user->ID, FARIDA_EMAIL_VERIFIED, time() );
	}
	return new WP_REST_Response( array( 'verified' => true ), 200 );
}

// A new email is unconfirmed again, and old links stop working.
add_action( 'profile_update', function ( $user_id, $old_user ) {
	$user = get_user_by( 'id', $user_id );
	if ( $user && $old_user instanceof WP_User && strtolower( $user->user_email ) !== strtolower( $old_user->user_email ) ) {
		delete_user_meta( $user_id, FARIDA_EMAIL_VERIFIED );
		delete_user_meta( $user_id, FARIDA_EMAIL_VERIFY );
	}
}, 10, 2 );

// Users > All Users: who confirmed their email.
add_filter( 'manage_users_columns', function ( $columns ) {
	$columns['farida_email_verified'] = __( 'Email verified', 'farida' );
	return $columns;
} );
add_filter( 'manage_users_custom_column', function ( $output, $column, $user_id ) {
	if ( 'farida_email_verified' !== $column ) {
		return $output;
	}
	$at = (int) get_user_meta( $user_id, FARIDA_EMAIL_VERIFIED, true );
	return $at ? esc_html( wp_date( get_option( 'date_format' ), $at ) ) : '—';
}, 10, 3 );

