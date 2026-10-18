import { asOf, organisationFixture } from './organisation';

/*
 * PLACEHOLDER operations data, shaped like the future ops controller props
 * (docs/DASHBOARD_UI_MAP.md §5.6). Platform figures are illustrative: nothing in
 * this phase can compute them. The demo organisation's rows are derived from
 * fixtures/organisation.js, not retyped, so both surfaces agree.
 *
 * The operational facts the screens quote (sending IPs, blocklists, thresholds)
 * live in `rules` and `blocklists` so no page hard-codes them; they come from
 * config once there is a backend. All names are fictional.
 */
export const rules = {
    bounceLimitPct: 2,
    complaintLimitPct: 0.1,
    queueTargetMinutes: 5,
    queueEscalateMinutes: 45,
    refundSecondApproverMinor: 2000000,
    refundGuaranteeDays: 14,
    flag: {
        volumeMultiple: 5,
        bounceHourPct: 5,
        complaintPct: 0.25,
        failuresBeforeSuccess: 50,
    },
    retryHours: 72,
};

const at = (time, day = '2026-09-29') => `${day}T${time}:00+01:00`;
const money = (naira) => ({ minor: naira * 100, currency: 'NGN' });

export const platform = {
    organisations: 412, orgsDeltaWeek: 9, mailboxes: 3106, mailboxesDeltaWeek: 64,
    mail24h: { in: 184000, out: 64000 }, bounceRate: 1.4, queueAgeMinutes: 18, queued: 2140,
    storage: { usedTb: 4.8, provisionedTb: 12 },
};

export const staffRoles = {
    support: { label: 'Support', can: 'Read any account, answer support messages, re-check DNS records, request a refund, open a customer\'s admin dashboard read-only.', cannot: 'lock an account, approve a refund, restore a backup, or read anybody\'s mail.' },
    engineer: { label: 'Engineer', can: 'Everything Support can do, plus lock and unlock accounts, restore backups, and move a domain to the backup relay.', cannot: 'approve refunds, change staff access, or read anybody\'s mail.' },
    owner: { label: 'Owner', can: 'Everything, including approving refunds, changing staff access, and, where a customer has asked in writing, opening a mailbox.', cannot: null },
};

export const opsCan = {
    support: ['read', 'recheck', 'refund.request', 'viewAs'],
    engineer: ['read', 'recheck', 'refund.request', 'viewAs', 'lock', 'restore'],
    owner: ['read', 'recheck', 'refund.request', 'viewAs', 'lock', 'restore', 'refund.approve', 'staff.manage', 'mail.read'],
};

export const stuckDomains = [
    { domain: 'chiomatextiles.ng', organisation: 'Chioma Textiles', orgId: 'org_chioma', missing: ['MX', 'SPF', 'DKIM'], records: { MX: 'no', SPF: 'no', DKIM: 'no', DMARC: 'na' }, daysWaiting: 9, registrar: 'Whogohost', paid: money(29670), severity: 'high' },
    { domain: 'grace-interiors.com', organisation: 'Grace Interiors', orgId: 'org_grace', missing: ['MX', 'SPF', 'DKIM'], records: { MX: 'no', SPF: 'no', DKIM: 'no', DMARC: 'na' }, daysWaiting: 7, registrar: 'GoDaddy', paid: money(16125), severity: 'high' },
    { domain: 'bellohaulage.com', organisation: 'Bello Haulage Ltd', orgId: 'org_bello', missing: ['DKIM'], records: { MX: 'ok', SPF: 'ok', DKIM: 'no', DMARC: 'na' }, daysWaiting: 4, registrar: 'Namecheap', paid: money(16125), severity: 'med' },
    { domain: 'pearlclinic.com.ng', organisation: 'Pearl Clinic', orgId: 'org_pearl', missing: ['DMARC'], records: { MX: 'ok', SPF: 'ok', DKIM: 'ok', DMARC: 'no' }, daysWaiting: 2, registrar: 'Qservers', paid: money(29670), severity: 'low' },
];

export const brokenDomains = [
    { domain: 'citymartng.com', organisation: 'CityMart Nigeria', orgId: 'org_citymart', records: { MX: 'no', SPF: 'ok', DKIM: 'ok', DMARC: 'ok' }, brokenSince: '2026-09-29T03:30:00+01:00', brokenFor: '6 hours', severity: 'high' },
    { domain: 'nnamdiautoparts.com', organisation: 'Nnamdi Auto Parts', orgId: 'org_nnamdi', records: { MX: 'ok', SPF: 'no', DKIM: 'no', DMARC: 'na' }, brokenSince: '2026-09-27T09:00:00+01:00', brokenFor: '2 days', severity: 'high' },
    { domain: 'zionschools.edu.ng', organisation: 'Zion Schools', orgId: 'org_zion', records: { MX: 'ok', SPF: 'ok', DKIM: 'no', DMARC: 'na' }, brokenSince: '2026-09-25T09:00:00+01:00', brokenFor: '4 days', severity: 'med' },
];

