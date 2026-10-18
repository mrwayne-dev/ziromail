// Scrollable data table. `caption` is required so the table is named for
// screen readers even when no visible heading sits above it.
export default function Table({ caption, head, children, flush = false, className = '' }) {
    return (
        <div className={`tbl-wrap ${className}`.trim()} tabIndex={0} role="region" aria-label={caption} style={flush ? { borderRadius: 'var(--r-xs)' } : undefined}>
            <table className="data" style={flush ? { minWidth: 0 } : undefined}>
                <caption className="sr-only">{caption}</caption>
                {head && <thead>{head}</thead>}
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}
