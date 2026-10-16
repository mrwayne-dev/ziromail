import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { route } from '../../Lib/route';
import PageHero from '../ui/PageHero';

const DOCS = [
    ['legal.terms', 'Terms of service'],
    ['legal.privacy', 'Privacy policy'],
    ['legal.aup', 'Acceptable use'],
    ['legal.refunds', 'Refund policy'],
];

const slug = (text) =>
    text.toLowerCase().replace(/^\d+\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/*
 * Shell for the four legal documents: a page hero, the document on the left and
 * a sticky aside on the right. The aside lists the document's own headings
 * ("On this page", with the current one marked as you scroll) and the other
 * documents. Headings are read from the rendered article, so a document only
 * has to use <h2> for its sections.
 */
export default function LegalDoc({ current, title, meta, intro, children }) {
    const article = useRef(null);
    const [toc, setToc] = useState([]);
    const [active, setActive] = useState(null);

    useEffect(() => {
        const heads = [...article.current.querySelectorAll('h2')];
        heads.forEach((h) => { h.id = slug(h.textContent); });
        setToc(heads.map((h) => ({ id: h.id, text: h.textContent })));

        if (!('IntersectionObserver' in window)) return undefined;
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-90px 0px -65% 0px' },
        );
        heads.forEach((h) => io.observe(h));
        return () => io.disconnect();
    }, [title]);

    return (
        <>
            <PageHero align="left" eyebrow="Legal" title={title} meta={meta} lead={intro} />
            <section className="legal-body">
                <div className="wrap legal-grid">
                    <article ref={article} className="doc">{children}</article>
                    <aside className="legal-aside">
                        {toc.length > 0 && (
                            <nav aria-label="On this page">
                                <p className="legal-kicker">On this page</p>
                                <ul className="toc">
                                    {toc.map((item) => (
                                        <li key={item.id}>
                                            <a href={`#${item.id}`} aria-current={active === item.id ? 'true' : undefined}>{item.text}</a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        )}
                        <nav aria-label="Legal documents">
                            <p className="legal-kicker">Legal documents</p>
                            <ul className="toc">
                                {DOCS.map(([name, label]) => (
                                    <li key={name}>
                                        <Link href={route(name)} aria-current={name === current ? 'page' : undefined}>{label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>
                </div>
            </section>
        </>
    );
}
