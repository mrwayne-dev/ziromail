/*
 * Named variants of the demo organisation, for reaching states without editing
 * data. Selected by `?scenario=` and honoured only while `site.prototype` is
 * true, so a real account can never be shown a staged state. Each scenario
 * returns a changed copy; the default is `healthy`.
 */
const clone = (value) => JSON.parse(JSON.stringify(value));

const patchDomain = (org, id, changes) => {
    org.domains = org.domains.map((domain) => (domain.id === id ? { ...domain, ...changes } : domain));
};
const patchSubscription = (org, id, changes) => {
    org.subscriptions = org.subscriptions.map((sub) => (sub.domainId === id ? { ...sub, ...changes } : sub));
};
const patchMailbox = (org, id, changes) => {
    org.mailboxes = org.mailboxes.map((mailbox) => (mailbox.id === id ? { ...mailbox, ...changes } : mailbox));
};

export const scenarios = {
    healthy: (org) => org,

    'spf-drift': (org) => {
        patchDomain(org, 'dom_foods', { recordsPassing: 3, healthNote: 'SPF needs fixing' });
        return org;
    },

    'past-due': (org) => {
        patchSubscription(org, 'dom_foods', { status: 'past_due', graceEndsAt: '2026-10-06' });
        return org;
    },

    'over-quota': (org) => {
        patchMailbox(org, 'mb_sales', { usedGb: 7.9, state: 'near_full' });
        return org;
    },

    'pool-full': (org) => {
        patchMailbox(org, 'mb_victory', { quotaGb: 26 });
        patchDomain(org, 'dom_foods', { assignedGb: 40 });
        return org;
    },

    'empty-mailbox': (org) => {
        org.mailboxes = org.mailboxes.filter((mailbox) => mailbox.domainId !== 'dom_export');
        patchDomain(org, 'dom_export', { mailboxCount: 0, assignedGb: 0, usedGb: 0 });
        return org;
    },

    'locked-sending': (org) => {
        patchMailbox(org, 'mb_sales', { state: 'locked' });
        return org;
    },
};

export function applyScenario(org, name) {
    const apply = scenarios[name] ?? scenarios.healthy;
    return apply(clone(org));
}

export const scenarioNames = Object.keys(scenarios);
