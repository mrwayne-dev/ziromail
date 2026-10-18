<?php

/*
 * Identity and authentication settings. Every number here is a binding value
 * from docs/DASHBOARD_BUILD.md section 7; code reads these, never literals.
 */
return [
    'registration' => [
        'enabled' => (bool) env('AUTH_REGISTRATION_ENABLED', true),
        // Comma-separated addresses or @domains. Empty means anyone may register (when enabled).
        'allowlist' => array_values(array_filter(array_map('trim', explode(',', (string) env('AUTH_REGISTRATION_ALLOWLIST', ''))))),
    ],

    'password' => [
        'min' => 10,
        'max' => 128,
        'uncompromised' => (bool) env('AUTH_CHECK_PWNED', true),
        'uncompromised_threshold' => 3,
    ],

    'verification' => [
        'code_digits' => 6,
        'code_minutes' => 15,
        'code_max_attempts' => 5,
        'confirm_per_15_minutes' => 10,
        'resend_per_minute' => 1,
        'resend_per_hour' => 6,
    ],

    'reset' => [
        'expire_minutes' => 30,
        'request_per_hour_email' => 3,
        'request_per_hour_ip' => 10,
        'submit_per_minute_ip' => 5,
        'submit_per_hour_email' => 5,
    ],

    'register_limits' => [
        'per_hour_ip' => 5,
        'per_hour_email' => 3,
    ],

    'login' => [
        'per_minute_email_ip' => 5,
        'per_minute_ip' => 30,
        'backoff_minutes' => [1, 2, 4, 8, 15],
        'distributed_failures_per_hour' => 20,
        'hold_minutes' => 15,
        'familiar_days' => 30,
        'notify_success_after_failures' => 5,
        'pending_minutes' => 5,
    ],

    'two_factor' => [
        'enforce_for_owners' => (bool) env('AUTH_ENFORCE_TWO_FACTOR_FOR_OWNERS', false),
        'issuer' => 'Ziroemail',
        'secret_length' => 32,
        'window' => 1,
        'setup_expires_minutes' => 10,
        'prompt_snooze_days' => 7,
        'recovery_codes' => 10,
        'attempts_per_minute_pending' => 5,
        'attempts_per_minute_ip' => 10,
        'failures_before_reset' => 10,
        'failure_window_minutes' => 15,
        'setup_per_hour' => 10,
    ],

    'confirm_password' => [
        'timeout_seconds' => 900,
        'per_minute_user' => 5,
        'failures_before_sign_out' => 10,
    ],

    'password_change' => ['per_hour_user' => 5],
    'session_revoke' => ['per_hour_user' => 20],

    // Staff session cookie. In production set STAFF_SESSION_COOKIE=__Secure-ziroemail_staff_session.
    'staff_cookie' => env('STAFF_SESSION_COOKIE', 'ziroemail_staff_session'),

    'sessions' => [
        'web' => ['idle_minutes' => 120, 'remember_minutes' => 43200, 'absolute_days' => 30],
        'staff' => ['idle_minutes' => 30, 'absolute_hours' => 8],
    ],

    'staff_login' => [
        'per_minute_email_ip' => 3,
        'failures_per_hour' => 10,
        'lock_minutes' => 30,
    ],

    'headers' => [
        // Extra origins the policy allows. Empty in production. The Vite dev server is added automatically in local.
        'hsts' => 'max-age=31536000; includeSubDomains',
        'permissions_policy' => 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), clipboard-write=(self)',
    ],
];
