const TONE = { ok: 'pill-ok', warn: 'pill-warn', bad: 'pill-bad', info: 'pill-info', muted: 'pill-mut', glass: 'pill-glass' };

export default function Pill({ tone = 'muted', dot = false, className = '', children }) {
    return (
        <span className={`pill ${TONE[tone]} ${className}`.trim()}>
            {dot && <span className={`dot dot-${tone === 'muted' ? '' : tone}`.trim()} aria-hidden="true" />}
            {children}
        </span>
    );
}
