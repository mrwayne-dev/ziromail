/*
 * Question and answer list. Pass the same `items` to faqSchema() so the visible
 * text and the structured data are one source. The first item opens by default.
 *
 *   variant  'plain' (ruled rows) or 'cards' (soft rounded rows with a leading
 *            icon and a chevron). Items may carry an `icon` node for 'cards'.
 */
export default function Faq({ items, openFirst = true, variant = 'plain' }) {
    const cards = variant === 'cards';

    return (
        <div className={cards ? 'faq-cards' : undefined}>
            {items.map((item, i) => (
                <details key={item.q} className={cards ? 'faq-card' : 'faq'} open={openFirst && i === 0}>
                    <summary>
                        {cards && item.icon && <span className="faq-ic" aria-hidden="true">{item.icon}</span>}
                        <span className="faq-q">{item.q}</span>
                        {cards && (
                            <svg className="faq-chev" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path d="M3 5.2 7 9l4-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </summary>
                    <div className="body">{item.a}</div>
                </details>
            ))}
        </div>
    );
}
