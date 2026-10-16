// Accepts what people actually paste: "https://www.Example.com/page" becomes "example.com".
export function normaliseDomain(raw) {
    return raw
        .trim()
        .toLowerCase()
        .replace(/^[a-z]+:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[/?#].*$/, '');
}

const VALID = /^(?!-)(?:[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,24}$/;

export function isValidDomain(domain) {
    return VALID.test(domain);
}

/*
 * Checks the shape of what was typed and says what is wrong in plain words.
 * Returns { domain, error }: `domain` is the cleaned value, `error` is '' when it is fine.
 */
export function checkDomainInput(raw) {
    const domain = normaliseDomain(raw);
    if (!domain) {
        return { domain, error: 'Type the domain your business already owns, for example yourbusiness.com.' };
    }
    if (!isValidDomain(domain)) {
        return { domain, error: `"${domain}" does not look like a domain. Use a name and an ending, like yourbusiness.com.` };
    }
    return { domain, error: '' };
}
