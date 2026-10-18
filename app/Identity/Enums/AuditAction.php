<?php

namespace App\Identity\Enums;

/**
 * Every event written to audit_log. The `access.*` cases are defined now and
 * emitted only when the Organisations features become real.
 */
enum AuditAction: string
{
    case Registered = 'auth.registered';
    case RegistrationAttemptOnExisting = 'auth.registration_attempt_on_existing';
    case EmailVerificationSent = 'auth.email_verification_sent';
    case EmailVerified = 'auth.email_verified';
    case LoginSucceeded = 'auth.login_succeeded';
    case LoginFailed = 'auth.login_failed';
    case LoginThrottled = 'auth.login_throttled';
    case Lockout = 'auth.lockout';
    case TwoFactorSucceeded = 'auth.two_factor_succeeded';
    case TwoFactorFailed = 'auth.two_factor_failed';
    case RecoveryCodeUsed = 'auth.recovery_code_used';
    case Logout = 'auth.logout';
    case PasswordResetRequested = 'auth.password_reset_requested';
    case PasswordResetCompleted = 'auth.password_reset_completed';
    case PasswordChanged = 'auth.password_changed';
    case PasswordConfirmFailed = 'auth.password_confirm_failed';
    case TwoFactorEnrolmentStarted = 'auth.two_factor_enrolment_started';
    case TwoFactorEnabled = 'auth.two_factor_enabled';
    case TwoFactorDisabled = 'auth.two_factor_disabled';
    case RecoveryCodesRegenerated = 'auth.recovery_codes_regenerated';
    case SessionRevoked = 'auth.session_revoked';
    case SessionsRevokedAll = 'auth.sessions_revoked_all';

    // Defined now, emitted when the features exist.
    case AdminAdded = 'access.admin_added';
    case AdminRemoved = 'access.admin_removed';
    case DelegationWithdrawn = 'access.delegation_withdrawn';
}
