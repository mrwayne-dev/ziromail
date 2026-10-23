/*
 * The one section header the console uses. `eyebrow`, `title`, `description`, `badge`, `actions`.
 * Replaces every page's ad-hoc `.ops-head` and `.between` title row. One pattern, consistent gutters.
 * See docs/BUILD_LOG.md "ops console redesign" and references in resources/css/pages/ops.css.
 */
export default function SectionHeader({ eyebrow, title, description, badge, actions }) {
    return (
        <header className="ops-head">
            <div>
                {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                <h1>{title}{badge && <span className="ops-pill info" style={{ marginLeft: 10, verticalAlign: 'middle' }}>{badge}</span>}</h1>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="actions">{actions}</div>}
        </header>
    );
}

/*
 * A smaller section heading used below the page's H1 to introduce a sub-block.
 * `tLink` is the "see all" link on the right.
 */
export function SubSection({ title, description, tLink, actions, children, id }) {
    return (
        <section aria-labelledby={id}>
            <div className="ops-sec-head">
                <div>
                    <h2 id={id}>{title}</h2>
                    {description && <p>{description}</p>}
                </div>
                {tLink
                    ? <a className="tlink" href={tLink.href}>{tLink.label}</a>
                    : actions ? <div style={{ display: 'inline-flex', gap: 8 }}>{actions}</div> : null}
            </div>
            {children}
        </section>
    );
}
