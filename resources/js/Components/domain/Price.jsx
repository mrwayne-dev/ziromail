import usePricingState from '../../Hooks/usePricingState';
import { formatMoney, symbol } from '../../Lib/money';

/*
 * A price in whichever term and currency the visitor has chosen. `price` is
 * { NGN: { monthly, yearly }, USD: { ... } } in minor units. The unit label
 * ("/ domain / year") comes from `unit`, called with the current term.
 */
export default function Price({ price, unit, wrapper: Wrapper = 'b' }) {
    const { term, currency } = usePricingState();
    const minor = price[currency][term === 'annual' ? 'yearly' : 'monthly'];

    return (
        <>
            <Wrapper>
                <span>{symbol(currency)}</span>
                <span>{formatMoney(minor, currency)}</span>
            </Wrapper>
            {unit && <span>{unit(term)}</span>}
        </>
    );
}
