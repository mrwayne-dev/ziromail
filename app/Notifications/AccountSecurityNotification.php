<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * One notification class for every account-security email (docs/DASHBOARD_BUILD.md
 * 7.13). Queued and sent after the database transaction commits. Bodies never
 * contain a secret, a code or a link that signs the person in.
 */
class AccountSecurityNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  list<string>  $lines
     * @param  array{label: string, url: string}|null  $action
     */
    public function __construct(
        public readonly string $subject,
        public readonly array $lines,
        public readonly ?array $action = null,
    ) {
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)->subject($this->subject)->greeting('Hello,');

        foreach ($this->lines as $line) {
            $mail->line($line);
        }

        if ($this->action !== null) {
            $mail->action($this->action['label'], $this->action['url']);
        }

        return $mail->line('If this was not you, reset your password straight away and tell us on WhatsApp or at support@ziroemail.com.');
    }

    public static function registrationAttempt(): self
    {
        return new self(
            'Someone tried to register with your address',
            ['Someone tried to create a Ziroemail account with this email address, which already has one. Nothing has changed.'],
            ['label' => 'Sign in', 'url' => route('login')],
        );
    }

    public static function lockout(): self
    {
        return new self(
            'Repeated sign-in attempts on your account',
            ['There have been many failed attempts to sign in to your account. Sign in from a new place is paused for 15 minutes. Your own devices keep working.'],
            ['label' => 'Reset your password', 'url' => route('password.request')],
        );
    }

    public static function signInAfterFailures(): self
    {
        return new self(
            'A sign-in succeeded after failed attempts',
            ['Your account was just signed in to after several failed attempts. If that was you, no action is needed.'],
            ['label' => 'Review your sessions', 'url' => route('login')],
        );
    }

    public static function passwordChanged(): self
    {
        return new self(
            'Your password was changed',
            ['The password for your Ziroemail account was just changed, and every other device was signed out.'],
        );
    }

    public static function passwordResetCompleted(): self
    {
        return new self(
            'Your password was reset',
            ['The password for your Ziroemail account was just reset using a link sent to this address. Every device was signed out. Two-factor stays as it was.'],
            ['label' => 'Sign in', 'url' => route('login')],
        );
    }

    public static function twoFactorEnabled(): self
    {
        return new self('Two-factor sign-in is on', ['Two-factor authentication was just turned on for your Ziroemail account.']);
    }

    public static function twoFactorDisabled(): self
    {
        return new self('Two-factor sign-in was turned off', ['Two-factor authentication was turned off for your Ziroemail account and your other devices were signed out.']);
    }

    public static function recoveryCodeUsed(int $remaining): self
    {
        return new self(
            'A recovery code was used to sign in',
            ["One of your recovery codes was just used to sign in. {$remaining} unused codes remain."],
        );
    }

    public static function sessionsRevoked(): self
    {
        return new self('You were signed out everywhere', ['Every other device was signed out of your Ziroemail account.']);
    }
}
