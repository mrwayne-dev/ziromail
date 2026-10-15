export function TickIcon({ size = 17 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 4.6 6.4 11.3 3 7.9" stroke="#1066C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// A list of ticked items.
export default function Ticks({ items, size = 17, className = '' }) {
    return (
        <ul className={`ticks ${className}`.trim()}>
            {items.map((item, i) => (
                <li key={i}>
                    <TickIcon size={size} />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}
