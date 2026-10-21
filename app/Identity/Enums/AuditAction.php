<?php

namespace App\Identity\Enums;

/**
 * Every event written to audit_log.
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

    // The customer's own account (shown in their activity log).
    case DomainAdded = 'domain.added';
    case DomainVerified = 'domain.verified';
    case DomainRecordChanged = 'domain.record_changed';
    case MailboxCreated = 'mailbox.created';
    case MailboxQuotaChanged = 'mailbox.quota_changed';
    case MailboxSuspended = 'mailbox.suspended';
    case MailboxDeleted = 'mailbox.deleted';
    case AliasSaved = 'alias.saved';
    case AliasRemoved = 'alias.removed';
    case StorageAdded = 'billing.storage_added';
    case PlanChanged = 'billing.plan_changed';
    case LogExported = 'access.log_exported';
    case AbuseFlagRaised = 'abuse.flag_raised';
    case SendingLimited = 'abuse.sending_limited';
    case SendingLocked = 'abuse.sending_locked';
    case SendingUnlocked = 'abuse.sending_unlocked';
    case OwnerWarned = 'abuse.owner_warned';
    case AbuseFlagCleared = 'abuse.flag_cleared';
    case AbuseExemptionChanged = 'abuse.exemption_changed';

    // Defined now, emitted when the features exist.
    case AdminAdded = 'access.admin_added';
    case AdminRemoved = 'access.admin_removed';
    case DelegationWithdrawn = 'access.delegation_withdrawn';

    /** A plain sentence for staff reading the trail. Events with their own summary (customer actions) use that instead. */
    public function label(): string
    {
        return match ($this) {
            self::Registered => 'Account created',
            self::RegistrationAttemptOnExisting => 'Sign-up attempted with an address that already has an account',
            self::EmailVerificationSent => 'Confirmation code sent',
            self::EmailVerified => 'Email address confirmed',
            self::LoginSucceeded => 'Signed in',
            self::LoginFailed => 'Failed sign-in attempt',
            self::LoginThrottled => 'Sign-in slowed after repeated attempts',
            self::Lockout => 'Sign-in locked after repeated failures',
            self::TwoFactorSucceeded => 'Two-factor code accepted',
            self::TwoFactorFailed => 'Two-factor code refused',
            self::RecoveryCodeUsed => 'Recovery code used to sign in',
            self::Logout => 'Signed out',
            self::PasswordResetRequested => 'Password reset requested',
            self::PasswordResetCompleted => 'Password reset completed',
            self::PasswordChanged => 'Password changed',
            self::PasswordConfirmFailed => 'Password re-check failed',
            self::TwoFactorEnrolmentStarted => 'Two-factor setup started',
            self::TwoFactorEnabled => 'Two-factor turned on',
            self::TwoFactorDisabled => 'Two-factor turned off',
            self::RecoveryCodesRegenerated => 'New recovery codes made',
            self::SessionRevoked => 'A signed-in device was ended',
            self::SessionsRevokedAll => 'All other devices were signed out',
            self::AbuseFlagRaised => 'Sending flagged for review',
            self::SendingLimited => 'Sending slowed',
            self::SendingLocked => 'Sending locked',
            self::SendingUnlocked => 'Sending unlocked',
            self::OwnerWarned => 'Owner warned about sending',
            self::AbuseFlagCleared => 'Sending flag cleared',
            self::AbuseExemptionChanged => 'Sending checks switched on or off for a mailbox',
            self::DomainAdded => 'Domain added',
            self::DomainVerified => 'Domain verified',
            self::DomainRecordChanged => 'A DNS record changed',
            self::MailboxCreated => 'Mailbox created',
            self::MailboxQuotaChanged => 'Mailbox quota changed',
            self::MailboxSuspended => 'Mailbox suspended',
            self::MailboxDeleted => 'Mailbox deleted',
            self::AliasSaved => 'Address saved',
            self::AliasRemoved => 'Address removed',
            self::StorageAdded => 'Storage added',
            self::PlanChanged => 'Plan changed',
            self::LogExported => 'Activity log exported',
            self::AdminAdded => 'Administrator invited',
            self::AdminRemoved => 'Administrator removed',
            self::DelegationWithdrawn => 'Agency access withdrawn',
        };
    }
}
