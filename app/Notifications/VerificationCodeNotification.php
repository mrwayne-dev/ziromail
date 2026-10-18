<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The confirmation code email. Deliberately not queued: the code has to reach the
 * inbox while the person is still on the screen waiting for it.
 */
class VerificationCodeNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $code,
        public readonly int $minutes,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Your Ziroemail confirmation code: {$this->code}")
            ->greeting('Hello,')
            ->line('Use this code to confirm your email address:')
            ->line("**{$this->code}**")
            ->line("It works once and expires in {$this->minutes} minutes. We will never ask you for it by phone or WhatsApp.")
            ->line('If you did not create a Ziroemail account, you can ignore this email.');
    }
}
