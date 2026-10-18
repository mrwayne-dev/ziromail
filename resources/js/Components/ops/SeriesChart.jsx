/*
 * One small chart for the console, two shapes:
 *   line  a trend line over an area, with an optional dashed limit line
 *   bars  one bar per point, each in the tone its point names ('base', 'hot', 'now', 'plain')
 * `points` are { label, value, tone? }. `label` is the text alternative: charts are
 * images to a screen reader, so say what the shape means ("flat, then a spike").
 * Colour is never the only signal: the limit is dashed and bars carry their value
 * in the axis text the page prints beneath.
 */
export default function SeriesChart({ kind = 'line', points, limit, max, label, height }) {
    if (kind === 'bars') {
        const top = max ?? Math.max(...points.map((point) => point.value), 1);

        return (
            <div className="series-bars" role="img" aria-label={label} style={height ? { height } : undefined}>
                {points.map((point, index) => (
                    <span key={`${point.label}-${index}`} className={`bar ${point.tone ?? 'plain'}`} style={{ height: `${Math.max((point.value / top) * 100, 1)}%` }} />
                ))}
            </div>
        );
    }

    const width = 280;
    const box = 60;
    const top = max ?? Math.max(limit ?? 0, ...points.map((point) => point.value)) * 1.05;
    const y = (value) => box - (value / top) * box;
    const x = (index) => (points.length === 1 ? 0 : (index / (points.length - 1)) * width);
    const line = points.map((point, index) => `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ');

    return (
        <svg className="series-line" viewBox={`0 0 ${width} ${box}`} preserveAspectRatio="none" role="img" aria-label={label}>
            <path className="area" d={`M${line.replace(/ /g, ' ')} V${box} H0Z`} />
            <path className="ln" d={`M${line}`} />
            {limit !== undefined && <path className="lim" d={`M0,${y(limit).toFixed(1)} H${width}`} />}
        </svg>
    );
}