export const abuseFlags = [
    {
        id: 'flag_quickloans', address: 'info@quickloans-ng.com', orgName: 'QuickLoans Nigeria', orgId: 'org_quickloans', planName: 'Starter', customerSince: '2026-08-14',
        state: 'rate_limited', stateLabel: 'Rate limited 07:48', severity: 'high', sentLastHour: 1900, baselineHourly: 20, bounceRate: 11.2, complaintRate: 0.62, distinctRecipients: 1847,
        evidence: [
            { key: 'sent', k: 'Sent last hour', v: '1,900', n: 'normal is 20', hot: true },
            { key: 'bounce', k: 'Bounce rate', v: '11.2%', n: 'limit 2%', hot: true },
            { key: 'complaints', k: 'Complaints', v: '0.62%', n: 'limit 0.10%', hot: true },
            { key: 'recipients', k: 'Distinct recipients', v: '1,847', n: '3 repeat', hot: false },
        ],
        subjects: [{ text: 'Get ₦500,000 today, no collateral needed', count: 842 }, { text: 'FINAL NOTICE: your loan pre-approval expires', count: 611 }, { text: 'Dear customer, claim your instant credit', count: 447 }],
        verdict: 'Three identical bodies to 1,847 addresses with no prior correspondence, and 11 recipients reported it as spam. This is a purchased list, not a customer base. Business email hosting is not a bulk sending service; our terms say so.',
        actions: [{ key: 'lock', label: 'Lock sending now', tone: 'danger' }], clearLabel: 'Not abuse, clear the flag',
    },
    {
        id: 'flag_lagosproperty', address: 'accounts@lagospropertyhub.com', orgName: 'Lagos Property Hub', orgId: 'org_lagosproperty', planName: 'Business', customerSince: '2026-02-02',
        state: 'flagged', stateLabel: 'Flagged 06:20', severity: 'med', sentLastHour: 340, baselineHourly: 60, bounceRate: 4.8, complaintRate: 0.09, distinctRecipients: 312,
        evidence: [
            { key: 'sent', k: 'Sent last hour', v: '340', n: 'normal is 60', hot: false },
            { key: 'bounce', k: 'Bounce rate', v: '4.8%', n: 'limit 2%', hot: false },
            { key: 'complaints', k: 'Complaints', v: '0.09%', n: 'under the limit', hot: false },
            { key: 'recipients', k: 'Distinct recipients', v: '312', n: '94% seen before', hot: false },
        ],
        subjects: [{ text: 'Rent renewal for Flat 4B, Admiralty Way', count: 1 }, { text: 'September statement, Ikoyi units', count: 1 }, { text: 'Service charge invoice, Q4 2026', count: 118 }],
        verdict: 'Volume is up five times, but 94% of recipients have corresponded with this domain before and complaints are within limits. This reads like a quarterly invoice run. The bounces are old tenant addresses, which is a list hygiene problem, not abuse.',
        actions: [{ key: 'warn', label: 'Email them about the bounces', tone: 'primary' }], clearLabel: 'Not abuse, clear the flag',
    },
    {
        id: 'flag_bello', address: 'tunde@bellohaulage.com', orgName: 'Bello Haulage Ltd', orgId: 'org_bello', planName: 'Starter', customerSince: '2026-05-09',
        state: 'sign_in_anomaly', stateLabel: 'Sign-in anomaly 04:11', severity: 'high', sentLastHour: 460, baselineHourly: 8, bounceRate: 3.1, complaintRate: 0.05, distinctRecipients: 420,
        evidence: [
            { key: 'sent', k: 'Sent last hour', v: '460', n: 'normal is 8', hot: true },
            { key: 'country', k: 'Sending from', v: '4 countries', n: 'normally Nigeria only', hot: true },
            { key: 'failed', k: 'Failed sign-ins', v: '218', n: 'before one succeeded', hot: true },
            { key: 'sentbox', k: 'Sent folder', v: 'Empty', n: 'deliberately cleared', hot: false },
        ],
        subjects: [{ text: 'Updated bank details for outstanding invoice', count: 204 }, { text: 'Re: payment, please use the account below', count: 181 }, { text: 'Document shared with you', count: 75 }],
        verdict: 'This is not the customer. A password was guessed after 218 attempts, the Sent folder was emptied to hide the activity, and the mail is invoice fraud aimed at this haulage company\'s own contacts. Lock it, force a password reset, and telephone the owner. Do not only email, because the attacker can read that mailbox.',
        actions: [{ key: 'lock-reset', label: 'Lock and force password reset', tone: 'danger' }], clearLabel: null, secondary: { label: 'Owner\'s phone number', routeName: 'ops.orgs.show', params: { org: 'org_bello' } },
    },
];

export const resolvedFlags = [
    { id: 'rf_1', address: 'promo@citymartng.com', flaggedFor: '4,200 messages in 20 minutes', outcome: 'locked', outcomeLabel: 'Locked', by: 'Tola Bankole', at: '2026-09-26' },
    { id: 'rf_2', address: 'hr@adaobifoods.com', flaggedFor: 'Volume spike, 180 recipients', outcome: 'cleared', outcomeLabel: 'Cleared: staff memo', by: 'Amaka Nwosu', at: '2026-09-25' },
    { id: 'rf_3', address: 'sales@citymartng.com', flaggedFor: 'Bounce rate 8.4%', outcome: 'warned', outcomeLabel: 'Warned', by: 'Tola Bankole', at: '2026-09-24' },
    { id: 'rf_4', address: 'admin@pearlclinic.com.ng', flaggedFor: 'Sign-in from two countries', outcome: 'cleared', outcomeLabel: 'Cleared: owner travelling', by: 'Amaka Nwosu', at: '2026-09-23' },
];

