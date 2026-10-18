// Thin wrapper over Ziggy's global `route()` (injected by @routes in app.blade.php).
// Pages import this instead of touching `window` so a missing route fails loudly
// in one place.
export function route(name, params, absolute) {
    return window.route(name, withoutEmpty(params), absolute);
}

// A step may not know every value yet (no plan chosen, no address); those keys are left off the URL.
function withoutEmpty(params) {
    if (params === null || typeof params !== 'object' || Array.isArray(params)) return params;
    return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== ''));
}

export function routeIs(pattern) {
    return window.route().current(pattern);
}

// A value from the current route's parameters (e.g. the {mailbox} in /dashboard/mailboxes/{mailbox}).
export function routeParam(name) {
    return window.route().params[name];
}
