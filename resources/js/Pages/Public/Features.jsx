import { Link } from '@inertiajs/react';
import Reveal from '../../Components/craft/Reveal';
import Card from '../../Components/ui/Card';
import CtaBlock from '../../Components/ui/CtaBlock';
import PageHero from '../../Components/ui/PageHero';
import Ticks from '../../Components/ui/Tick';
import Seo from '../../Components/seo/Seo';
import PublicLayout from '../../Layouts/PublicLayout';
import { route } from '../../Lib/route';

const rows = [
    {
        n: '01',
        kicker: 'Delivery',
        title: 'Mail that reaches the inbox',
        body: [
            'We generate SPF, DKIM and DMARC for your exact domain, show you where to paste them, and verify them ourselves. Your mailboxes do not go live until all four records pass. That is stricter than most providers, deliberately.',
            'After that we keep watching. If somebody edits your DNS months later and breaks a record, you hear about it from us before your customers notice.',
        ],
        ticks: [
            'Records written for your domain, not a generic template',
            'Outbound sending monitored for spikes and abuse',
            'Ongoing checks against the major blocklists',
        ],
    },
    {
        n: '02',
        kicker: 'Storage',
        title: 'One pool, divided your way',
        body: [
            'Your plan gives the domain a storage pool. You decide how it is split: twelve gigabytes for the address that keeps every invoice, half a gigabyte for a seasonal hire, nothing wasted on mailboxes that barely receive.',
            'Change the split whenever you like. Run low and add a 10 GB block, which joins the pool immediately at the same price on every plan.',
        ],
        link: { label: 'How storage is priced', href: route('pricing') },
    },
    {
        n: '03',
        kicker: 'Devices',
        title: 'Phones that set themselves up',
        body: [
            'Add a staff member, send them a link on WhatsApp, and they tap once. iPhone installs a signed configuration profile; Android gets pre-filled guided steps. Nothing typed, nothing dictated over the phone.',
            'Outlook and Apple Mail find their own settings through autodiscover. The dashboard shows you whether each mailbox has actually connected from a device.',
        ],
    },
    {
        n: '04',
        kicker: 'Safety',
        title: 'Filtering, backups and locks',
        body: [
            'Spam, phishing and malware filtering on everything inbound, with quarantine you can release from yourself. Two-factor login on any mailbox, enforced for owners.',
            'Encrypted backups leave the server daily under separate credentials, and the restore is tested, not assumed.',
        ],
    },
    {
        n: '05',
        kicker: 'Control',
        title: 'An admin surface that is actually usable',
        body: [
            <>Create mailboxes, reset a staff password, move storage between people, add a shared address like <span className="mono">info@</span>, or hand an agency delegated access you can withdraw in one click.</>,
            'Everything that matters is logged: who created what, who changed a quota, who exported data.',
        ],
    },
    {
        n: '06',
        kicker: 'Support',
        title: 'People who answer',
        body: [
            'WhatsApp support from the team that runs the servers, not a ticket queue in another time zone. Setup runs on its own, so most people never need us at all, and when something does break, you get somebody who knows the system.',
            'Uptime and incidents are published on a status page hosted away from our own infrastructure, so it still loads on the day we are the problem.',
        ],
    },
];

const specs = [
    { title: 'Your own domain', body: 'Unlimited mailboxes and shared addresses on the name you already own.' },
    { title: 'IMAP & SMTP', body: 'Works with Outlook, Apple Mail, Thunderbird and the Gmail app.' },
    { title: 'Webmail', body: 'Built for a phone browser first, not a desktop app shrunk down.' },
    { title: 'Search', body: 'Across sender, subject, body and attachment names.' },
    { title: 'Aliases & forwarding', body: 'Extra addresses that deliver into an existing mailbox, not billed separately.' },
    { title: 'Out-of-office', body: 'Auto-replies with a date range, set per mailbox.' },
    { title: 'Two-factor login', body: 'Available to everyone, enforced for owners and administrators.' },
    { title: 'Export', body: 'Take all your mail with you whenever you want. Documented, self-service.' },
];

export default function Features() {
    return (
        <>
            <Seo title="Features | Ziroemail"
                description="What Ziroemail gives your business: mail that reaches the inbox, storage you divide yourself, phones that set themselves up, and support from people."
                path="/features"
                ogTitle="Features | Ziroemail business email"
                ogDescription="Authentication set up for you, storage you divide yourself, automatic phone setup, filtering, backups and WhatsApp support. Included on every plan." />

            <PageHero
              eyebrow="Features"
              title="Everything a business needs from its email."
              lead="No add-on tiers for the basics. Authentication, filtering, backups, device setup and support are in every plan, because email without them is not really email."
            />

            {/* ===== FEATURE ROWS ===== */}
            <section className="feature-rows">
              <div className="wrap">
                {rows.map((row) => (
                  <Reveal key={row.n} className="feature-row">
                    <div className="feature-k">
                      <span className="n">{row.n}</span>
                      <span className="kicker">{row.kicker}</span>
                    </div>
                    <div className="feature-main">
                      <h2>{row.title}</h2>
                      {row.body.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                      {row.ticks && <Ticks items={row.ticks} />}
                      {row.link && <Link className="tlink" href={row.link.href}>{row.link.label}</Link>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* ===== SPEC GRID ===== */}
            <section className="sec band-soft">
              <div className="wrap">
                <Reveal className="block-head center">
                  <span className="eyebrow">The details</span>
                  <h2>Included on every plan</h2>
                </Reveal>
                <Reveal stagger className="spec-grid">
                  {specs.map((spec) => (
                    <Card key={spec.title} className="spec-card">
                      <h3>{spec.title}</h3>
                      <p>{spec.body}</p>
                    </Card>
                  ))}
                </Reveal>
                <div className="note spec-note">
                  <h4>What we do not offer</h4>
                  <p>No bulk or marketing email. It is the fastest way to get a mail server blocked, and protecting delivery for everyone else matters more than that sale. There is no built-in calendar screen yet either, though calendars work through your phone's own calendar app.</p>
                </div>
              </div>
            </section>

            <CtaBlock
              title="See it on your own domain"
              lead="Connect your domain, add your staff, and have every phone working before you close for the day."
              primary={{ label: 'Get started', href: route('signup') }}
              secondary={{ label: 'See pricing', href: route('pricing') }}
            />
        </>
    );
}

Features.layout = (page) => (
    <PublicLayout variant="float" page="features">{page}</PublicLayout>
);