// Hourly sending for the last 24 hours (index 0 is 09:00 yesterday): the account's own average, and today.
const flat = (n, v) => Array.from({ length: n }, () => v);
export const abuseDetails = {
    flag_quickloans: {
        subscription: 'Starter, ₦16,125/year', mailboxCount: 3,
        series: { baseline: flat(24, 1), today: [...flat(22, 1), 840, 1060] },
        recipients: [['Distinct recipients', '1,847'], ['Recipients this account has ever mailed before', '3'], ['Addresses that do not exist', '207 (11.2%)'], ['Reported as spam by the recipient', '11 (0.62%)'], ['Recipient domains', 'Gmail 61%, Yahoo 24%, other 15%'], ['Distinct message bodies', '3']],
        recipientsNote: 'Three bodies, 1,847 strangers, one in nine addresses dead. A genuine customer list does not look like this; a purchased one does.',
        signals: [['Sign-in location', 'Lagos only, as always'], ['Failed sign-in attempts', 'None'], ['Password changed recently', 'No'], ['Sent folder', 'Intact, nothing deleted'], ['New forwarding rules', 'None']],
        signalsNote: 'Nothing suggests a compromise. This is the account owner sending marketing mail they are not allowed to send here: a terms problem, not a security incident. Treat them as a customer who needs telling, not an attacker.',
        history: [['07:48 today', 'rate limit applied automatically.'], ['24 Sep', 'warned about an 8.4% bounce rate on a different mailbox.'], ['2 Sep', 'asked support whether bulk sending was allowed. Told no.'], ['14 Aug', 'signed up, paid yearly by card.']],
        historyNote: 'They asked, were told no, and did it anyway. That is relevant to whether this is a warning or a lock.',
        summary: '2,340 messages in two hours, against a 30-day average of 20 per day. The account has never sent more than 46 messages in a day before today.',
    },
    flag_lagosproperty: {
        subscription: 'Business, ₦29,670/year', mailboxCount: 9,
        series: { baseline: flat(24, 2), today: [...flat(20, 2), 60, 340, 280, 120] },
        recipients: [['Distinct recipients', '312'], ['Recipients this account has ever mailed before', '293 (94%)'], ['Addresses that do not exist', '15 (4.8%)'], ['Reported as spam by the recipient', '1 (0.09%)'], ['Distinct message bodies', '9']],
        recipientsNote: 'Mostly known recipients and a handful of dead addresses. This is list hygiene, not abuse.',
        signals: [['Sign-in location', 'Lagos only, as always'], ['Failed sign-in attempts', 'None'], ['Password changed recently', 'No'], ['Sent folder', 'Intact, nothing deleted'], ['New forwarding rules', 'None']],
        signalsNote: 'Nothing suggests a compromise.',
        history: [['06:20 today', 'flagged for volume.'], ['30 Jun', 'same pattern, cleared as a quarterly invoice run.']],
        historyNote: 'The same pattern appeared last quarter and was cleared.',
        summary: '340 messages in the last hour against a normal 60.',
    },
    flag_bello: {
        subscription: 'Starter, ₦16,125/year', mailboxCount: 2,
        series: { baseline: flat(24, 1), today: [...flat(19, 1), 12, 460, 380, 90, 20] },
        recipients: [['Distinct recipients', '420'], ['Recipients this account has ever mailed before', '388 (92%)'], ['Reported as spam by the recipient', '2 (0.05%)'], ['Distinct message bodies', '3']],
        recipientsNote: 'Known contacts, which is exactly why invoice fraud from a compromised mailbox works.',
        signals: [['Sign-in location', '4 countries in one hour'], ['Failed sign-in attempts', '218 before one succeeded'], ['Password changed recently', 'No'], ['Sent folder', 'Emptied'], ['New forwarding rules', 'None']],
        signalsNote: 'This looks like a compromise, not abuse by the owner.',
        history: [['04:11 today', 'sign-in anomaly flagged.'], ['9 May', 'signed up, paid yearly by transfer.']],
        historyNote: 'No earlier incidents.',
        summary: '460 messages in the last hour against a normal 8.',
    },
};

export const orgRows = [
    { id: 'org_adaobi', name: organisationFixture.name, domain: 'adaobifoods.com', planCode: 'business', mailboxCount: 4, usedGb: 13.5, poolGb: 40, state: 'healthy', stateLabel: 'Healthy', renewsAt: '2027-03-04', severity: null, filters: ['renewing'] },
    { id: 'org_quickloans', name: 'QuickLoans Nigeria', domain: 'quickloans-ng.com', planCode: 'starter', mailboxCount: 3, usedGb: 2.1, poolGb: 10, state: 'rate_limited', stateLabel: 'Rate limited', renewsAt: '2027-08-14', severity: 'high', filters: ['flagged'] },
    { id: 'org_lagosproperty', name: 'Lagos Property Hub', domain: 'lagospropertyhub.com', planCode: 'business', mailboxCount: 9, usedGb: 34.8, poolGb: 40, state: 'storage', stateLabel: 'Storage 87%', renewsAt: '2027-02-02', severity: 'med', filters: ['storage', 'flagged'] },
    { id: 'org_citymart', name: 'CityMart Nigeria', domain: 'citymartng.com', planCode: 'business', mailboxCount: 12, usedGb: 21, poolGb: 40, state: 'mx_missing', stateLabel: 'MX missing', renewsAt: '2027-06-19', severity: 'high', filters: ['incomplete'] },
    { id: 'org_bello', name: 'Bello Haulage Ltd', domain: 'bellohaulage.com', planCode: 'starter', mailboxCount: 2, usedGb: 0.8, poolGb: 10, state: 'setup_incomplete', stateLabel: 'Setup incomplete', renewsAt: '2027-05-09', severity: 'med', filters: ['incomplete', 'flagged'] },
    { id: 'org_pearl', name: 'Pearl Clinic', domain: 'pearlclinic.com.ng', planCode: 'business', mailboxCount: 6, usedGb: 4.2, poolGb: 40, state: 'healthy', stateLabel: 'Healthy', renewsAt: '2027-09-21', severity: null, filters: [] },
    { id: 'org_chioma', name: 'Chioma Textiles', domain: 'chiomatextiles.ng', planCode: 'business', mailboxCount: 0, usedGb: 0, poolGb: 40, state: 'never_set_up', stateLabel: 'Never set up', renewsAt: '2027-09-20', severity: 'low', filters: ['incomplete', 'renewing'] },
    { id: 'org_zion', name: 'Zion Schools', domain: 'zionschools.edu.ng', planCode: 'business', mailboxCount: 18, usedGb: 29.6, poolGb: 40, state: 'dkim_broken', stateLabel: 'DKIM broken', renewsAt: '2027-01-11', severity: 'med', filters: ['incomplete'] },
];
export const orgFilters = [['all', 'All', 412], ['incomplete', 'Setup incomplete', 11], ['overdue', 'Payment overdue', 7], ['storage', 'Storage over 85%', 14], ['flagged', 'Flagged', 3], ['renewing', 'Renewing in 30 days', 38]];

