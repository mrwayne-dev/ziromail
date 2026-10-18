import { onboardingFixture } from './onboarding';
import { organisationFixture } from './organisation';
import { plansFixture } from './plans';
import { applyScenario } from './scenarios';
import { poolSummary } from '../Lib/pool';

/*
 * Selectors that return each owner-dashboard page's props, shaped like the
 * future controller responses (docs/DASHBOARD_UI_MAP.md §5.3). A page calls one
 * of these where it will later read `usePage().props`.
 */
const planOf = (code) => plansFixture.plans.find((plan) => plan.code === code);

function organisationFor(scenario) {
    return applyScenario(organisationFixture, scenario);
}

// Alerts are derived, not authored (UI_MAP §1.6): the rules run here so the page never has to.
export function deriveAlerts(domain, mailboxes, subscription) {
    const alerts = [];

    if (subscription.status === 'past_due') {
        alerts.push({
            id: 'past-due', kind: 'bad',
            title: 'Your last payment did not go through',
            body: 'Mail keeps working while we retry. Pay before the grace period ends to avoid a pause on sending.',
            cta: { label: 'Go to billing', routeName: 'dashboard.billing' },
        });
    }

    if (domain.recordsPassing < domain.recordsTotal) {
        alerts.push({
            id: 'records', kind: 'bad',
            title: domain.healthNote === 'DKIM missing' ? 'DKIM has never been added for this domain' : `${domain.name} has a record that needs fixing`,
            body: domain.healthNote === 'DKIM missing'
                ? 'Without it your messages are unsigned, and Gmail and Outlook are placing some of them in spam. This is the one record still missing.'
                : 'One of your DNS records stopped matching. Mail may start landing in spam until it is fixed.',
            cta: { label: 'Open the domain', routeName: 'dashboard.domains.show', params: { domain: domain.id } },
        });
    }

    mailboxes
        .filter((mailbox) => mailbox.usedGb / mailbox.quotaGb >= 0.75 && mailbox.state !== 'locked')
        .forEach((mailbox) => {
            alerts.push({
                id: `quota-${mailbox.id}`, kind: 'warn',
                title: `${mailbox.local}@${domain.name} is nearly full`,
                body: `It is using ${mailbox.usedGb} GB of ${mailbox.quotaGb} GB. At 100% it stops receiving mail; queued mail is held, not discarded.`,
                cta: { label: 'Raise the quota', routeName: 'dashboard.mailboxes.show', params: { mailbox: mailbox.id } },
            });
        });

    mailboxes
        .filter((mailbox) => mailbox.state === 'locked')
        .forEach((mailbox) => {
            alerts.push({
                id: `locked-${mailbox.id}`, kind: 'bad',
                title: `Sending is paused for ${mailbox.local}@${domain.name}`,
                body: 'We saw unusual sending and stopped it to protect your reputation. Receiving continues. Contact support to review and lift the pause.',
                cta: { label: 'Contact support', routeName: 'dashboard.help' },
            });
        });

    return alerts;
}

export function overviewProps(domainId, scenario = 'healthy') {
    const org = organisationFor(scenario);
    const domain = org.domains.find((candidate) => candidate.id === domainId) ?? org.domains[0];
    const mailboxes = org.mailboxes.filter((mailbox) => mailbox.domainId === domain.id);
    const subscription = org.subscriptions.find((sub) => sub.domainId === domain.id);
    const plan = planOf(domain.planCode);
    const pool = poolSummary(domain, mailboxes);

    return {
        org: { id: org.id, name: org.name, owner: org.owner },
        domain,
        stats: {
            mailboxCount: mailboxes.length,
            usedGb: pool.usedGb,
            poolGb: pool.poolGb,
            assignedGb: pool.assignedGb,
            planName: plan.name,
            renewsAt: subscription.renewsAt,
            recordsPassing: domain.recordsPassing,
            recordsTotal: domain.recordsTotal,
            healthNote: domain.healthNote,
        },
        alerts: deriveAlerts(domain, mailboxes, subscription),
        mailboxes,
        subscription: { ...subscription, planName: plan.name, poolGb: pool.poolGb },
        activity: org.activity.filter((item) => item.domainId === domain.id).slice(0, 3),
    };
}

