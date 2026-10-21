<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A signal that something staff watch changed: a new signup, a new abuse flag, a sending state
 * change, a batch of mail events ingested. Category only; the console refetches the piece.
 */
class OpsChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly string $category) {}

    public static function fire(string $category): void
    {
        broadcast(new self($category));
    }

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('ops')];
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