export const opsMailboxRows = [
    { address: 'orders@citymartng.com', orgName: 'CityMart Nigeria', orgId: 'org_citymart', usedGb: 9.8, quotaGb: 10, lastLoginAt: at('08:30'), state: 'full', stateLabel: '98% full', severity: 'high', filters: ['attention', 'full'] },
    { address: 'info@zionschools.edu.ng', orgName: 'Zion Schools', orgId: 'org_zion', usedGb: 7.5, quotaGb: 8, lastLoginAt: at('08:02'), state: 'full', stateLabel: '94% full', severity: 'high', filters: ['attention', 'full'] },
    { address: 'accounts@lagospropertyhub.com', orgName: 'Lagos Property Hub', orgId: 'org_lagosproperty', usedGb: 10.4, quotaGb: 12, lastLoginAt: at('07:15'), state: 'near', stateLabel: '87% full', severity: 'med', filters: ['attention'] },
    { address: 'sales@adaobifoods.com', orgName: 'Adaobi Foods Ltd', orgId: 'org_adaobi', usedGb: 6.1, quotaGb: 8, lastLoginAt: at('07:40'), state: 'near', stateLabel: '76% full', severity: 'med', filters: ['attention'] },
    { address: 'info@quickloans-ng.com', orgName: 'QuickLoans Nigeria', orgId: 'org_quickloans', usedGb: 0.7, quotaGb: 3.3, lastLoginAt: at('07:50'), state: 'limited', stateLabel: 'Rate limited', severity: 'high', filters: ['attention'], action: { label: 'Review', routeName: 'ops.abuse.show', params: { flag: 'flag_quickloans' }, primary: true } },
    { address: 'emeka@adaobifoods.com', orgName: 'Adaobi Foods Ltd', orgId: 'org_adaobi', usedGb: 1.4, quotaGb: 2, lastLoginAt: null, state: 'not_set_up', stateLabel: 'Not set up', severity: 'low', filters: ['attention', 'never'] },
    { address: 'promo@citymartng.com', orgName: 'CityMart Nigeria', orgId: 'org_citymart', usedGb: 0.4, quotaGb: 3, lastLoginAt: '2026-09-26T13:00:00+01:00', state: 'locked', stateLabel: 'Locked: abuse', severity: 'low', filters: ['suspended'], action: { label: 'History', routeName: 'ops.abuse', params: {} } },
];
export const mailboxFilters = [['attention', 'Needs attention', 231], ['full', 'Over 90% full', 31], ['never', 'Never signed in', 194], ['suspended', 'Suspended', 6], ['all', 'All', 3106]];

export const refunds = {
    waiting: [
        { id: 'ref_chioma', orgName: 'Chioma Textiles', orgId: 'org_chioma', domain: 'chiomatextiles.ng', planName: 'Business', paid: money(29670), paidAt: '2026-09-20', daysSincePayment: 9, reason: 'Could not get the DNS records added, gave up after nine days', mailEverDelivered: 'No, not one message', extra: [['Support contact', '3 emails, no reply to any'], ['Reached the records step', 'No, stopped at payment']], requestedBy: 'Halima Yusuf', requestedAt: at('07:40'), insideGuarantee: true, needsSecondApprover: true, requesterId: 'staff_halima', recommendation: 'Full refund is correct here. They paid, we never delivered a single message, and it is within the guarantee. Worth one telephone call before paying it out. If they simply never found the records page, that is worth knowing.' },
        { id: 'ref_grace', orgName: 'Grace Interiors', orgId: 'org_grace', domain: 'grace-interiors.com', planName: 'Starter', paid: money(16125), paidAt: '2026-09-22', daysSincePayment: 7, reason: 'Bought the wrong thing: wanted a website, not email', mailEverDelivered: 'No', extra: [['Mailboxes created', 'None']], requestedBy: 'Segun Ade', requestedAt: '2026-09-28T16:12:00+01:00', insideGuarantee: true, needsSecondApprover: false, requesterId: 'staff_segun', recommendation: 'Straightforward. Nothing was used, the reason is honest, and it is inside the guarantee. Under ₦20,000, so one approver is enough.' },
    ],
    paid: [
        { id: 'rp_1', orgName: 'Okonkwo & Sons', reason: 'Setup never completed', amount: money(29670), approvedBy: 'Amaka Nwosu and Tola Bankole', paidAt: '2026-09-18' },
        { id: 'rp_2', orgName: 'Delta Print Works', reason: 'Duplicate payment', amount: money(16125), approvedBy: 'Tola Bankole', paidAt: '2026-09-11' },
        { id: 'rp_3', orgName: 'Rivers Logistics', reason: 'Closed the business', amount: money(16125), approvedBy: 'Amaka Nwosu', paidAt: '2026-09-04' },
    ],
};

