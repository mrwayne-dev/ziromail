import { asOf } from '../fixtures/organisation';

/*
 * Display helpers for the signed-in screens. Every relative time is measured
 * from one reference moment (`asOf`) so the demo organisation reads the same
 * on every screen and in every test. With a backend, `now` is the server time.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const referenceTime = () => new Date(asOf).getTime();

/*
 * Guard against null/undefined/empty input: `new Date(null)` is `new Date(0)`
 * which renders as 1 Jan 1970 and reads to the user as a real-but-wrong date.
 * Return the em-dash so missing values look missing, not fictional. Every
 * date-rendering path on the dashboard goes through this helper, so the fix
 * lives here once rather than per caller.
 */
const EM_DASH = '—';

export function formatDate(value, { year = true } = {}) {
    if (value === null || value === undefined || value === '') return EM_DASH;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return EM_DASH;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}), timeZone: 'Africa/Lagos' });
}

export function formatTime(value) {
    if (value === null || value === undefined || value === '') return EM_DASH;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return EM_DASH;
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
}

export function formatRelative(value, now = referenceTime()) {
    if (!value) return 'Never';
    const gap = now - new Date(value).getTime();
    if (gap < MINUTE) return 'Just now';
    if (gap < HOUR) return `${Math.floor(gap / MINUTE)} min ago`;
    if (gap < DAY) return `${Math.floor(gap / HOUR)} hr ago`;
    if (gap < 2 * DAY) return 'Yesterday';
    if (gap < 30 * DAY) return `${Math.floor(gap / DAY)} days ago`;
    return formatDate(value);
}

// 13.5 -> "13.5 GB"; whole numbers drop the decimal.
export function formatGb(gb) {
    const rounded = Math.round(gb * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} GB`;
}

export function pluralise(count, one, many = `${one}s`) {
    return `${count} ${count === 1 ? one : many}`;
}

export function initials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
}

export function greeting(now = referenceTime()) {
    const hour = Number(new Date(now).toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Africa/Lagos' }));
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// The time a mail list shows: the clock for today, then Yesterday, a weekday for this week, else a date.
export function formatMailTime(value, now = referenceTime()) {
    const gap = now - new Date(value).getTime();
    const dayKey = (instant) => new Date(instant).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const sameDay = dayKey(value) === dayKey(now);
    if (sameDay) return formatTime(value);
    if (gap < 2 * DAY) return 'Yesterday';
    if (gap < 7 * DAY) return new Date(value).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Africa/Lagos' });
    return formatDate(value, { year: false });
}

export function formatLongTime(value, now = referenceTime()) {
    const when = formatMailTime(value, now);
    return when.includes(':') ? `Today, ${when}` : `${when}, ${formatTime(value)}`;
}

export function formatDay(value) {
    return new Date(value).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
}
