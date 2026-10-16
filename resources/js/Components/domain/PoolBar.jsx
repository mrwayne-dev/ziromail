/*
 * The stacked bar that shows one plan's pool divided between mailboxes.
 * `segments` is [{ key, gb, label }] and `freeGb` is what is left over; each
 * segment's width is its share of the pool. `over` turns the bar red.
 */
const TONES = ['s1', 's2', 's3', 's4'];

export default function PoolBar({ segments, freeGb, description, over = false }) {
    return (
        <div className={`pool${over ? ' is-over' : ''}`} role="img" aria-label={description}>
            {segments.filter((s) => s.gb > 0).map((s, i) => (
                <span key={s.key} className={`pool-seg ${TONES[i % TONES.length]}`} style={{ flex: s.gb }}>
                    {s.label ?? `${s.gb} GB`}
                </span>
            ))}
            {freeGb > 0 && <span className="pool-seg free" style={{ flex: freeGb }}>{freeGb} free</span>}
        </div>
    );
}