// Night strip: 'ok', 'slow' or 'fail', oldest first. 30 nights to 29 Sept.
export const backupNights = Array.from({ length: 30 }, (_, i) => (i === 7 ? 'fail' : i === 11 ? 'slow' : 'ok'));
export const snapshots = [
    { id: 'snap_0929', takenAt: at('02:00'), kind: 'full', mailboxCount: 3106, sizeTb: 1.4, restoreTest: 'passed', note: 'restore test passed on hr@adaobifoods.com' },
    { id: 'snap_0928', takenAt: at('02:00', '2026-09-28'), kind: 'full', mailboxCount: 3092, sizeTb: 1.4, restoreTest: 'passed', note: 'restore test passed' },
    { id: 'snap_0927', takenAt: at('02:00', '2026-09-27'), kind: 'full', mailboxCount: 3081, sizeTb: 1.4, restoreTest: 'passed', note: 'restore test passed' },
    { id: 'snap_0901', takenAt: at('02:00', '2026-09-01'), kind: 'monthly', mailboxCount: 2904, sizeTb: 1.3, restoreTest: 'passed', note: 'kept for a year' },
];
export const restores = [
    { id: 'rs_1', what: 'One mailbox, deleted by mistake', orgName: 'Zion Schools', from: '2026-09-22', askedBy: 'Tola Bankole', outcome: 'Restored in 18m' },
    { id: 'rs_2', what: 'One folder, 400 messages', orgName: 'Pearl Clinic', from: '2026-09-14', askedBy: 'Amaka Nwosu', outcome: 'Restored in 6m' },
    { id: 'rs_3', what: 'Whole domain after a ransomware scare', orgName: 'Delta Print Works', from: '2026-09-02', askedBy: 'Tola Bankole', outcome: 'Restored in 3h 10m' },
];

export const staffRoster = [
    { id: 'staff_tola', name: 'Tola Bankole', email: 'tola@ziroops.example', role: 'owner', perms: ['All accounts', 'Lock and unlock', 'Approve refunds', 'Restore backups'], strong: 'Can view customer mail', lastSignInAt: at('07:31'), place: 'Port Harcourt', method: 'authenticator', invited: false },
    { id: 'staff_amaka', name: 'Amaka Nwosu', email: 'amaka@ziroops.example', role: 'owner', perms: ['All accounts', 'Lock and unlock', 'Approve refunds', 'Restore backups'], strong: 'Can view customer mail', lastSignInAt: at('06:48'), place: 'Lagos', method: 'authenticator', invited: false },
    { id: 'staff_halima', name: 'Halima Yusuf', email: 'halima@ziroops.example', role: 'support', perms: ['Read accounts', 'Answer support messages', 'Request refunds', 'Re-check DNS'], strong: null, lastSignInAt: '2026-09-28T17:02:00+01:00', place: 'Port Harcourt', method: 'authenticator', invited: false },
    { id: 'staff_segun', name: 'Segun Ade', email: 'segun@ziroops.example', role: 'support', perms: ['Read accounts', 'Answer support messages', 'Request refunds'], strong: null, lastSignInAt: null, place: null, method: null, invited: true, invitedAt: '2026-09-26' },
];

export const opsAudit = [
    { id: 'oa_1', at: at('08:02'), actor: 'System', kind: 'billing', text: 'Storage added', detail: 'Adaobi Foods Ltd bought 10 GB, ₦6,450 paid by bank transfer.', reason: null, grave: false },
    { id: 'oa_2', at: at('07:48'), actor: 'System', kind: 'locks', text: 'Rate limit applied', detail: 'to info@quickloans-ng.com: 1,900 messages in one hour against an average of 20.', reason: 'Automatic: volume more than five times the account average.', grave: false, mono: 'info@quickloans-ng.com' },
    { id: 'oa_3', at: at('07:40'), actor: 'Halima Yusuf', kind: 'refunds', text: 'Refund requested', detail: '₦29,670 for Chioma Textiles.', reason: 'Setup never completed, nine days, three unanswered emails.', grave: false },
    { id: 'oa_4', at: at('06:55'), actor: 'Amaka Nwosu', kind: 'support', text: 'Support message answered', detail: 'Outlook setup for Adaobi Foods Ltd.', reason: null, grave: false },
    { id: 'oa_5', at: at('02:47'), actor: 'System', kind: 'restores', text: 'Restore test passed', detail: 'random mailbox restored from the 02:00 snapshot and verified against the live copy.', reason: null, grave: false },
    { id: 'oa_6', at: '2026-09-28T16:20:00+01:00', actor: 'Tola Bankole', kind: 'access', text: 'Mailbox opened by staff', detail: 'admin@deltaprintworks.example, to recover mail after an account compromise.', reason: 'Written request attached from the account owner, 27 Sep. Customer emailed automatically. Read-only, 22 minutes.', grave: true },
    { id: 'oa_7', at: '2026-09-28T14:02:00+01:00', actor: 'Halima Yusuf', kind: 'support', text: 'Quota raised', detail: 'info@zionschools.edu.ng from 6 GB to 8 GB at the customer\'s request by WhatsApp.', reason: null, grave: false },
    { id: 'oa_8', at: '2026-09-28T11:14:00+01:00', actor: 'Amaka Nwosu', kind: 'access', text: 'Admin dashboard viewed', detail: 'Lagos Property Hub, read-only.', reason: 'Checking what the customer sees on the storage screen for their email of 24 Sep.', grave: false },
    { id: 'oa_9', at: '2026-09-26T13:38:00+01:00', actor: 'Tola Bankole', kind: 'locks', text: 'Sending locked', detail: 'promo@citymartng.com, 4,200 messages in 20 minutes to a purchased list.', reason: 'Bulk marketing against clause 4.2. Owner telephoned and emailed. Sending only; mail still delivering to them.', grave: true },
    { id: 'oa_10', at: '2026-09-26T09:05:00+01:00', actor: 'Tola Bankole', kind: 'staff', text: 'Staff invited', detail: 'Segun Ade, Support role.', reason: null, grave: false },
];
export const auditKinds = [['all', 'Everything'], ['locks', 'Locks and suspensions'], ['refunds', 'Refunds'], ['access', 'Mailbox access'], ['restores', 'Restores'], ['staff', 'Staff changes']];

