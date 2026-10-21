<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Tells an owner that sending on one of their addresses was locked, or that we need them to look at it. */
class SendingRestrictedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly string $address, public readonly string $kind, public readonly string $reason) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)->greeting('Hello,');

        if ($this->kind === 'locked') {
            $message->subject('Sending is paused on '.$this->address)
                ->line('We have paused sending from '.$this->address.'. Mail sent to it still arrives and nothing has been deleted.');
        } else {
            $message->subject('Please look at sending on '.$this->address)
                ->line('We noticed sending from '.$this->address.' that looks unlike its usual pattern. Nothing has been limited.');
        }

        return $message
            ->line('Reason: '.$this->reason)
            ->line('If this is a mistake, or someone else may have used the account, reply to this email and we will look at it straight away.');
    }
}
