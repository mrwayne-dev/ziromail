/*
 * PLACEHOLDER mailbox data for webmail, shaped like the future MailboxClient
 * responses (docs/DASHBOARD_UI_MAP.md §5.5): folders, message rows and details,
 * contacts and settings. Times are ISO 8601 and read against the one reference
 * moment in fixtures/organisation.js. Message bodies are lists of blocks rather
 * than HTML, so nothing here is ever injected into the page as markup; the real
 * client returns sanitised HTML for a sandboxed frame.
 *
 * Names and addresses are fictional.
 */
export const mailboxFixture = {
    address: 'sales@adaobifoods.com',
    displayName: 'Adaobi Foods Sales',
    quota: { usedGb: 6.1, quotaGb: 8, orgDomainPoolGb: 40 },
    domain: 'adaobifoods.com',
    signature: 'Adaobi Foods Sales\nAdaobi Foods Ltd, Port Harcourt\nsales@adaobifoods.com',
};

export const folderDefs = [
    { id: 'inbox', name: 'Inbox', kind: 'inbox' },
    { id: 'sent', name: 'Sent', kind: 'sent' },
    { id: 'drafts', name: 'Drafts', kind: 'drafts' },
    { id: 'archive', name: 'Archive', kind: 'archive' },
    { id: 'spam', name: 'Spam', kind: 'spam' },
    { id: 'trash', name: 'Trash', kind: 'trash' },
    { id: 'invoices', name: 'Invoices', kind: 'user' },
    { id: 'suppliers', name: 'Suppliers', kind: 'user' },
    { id: 'orders', name: 'Orders', kind: 'user' },
];

const person = (name, address) => ({ name, address });
const me = person('Adaobi Foods Sales', 'sales@adaobifoods.com');