export const reports = {
    month: 'September 2026',
    headline: { newCustomers: 38, newDelta: 12, left: 6, leftPct: 1.5, billed: 1092400, billedDeltaPct: 18, refunded: 64500, refundedPct: 5.9, uptime: 99.97, downMinutes: 13, storageSoldGb: 180, addOns: 18 },
    customersByMonth: [['Mar', 34], ['Apr', 79], ['May', 136], ['Jun', 206], ['Jul', 280], ['Aug', 346], ['Sep', 412]],
    money: [['Billed in September', '₦1,092,400'], ['From new customers', '₦886,500'], ['From renewals', '₦89,400'], ['From storage add-ons', '₦116,500'], ['Refunded', '₦64,500', 'down'], ['Outstanding, unpaid', '₦112,875'], ['Paid in naira', '94%'], ['Paid in dollars', '6%']],
    moneyNote: 'Storage add-ons are now a tenth of monthly revenue and cost nothing extra to serve. That is the clearest signal in this report.',
    departures: [['Setup never completed', 3], ['Business closed', 1], ['Moved to Google Workspace', 1], ['Bought the wrong product', 1], ['Left over price', 0], ['Left over deliverability', 0]],
    departuresNote: 'Half of September\'s departures never got mail flowing at all. That is a setup problem showing up as churn, and the records step is where they stop.',
    service: [['Uptime', '99.97%', 'up'], ['Longest outage', '9 minutes, 14 Sep'], ['Messages delivered', '7.4 million'], ['Average bounce rate', '1.4%', 'up'], ['Blocklist incidents', '0', 'up'], ['Backups failed', '1 of 30, re-run same night']],
    support: [['Support messages', '187'], ['Closed', '175'], ['Median first reply', '41 minutes', 'up'], ['Missed the 4-hour promise', '9', 'down'], ['Commonest subject', 'DNS records'], ['Second commonest', 'Outlook setup'], ['Migrations completed', '22']],
    supportNote: 'DNS is the top support subject and the top reason customers leave. The same problem is showing up in both columns.',
    narrative: 'Growth is steady and nobody has left over price or deliverability, the two things that would be hardest to fix. Every departure traces back to the same place: customers who pay and then cannot get their DNS records right. One-click setup at more registrars would have kept three of September\'s six.',
    earlier: [{ month: 'August 2026', customers: 346, billed: 925600, left: 4, uptime: '99.99%' }, { month: 'July 2026', customers: 280, billed: 781200, left: 5, uptime: '99.95%' }, { month: 'June 2026', customers: 206, billed: 612750, left: 2, uptime: '99.98%' }],
};

export const blocklists = {
    ips: ['102.89.44.12', '102.89.44.13', '102.89.44.14', '102.89.44.15'],
    lists: ['Spamhaus', 'Barracuda', 'SORBS', 'SpamCop'],
    polledEveryMinutes: 15,
};
const clearMatrix = Object.fromEntries(blocklists.ips.map((ip) => [ip, Object.fromEntries(blocklists.lists.map((list) => [list, 'clear']))]));

export const deliverability = {
    headline: [
        { k: 'Bounce rate', v: '1.4%', d: 'limit 2.0%', tone: 'up' },
        { k: 'Complaints', v: '0.04%', d: 'limit 0.10%', tone: 'up' },
        { k: 'Oldest in queue', v: '18m', d: 'target under 5m', tone: 'down', alert: true },
        { k: 'Inbox placement', v: '96%', d: 'across five providers' },
        { k: 'DKIM signed', v: '100%', d: 'outbound, all domains' },
        { k: 'TLS on delivery', v: '99.2%', d: '0.8% recipient refused' },
    ],
    blocklists: { ...blocklists, matrix: clearMatrix },
    // 14 daily bounce rates, 15 to 28 Sep, then today's 1.4. Peak 1.9 on 17 Sep.
    bounceSeries: [1.2, 1.4, 1.9, 1.5, 1.3, 1.2, 1.1, 1.3, 1.4, 1.2, 1.5, 1.3, 1.4, 1.4].map((value, index) => ({ label: `${15 + index} Sep`, value })),
    worstDomains: [
        { domain: 'quickloans-ng.com', sent7d: 18400, bounce: '11.2%', complaints: '0.62%', state: 'bad', stateLabel: 'Rate limited', severity: 'high', action: { label: 'Review', routeName: 'ops.abuse.show', params: { flag: 'flag_quickloans' }, primary: true } },
        { domain: 'lagospropertyhub.com', sent7d: 6110, bounce: '4.8%', complaints: '0.09%', state: 'warn', stateLabel: 'Watching', severity: 'med', action: { label: 'Open', routeName: 'ops.orgs.show', params: { org: 'org_lagosproperty' } } },
        { domain: 'bellohaulage.com', sent7d: 890, bounce: '2.6%', complaints: '0.00%', state: 'muted', stateLabel: 'Normal', severity: 'low', action: { label: 'Open', routeName: 'ops.orgs.show', params: { org: 'org_bello' } } },
    ],
    placement: [{ provider: 'Gmail', inbox: 98, spam: 2, miss: 0 }, { provider: 'Outlook', inbox: 94, spam: 6, miss: 0 }, { provider: 'Yahoo', inbox: 96, spam: 4, miss: 0 }, { provider: 'Zoho', inbox: 100, spam: 0, miss: 0 }, { provider: 'Others', inbox: 92, spam: 5, miss: 3 }],
    authCoverage: [['Domains with SPF', '412 / 412'], ['Domains with DKIM', '409 / 412'], ['Domains with DMARC', '361 / 412'], ['DMARC at p=reject', '88']],
};

