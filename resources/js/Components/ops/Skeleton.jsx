/*
 * Shape skeletons for ops cards and tables. The shapes mirror the real content so a
 * loading page reads like the final page in grey. Respects `prefers-reduced-motion`
 * (CSS keyframes gated on the media query).
 *
 * Reference:
 *   https://21st.dev/@ai2/components/skeleton-shapes
 *   https://21st.dev/@cnippet-dev/components/v-skeleton-8
 */

export function Skeleton({ w = '100%', h = 14, radius = 6, inline = false }) {
    const style = { width: typeof w === 'number' ? `${w}px` : w, height: typeof h === 'number' ? `${h}px` : h, borderRadius: typeof radius === 'number' ? `${radius}px` : radius };
    return <span className="ops-skel" style={{ display: inline ? 'inline-block' : 'block', ...style }} aria-hidden="true" />;
}

/* One empty row inside a DataTable, keyed off the column list so the shape matches. */
export function SkeletonRow({ columns }) {
    return (
        <tr aria-hidden="true">
            {columns.map((col, i) => (
                <td key={col.id ?? i} className={[col.align === 'num' ? 'num' : '', col.mono ? 'mono' : ''].filter(Boolean).join(' ') || undefined}>
                    <Skeleton w={col.align === 'num' ? 48 : (i === 0 ? '70%' : '60%')} h={14} />
                </td>
            ))}
        </tr>
    );
}

/* A metric tile placeholder: label, big number, delta. */
export function SkeletonMetric() {
    return (
        <div className="ops-metric" aria-hidden="true">
            <span className="k"><Skeleton w={72} h={10} radius={4} /></span>
            <span className="v" style={{ paddingTop: 8, paddingBottom: 6 }}><Skeleton w={88} h={26} /></span>
            <span className="d"><Skeleton w={56} h={16} radius={999} inline /></span>
        </div>
    );
}

/* A row of n metric tile skeletons that match the real MetricRow shape. */
export function SkeletonMetricRow({ count = 4, label = 'Loading figures' }) {
    return (
        <section className="ops-metrics" aria-label={label}>
            {Array.from({ length: count }, (_, i) => <SkeletonMetric key={i} />)}
        </section>
    );
}

/* A list-row placeholder for ListRow / ActivityFeed. */
export function SkeletonListRow({ withMeta = false }) {
    return (
        <div className="ops-row" aria-hidden="true">
            <span className="ops-row-ic"><Skeleton w={16} h={16} radius={4} /></span>
            <span className="ops-row-body" style={{ display: 'grid', gap: 6 }}>
                <Skeleton w="70%" h={13} />
                {withMeta && <Skeleton w="40%" h={11} />}
            </span>
            <span className="ops-row-time"><Skeleton w={56} h={11} /></span>
        </div>
    );
}

export function SkeletonList({ rows = 4, withMeta = false, ariaLabel = 'Loading list' }) {
    return (
        <div className="ops-rows" role="list" aria-label={ariaLabel}>
            {Array.from({ length: rows }, (_, i) => <SkeletonListRow key={i} withMeta={withMeta} />)}
        </div>
    );
}

/* Chart placeholder: the frame + a flat shimmer where the line/bars would be. */
export function SkeletonChart({ height = 76 }) {
    return (
        <div aria-hidden="true" style={{ padding: '4px 0' }}>
            <Skeleton w="100%" h={height} radius={10} />
        </div>
    );
}

/* A full card: header line, lede, and a few list rows. */
export function SkeletonCard({ rows = 3 }) {
    return (
        <section className="ops-card" aria-hidden="true">
            <Skeleton w={140} h={16} />
            <div style={{ marginTop: 6 }}><Skeleton w="60%" h={12} /></div>
            <div style={{ marginTop: 14 }}>
                <SkeletonList rows={rows} />
            </div>
        </section>
    );
}
