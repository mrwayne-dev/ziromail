// Question and answer list. Pass the same `items` to faqSchema() so the visible
// text and the structured data are one source. The first item opens by default.
export default function Faq({ items, openFirst = true }) {
    return (
        <>
            {items.map((item, i) => (
                <details key={item.q} className="faq" open={openFirst && i === 0}>
                    <summary>{item.q}</summary>
                    <div className="body">{item.a}</div>
                </details>
            ))}
        </>
    );
}