export const deliveryRows = [
    { id: 'dl_1', at: at('08:11'), from: 'sales@adaobifoods.com', to: 'buyer@shoprite-ng.example', subject: 'Pro forma invoice, October', state: 'deferred', attempts: 4, severity: 'med' },
    { id: 'dl_2', at: at('08:09'), from: 'tunde@bellohaulage.com', to: 'ops@shoprite-ng.example', subject: 'Delivery schedule week 40', state: 'deferred', attempts: 4, severity: 'med' },
    { id: 'dl_3', at: at('08:04'), from: 'admin@pearlclinic.com.ng', to: 'ngozi.a@gmail.example', subject: 'Appointment confirmed: 2 October', state: 'delivered', attempts: 1 },
    { id: 'dl_4', at: at('07:58'), from: 'info@quickloans-ng.com', to: 'c.okafor@yahoo.example', subject: 'FINAL NOTICE: your loan pre-approval...', state: 'bounced', attempts: 1, severity: 'high' },
    { id: 'dl_5', at: at('07:52'), from: 'accounts@lagospropertyhub.com', to: 'tenant@outlook.example', subject: 'Service charge invoice, Q4 2026', state: 'delivered', attempts: 1 },
    { id: 'dl_6', at: at('07:44'), from: 'accounts@lagospropertyhub.com', to: 'old.tenant@yahoo.example', subject: 'Service charge invoice, Q4 2026', state: 'bounced', attempts: 1, severity: 'high' },
];
export const deliveryStates = [['any', 'Any state'], ['delivered', 'Delivered'], ['deferred', 'Deferred'], ['bounced', 'Bounced'], ['rejected', 'Rejected']];
export const deliveryTrace = {
    messageId: '3f9c1e@mx1.ziroemail.com', subject: 'Pro forma invoice, October', recipientDomain: 'shoprite-ng.example',
    hops: [
        { at: '08:11:04', label: 'Accepted from the sender', detail: 'authenticated, TLS 1.3', serverReply: '250 2.0.0 Ok: queued as 3f9c1e', outcome: 'ok' },
        { at: '08:11:04', label: 'DKIM signed and queued for delivery', detail: 'via 102.89.44.13', serverReply: null, outcome: 'ok' },
        { at: '08:11:09', label: 'First attempt refused, temporary', detail: 'mx.shoprite-ng.example', serverReply: '451 4.3.2 Too many concurrent connections, try again later', outcome: 'temp_fail' },
        { at: '08:16, 08:26, 08:46', label: 'Retried three times', detail: 'same response each time', serverReply: null, outcome: 'temp_fail' },
        { at: '09:26', label: 'Next attempt at 09:26', detail: 'Retries continue for 72 hours before the sender is told it failed', serverReply: null, outcome: 'pending' },
    ],
};
export const deliverySummary = { deferred: 2140, waitingOnOneDomain: 2108 };

export const overviewChecks = [
    { id: 'blocklist', kind: 'blocklist', state: 'ok', title: 'No blocklist entries', body: 'All four sending IPs clear on Spamhaus, Barracuda, SORBS and SpamCop.', at: 'checked 06:00', link: null },
    { id: 'queue', kind: 'queue', state: 'bad', title: 'Outbound queue is backing up', body: '18 minutes oldest message, 2,140 waiting. One recipient domain is deferring: see the delivery log.', at: null, link: { label: 'Open', routeName: 'ops.queue' } },
    { id: 'flags', kind: 'flags', state: 'warn', title: '3 accounts flagged for review', body: 'Sending volume above their normal pattern. None locked yet.', at: null, link: { label: 'Review', routeName: 'ops.abuse' } },
    { id: 'backup', kind: 'backup', state: 'ok', title: 'Last night\'s backup verified', body: 'Full snapshot at 02:00, restore test passed on a sample mailbox.', at: '02:47', link: null },
];
export const overviewFeed = [
    { id: 'of_1', at: at('08:02'), html: [['b', 'Adaobi Foods Ltd'], ' added 10 GB storage, ₦6,450 paid.'] },
    { id: 'of_2', at: at('07:48'), html: ['Anomaly flag on ', ['m', 'info@quickloans-ng.com'], ': 1,900 messages in an hour.'] },
    { id: 'of_3', at: at('07:31'), html: [['b', 'Pearl Clinic'], ' finished DNS setup. First mail delivered.'] },
    { id: 'of_4', at: at('07:12'), html: ['Deferrals from one recipient domain began. Queue age started climbing.'] },
    { id: 'of_5', at: at('06:55'), html: [['b', 'Amaka N.'], ' answered a WhatsApp message: Outlook setup.'] },
];
export const supportLoad = { whatsapp: 4, email: 8, medianFirstReply: '41m', migrationsRunning: 5 };
export const domainFigures = [
    { k: 'Domains', v: '412', d: 'across 412 organisations' },
    { k: 'Fully configured', v: '387', d: '94% of the estate', tone: 'up' },
    { k: 'Never finished', v: '11', d: 'paid, no mail flowing', tone: 'down', alert: true },
    { k: 'Missing DMARC', v: '51', d: 'works, but unprotected' },
    { k: 'Records broke', v: '3', d: 'was working, now not', tone: 'down' },
    { k: 'Median setup time', v: '41m', d: 'signup to first mail' },
];
export const backupFigures = [
    { k: 'Last snapshot', v: '02:00', d: 'completed 02:41', tone: 'up' },
    { k: 'Restore tested', v: '02:47', d: 'passed', tone: 'up' },
    { k: 'Retention', v: '30 days', d: 'daily, then 12 monthly' },
    { k: 'Total stored', v: '31 TB', d: 'compressed and encrypted' },
    { k: 'Offsite copy', v: 'Yes', d: 'second region, 04:00' },
    { k: 'Failed nights', v: '1', d: 'in the last 30' },
];
export const refundFigures = [
    { k: 'Waiting', v: '2', d: '₦48,375 total' }, { k: 'Paid this month', v: '3', d: '₦64,500' }, { k: 'Refund rate', v: '1.2%', d: 'of revenue this year' },
    { k: 'Commonest reason', v: 'DNS', d: 'setup never finished' }, { k: 'Median time to pay', v: '2 days', d: 'approval to bank' }, { k: 'Within 14 days', v: '4 of 5', d: 'inside the guarantee' },
];
export const mailboxFigures = [
    { k: 'Total', v: '3,106', d: '+64 this week', tone: 'up' }, { k: 'Active in 30d', v: '2,847', d: '92% of the estate' }, { k: 'Over 90% full', v: '31', d: 'delivery stops at 100%', tone: 'down', alert: true },
    { k: 'Never signed in', v: '194', d: 'created but unused' }, { k: 'Suspended', v: '6', d: '4 non-payment, 2 abuse' }, { k: 'Median size', v: '1.6 GB', d: 'against a 6 GB median quota' },
];

