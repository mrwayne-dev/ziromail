/*
 * Small status and action glyphs shared by the auth, checkout and onboarding
 * screens. All are decorative (aria-hidden); the text beside them carries the meaning.
 */
const base = { fill: 'none', 'aria-hidden': true };

export function InfoIcon({ size = 17 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7.4v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="8" cy="4.8" r=".9" fill="currentColor" />
        </svg>
    );
}

export function AlertIcon({ size = 17 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.6v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="8" cy="11.2" r=".9" fill="currentColor" />
        </svg>
    );
}

export function CheckIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
            <path d="M13 4.8 6.4 11.4 3 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function CrossIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    );
}

export function ClockIcon({ size = 13 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 4.6V8l2.2 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

export function ChevronDownIcon({ size = 13 }) {
    return (
        <svg width={size} height={Math.round(size * 0.62)} viewBox="0 0 12 8" {...base}>
            <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function HelpIcon({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.2 6a1.8 1.8 0 1 1 2.3 1.7c-.4.2-.5.5-.5.8v.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.4" r=".9" fill="currentColor" />
        </svg>
    );
}

export function LockIcon({ size = 16 }) {
    return (
        <svg width={Math.round(size * 0.82)} height={size} viewBox="0 0 13 16" {...base}>
            <path d="M2 7V4.5a4.5 4.5 0 0 1 9 0V7" stroke="currentColor" strokeWidth="1.6" />
            <rect x="1" y="7" width="11" height="8" rx="2" fill="currentColor" />
        </svg>
    );
}

export function PlusIcon({ size = 15 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" {...base}>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
    );
}

export function MailIcon({ size = 30 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="m3 6.5 9 6.5 9-6.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}

export function BoltIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
            <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
    );
}

export function CopyIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
            <rect x="8" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}