export const messageFixtures = [
    {
        uid: 'm1', folder: 'inbox', from: person('First Bank Nigeria', 'alerts@firstbank.example'), to: [me],
        subject: 'Payment confirmation: ₦480,000',
        preview: 'Your account has been credited for invoice INV-2291 from Lagos Retail Ltd.',
        receivedAt: '2026-09-29T09:14:00+01:00', unread: true, hasAttachment: true,
        receipt: { requested: false, state: 'none', openedAt: null },
        cc: [], remoteImages: 'blocked', hasRemoteImages: true,
        body: [
            { type: 'p', text: 'Dear Customer,' },
            { type: 'p', text: 'Your account ending 417 has been credited with ₦480,000.00 on 29 September 2026 at 09:12.' },
            { type: 'p', text: 'Narration: INV-2291 LAGOS RETAIL LTD SUPPLY' },
            { type: 'p', text: 'If you did not authorise this transaction, please contact your branch immediately.' },
        ],
        attachments: [{ id: 'a1', name: 'Credit-advice-INV2291.pdf', type: 'PDF', sizeKb: 94 }],
    },
    {
        uid: 'm2', folder: 'inbox', from: person('Chidi Okonkwo', 'chidi@lagosretail.example'), to: [me],
        subject: 'Re: Supply quotation for October',
        preview: 'Thank you for the quote. Please confirm the delivery window and we will proceed with the order.',
        receivedAt: '2026-09-29T08:42:00+01:00', unread: true, hasAttachment: true,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [
            { type: 'p', text: 'Good morning,' },
            { type: 'p', text: 'Thank you for the quote. The pricing works for us. Please confirm the delivery window and we will proceed with the order this week.' },
            { type: 'p', text: 'One question: is the 5% discount still available if we take the full forty cartons rather than twenty-five?' },
            { type: 'p', text: 'Regards,\nChidi' },
            { type: 'quote', head: 'On 27 September, Adaobi Foods Sales wrote:', text: 'Please find our quotation for October attached. Prices hold for fourteen days and delivery within Port Harcourt is at no extra charge.' },
        ],
        attachments: [{ id: 'a2', name: 'Quotation-October.pdf', type: 'PDF', sizeKb: 182 }],
    },
    {
        uid: 'm3', folder: 'inbox', from: person('Ngozi Adeyemi', 'ngozi.a@rivermart.example'), to: [me],
        subject: 'Purchase order PO-4417 attached',
        preview: "Kindly find attached the purchase order for this month's order. Regards.",
        receivedAt: '2026-09-28T16:20:00+01:00', unread: true, hasAttachment: true,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [
            { type: 'p', text: 'Good afternoon,' },
            { type: 'p', text: "Kindly find attached the purchase order for this month's order. Quantities are the same as September except for the palm oil, which we have increased to sixty units." },
            { type: 'p', text: 'Please acknowledge receipt and confirm the delivery date. Our stores close at 4pm on Fridays.' },
            { type: 'p', text: 'Regards,\nNgozi Adeyemi\nProcurement, RiverMart' },
        ],
        attachments: [
            { id: 'a3', name: 'PO-4417.pdf', type: 'PDF', sizeKb: 128 },
            { id: 'a4', name: 'Order-lines-October.xlsx', type: 'XLS', sizeKb: 46 },
        ],
    },
    {
        uid: 'm4', folder: 'invoices', from: person('Zenith Trade Ltd', 'accounts@zenithtrade.example'), to: [me],
        subject: 'Invoice receipt for September',
        preview: 'Attached is your receipt for the transaction completed on Friday afternoon.',
        receivedAt: '2026-09-25T11:05:00+01:00', unread: false, hasAttachment: true,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: true,
        body: [
            { type: 'p', text: 'Dear Adaobi Foods,' },
            { type: 'p', text: 'Attached is your receipt for the transaction completed on Friday afternoon. Payment of ₦212,500.00 was received in full against invoice ZT-8841.' },
            { type: 'p', text: 'No further action is needed. Thank you for your business.\nAccounts Department, Zenith Trade Limited' },
        ],
        attachments: [{ id: 'a5', name: 'Receipt-ZT-8841.pdf', type: 'PDF', sizeKb: 61 }],
    },
    {
        uid: 'm5', folder: 'inbox', from: person('Ibrahim Sani', 'ibrahim@sanilogistics.example'), to: [me],
        subject: 'Delivery schedule next week',
        preview: 'Good afternoon. Can we move the Thursday delivery to Friday morning instead?',
        receivedAt: '2026-09-24T09:38:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [
            { type: 'p', text: 'Good afternoon,' },
            { type: 'p', text: 'Can we move the Thursday delivery to Friday morning instead? Two of our trucks are going in for servicing and Thursday will be tight.' },
            { type: 'p', text: 'Friday between 8am and 11am would suit us. Let me know if that causes a problem at your end and we will work around it.\nIbrahim Sani, Sani Logistics' },
        ],
        attachments: [],
    },
    {
        uid: 'm6', folder: 'suppliers', from: person('Ziroemail', 'no-reply@ziroemail.com'), to: [me],
        subject: 'Your domain is verified and live',
        preview: 'All four records for adaobifoods.com have been verified. Your mailboxes are active.',
        receivedAt: '2026-03-04T14:02:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [
            { type: 'p', text: 'Good afternoon,' },
            { type: 'p', text: 'All four records for adaobifoods.com have been verified. Your mailboxes are active and mail is being delivered.' },
            { type: 'p', text: 'Nothing else is needed from you. If mail stops arriving at any point we will email and message you on WhatsApp before you notice it yourself.' },
        ],
        attachments: [],
    },
    {
        uid: 'm7', folder: 'inbox', from: person('Kemi Martins', 'kemi@martinsandco.example'), to: [me],
        subject: 'Re: Staff email addresses',
        preview: 'The new addresses are working on my phone now. Thank you for setting it up so quickly.',
        receivedAt: '2026-09-22T10:12:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [
            { type: 'p', text: 'Hello,' },
            { type: 'p', text: 'The new addresses are working on my phone now. Thank you for setting it up so quickly.' },
        ],
        attachments: [],
    },
    {
        uid: 's1', folder: 'sent', from: me, to: [person('Chidi Okonkwo', 'chidi@lagosretail.example')],
        subject: 'Quotation for October: forty cartons',
        preview: 'Revised quotation attached, at the forty-carton rate. The 5% holds at that volume.',
        receivedAt: '2026-09-29T07:55:00+01:00', unread: false, hasAttachment: true,
        receipt: { requested: true, state: 'opened', openedAt: '2026-09-29T08:41:00+01:00' }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [{ type: 'p', text: 'Revised quotation attached, at the forty-carton rate. The 5% holds at that volume.' }],
        attachments: [{ id: 'a6', name: 'Quotation-forty-cartons.pdf', type: 'PDF', sizeKb: 175 }],
    },
    {
        uid: 's2', folder: 'sent', from: me, to: [person('Ngozi Adeyemi', 'ngozi.a@rivermart.example')],
        subject: 'Re: Purchase order PO-4417',
        preview: 'PO-4417 received and acknowledged. Sixty units of palm oil noted.',
        receivedAt: '2026-09-28T17:05:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: true, state: 'opened', openedAt: '2026-09-28T17:30:00+01:00' }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [{ type: 'p', text: 'PO-4417 received and acknowledged. Sixty units of palm oil noted. Delivery Friday morning.' }],
        attachments: [],
    },
    {
        uid: 's3', folder: 'sent', from: me, to: [person('Ibrahim Sani', 'ibrahim@sanilogistics.example')],
        subject: 'Friday morning works',
        preview: 'Friday 8am to 11am is fine. I have moved it on our end.',
        receivedAt: '2026-09-24T10:20:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: true, state: 'not_opened', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [{ type: 'p', text: 'Friday 8am to 11am is fine. I have moved it on our end.' }],
        attachments: [],
    },
    {
        uid: 's4', folder: 'sent', from: me, to: [person('Kemi Martins', 'kemi@martinsandco.example')],
        subject: 'Re: Staff email addresses',
        preview: 'Ask Amaka to switch this week rather than waiting for month end.',
        receivedAt: '2026-09-22T11:00:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [{ type: 'p', text: 'Ask Amaka to switch this week rather than waiting for month end.' }],
        attachments: [],
    },
    {
        uid: 'd1', folder: 'drafts', from: me, to: [person('Chidi Okonkwo', 'chidi@lagosretail.example')],
        subject: 'Delivery window', preview: 'Hi Chidi, we can deliver on Thursday between',
        receivedAt: '2026-09-29T09:20:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [{ type: 'p', text: 'Hi Chidi, we can deliver on Thursday between' }], attachments: [],
    },
    {
        uid: 'd2', folder: 'drafts', from: me, to: [],
        subject: '(no subject)', preview: 'Reminder to self about the October stock count.',
        receivedAt: '2026-09-27T18:00:00+01:00', unread: false, hasAttachment: false,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: false,
        body: [{ type: 'p', text: 'Reminder to self about the October stock count.' }], attachments: [],
    },
    {
        uid: 'x1', folder: 'spam', from: person('Prize Desk', 'win@prizes.example'), to: [me],
        subject: 'You have been selected', preview: 'Claim your reward before midnight.',
        receivedAt: '2026-09-28T03:00:00+01:00', unread: true, hasAttachment: false,
        receipt: { requested: false, state: 'none', openedAt: null }, cc: [], remoteImages: 'blocked', hasRemoteImages: true,
        body: [{ type: 'p', text: 'Claim your reward before midnight.' }], attachments: [],
    },
];

