/*
 * A single number worth looking at. Shape:
 *   k         short uppercase label
 *   v         the number itself (tabular). `unit` sits beside it at normal size
 *   d         one short line of context (e.g. "limit 2.0%")
 *   delta     { value, tone }       small coloured pill with an arrow
 *   tone      ok | watch | bad | off (grid cell + the delta pill if the pill has no tone)
 *   sparkline [ ... ]                tiny inline SVG below the number
 *   href      wrap the whole tile in a link
 *
 * References:
 *   https://21st.dev/@konsstepnov/components/kpi-tile
 *   https://21st.dev/@arihantcodes_1f7b8c4d/components/insight-cards
 *   https://21st.dev/@appica-dev/components/sparkline
 */

function Sparkline({ points, tone = 'ok' }) {
    if (!points || points.length < 2) return null;
    const w = 112;
    const h = 28;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const step = w / (points.length - 1);
    const x = (i) => +(i * step).toFixed(1);
    const y = (v) => +(h - ((v - min) / span) * (h - 2) - 1).toFixed(1);
    const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
    const colour = tone === 'bad' ? 'var(--ops-bad)' : tone === 'watch' ? 'var(--ops-watch)' : 'var(--blue-700)';

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
            <path d={path} fill="none" stroke={colour} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

function Delta({ delta }) {
    if (!delta) return null;
    const tone = delta.tone ?? (delta.value > 0 ? 'ok' : delta.value < 0 ? 'bad' : null);
    const sign = delta.value > 0 ? '↑' : delta.value < 0 ? '↓' : '•';
    const text = typeof delta.value === 'number' ? `${sign} ${Math.abs(delta.value)}${delta.unit ?? '%'}` : delta.value;

    return <span className={`delta${tone ? ' ' + tone : ''}`} aria-label={delta.label}>{text}</span>;
}

export default function MetricTile({ k, v, unit, d, delta, tone, sparkline, href, srTitle }) {
    const toneClass = tone === 'off' ? 'off' : tone === 'watch' ? 'watch' : tone === 'bad' ? 'bad' : '';
    const inner = (
        <>
            <span className="k">{k}</span>
            <span className="v">
                <span>{v}</span>
                {unit && <span className="unit">{unit}</span>}
            </span>
            {(d || delta) && (
                <span className="d">
                    <Delta delta={delta} />
                    {d && <span>{d}</span>}
                </span>
            )}
            {sparkline && <Sparkline points={sparkline} tone={tone === 'bad' ? 'bad' : tone === 'watch' ? 'watch' : 'ok'} />}
            {srTitle && <span className="sr-only">{srTitle}</span>}
        </>
    );
    const cls = `ops-metric${toneClass ? ' ' + toneClass : ''}`;
    return href ? <a className={cls} href={href}>{inner}</a> : <div className={cls}>{inner}</div>;
}

/* A convenience row for the four or six tiles above a page. */
export function MetricRow({ items, label }) {
    return (
        <section className="ops-metrics" aria-label={label}>
            {items.map((item, i) => <MetricTile key={item.k ?? i} {...item} />)}
        </section>
    );
}
