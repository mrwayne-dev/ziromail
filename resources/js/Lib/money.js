// Display formatting only. Amounts that are charged come from the server.
const SYMBOL = { NGN: '₦', USD: '$' };

export function symbol(currency) {
    return SYMBOL[currency] ?? '';
}

// `minor` is in kobo / cents. Whole naira are shown without decimals.
export function formatMoney(minor, currency = 'NGN') {
    const major = minor / 100;
    const whole = Number.isInteger(major);
    return major.toLocaleString('en-NG', {
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: 2,
    });
}

export function formatPrice(minor, currency = 'NGN') {
    return symbol(currency) + formatMoney(minor, currency);
}
