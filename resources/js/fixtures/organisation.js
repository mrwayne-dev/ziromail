/*
 * PLACEHOLDER organisation data: the one demo business every signed-in screen
 * reads. Shapes equal the future Data classes (docs/DASHBOARD_UI_MAP.md §5.3):
 * money is integer minor units, times are ISO 8601, nothing is pre-formatted.
 *
 * Names here are fictional. The person signed in is the real `auth.user` shared
 * prop, not this owner.
 */
export const asOf = '2026-09-29T09:30:00+01:00';

export const organisationFixture = {
    id: 'org_adaobi',
    name: 'Adaobi Foods Ltd',
    customerSince: '2026-03-04',
    owner: { name: 'Victory Adaobi', email: 'victory.adaobi@example.com', mailbox: 'victory@adaobifoods.com' },

    domains: [
        {
            id: 'dom_foods',
            name: 'adaobifoods.com',
            planCode: 'business',
            state: 'live',
            mailboxCount: 4,
            assignedGb: 26,
            usedGb: 13.5,
            poolGb: 40,
            planGb: 30,
            boughtGb: 10,
            ceilingGb: 100,
            renewsAt: '2027-03-04',
            recordsPassing: 4,
            recordsTotal: 4,
            healthNote: 'All four records passing',
        },
        {
            id: 'dom_export',
            name: 'adaobiexport.ng',
            planCode: 'starter',
            state: 'live',
            mailboxCount: 2,
            assignedGb: 4,
            usedGb: 1.2,
            poolGb: 10,
            planGb: 10,
            boughtGb: 0,
            ceilingGb: 25,
            renewsAt: '2027-08-18',
            recordsPassing: 3,
            recordsTotal: 4,
            healthNote: 'DKIM missing',
        },
    ],

    mailboxes: [
        { id: 'mb_victory', domainId: 'dom_foods', local: 'victory', roleLabel: 'Owner', quotaGb: 12, usedGb: 4.2, lastLoginAt: '2026-09-29T08:12:00+01:00', state: 'active', setupCompletedAt: '2026-03-04T11:00:00+01:00' },
        { id: 'mb_sales', domainId: 'dom_foods', local: 'sales', roleLabel: 'Shared', quotaGb: 8, usedGb: 6.1, lastLoginAt: '2026-09-29T07:40:00+01:00', state: 'near_full', setupCompletedAt: '2026-03-04T11:05:00+01:00' },
        { id: 'mb_ngozi', domainId: 'dom_foods', local: 'ngozi', roleLabel: 'Staff', quotaGb: 4, usedGb: 1.8, lastLoginAt: '2026-09-28T16:20:00+01:00', state: 'active', setupCompletedAt: '2026-03-05T09:30:00+01:00' },
        { id: 'mb_emeka', domainId: 'dom_foods', local: 'emeka', roleLabel: 'Staff', quotaGb: 2, usedGb: 1.4, lastLoginAt: null, state: 'not_set_up', setupCompletedAt: null },
        { id: 'mb_victory_export', domainId: 'dom_export', local: 'victory', roleLabel: 'Owner', quotaGb: 2.5, usedGb: 0.9, lastLoginAt: '2026-09-29T07:51:00+01:00', state: 'active', setupCompletedAt: '2026-08-18T12:00:00+01:00' },
        { id: 'mb_export', domainId: 'dom_export', local: 'export', roleLabel: 'Shared', quotaGb: 1.5, usedGb: 0.3, lastLoginAt: '2026-09-26T14:00:00+01:00', state: 'active', setupCompletedAt: '2026-08-18T12:10:00+01:00' },
    ],

    // Money is minor units. priceExVat plus vat is what was charged (7.5%).
    subscriptions: [
        { id: 'sub_foods', domainId: 'dom_foods', planCode: 'business', term: 'annual', status: 'active', renewsAt: '2027-03-04', graceEndsAt: null, paidBy: 'transfer', extraStorageGb: 10, priceExVat: { minor: 2760000, currency: 'NGN' }, vat: { minor: 207000, currency: 'NGN' } },
        { id: 'sub_export', domainId: 'dom_export', planCode: 'starter', term: 'annual', status: 'active', renewsAt: '2027-08-18', graceEndsAt: null, paidBy: 'card', extraStorageGb: 0, priceExVat: { minor: 1200000, currency: 'NGN' }, vat: { minor: 90000, currency: 'NGN' } },
    ],

    // Newest first. `emphasis` is the part of `text` shown in bold.
    activity: [
        { id: 'act_1', domainId: 'dom_foods', at: '2026-09-26T10:15:00+01:00', actor: { type: 'user', name: 'You' }, text: 'You created emeka@adaobifoods.com', emphasis: 'emeka@adaobifoods.com', category: 'mailboxes' },
        { id: 'act_2', domainId: 'dom_foods', at: '2026-09-17T14:02:00+01:00', actor: { type: 'user', name: 'You' }, text: 'Quota for sales@ raised from 6 GB to 8 GB', emphasis: 'sales@', category: 'storage' },
        { id: 'act_3', domainId: 'dom_foods', at: '2026-03-04T11:30:00+01:00', actor: { type: 'system', name: 'Ziroemail' }, text: 'adaobifoods.com finished setup, all records passing', emphasis: 'adaobifoods.com', category: 'domain' },
        { id: 'act_4', domainId: 'dom_export', at: '2026-09-27T09:00:00+01:00', actor: { type: 'system', name: 'Ziroemail' }, text: 'Inbox placement on Outlook fell to 71%', emphasis: 'Outlook', category: 'domain' },
        { id: 'act_5', domainId: 'dom_export', at: '2026-08-18T12:10:00+01:00', actor: { type: 'user', name: 'You' }, text: 'You created export@adaobiexport.ng', emphasis: 'export@adaobiexport.ng', category: 'mailboxes' },
        { id: 'act_6', domainId: 'dom_export', at: '2026-08-18T12:00:00+01:00', actor: { type: 'system', name: 'Ziroemail' }, text: 'adaobiexport.ng added, DKIM step not completed', emphasis: 'adaobiexport.ng', category: 'domain' },
    ],

    // Organisation roles. The owner is the account holder's own address, not a mailbox on a domain.
    people: [
        { id: 'p_owner', name: 'Victory Adaobi', email: 'victory.adaobi@example.com', role: 'owner', locked: true, kind: 'person', grantedAt: null },
        { id: 'p_ngozi', name: 'Ngozi Adeyemi', email: 'ngozi@adaobifoods.com', role: 'admin', locked: false, kind: 'person', grantedAt: '2026-03-05' },
    ],
    delegations: [
        { id: 'del_1', granteeName: 'Techsavii Ltd', scope: 'Agency access to adaobifoods.com', grantedAt: '2026-03-04', expiresAt: null, revokedAt: null },
    ],

    aliases: [
        { id: 'al_info', domainId: 'dom_foods', address: 'info@adaobifoods.com', destinations: ['victory@adaobifoods.com', 'sales@adaobifoods.com'], type: 'forward' },
        { id: 'al_accounts', domainId: 'dom_foods', address: 'accounts@adaobifoods.com', destinations: ['victory@adaobifoods.com'], type: 'alias' },
        { id: 'al_orders', domainId: 'dom_foods', address: 'orders@adaobifoods.com', destinations: ['sales@adaobifoods.com'], type: 'alias' },
        { id: 'al_sales_export', domainId: 'dom_export', address: 'sales@adaobiexport.ng', destinations: ['export@adaobiexport.ng'], type: 'alias' },
    ],
    catchAll: { dom_foods: { on: false, destination: null }, dom_export: { on: false, destination: null } },

    // Newest first. `category` is one of mailboxes, storage, billing, access, domain.
    audit: [
        { id: 'au_1', at: '2026-09-29T09:14:00+01:00', actor: { type: 'user', name: 'Victory Adaobi' }, text: 'Victory Adaobi signed in', emphasis: 'Victory Adaobi', category: 'access', detail: 'Chrome on Windows, Port Harcourt' },
        { id: 'au_2', at: '2026-09-28T14:20:00+01:00', actor: { type: 'system', name: 'Ziroemail' }, text: 'SPF record for adaobifoods.com stopped verifying', emphasis: 'adaobifoods.com', category: 'domain', detail: 'Detected automatically, changed outside Ziroemail' },
        { id: 'au_3', at: '2026-09-17T14:02:00+01:00', actor: { type: 'user', name: 'Victory Adaobi' }, text: 'Victory Adaobi raised the quota on sales@ from 6 GB to 8 GB', emphasis: 'sales@', category: 'storage', detail: 'Pool unassigned went from 16 GB to 14 GB' },
        { id: 'au_4', at: '2026-09-15T10:00:00+01:00', actor: { type: 'user', name: 'Victory Adaobi' }, text: 'Victory Adaobi bought 10 GB of extra storage', emphasis: null, category: 'billing', detail: 'Pool went from 30 GB to 40 GB, \u20A66,450 inc. VAT' },
        { id: 'au_5', at: '2026-03-05T09:30:00+01:00', actor: { type: 'user', name: 'Victory Adaobi' }, text: 'Victory Adaobi granted delegated access to Techsavii Ltd', emphasis: 'Techsavii Ltd', category: 'access', detail: 'Can be withdrawn at any time from Team & access' },
        { id: 'au_6', at: '2026-03-04T11:30:00+01:00', actor: { type: 'system', name: 'Ziroemail' }, text: 'Three mailboxes created during setup', emphasis: null, category: 'mailboxes', detail: 'victory@, sales@, ngozi@' },
        { id: 'au_7', at: '2026-03-04T11:00:00+01:00', actor: { type: 'system', name: 'Ziroemail' }, text: 'Domain adaobifoods.com verified', emphasis: 'adaobifoods.com', category: 'domain', detail: 'All four authentication records passing' },
    ],

    // Newest first. total is what was charged, VAT included.
    invoices: [
        { id: 'inv_2', domainId: 'dom_foods', number: 'ZIRO-2026-0002', issuedAt: '2026-09-15', description: 'Extra storage, 10 GB', total: { minor: 645000, currency: 'NGN' }, status: 'paid', pdfAvailable: false },
        { id: 'inv_1', domainId: 'dom_foods', number: 'ZIRO-2026-0001', issuedAt: '2026-03-04', description: 'Business plan, 1 year', total: { minor: 2967000, currency: 'NGN' }, status: 'paid', pdfAvailable: false },
        { id: 'inv_3', domainId: 'dom_export', number: 'ZIRO-2026-0003', issuedAt: '2026-08-18', description: 'Starter plan, 1 year', total: { minor: 1290000, currency: 'NGN' }, status: 'paid', pdfAvailable: false },
    ],
};
