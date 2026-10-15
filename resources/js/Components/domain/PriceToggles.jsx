import CurrencySwitch from './CurrencySwitch';
import TermSwitch from './TermSwitch';

// The term and currency switches side by side, as used above every price list.
export default function PriceToggles() {
    return (
        <div className="toggles">
            <TermSwitch />
            <CurrencySwitch />
        </div>
    );
}
