/* The row of figure tiles at the top of a console page. `items` are { k, v, d, tone?, alert? }. */
export default function Metrics({ items, label }) {
    return (
        <section aria-label={label}>
            <div className="metrics">
                {items.map((item) => (
                    <div className={`metric${item.alert ? ' alert' : ''}`} key={item.k}>
                        <span className="k">{item.k}</span>
                        <span className="v">{item.v}</span>
                        <span className={`d${item.tone ? ` ${item.tone}` : ''}`}>{item.d}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
