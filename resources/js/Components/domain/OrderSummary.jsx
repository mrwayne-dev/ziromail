import { formatPrice } from '../../Lib/money';

/*
 * The "Your order" panel beside checkout and plan selection. `rows` is
 * [{ label, note, value }]; subtotal, VAT and total always follow, taken from
 * an order built by Lib/order.js.
 */
export default function OrderSummary({ order, rows, totalLabel = 'Total', children }) {
    const { currency, subtotal, vat, total, vatPercent } = order;

    return (
        <aside className="order" aria-label="Order summary">
            <h2>Your order</h2>
            <dl className="o-rows">
                {rows.map((row) => (
                    <div className="o-row" key={row.label}>
                        <dt>
                            {row.label}
                            {row.note && <span className="o-note">{row.note}</span>}
                        </dt>
                        <dd className={row.mono ? 'mono' : undefined}>{row.value}</dd>
                    </div>
                ))}
                <div className="o-row">
                    <dt>Subtotal</dt>
                    <dd>{formatPrice(subtotal, currency)}</dd>
                </div>
                <div className="o-row">
                    <dt>VAT at {vatPercent}%</dt>
                    <dd>{formatPrice(vat, currency)}</dd>
                </div>
            </dl>
            <p className="o-total">
                <span>{totalLabel}</span>
                <b>{formatPrice(total, currency)}</b>
            </p>
            {children}
        </aside>
    );
}
