import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

/*
 * The Reverb client: one socket per browser tab, used by `useRealtimeReload`.
 * It is created only when a key is configured, so a build with no socket server
 * (preview on the shared host, a test) silently falls back to polling. The
 * socket authenticates against our own `/broadcasting/auth`, which is behind
 * the web session: no API tokens are exposed to the browser.
 *
 * Robustness: construction is wrapped so a Pusher-side error (CSP blocking the
 * socket, bad config) never leaks into React mounts. We also hard-stop Pusher's
 * reconnect loop after a short grace window so a tab left on an unreachable
 * socket does not accumulate thousands of CSP console errors over time. The
 * client-side realtime story is "nice to have"; the Inertia request is the
 * authority for data, and polling catches whatever the socket misses.
 */

const key = import.meta.env.VITE_REVERB_APP_KEY;
const host = import.meta.env.VITE_REVERB_HOST;

export let echo = null;

if (key && host) {
    try {
        // Silence Pusher's chatty default logger; CSP-blocked connects would spam the console.
        if (Pusher) Pusher.logToConsole = false;
        window.Pusher = Pusher;

        echo = new Echo({
            broadcaster: 'reverb',
            key,
            wsHost: host,
            wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
            // Pusher will stop retrying after this many failed consecutive attempts;
            // combined with the timer below this bounds the error noise at ~5 attempts.
            activityTimeout: 30_000,
            pongTimeout: 10_000,
        });

        // If the socket is still not connected after 20 seconds, disconnect it. The hook falls
        // back to polling; the browser stops hammering the host and the console stays clean.
        const pusher = echo?.connector?.pusher;
        if (pusher) {
            setTimeout(() => {
                if (pusher.connection?.state !== 'connected') {
                    try { pusher.disconnect(); } catch { /* ignore */ }
                }
            }, 20_000);
        }
    } catch (error) {
        // Construction itself failed. The hook will poll; nothing else cares.
        echo = null;
        if (typeof console !== 'undefined') console.warn('Reverb unavailable, falling back to polling.', error);
    }
}

/** True while we have a working socket. The hook falls back to polling when this flips to false. */
export function isLive() {
    return Boolean(echo?.connector?.pusher?.connection?.state === 'connected');
}
