/*
 * PLACEHOLDER onboarding data: the domain being connected, its four DNS records
 * and how they change between checks, the registrars we know, the starting
 * mailboxes, and what the finished state reports.
 *
 * `records` is shaped like the future GET /domains/{id}/records response: one
 * entry per record with a `status` of passing, needs_fix, waiting or missing.
 * `checks` stands in for the resolver. Each entry is the status of every record
 * after one more "check now"; the last entry is the settled state.
 *
 * Plans and prices are not here. They come from fixtures/plans.js.
 */
export const onboardingFixture = {
    domain: 'adaobifoods.com',
    plan: 'business',

    steps: [
        { key: 'domain', label: 'Domain' },
        { key: 'plan', label: 'Plan & payment' },
        { key: 'records', label: 'Records' },
        { key: 'mailboxes', label: 'Mailboxes' },
    ],

    // How the customer pays for the plan, as offered on the plan step.
    payment: [
        { value: 'card', title: 'Card', description: 'Naira or dollar card. Your domain is active the moment payment clears.' },
        { value: 'transfer', title: 'Bank transfer', description: 'We send account details and activate as soon as it lands, usually within a few hours on a working day.' },
    ],

    // What the domain check reports about the domain as it stands today.
    domainCheck: {
        available: true,
        currentProvider: 'Google Workspace',
        importsMail: true,
    },

    records: {
        checkedAt: '2 minutes ago',
        items: [
            {
                id: 'mx',
                type: 'MX',
                title: 'where your mail is delivered',
                fields: [
                    { key: 'host', label: 'Host', value: '@' },
                    { key: 'target', label: 'Points to', value: 'mx.ziroemail.com' },
                    { key: 'priority', label: 'Priority', value: '10' },
                ],
                status: 'passing',
                messages: {
                    passing: 'Verified 2 minutes ago',
                },
            },
            {
                id: 'spf',
                type: 'SPF',
                title: 'who may send as you',
                fields: [
                    { key: 'host', label: 'Host', value: '@' },
                    {
                        key: 'value',
                        label: 'Value (replaces your current SPF record)',
                        value: 'v=spf1 include:_spf.google.com include:_spf.ziroemail.com ~all',
                        hint: 'Not sure? Send us a screenshot and we will tell you exactly what to paste.',
                    },
                ],
                status: 'needs_fix',
                messages: {
                    passing: 'Verified just now',
                    needs_fix: 'Found, but it conflicts with a record already on your domain',
                },
                conflict: {
                    title: 'Your domain already has an SPF record',
                    found: 'v=spf1 include:_spf.google.com ~all',
                    advice: 'A domain may only have one. Replace it with the merged value below, which keeps Google working alongside us.',
                },
            },
            {
                id: 'dkim',
                type: 'DKIM',
                title: 'the signature on every message',
                fields: [
                    { key: 'host', label: 'Host', value: 'ziro._domainkey' },
                    {
                        key: 'value',
                        label: 'Value',
                        value: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f2Xn7pQ',
                        hint: 'This value is long. Use the copy button rather than typing it. One wrong character stops it verifying.',
                    },
                ],
                status: 'waiting',
                messages: {
                    passing: 'Verified just now',
                    waiting: 'Not found yet',
                },
            },
            {
                id: 'dmarc',
                type: 'DMARC',
                title: 'what to do with failures',
                fields: [
                    { key: 'host', label: 'Host', value: '_dmarc' },
                    { key: 'value', label: 'Value', value: 'v=DMARC1; p=none; rua=mailto:dmarc@ziroemail.com' },
                ],
                status: 'missing',
                messages: {
                    passing: 'Verified just now',
                    missing: 'Not found after repeated checks. Add the record below',
                },
            },
        ],
    },

    // Status of [mx, spf, dkim, dmarc] after each successive check. Index 0 is the opening state.
    checks: [
        ['passing', 'needs_fix', 'waiting', 'missing'],
        ['passing', 'needs_fix', 'passing', 'waiting'],
        ['passing', 'passing', 'passing', 'passing'],
    ],

    registrars: [
        { key: 'whogohost', name: 'Whogohost', oneClick: false },
        { key: 'qservers', name: 'Qservers', oneClick: false },
        { key: 'godaddy', name: 'GoDaddy', oneClick: true },
        { key: 'namecheap', name: 'Namecheap', oneClick: true },
        { key: 'domainking', name: 'DomainKing', oneClick: false },
        { key: 'truehost', name: 'Truehost', oneClick: false },
        { key: 'cloudflare', name: 'Cloudflare', oneClick: true },
        { key: 'other', name: 'Somewhere else', oneClick: false },
    ],

    mailboxes: {
        step: 0.5,
        initial: [
            { id: 'm1', local: 'victory', quotaGb: 12, owner: true },
            { id: 'm2', local: 'sales', quotaGb: 8, owner: false },
            { id: 'm3', local: 'ngozi', quotaGb: 2, owner: false },
        ],
        // Where each mailbox's phone-setup QR points once real signed tokens exist.
        setupUrlBase: 'https://ziroemail.com/setup/fixture-',
    },

    done: {
        filtering: true,
        importMinutesRemaining: 40,
    },
};
