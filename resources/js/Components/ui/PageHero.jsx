import Reveal from '../craft/Reveal';

/*
 * The opening block of an inner page: eyebrow, title, one lead paragraph and
 * optional actions, with room for extra content (switches, a search box) as
 * children. `align` is 'center' or 'left'. The data-hero wrapper gives it the
 * same entry animation as the home page hero.
 */
export default function PageHero({ eyebrow, title, meta, lead, actions, align = 'center', children }) {
    return (
        <section className={`page-hero page-hero-${align}`}>
            <div className="wrap">
                <div className="page-hero-in" data-hero="">
                    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                    <h1>{title}</h1>
                    {meta && <p className="page-hero-meta">{meta}</p>}
                    {lead && <p className="lead">{lead}</p>}
                    {children}
                    {actions && <div className="btn-row">{actions}</div>}
                </div>
            </div>
        </section>
    );
}

// Re-exported so pages can wrap their next block in the same reveal.
export { Reveal };