export const referenceTime = asOf;

const PLAN_NAME = { starter: 'Starter', business: 'Business', premium: 'Premium' };
const PLAN_PRICE = { starter: 16125, business: 29670, premium: 58050 };

// One organisation's record. The demo organisation is derived from organisation.js; others are generated from their row.
export function orgDetailProps(orgId) {
    const row = orgRows.find((candidate) => candidate.id === orgId) ?? orgRows[0];
    const demo = row.id === 'org_adaobi';
    const domain = organisationFixture.domains[0];
    const mailboxes = demo
        ? organisationFixture.mailboxes.filter((mailbox) => mailbox.domainId === domain.id).map((mailbox) => ({ address: `${mailbox.local}@${domain.name}`, quotaGb: mailbox.quotaGb, usedGb: mailbox.usedGb, lastLoginAt: mailbox.lastLoginAt, state: mailbox.state }))
        : Array.from({ length: Math.min(row.mailboxCount, 4) }, (_, i) => ({ address: `${['info', 'accounts', 'sales', 'admin'][i]}@${row.domain}`, quotaGb: 4, usedGb: Math.round((row.usedGb / Math.max(row.mailboxCount, 1)) * 10) / 10, lastLoginAt: at('07:30'), state: 'active' }));
    const records = ['MX', 'SPF', 'DKIM', 'DMARC'].map((type) => ({ type, status: row.state === 'healthy' || demo ? 'Verified 4 Mar 2026' : row.state === 'mx_missing' && type === 'MX' ? 'Not found' : row.state === 'dkim_broken' && type === 'DKIM' ? 'Not found' : 'Verified' }));
    const owner = demo ? organisationFixture.owner : { name: 'Account owner', email: `owner@${row.domain}` };

    return {
        org: { id: row.id, name: row.name, domain: row.domain, planName: PLAN_NAME[row.planCode], customerSince: demo ? organisationFixture.customerSince : '2026-05-01', stateLabel: row.stateLabel, severity: row.severity },
        figures: [
            { k: 'Mailboxes', v: row.mailboxCount, d: 'of unlimited' },
            { k: 'Storage used', v: `${row.usedGb} GB`, d: `of a ${row.poolGb} GB pool` },
            { k: 'Mail in 30d', v: demo ? '5,140' : '2,310', d: demo ? '4,022 in · 1,118 out' : '1,900 in · 410 out' },
            { k: 'Bounce rate', v: demo ? '0.9%' : '2.4%', d: demo ? 'normal' : 'worth a look', tone: demo ? 'up' : undefined },
            { k: 'Paid to date', v: demo ? '₦36,120' : `₦${PLAN_PRICE[row.planCode].toLocaleString('en-NG')}`, d: demo ? '2 invoices, all settled' : '1 invoice, settled' },
            { k: 'Support contacts', v: 2, d: 'both closed' },
        ],
        mailboxes,
        domain: { name: row.domain, registrar: demo ? 'Whogohost' : 'Namecheap', records, lastChecked: 'Today, 06:00' },
        billing: [['Plan', `${PLAN_NAME[row.planCode]} · ₦${PLAN_PRICE[row.planCode].toLocaleString('en-NG')}/year inc. VAT`], ['Extra storage', demo ? '10 GB · ₦6,450/year' : 'None'], ['Method', demo ? 'Bank transfer' : 'Card'], ['Renews', row.renewsAt], ['Outstanding', 'Nothing']],
        contact: { phone: '+234 803 000 0000', name: `${owner.name}, owner and billing contact`, email: demo ? owner.mailbox : owner.email, note: 'Prefers a phone call before 09:00 or after 17:00. Noted when they last wrote in.' },
        business: demo ? [['Registered name', 'Adaobi Foods Limited'], ['RC number', 'RC 0000000'], ['Address', '14 Aba Road, Port Harcourt, Rivers'], ['Industry', 'Food distribution'], ['Came from', 'Google search']] : [['Registered name', row.name], ['Industry', 'Not recorded']],
        tickets: [{ id: '#2104', text: 'Outlook setup on a second laptop. Closed 12 Sep.' }, { id: '#1877', text: 'Asked how to add storage. Closed 4 Aug, bought 10 GB the same day.' }],
        assigned: Math.round(mailboxes.reduce((sum, mailbox) => sum + mailbox.quotaGb, 0) * 10) / 10,
    };
}