export const contactFixtures = [
    { id: 'c1', name: 'Chidi Okonkwo', address: 'chidi@lagosretail.example', company: 'Lagos Retail Ltd', role: 'Purchasing', phone: '0803 411 2290', autoAdded: true, addedFrom: '2026-02-18' },
    { id: 'c2', name: 'First Bank Nigeria', address: 'alerts@firstbank.example', company: 'First Bank', role: '', phone: '', autoAdded: true, addedFrom: '2026-03-04' },
    { id: 'c3', name: 'Ibrahim Sani', address: 'ibrahim@sanilogistics.example', company: 'Sani Logistics', role: 'Dispatch', phone: '0802 700 4410', autoAdded: true, addedFrom: '2026-04-11' },
    { id: 'c4', name: 'Kemi Martins', address: 'kemi@martinsandco.example', company: 'Martins & Co', role: 'Director', phone: '', autoAdded: false, addedFrom: '2026-03-02' },
    { id: 'c5', name: 'Ngozi Adeyemi', address: 'ngozi.a@rivermart.example', company: 'RiverMart', role: 'Procurement', phone: '0805 300 1188', autoAdded: true, addedFrom: '2026-02-18' },
    { id: 'c6', name: 'Zenith Trade Ltd', address: 'accounts@zenithtrade.example', company: 'Zenith Trade', role: 'Accounts', phone: '', autoAdded: true, addedFrom: '2026-05-20' },
];

export const settingsFixture = {
    identity: { displayName: 'Adaobi Foods Sales', replyTo: '', defaultFrom: true, addresses: ['sales@adaobifoods.com', 'orders@adaobifoods.com'] },
    signature: { text: 'Adaobi Foods Sales\nAdaobi Foods Ltd, Port Harcourt\nsales@adaobifoods.com', onReplies: true },
    autoReply: { on: false, from: '', until: '' },
    devices: [
        { id: 'd_1', label: 'iPhone · Apple Mail', place: 'Port Harcourt', lastActiveAt: '2026-09-29T09:26:00+01:00', current: false, revocable: false, kind: 'app' },
        { id: 'd_2', label: 'Android · Gmail app', place: 'Port Harcourt', lastActiveAt: '2026-09-08T10:00:00+01:00', current: false, revocable: true, kind: 'app' },
    ],
    security: { passwordChangedAt: '2026-06-29', blockRemoteImages: true },
    manual: {
        imap: 'imap.ziroemail.com · port 993 · SSL/TLS',
        smtp: 'smtp.ziroemail.com · port 587 · STARTTLS',
        carddav: 'dav.ziroemail.com',
    },
    preferences: { askNoSubject: true, undoSend: true, markReadOnOpen: true, requestReceipts: false, confirmReceipts: true },
};
