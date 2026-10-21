import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { echo } from '../echo';

/*
 * Subscribe to a private channel and, when its events fire, reload a short list of Inertia
 * props. The payload on the socket is tiny on purpose: a category only. The reload goes
 * through the ordinary controller, which re-checks who may see what, so authorisation is
 * never at the socket.
 *
 * `map` is { category: ['prop', 'prop'] } for the signal "changed" that both events use. A
 * missing category reloads nothing: adding a new category means adding a line here, which is
 * easier to review than a cascade of listeners.
 *
 * Fallback: when no socket is configured or the connection is down, the hook polls at
 * `fallbackMs` and pauses while the tab is hidden. The server does the authorisation on
 * every poll, same as every other Inertia request.
 */
export default function useRealtimeReload({ channel, map, fallbackMs = 60000 }) {
    const latestMap = useRef(map);
    latestMap.current = map;

    useEffect(() => {
        let subscription = null;
        let timer = null;

        function propsFor(category) {
            return latestMap.current?.[category] ?? [];
        }

        function reload(category) {
            const only = propsFor(category);
            if (only.length === 0) return;
            router.reload({ only, preserveScroll: true, preserveState: true });
        }

        function startPolling() {
            stopPolling();
            timer = window.setInterval(() => {
                if (document.hidden) return;
                const union = Array.from(new Set(Object.values(latestMap.current ?? {}).flat()));
                if (union.length === 0) return;
                router.reload({ only: union, preserveScroll: true, preserveState: true });
            }, fallbackMs);
        }

        function stopPolling() {
            if (timer !== null) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (echo) {
            subscription = echo.private(channel);
            subscription.listen('.changed', (payload) => reload(payload?.category));
            // When the socket drops, swap to polling until it comes back.
            echo.connector.pusher.connection.bind('state_change', ({ current }) => {
                if (current === 'connected') stopPolling();
                else startPolling();
            });
            if (echo.connector.pusher.connection.state !== 'connected') startPolling();
        } else {
            // No socket configured for this build (preview, tests): poll only.
            startPolling();
        }

        return () => {
            stopPolling();
            if (subscription) echo.leave(channel);
        };
    }, [channel, fallbackMs]);
}
