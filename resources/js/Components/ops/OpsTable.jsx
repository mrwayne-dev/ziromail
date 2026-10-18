/*
 * The dense console table (table.ops). `caption` names it for screen readers;
 * `head` is the <tr> of column headings. Rows may carry a severity class
 * (`sev-high|med|low`) for the coloured rail on their first cell.
 */
export default function OpsTable({ caption, head, wide = false, className = '', children }) {
    return (
        <div className={`tbl-wrap ${className}`.trim()} tabIndex={0} role="region" aria-label={caption}>
            <table className="ops">
                <caption className="sr-only">{caption}</caption>
                <thead className={wide ? 'wide' : undefined}>{head}</thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

export const severityClass = (severity) => (severity ? `sev-${severity}` : undefined);
