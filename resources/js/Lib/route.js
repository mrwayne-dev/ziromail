// Thin wrapper over Ziggy's global `route()` (injected by @routes in app.blade.php).
// Pages import this instead of touching `window` so a missing route fails loudly
// in one place.
export function route(name, params, absolute) {
    return window.route(name, params, absolute);
}

export function routeIs(pattern) {
    return window.route().current(pattern);
}
