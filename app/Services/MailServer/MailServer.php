<?php

namespace App\Services\MailServer;

use App\Models\Mailbox;

/**
 * The only door to the real mail server. Controllers never talk to it directly: they write
 * the mailbox row and hand it here. Until the server is connected, FakeMailServer answers.
 * Secrets (a first password) are passed through and never stored by us.
 */
interface MailServer
{
    /** Create the mailbox on the server. Returns true when the server confirmed it. */
    public function create(Mailbox $mailbox, ?string $firstPassword): bool;

    /**
     * Apply a sending restriction: `normal`, `limited` (a low hourly cap) or `locked` (no sending, receiving continues).
     * Returns true when the server confirmed it.
     */
    public function setSending(Mailbox $mailbox, string $state): bool;

    public function suspend(Mailbox $mailbox): bool;

    public function delete(Mailbox $mailbox): bool;
}
