import { Link } from '@inertiajs/react';
import QrCode from '../../Components/domain/QrCode';
import Button from '../../Components/ui/Button';
import { CheckIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import useOnboarding from '../../Hooks/useOnboarding';
import useQuery from '../../Hooks/useQuery';
import OnboardingLayout from '../../Layouts/OnboardingLayout';
import { onboardingFixture } from '../../fixtures/onboarding';
import { plans } from '../../fixtures/plans';
import { decodeMailboxes, quotaOf, rowsFromFixture } from '../../Lib/onboarding';
import { route } from '../../Lib/route';

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export default function Done() {
    const { domain, planCode } = useOnboarding();
    const plan = plans.find((p) => p.code === planCode) ?? plans[0];
    const rows = decodeMailboxes(useQuery().get('mailboxes')) ?? rowsFromFixture(onboardingFixture.mailboxes.initial);
    const assigned = Math.round(rows.reduce((sum, row) => sum + quotaOf(row), 0) * 10) / 10;
    const free = Math.max(0, Math.round((plan.poolGb - assigned) * 10) / 10);
    const { importMinutesRemaining, filtering } = onboardingFixture.done;
    const count = NUMBER_WORDS[rows.length] ?? String(rows.length);
    const { toast } = useToast();

    function sendOnWhatsApp(local) {
        toast({ tone: 'warn', title: 'Sending is not live yet', message: `The setup link for ${local}@${domain} will go out on WhatsApp once messaging is connected.` });
    }

    const checks = [
        { done: true, title: 'All four records verified', note: 'MX, SPF, DKIM and DMARC are passing' },
        { done: true, title: `${count} ${rows.length === 1 ? 'mailbox' : 'mailboxes'} created`, note: `${assigned} GB assigned, ${free} GB still free in your pool` },
        { done: filtering, title: 'Filtering is on', note: 'Spam, phishing and malware, from the first message' },
        { done: false, title: 'Importing your old mail', note: `About ${importMinutesRemaining} minutes remaining. You can leave this page` },
    ];

    const next = [
        { title: 'Open your mailbox', note: 'Read and send from the browser, right now.', href: route('mail') },
        { title: 'Add more mailboxes', note: `You still have ${free} GB unassigned in the pool.`, href: route('dashboard') },
        { title: 'Go to the dashboard', note: 'Storage, billing, staff and domain health.', href: route('dashboard') },
    ];

    return (
        <>
            <Seo title="You are live | Ziroemail" description="Your domain is verified and your mailboxes are ready." path="/onboarding/done" noindex />

            <div className="done-hero" data-hero>
                <span className="done-tick" aria-hidden="true"><CheckIcon size={34} /></span>
                <h1>You are live.</h1>
                <p className="lead">
                    <span className="mono strong">{domain}</span> is verified and your {count.toLowerCase()} {rows.length === 1 ? 'mailbox is' : 'mailboxes are'} ready to receive. Mail sent to {rows.length === 1 ? 'it' : 'them'} now arrives here.
                </p>
            </div>

            <ul className="checks" aria-label="What is done">
                {checks.map((check) => (
                    <li key={check.title} className="check-i">
                        <span className={`check-ic${check.done ? ' is-done' : ''}`} aria-hidden="true">
                            {check.done ? <CheckIcon size={12} /> : <span className="check-dot" />}
                        </span>
                        <span><b>{check.title}</b><span>{check.note}</span></span>
                    </li>
                ))}
            </ul>

            <section className="done-block" aria-labelledby="phones-h">
                <h2 id="phones-h">Now get everyone onto their phone</h2>
                <p className="lead">Each person scans their own code, or you send them the link on WhatsApp. It takes about thirty seconds and they will not need to type any settings.</p>

                <div className="setups">
                    {rows.map((row, i) => {
                        const address = `${row.local}@${domain}`;
                        return (
                            <div className="setup" key={row.id}>
                                <p className="who">{address}</p>
                                <QrCode url={`${onboardingFixture.mailboxes.setupUrlBase}${row.local}`} label={`Setup code for ${address}`} size={120} />
                                {i === 0 ? (
                                    <Button size="sm" full href={route('setup.device')}>Set up this phone</Button>
                                ) : (
                                    <Button variant="line" size="sm" full onClick={() => sendOnWhatsApp(row.local)}>Send on WhatsApp</Button>
                                )}
                                <p className="setup-note">{i === 0 ? 'That is you, scan it now' : 'Not set up yet'}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <Note tone="warn" title="Tell your customers nothing changed" className="done-note">
                <p>Your addresses are exactly the same as before, so nobody needs to update their contacts. The only difference is that your mail now arrives reliably.</p>
            </Note>

            <section className="done-block" aria-labelledby="next-h">
                <h2 id="next-h">Where to go from here</h2>
                <div className="next">
                    {next.map((item) => (
                        <Link key={item.title} href={item.href}>
                            <b>{item.title}</b>
                            <span>{item.note}</span>
                        </Link>
                    ))}
                </div>
            </section>
        </>
    );
}

Done.layout = (page) => (
    <OnboardingLayout step={null} headerEnd={<Button variant="line" size="sm" href={route('dashboard')}>Go to dashboard</Button>}>
        {page}
    </OnboardingLayout>
);
