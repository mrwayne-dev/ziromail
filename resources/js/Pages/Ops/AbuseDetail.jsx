import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import SectionHeader from '../../Components/ops/SectionHeader';
import SeriesChart from '../../Components/ops/SeriesChart';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import useOpsCan from '../../Hooks/useOpsCan';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatDate, formatRelative } from '../../Lib/format';
import { route } from '../../Lib/route';

const DECISIONS = {
    locked:  { title: 'Lock sending', confirm: 'Lock sending', tone: 'danger' },
    warned:  { title: 'Keep the limit and email a warning', confirm: 'Email the warning', tone: 'primary' },
    cleared: { title: 'Lift the limit: not abuse', confirm: 'Lift the limit', tone: 'ink' },
};

export default function AbuseDetail() {
    useRealtimeReload({ channel: 'ops', map: { abuse: ['flag', 'detail', 'exemptReason'] } });

    const { flag, detail, rules, exemptReason } = usePage().props;
    const { toast } = useToast();
    const can = useOpsCan();
    const [decision, setDecision] = useState(null);
    const [exempting, setExempting] = useState(false);
    const isOwner = usePage().props.staff?.role === 'owner';
    const isHot = (value) => value >= rules.minVolume && value > detail.baselinePerHour * rules.volumeMultiple;
    const hours = detail.series.map((value, index) => ({ label: `${index}`, value, tone: isHot(value) ? 'hot' : 'base' }));
    const hot = detail.series.filter(isHot).length;
    const max = Math.max(...detail.series, 1);
    const start = new Date(detail.startsAt);
    const hourLabel = (offset) => new Date(start.getTime() + offset * 3600000).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false });
    const toneForSeverity = flag.severity === 'high' ? 'bad' : flag.severity === 'medium' ? 'watch' : 'info';

    function confirm(reason) {
        router.post(route('ops.abuse.resolve', { flag: flag.id }), { outcome: decision, reason }, {
            onSuccess: () => toast({ tone: 'ok', title: 'Decision recorded.', message: 'It is in the audit trail with your name on it.' }),
            onFinish: () => setDecision(null),
        });
    }

    function exempt(reason) {
        router.post(route('ops.abuse.exempt', { mailbox: flag.mailboxId }), { reason }, {
            preserveScroll: true,
            onSuccess: () => toast({ tone: 'ok', title: 'Sending checks switched off for this mailbox.', message: 'It is in the audit trail with your name on it.' }),
            onFinish: () => setExempting(false),
        });
    }

    function restore() {
        router.post(route('ops.abuse.exempt', { mailbox: flag.mailboxId }), {}, { preserveScroll: true });
    }

    return (
        <OpsLayout page="ops-abuse-detail" title="Sending review" parent={{ href: route('ops.abuse'), label: 'Abuse queue' }}>
            <SectionHeader
                title="Sending review"
                description="Everything the bot counted, and nothing it could not see. The decision is yours and it is recorded with your name on it."
                badge={flag.stateLabel}
                actions={<Button variant="line" size="sm" href={route('ops.users.show', { user: flag.ownerId })}>User record</Button>}
            />

            <section className={`ops-card tone-${toneForSeverity === 'bad' ? 'high' : toneForSeverity === 'watch' ? 'med' : 'low'}`}>
                <h2 className="ops-card-h mono">{flag.address}</h2>
                <p className="ops-card-lede">{flag.orgName} &middot; {detail.plan ?? 'No'} plan &middot; customer since {formatDate(flag.customerSince)} &middot; {detail.mailboxCount} {detail.mailboxCount === 1 ? 'mailbox' : 'mailboxes'}</p>
            </section>

            <div className="ops-row2 mt-20">
                <div className="ops-stack">
                    <section className="ops-card" aria-labelledby="vol-h">
                        <h3 className="ops-card-h" id="vol-h">Messages sent, last 24 hours</h3>
                        <p className="ops-card-lede">Red marks hours more than {rules.volumeMultiple} times this mailbox's own hourly average ({detail.baselinePerHour}).</p>
                        <div className="mt-14">
                            <SeriesChart kind="bars" points={hours} max={max} label={`Hourly sending volume: ${hot} hour${hot === 1 ? '' : 's'} far above the mailbox's own average, peaking at ${max.toLocaleString('en-NG')} messages`} />
                            <div className="ops-axis-row ops-tnum mt-8">
                                <span>{hourLabel(0)}</span><span>{hourLabel(12)}</span><span>{hourLabel(23)}</span>
                            </div>
                        </div>
                        <p className="ops-sm ops-mut mt-10">{flag.summary}.</p>
                    </section>

                    <section className="ops-card" aria-labelledby="rec-h">
                        <h3 className="ops-card-h" id="rec-h">What the bot counted</h3>
                        <dl className="mt-10">
                            {flag.evidence.map((item) => (
                                <div key={item.key} className="ops-kv-row">
                                    <dt>{item.k}</dt>
                                    <dd className={item.hot ? 'num hot' : 'num'}>{item.v}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="ops-sm ops-mut mt-10">{flag.verdict}</p>
                    </section>

                    <Note title="What the bot cannot see">
                        <p>It never reads subject lines, message bodies or recipient addresses, and neither can you. Counts and rates are all that is kept. If you need to know what was sent, ask the owner.</p>
                    </Note>
                </div>

                <div className="ops-stack">
                    <section className="ops-card">
                        <h3 className="ops-card-h">Decide</h3>
                        <p className="ops-card-lede">
                            {flag.sendingState === 'locked' ? 'Sending is locked now.' : flag.sendingState === 'limited' ? `Sending is slowed to ${rules.limitedPerHour} messages an hour, applied automatically.` : 'Sending is not restricted.'} Choose what happens next.
                        </p>
                        <div className="ops-stack ops-stack-tight mt-12">
                            {can('lock')
                                ? <Button variant="danger" full onClick={() => setDecision('locked')} disabled={flag.sendingState === 'locked'}>Lock sending</Button>
                                : <Button variant="line" full disabled title="Only Engineers and Owners can lock an account">Lock sending</Button>}
                            <Button full onClick={() => setDecision('warned')}>Keep the limit, email a warning</Button>
                            <Button variant="line" full onClick={() => setDecision('cleared')}>Lift the limit: not abuse</Button>
                        </div>
                        <p className="ops-sm ops-mut mt-10">Whichever you pick, you write a sentence saying why. It appears in the audit trail and in the email the customer receives.</p>
                    </section>

                    {isOwner && (
                        <section className="ops-card">
                            <h3 className="ops-card-h">Sending checks</h3>
                            {exemptReason
                                ? <>
                                    <p className="ops-card-lede">Switched off for this mailbox: {exemptReason}</p>
                                    <Button variant="line" full className="mt-10" onClick={restore}>Switch checks back on</Button>
                                  </>
                                : <>
                                    <p className="ops-card-lede">For a customer who legitimately sends in bulk. The bot stops flagging this mailbox. Use sparingly.</p>
                                    <Button variant="line" full className="mt-10" onClick={() => setExempting(true)}>Switch checks off</Button>
                                  </>}
                        </section>
                    )}

                    <Note tone="warn" title="What a lock does">
                        <p>Sending stops immediately. Mail still arrives, sign-in still works and nothing is deleted. The owner gets an email with the reason and a reply address.</p>
                    </Note>

                    <section className="ops-card">
                        <h3 className="ops-card-h">History on this mailbox</h3>
                        {detail.history.length === 0
                            ? <p className="ops-sm ops-mut mt-10">Nothing has been recorded yet.</p>
                            : <div className="ops-stack-tight mt-10">
                                {detail.history.map((item) => (
                                    <p key={item.id} className="ops-sm m-0">
                                        <b>{formatRelative(item.at)}</b>: {item.text}{item.detail ? ` (${item.detail})` : ''}
                                    </p>
                                ))}
                              </div>}
                    </section>

                    <Note tone="bad" title="If this reaches a blocklist">
                        <p>Customers share sending addresses, so a listing caused by one account can put every other customer's mail in the spam folder within hours, and delisting takes days. The cost of locking wrongly is one annoyed customer; the cost of waiting is all of them.</p>
                    </Note>
                </div>
            </div>

            <ReasonDialog open={exempting} onClose={() => setExempting(false)} title="Switch sending checks off" description={`${flag.address}. The bot will stop flagging this mailbox until an owner switches it back on.`} confirmLabel="Switch off" tone="ink" onConfirm={exempt} />
            <ReasonDialog
                open={Boolean(decision)}
                onClose={() => setDecision(null)}
                title={decision ? DECISIONS[decision].title : ''}
                description={decision ? `${flag.address}. The reason goes into the audit trail and the email the customer receives.` : ''}
                confirmLabel={decision ? DECISIONS[decision].confirm : ''}
                tone={decision ? DECISIONS[decision].tone : 'ink'}
                onConfirm={confirm}
            />
        </OpsLayout>
    );
}
