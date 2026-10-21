<?php

use App\Models\Mailbox;
use App\Models\Staff;
use App\Models\User;
use App\Services\AccountContext;
use Illuminate\Support\Facades\Broadcast;

/*
 * Private channels. Each is a short name scoping events to the people who may see them.
 * Nothing is broadcast through them except small signals (a category). The browser fetches
 * the data back through the normal Inertia request, which the server already guards, so there
 * is no second surface for a mistake to leak through.
 *
 * `guards` is set on each channel so the right session guard decides who is signed in, and
 * only that guard. The web and staff guards use separate sessions and must not stand in for
 * each other.
 */

/** The signed-in customer's own channel. The owner's account and verified team members may subscribe. */
Broadcast::channel('account.{userId}', function (User $user, int $userId) {
    return (int) app(AccountContext::class)->owner()->getKey() === (int) $userId;
}, ['guards' => ['web']]);

/** One mailbox's channel: webmail. Only the account that owns the mailbox may subscribe. */
Broadcast::channel('mailbox.{mailboxId}', function (User $user, string $mailboxId) {
    $ownerId = app(AccountContext::class)->owner()->getKey();

    return Mailbox::query()->whereKey($mailboxId)->whereHas('domain', fn ($query) => $query->where('user_id', $ownerId))->exists();
}, ['guards' => ['web']]);

/** The operations console channel. The staff guard enforces who may hold a staff session. */
Broadcast::channel('ops', function (Staff $staff) {
    return $staff !== null;
}, ['guards' => ['staff']]);
