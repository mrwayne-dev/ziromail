<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A signal that something on an account's data changed. The payload is tiny on purpose: just
 * the account id and a category. The browser decides which prop to reload and that reload
 * goes through the normal controller, which re-checks who may see what. Nothing sensitive
 * ever travels on the socket.
 */
class AccountChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly int $accountId, public readonly string $category) {}

    public static function for(User $owner, string $category): void
    {
        broadcast(new self((int) $owner->getKey(), $category));
    }

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('account.'.$this->accountId)];
    }

    public function broadcastAs(): string
    {
        return 'changed';
    }

    /**
     * @return array<string, string>
     */
    public function broadcastWith(): array
    {
        return ['category' => $this->category];
    }
}
