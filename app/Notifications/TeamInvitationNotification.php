<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Tells someone they were invited to help run a business account. It carries no code and no sign-in link. */
class TeamInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly string $business) {}

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
            ->subject($this->business.' invited you to help run its email on Ziroemail')
            ->greeting('Hello,')
            ->line($this->business.' has added you as an administrator of its Ziroemail account.')
            ->line('Sign in, or create an account with this email address, and confirm the address. The account then appears when you open your dashboard.')
            ->action('Sign in', route('login'))
            ->line('If you were not expecting this, ignore this email: nothing happens until you sign in.');
    }
}