const MAILBOX_EXTRAS = {
    mb_sales: {
        displayName: 'Adaobi Foods Sales',
        createdAt: '2026-03-04T11:05:00+01:00',
        requireTwoFactor: true,
        requirePasswordChange: false,
        sentMonth: 402,
        receivedMonth: 1284,
        bouncedMonth: 3,
        aliases: [
            { id: 'al_orders', address: 'orders@adaobifoods.com', addedAt: '2026-03-04T11:10:00+01:00' },
            { id: 'al_enquiries', address: 'enquiries@adaobifoods.com', addedAt: '2026-09-17T14:10:00+01:00' },
        ],
        devices: [
            { id: 'dev_1', label: 'iPhone · Lagos', client: 'Mail app', lastActiveAt: '2026-09-29T09:02:00+01:00', current: false, revocable: true },
            { id: 'dev_2', label: 'Windows · Chrome', client: 'Webmail', lastActiveAt: '2026-09-28T17:30:00+01:00', current: false, revocable: true },
        ],
        activity: [
            { id: 'ma_1', at: '2026-09-17T14:02:00+01:00', actor: { type: 'user', name: 'You' }, text: 'Quota raised from 6 GB to 8 GB', emphasis: null, category: 'storage' },
            { id: 'ma_2', at: '2026-03-04T11:20:00+01:00', actor: { type: 'user', name: 'You' }, text: 'Password reset', emphasis: null, category: 'access' },
            { id: 'ma_3', at: '2026-03-04T11:05:00+01:00', actor: { type: 'system', name: 'Ziroemail' }, text: 'Mailbox created during setup', emphasis: null, category: 'mailboxes' },
        ],
    },
};

const MAILBOX_DEFAULTS = {
    displayName: '',
    createdAt: '2026-03-04T11:05:00+01:00',
    requireTwoFactor: false,
    requirePasswordChange: false,
    sentMonth: 40,
    receivedMonth: 120,
    bouncedMonth: 0,
    aliases: [],
    devices: [],
    activity: [],
};

export function mailboxProps(mailboxId, scenario = 'healthy') {
    const org = organisationFor(scenario);
    const row = org.mailboxes.find((mailbox) => mailbox.id === mailboxId) ?? org.mailboxes[1];
    const domain = org.domains.find((candidate) => candidate.id === row.domainId);
    const siblings = org.mailboxes.filter((mailbox) => mailbox.domainId === domain.id);

    return {
        mailbox: { ...MAILBOX_DEFAULTS, ...MAILBOX_EXTRAS[row.id], ...row, address: `${row.local}@${domain.name}` },
        domain,
        pool: poolSummary(domain, siblings),
        forwarding: { to: '', keepCopy: true },
        autoReply: { on: false, from: '', until: '', message: '' },
        filtering: { spam: true, rejectExecutables: true },
        limits: { hourly: 100, daily: 500, planDefaults: { hourly: 100, daily: 500 } },
    };
}

// The four records every domain needs, from the onboarding fixture, with this domain's own state.
const RECORD_ORDER = ['mx', 'spf', 'dkim', 'dmarc'];

function recordsFor(domain, healthNote) {
    const base = onboardingFixture.records.items;
    const broken = {
        dkim: domain.recordsPassing < domain.recordsTotal && healthNote === 'DKIM missing' ? 'missing' : null,
        spf: domain.recordsPassing < domain.recordsTotal && healthNote === 'SPF needs fixing' ? 'needs_fix' : null,
    };

    return RECORD_ORDER.map((id) => {
        const item = base.find((record) => record.id === id);
        const status = broken[id] ?? 'passing';
        const failing = status !== 'passing';
        const host = item.fields.find((field) => field.key === 'host')?.value;

        return {
            ...item,
            fields: id === 'spf'
                ? item.fields.map((field) => (field.key === 'value' ? { ...field, label: 'Value', value: 'v=spf1 include:_spf.ziroemail.com ~all' } : field))
                : item.fields,
            status,
            message: failing ? (status === 'missing' ? 'Not found after repeated checks' : 'Found, but it no longer matches') : 'Verified a few minutes ago',
            observed: failing && status === 'needs_fix' ? [{ key: 'value', label: 'Value', value: 'v=spf1 include:_spf.google.com ~all' }] : null,
            lastCheckedAt: '2026-09-29T09:20:00+01:00',
            brokenSince: failing ? (status === 'missing' ? '2026-08-18' : '2026-09-28') : null,
            conflict: undefined,
            hostLabel: host,
        };
    });
}

const DOMAIN_EXTRAS = {
    dom_foods: {
        registrar: 'Whogohost',
        placement: { gmail: '99%', outlook: '98%', yahoo: '99%', asOf: '2026-09-28', scope: 'platform', badDays: { gmail: [], outlook: [6], yahoo: [] } },
        reputation: { bounceRate: '0.4%', complaintRate: '0.02%', blocklists: 'clear', note: 'Both well inside safe limits. We alert you before they become a problem.' },
    },
    dom_export: {
        registrar: 'Qservers',
        placement: { gmail: '82%', outlook: '71%', yahoo: '88%', asOf: '2026-09-28', scope: 'platform', badDays: { gmail: [3, 11, 17], outlook: [2, 5, 8, 11, 14, 16, 18], yahoo: [9] } },
        reputation: { bounceRate: '1.1%', complaintRate: '0.09%', blocklists: 'clear', note: 'Higher than we like. Unsigned mail is treated with more suspicion, which is why the DKIM record matters.' },
    },
};

