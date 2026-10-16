// Help centre content. Guides link nowhere yet: the articles are written in a later phase.

export const popularGuides = [
    { n: '01', title: 'My mail is going to spam', note: 'The usual cause and how to check it in two minutes' },
    { n: '02', title: 'Set up email on an iPhone', note: 'One tap with the configuration profile' },
    { n: '03', title: 'Where do I paste the DNS records?', note: 'Step by step for the common Nigerian registrars' },
    { n: '04', title: 'Give a mailbox more storage', note: 'Moving space around inside your pool' },
];

export const helpCategories = [
    {
        id: 'domain',
        name: 'Domain & DNS',
        total: 9,
        guides: ['Adding your four records', 'Fixing an SPF conflict', 'Why records take time to appear', 'Adding a second domain'],
    },
    {
        id: 'phones',
        name: 'Phones & apps',
        total: 7,
        guides: ['iPhone and iPad setup', 'Android setup', 'Outlook on a computer', 'Manual IMAP and SMTP settings'],
    },
    {
        id: 'storage',
        name: 'Storage & mailboxes',
        total: 8,
        guides: ['How the storage pool works', 'Changing a mailbox quota', 'Buying extra storage', 'Creating a shared address'],
    },
    {
        id: 'delivery',
        name: 'Delivery & spam',
        total: 6,
        guides: ['My mail is going to spam', 'Releasing a message from quarantine', 'Reporting a phishing message', 'What we do about abuse'],
    },
    {
        id: 'billing',
        name: 'Billing',
        total: 6,
        guides: ['Paying by bank transfer', 'Paying by USSD', 'Downloading a VAT invoice', 'What happens if payment is late'],
    },
    {
        id: 'moving',
        name: 'Moving to Ziroemail',
        total: 5,
        guides: ['Moving from Google Workspace', 'Moving from cPanel', 'Keeping your old address working', 'What comes across, and what does not'],
    },
];
