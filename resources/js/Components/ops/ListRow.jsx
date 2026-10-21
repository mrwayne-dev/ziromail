import { Link } from '@inertiajs/react';

/*
 * One row in a list inside an ops card. Icon tile on the left, two-line label in the middle,
 * optional status pill, timestamp on the right. Rows share vertical rhythm, hover state and
 * (optional) link target.
 *
 *   icon       lucide-react icon component (optional)
 *   title      the first line (bold)
 *   detail     the second line (muted)
 *   meta       small text under the detail (optional)
 *   status     short label; renders as the ops-pill class
 *   timestamp  right-aligned, usually a formatted relative time
 *   href       whole row becomes a Link
 *
 * References:
 *   https://21st.dev/@olewandowski1/components/activity-3   icon tile + two-line title + tag + time
 *   https://21st.dev/@felipemenezes098/components/item-19   vertical rhythm
 */

const TONE_CLASS = { ok: 'ops-pill ok', watch: 'ops-pill watch', bad: 'ops-pill bad', info: 'ops-pill info', neutral: 'ops-pill' };

export default function ListRow({ icon: Icon, title, detail, meta, status, timestamp, href, onClick }) {
    const inner = (
        <>
            {Icon && (
                <span className="ops-row-ic" aria-hidden="true">
                    <Icon size={16} strokeWidth={1.6} />
                </span>
            )}
            <span className="ops-row-body">
                <span className="ops-row-title">{title}</span>
                {detail && <span className="ops-row-detail">{detail}</span>}
                {meta && <span className="ops-row-meta">{meta}</span>}
            </span>
            {status && <span className={TONE_CLASS[status.tone ?? 'neutral']}>{status.label ?? status}</span>}
            {timestamp && <span className="ops-row-time">{timestamp}</span>}
        </>
    );
    const className = `ops-row${href || onClick ? ' ops-row-link' : ''}`;
    if (href) return <Link href={href} className={className}>{inner}</Link>;
    if (onClick) return <button type="button" className={className} onClick={onClick}>{inner}</button>;
    return <div className={className}>{inner}</div>;
}

/* A sized stack of ListRows. Keeps the shared rhythm and borders. */
export function RowList({ children, ariaLabel }) {
    return <div className="ops-rows" role="list" aria-label={ariaLabel}>{children}</div>;
}
