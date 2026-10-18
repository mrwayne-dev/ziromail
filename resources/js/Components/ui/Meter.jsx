/*
 * A usage bar. The tone follows how full it is: normal, then warn from 80%, then
 * bad from 95% (the thresholds the dashboard copy promises). `label` is the
 * accessible description, e.g. "6.1 of 8 GB used".
 */
export function meterTone(fraction) {
    if (fraction >= 0.95) return 'bad';
    if (fraction >= 0.8) return 'warn';
    return 'ok';
}

const CLASS = { ok: '', warn: ' meter-warn', bad: ' meter-bad' };

export default function Meter({ used, total, label, className = '' }) {
    const fraction = total > 0 ? Math.min(used / total, 1) : 0;

    return (
        <div
            className={`meter${CLASS[meterTone(fraction)]} ${className}`.trim()}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={Math.min(used, total)}
            aria-label={label}
        >
            <i style={{ width: `${Math.round(fraction * 100)}%` }} />
        </div>
    );
}
