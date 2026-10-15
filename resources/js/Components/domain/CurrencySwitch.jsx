import usePricingState, { setCurrency } from '../../Hooks/usePricingState';
import { symbol } from '../../Lib/money';

const OPTIONS = [
    { value: 'NGN', label: 'Naira' },
    { value: 'USD', label: 'Dollar' },
];

export default function CurrencySwitch() {
    const { currency } = usePricingState();
    return (
        <div className="tg" role="group" aria-label="Currency">
            {OPTIONS.map((o) => (
                <button key={o.value} type="button" aria-pressed={currency === o.value} onClick={() => setCurrency(o.value)}>
                    {symbol(o.value)} {o.label}
                </button>
            ))}
        </div>
    );
}
