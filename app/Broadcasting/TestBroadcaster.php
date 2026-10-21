<?php

namespace App\Broadcasting;

use Illuminate\Broadcasting\Broadcasters\Broadcaster;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Broadcaster used by the test suite: calls the ordinary channel-authorisation callbacks from
 * `routes/channels.php` so the test checks the same guards production uses, but drops every
 * outgoing event instead of posting to Reverb. The real `reverb` connection runs in dev and
 * production.
 */
class TestBroadcaster extends Broadcaster
{
    public function auth($request)
    {
        $channel = (string) $request->channel_name;
        $isGuarded = str_starts_with($channel, 'private-') || str_starts_with($channel, 'presence-');
        $name = preg_replace('/^(private|presence)-/', '', $channel) ?? $channel;

        if ($channel === '' || ($isGuarded && ! $this->retrieveUser($request, $name))) {
            throw new AccessDeniedHttpException;
        }

        return $this->verifyUserCanAccessChannel($request, $name);
    }

    /** @param  mixed  $result */
    public function validAuthenticationResponse($request, $result)
    {
        return ['auth' => 'test:signature'];
    }

    /**
     * @param  array<int, string>  $channels
     * @param  array<string, mixed>  $payload
     */
    public function broadcast(array $channels, $event, array $payload = []): void
    {
        // Dropped on purpose: the socket is not run in the test suite.
    }
}
