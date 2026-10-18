// A small JSON client for the endpoints that return data instead of a page (two-factor
// setup, the session list). It sends the XSRF cookie value Laravel expects, so these
// calls are CSRF protected exactly like Inertia visits.
function xsrfToken() {
    const match = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.split('=')[1]) : '';
}

export async function requestJson(method, url, body) {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    return { ok: response.ok, status: response.status, data };
}

// The first validation message for a field, from Laravel's { errors: { field: [..] } } shape.
export function firstError(result, field) {
    return result?.data?.errors?.[field]?.[0] ?? result?.data?.message ?? null;
}
