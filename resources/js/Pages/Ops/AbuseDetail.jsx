import { Link } from '@inertiajs/react';
import { useState } from 'react';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import SeriesChart from '../../Components/ops/SeriesChart';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import useOpsCan from '../../Hooks/useOpsCan';
import OpsLayout from '../../Layouts/OpsLayout';
import { abuseDetails, abuseFlags } from '../../fixtures/ops';
import { formatDate } from '../../Lib/format';
import { route, routeParam } from '../../Lib/route';

const DECISIONS = {
    lock: { title: 'Lock sending', confirm: 'Lock sending', tone: 'danger', done: 'Sending locked. Receiving continues.' },
    warn: { title: 'Keep the limit and email a warning', confirm: 'Email the warning', tone: 'primary', done: 'Warning emailed. The limit stays.' },
    lift: { title: 'Lift the limit: not abuse', confirm: 'Lift the limit', tone: 'ink', done: 'Limit lifted.' },
};

export default function AbuseDetail() {
    const flag = abuseFlags.find((candidate) => candidate.id === routeParam('flag')) ?? abuseFlags[0];
    const detail = abuseDetails[flag.id];
    const { toast } = useToast();
    const can = useOpsCan();
    const [decision, setDecision] = useState(null);
    const hours = detail.series.today.map((value, index) => ({ label: `${index}`, value, tone: value > detail.series.baseline[index] * 5 ? 'hot' : 'base' }));
    const hot = detail.series.today.filter((value, index) => value > detail.series.baseline[index] * 5).length;
    const max = Math.max(...detail.series.today);

    function confirm() {
        toast({ tone: 'ok', title: DECISIONS[decision].done, message: 'Preview: nothing was sent or changed.' });
        setDecision(null);
    }

    return (
        <OpsLayout page="ops-abuse-detail" title="Sending review">
            <div className="ops-head">
                <div>
                    <h1>Sending review</h1>
                    <p>Everything the anomaly detector saw, and everything it did not. The decision is yours and it is recorded with your name on it.</p>
                </div>
                <Pill tone={flag.severity === 'high' ? 'bad' : 'warn'}>{flag.stateLabel}</Pill>
            </div>
            <p className="sm mut mb"><Link href={route('ops.abuse')}>&larr; Abuse queue</Link></p>

            <Card>
                <div className="between">
                    <div>
                        <h2 className="mono heading-md">{flag.address}</h2>
                        <p className="sm mut">{flag.orgName} &middot; {detail.subscription} &middot; customer since {formatDate(flag.customerSince)} &middot; {detail.mailboxCount} mailboxes</p>
                    </div>
                    <Button variant="line" size="sm" href={route('ops.orgs.show', { org: flag.orgId })}>Organisation record</Button>
                </div>
            </Card>

            <div className="ab-grid mt">
                <div>
                    <Card as="section" aria-labelledby="vol-h">
                        <h3 id="vol-h">Messages sent, last 24 hours</h3>
                        <p className="sm mut mt-s">Grey is this account's own 30-day hourly average. Red is the hours that broke the {flag.severity === 'high' ? 'limit' : 'pattern'}.</p>
                        <SeriesChart kind="bars" points={hours} max={max} label={`Hourly sending volume: ${hot} hour${hot === 1 ? '' : 's'} far above the account's own average, peaking at ${max.toLocaleString('en-NG')} messages`} />
                        <div className="hrs-ax"><span>09:00 yesterday</span><span>00:00</span><span>08:00 today</span></div>
                        <p className="hint">{detail.summary}</p>
                    </Card>

                    <Card as="section" aria-labelledby="rec-h" className="mt">
                        <h3 id="rec-h">Who received them</h3>
                        <div className="kv mt-s">{detail.recipients.map(([k, v]) => <div className="r" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
                        <p className="hint">{detail.recipientsNote}</p>
                    </Card>

                    <Card as="section" aria-labelledby="sig-h" className="mt">
                        <h3 id="sig-h">Signals that did <em>not</em> fire</h3>
                        <p className="sm mut mt-s">Worth reading before you lock. These are the reasons this might still be the account owner acting honestly.</p>
                        <div className="kv mt-s">{detail.signals.map(([k, v]) => <div className="r" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
                        <p className="hint">{detail.signalsNote}</p>
                    </Card>
                </div>

                <div className="stack">
                    <Card>
                        <h3>Decide</h3>
                        <p className="sm mut mt-s">Sending is already rate limited to {flag.baselineHourly} messages an hour, applied automatically. Choose what happens next.</p>
                        <div className="stack mt">
                            {can('lock')
                                ? <Button variant="danger" full onClick={() => setDecision('lock')}>Lock sending</Button>
                                : <Button variant="line" full disabled title="Only Engineers and Owners can lock an account">Lock sending</Button>}
                            <Button full onClick={() => setDecision('warn')}>Keep the limit, email a warning</Button>
                            <Button variant="line" full onClick={() => setDecision('lift')}>Lift the limit: not abuse</Button>
                            <p className="hint">Whichever you pick, you write a sentence saying why. It appears in the audit trail and in the email the customer receives.</p>
                        </div>
                    </Card>

                    <Note tone="warn" title="What a lock does">
                        <p>Sending stops immediately. Mail still arrives, sign-in still works and nothing is deleted. The owner gets an email with the reason and a reply address. Support can lift a lock; only an owner-level account can delete data.</p>
                    </Note>

                    <Card>
                        <h3>Account history</h3>
                        <div className="feed-lite mt-s">{detail.history.map(([when, what]) => <p key={when}><b>{when}</b>: {what}</p>)}</div>
                        <p className="hint">{detail.historyNote}</p>
                    </Card>

                    <Note tone="bad" title="If this reaches a blocklist">
                        <p>The four sending IPs carry all 412 customers. A Spamhaus listing caused by this account puts every other customer's mail in the spam folder within hours, and delisting takes days. The cost of locking wrongly is one annoyed customer; the cost of waiting is all of them.</p>
                    </Note>
                </div>
            </div>

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
