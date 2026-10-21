<?php

namespace App\Services\MailServer;

use App\Models\Mailbox;

/** Stands in until the mail server is connected: says "not yet" so rows stay `pending`, and keeps nothing. */
class FakeMailServer implements MailServer
{
    public function create(Mailbox $mailbox, ?string $firstPassword): bool
    {
        return false;
    }

    public function setSending(Mailbox $mailbox, string $state): bool
    {
        return false;
    }

    public function suspend(Mailbox $mailbox): bool
    {
        return false;
    }

    public function delete(Mailbox $mailbox): bool
    {
        return false;
    }
}
