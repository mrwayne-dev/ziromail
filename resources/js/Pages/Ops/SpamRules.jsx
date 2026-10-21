import { Link, usePage } from '@inertiajs/react';
import SectionHeader from '../../Components/ops/SectionHeader';
import Note from '../../Components/ui/Note';
import OpsLayout from '../../Layouts/OpsLayout';
import { route } from '../../Lib/route';

function KV({ rows }) {
    return (
        <dl className="ops-kv">
            {rows.map(([label, value]) => (
                <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                </div>
            ))}
        </dl>
    );
}

export default function SpamRules() {
    const { rules, activity, weeks } = usePage().props;
    const live = rules.mode === 'live';

    const checks = [
        ['Volume', `An hour's sending more than ${rules.volume_multiple} times the mailbox's own 30-day hourly average, and at least ${rules.min_volume} messages.`],
        ['Bounces', `More than ${rules.bounce_hour_pct}% of an hour's messages bounced, once at least ${rules.min_sample} were sent.`],
        ['Outbound filter', `More than ${rules.filter_pct}% of an hour's messages flagged as bulk or phishing-like by the mail server's filter. The filter reports a count, never the text.`],
        ['Complaints', `More than ${rules.complaint_pct}% of an hour's messages reported as spam, once at least ${rules.min_sample} were sent.`],
    ];

    const steps = [
        ['New domains', `Until its first payment clears, a domain's mailboxes may send only ${rules.probation_per_hour} messages an hour.`],
        ['Any rule trips', rules.auto_limit ? `Sending is slowed to ${rules.limited_per_hour} messages an hour and a flag waits in the abuse queue for a person.` : 'A flag waits in the abuse queue for a person.'],
        ['Volume + something else', rules.auto_lock ? 'Sending is locked automatically and the owner is emailed with the reason. Receiving continues. Staff can reverse it.' : 'A flag is raised for a person to decide.'],
        ['A person decides the rest', 'Lock, warn or clear, with a written reason that is kept in the audit trail and sent to the owner.'],
    ];

    return (
        <OpsLayout page="ops-spam-rules" title="Spam rules">
            <SectionHeader
                title="Spam rules"
                description="How the sending bot decides a mailbox looks unlike itself, and what it may do alone. Read-only: thresholds change in a reviewed code change, never from this page."
                badge={live ? 'Live' : 'Practice mode'}
            />

            <Note tone={live ? 'ok' : 'warn'} title={live ? 'The bot is live' : 'The bot is in practice mode'} className="mb">
                <p>{live
                    ? 'It slows and locks sending as described below.'
                    : 'It flags what it sees and records what it would have done, but slows and locks nothing. It is switched to live in the server settings once the numbers below look right.'}</p>
            </Note>

            <div className="ops-row2">
                <div className="ops-stack">
                    <section className="ops-card" aria-labelledby="what-h">
                        <h2 id="what-h" className="ops-card-h">What it checks</h2>
                        <p className="ops-card-lede">Every threshold is judged against the mailbox's own history, so a business that always sends a lot is not flagged for doing it again.</p>
                        <div className="mt-10"><KV rows={checks} /></div>
                    </section>

                    <section className="ops-card" aria-labelledby="do-h">
                        <h2 id="do-h" className="ops-card-h">What it does</h2>
                        <div className="mt-10"><KV rows={steps} /></div>
                    </section>
                </div>

                <div className="ops-stack">
                    <section className="ops-card" aria-labelledby="act-h">
                        <h2 id="act-h" className="ops-card-h">Last 30 days</h2>
                        <div className="mt-10">
                            <KV rows={[
                                ['Flags raised', activity.flagged],
                                ['Slowed automatically', activity.autoLimited],
                                ['Locked automatically', activity.autoLocked],
                                ['Cleared as not abuse', activity.cleared],
                                ['Restricted right now', activity.currentlyRestricted],
                            ]} />
                        </div>
                        <p className="ops-sm mt-10"><Link href={route('ops.abuse')} className="ops-link">Open the abuse queue</Link></p>
                    </section>

                    <section className="ops-card" aria-labelledby="wk-h">
                        <h2 id="wk-h" className="ops-card-h">Week by week</h2>
                        <div className="mt-10">
                            <KV rows={weeks.map((week) => [
                                `Week of ${week.label}`,
                                `${week.flagged} flagged, ${week.autoActed} acted on, ${week.wouldHave} would have, ${week.cleared} cleared`,
                            ])} />
                        </div>
                    </section>

                    <Note title="What it never sees">
                        <p>The bot works from counts: how many were sent, bounced, reported and sent to new people. It does not read subject lines, message bodies or recipient addresses, and staff cannot open a customer's mailbox. Mail content lives only on the mail server.</p>
                    </Note>

                    <Note tone="warn" title="Not connected to the mail server yet">
                        <p>The bot is ready, but no mail server is sending counts to it. Until one is connected, these figures stay at zero and a lock is recorded here without being applied on the server.</p>
                    </Note>
                </div>
            </div>
        </OpsLayout>
    );
}
