/*
 * The short explanatory cards beside an onboarding form. `items` is
 * [{ title, body }]; `body` may be text or nodes.
 */
export default function AsideCards({ items, children }) {
    return (
        <aside className="aside-cards">
            {items.map((item) => (
                <section key={item.title} className="aside-card">
                    <h2>{item.title}</h2>
                    <p>{item.body}</p>
                </section>
            ))}
            {children}
        </aside>
    );
}