export function domainsProps(scenario = 'healthy') {
    const org = organisationFor(scenario);

    return {
        domains: org.domains.map((domain) => ({
            ...domain,
            subscription: org.subscriptions.find((sub) => sub.domainId === domain.id),
        })),
        plans: plansFixture.plans,
        canAddDomain: true,
    };
}

export function domainDetailProps(domainId, scenario = 'healthy') {
    const org = organisationFor(scenario);
    const domain = org.domains.find((candidate) => candidate.id === domainId) ?? org.domains[0];
    const extras = DOMAIN_EXTRAS[domain.id];

    return {
        org: { id: org.id, name: org.name },
        domain: { ...domain, registrar: extras.registrar, subscription: org.subscriptions.find((sub) => sub.domainId === domain.id) },
        records: recordsFor(domain, domain.healthNote),
        checkedAt: '10 minutes ago',
        placement: extras.placement,
        reputation: extras.reputation,
    };
}

export function aliasesProps(domainId, scenario = 'healthy') {
    const org = organisationFor(scenario);
    const domain = org.domains.find((candidate) => candidate.id === domainId) ?? org.domains[0];

    return {
        domain,
        aliases: org.aliases.filter((alias) => alias.domainId === domain.id),
        mailboxes: org.mailboxes.filter((mailbox) => mailbox.domainId === domain.id).map((mailbox) => ({ id: mailbox.id, address: `${mailbox.local}@${domain.name}` })),
        catchAll: org.catchAll[domain.id],
    };
}

export function teamProps(scenario = 'healthy') {
    const org = organisationFor(scenario);

    return {
        org: { id: org.id, name: org.name },
        domain: org.domains[0],
        people: org.people,
        delegations: org.delegations,
        canManageAccess: true,
        canExport: true,
    };
}

export const CATEGORIES = [
    ['all', 'Everything'],
    ['mailboxes', 'Mailboxes'],
    ['storage', 'Storage'],
    ['billing', 'Billing'],
    ['access', 'Access'],
    ['domain', 'Domain'],
];

export function auditProps(filter = 'all', scenario = 'healthy') {
    const org = organisationFor(scenario);
    const entries = filter === 'all' ? org.audit : org.audit.filter((entry) => entry.category === filter);

    return { filter, entries, nextCursor: null, retentionMonths: 12 };
}

export function billingProps(domainId, scenario = 'healthy') {
    const org = organisationFor(scenario);
    const domain = org.domains.find((candidate) => candidate.id === domainId) ?? org.domains[0];
    const mailboxes = org.mailboxes.filter((mailbox) => mailbox.domainId === domain.id);
    const subscription = org.subscriptions.find((sub) => sub.domainId === domain.id);

    return {
        org: { id: org.id, name: org.name },
        domain,
        subscription,
        plan: planOf(subscription.planCode),
        plans: plansFixture.plans,
        invoices: org.invoices.filter((invoice) => invoice.domainId === domain.id),
        storage: { ...poolSummary(domain, mailboxes), extra: { blockGb: plansFixture.extraStorage.blockGb, mode: 'block' } },
        paymentMethod: { channel: subscription.paidBy },
        can: { changePlan: true, buyStorage: true },
    };
}

export function storageProps(domainId, scenario = 'healthy') {
    const org = organisationFor(scenario);
    const domain = org.domains.find((candidate) => candidate.id === domainId) ?? org.domains[0];
    const mailboxes = org.mailboxes.filter((mailbox) => mailbox.domainId === domain.id);
    const subscription = org.subscriptions.find((sub) => sub.domainId === domain.id);

    return {
        domain,
        pool: poolSummary(domain, mailboxes),
        plan: planOf(domain.planCode),
        // Block pricing follows the Pricing page (Q2 is open); `mode: 'perGb'` is a fixture switch.
        extraStorage: { mode: 'block', blockGb: plansFixture.extraStorage.blockGb, price: plansFixture.extraStorage.price.NGN.yearly, vatRate: plansFixture.vatRate, currency: 'NGN' },
        renewsAt: subscription.renewsAt,
        presets: [10, 20, 30],
    };
}

// Placeholder contact details (Q20 is open) and fictional staff; never real people.
export function helpProps(domainId, scenario = 'healthy') {
    const org = organisationFor(scenario);
    const domain = org.domains.find((candidate) => candidate.id === domainId) ?? org.domains[0];
    const plan = planOf(domain.planCode);

    return {
        support: { whatsapp: '0800 000 0000', whatsappLink: 'https://wa.me/2348000000000', email: 'support@ziroemail.com', hours: 'Mon to Fri, 9am to 6pm WAT', firstReply: 'usually within the hour' },
        people: [{ name: 'Tolu Bakare', role: 'Support and servers' }, { name: 'Amaka Eze', role: 'Support and billing' }],
        context: { domain: domain.name, plan: plan.name, accountEmail: org.owner.email },
    };
}
