import usePricingState, { setTerm } from '../../Hooks/usePricingState';

const OPTIONS = [
    { value: 'annual', label: 'Pay yearly' },
    { value: 'monthly', label: 'Pay monthly' },
];

export default function TermSwitch() {
    const { term } = usePricingState();
    return (
        <div className="tg" role="group" aria-label="Billing term">
            {OPTIONS.map((o) => (
                <button key={o.value} type="button" aria-pressed={term === o.value} onClick={() => setTerm(o.value)}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}
