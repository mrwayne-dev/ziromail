import { Link } from '@inertiajs/react';
import { useState } from 'react';
import OpsTable from '../../Components/ops/OpsTable';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import { AlertIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import useOpsCan from '../../Hooks/useOpsCan';
import OpsLayout from '../../Layouts/OpsLayout';
import { abuseFlags, resolvedFlags, rules } from '../../fixtures/ops';
import { formatDate } from '../../Lib/format';
import { route } from '../../Lib/route';

const OUTCOME_TONE = { locked: 'bad', cleared: 'ok', warned: 'warn' };
const DIALOG = {
    lock: { title: 'Lock sending', confirm: 'Lock sending', tone: 'danger', outcome: 'locked', done: 'Sending locked. Receiving continues.', description: 'Sending stops now. Mail still arrives and nothing is deleted. The owner is emailed with your reason.' },
    'lock-reset': { title: 'Lock and force a password reset', confirm: 'Lock and reset', tone: 'danger', outcome: 'locked', done: 'Locked, sessions revoked, password reset required.', description: 'Sending stops, every session is signed out, and a new password is required. Telephone the owner too.' },
    warn: { title: 'Email them about the bounces', confirm: 'Send the email', tone: 'primary', outcome: 'warned', done: 'Warning emailed to the owner.', description: 'The owner gets an email with your reason. Nothing is limited.' },
    clear: { title: 'Not abuse: clear the flag', confirm: 'Clear the flag', tone: 'ink', outcome: 'cleared', done: 'Flag cleared.', description: 'The flag is closed and the reason is kept.' },
};

export default function Abuse() {
    const { toast } = useToast();
    const can = useOpsCan();
    const [open, setOpen] = useState(abuseFlags);
    const [done, setDone] = useState([]);
    const [pending, setPending] = useState(null);

    function confirm(reason) {
        const meta = DIALOG[pending.action];
        setOpen((flags) => flags.filter((flag) => flag.id !== pending.flag.id));
        setDone((list) => [{ id: pending.flag.id, address: pending.flag.address, flaggedFor: `${pending.flag.sentLastHour.toLocaleString('en-NG')} messages in the last hour`, outcome: meta.outcome, outcomeLabel: { locked: 'Locked', warned: 'Warned', cleared: 'Cleared' }[meta.outcome], by: 'You', at: '2026-09-29', reason }, ...list]);
        toast({ tone: 'ok', title: meta.done, message: 'Preview: nothing was sent or changed.' });
        setPending(null);
    }

    const meta = pending ? DIALOG[pending.action] : null;

    return (
        <OpsLayout page="ops-abuse" title="Abuse queue">
            <div className="ops-head">
                <div>
                    <h1>Abuse queue</h1>
                    <p>Accounts sending unlike themselves. Anomaly detection flags; a person decides. Locking is one click because the cost of waiting is a blocklisting.</p>
                </div>
                <Pill tone={open.length ? 'bad' : 'ok'}>{open.length} waiting</Pill>
            </div>

            <Banner tone="warn" live icon={<AlertIcon />} title="A lock stops sending, not receiving" className="mb">
                <p>Locked accounts keep receiving mail and nothing is deleted. The owner is emailed with the reason and a way to reply. Every lock is recorded in the <Link href={route('ops.audit')}>audit trail</Link> with the name of the person who did it.</p>
            </Banner>

            <section aria-labelledby="fl-h">
                <h2 id="fl-h" className="sr-only">Flagged accounts</h2>
                {open.length === 0 && <p className="sm mut">Nothing is waiting. Resolved flags are below.</p>}
                {open.map((flag) => (
                    <article className={`flag ${flag.severity}`} key={flag.id} aria-labelledby={`${flag.id}-h`}>
                        <div className="flag-top">
                            <div>
                                <h3 id={`${flag.id}-h`}>{flag.address}</h3>
                                <p className="sub">{flag.orgName} &middot; {flag.planName} plan &middot; customer since {formatDate(flag.customerSince)}</p>
                            </div>
                            <Pill tone={flag.severity === 'high' ? 'bad' : 'warn'}>{flag.stateLabel}</Pill>
                        </div>
                        <div className="ev">
                            {flag.evidence.map((item) => <div className="c" key={item.key}><span className="k">{item.k}</span><span className={`v${item.hot ? ' hot' : ''}`}>{item.v}</span><span className="n">{item.n}</span></div>)}
                        </div>
                        <div className="samples">
                            <span className="k">Sample subject lines from the last hour</span>
                            <ul>{flag.subjects.map((subject) => <li key={subject.text}>{subject.text} <span className="rp">&times;{subject.count}</span></li>)}</ul>
                        </div>
                        <p className="sm mut mt">{flag.verdict}</p>
                        <div className="flag-acts">
                            {flag.actions.map((action) => (
                                (action.key.startsWith('lock') && !can('lock'))
                                    ? <Button key={action.key} variant="line" size="sm" disabled title="Only Engineers and Owners can lock an account">{action.label}</Button>
                                    : <Button key={action.key} variant={action.tone} size="sm" onClick={() => setPending({ flag, action: action.key })}>{action.label}</Button>
                            ))}
                            <Button variant="line" size="sm" href={route('ops.abuse.show', { flag: flag.id })}>Full sending history</Button>
                            <span className="sp">
                                {flag.clearLabel
                                    ? <Button variant="quiet" size="sm" onClick={() => setPending({ flag, action: 'clear' })}>{flag.clearLabel}</Button>
                                    : <Button variant="quiet" size="sm" href={route(flag.secondary.routeName, flag.secondary.params)}>{flag.secondary.label}</Button>}
                            </span>
                        </div>
                    </article>
                ))}
            </section>

            <section aria-labelledby="rs-h" className="mt-l">
                <div className="between"><h2 id="rs-h">Resolved this week</h2><Link className="tlink" href={route('ops.audit')}>Audit trail</Link></div>
                <p className="sm mut mt-s">Kept visible so patterns are obvious.</p>
                <OpsTable
                    className="mt"
                    caption="Abuse flags resolved in the last seven days"
                    head={<tr><th scope="col">Address</th><th scope="col">Flagged for</th><th scope="col">Outcome</th><th scope="col">By</th><th scope="col" className="num">When</th></tr>}
                >
                    {[...done, ...resolvedFlags].map((row) => (
                        <tr key={row.id}>
                            <td className="mono">{row.address}</td>
                            <td className="wide">{row.flaggedFor}</td>
                            <td><Pill tone={OUTCOME_TONE[row.outcome]}>{row.outcomeLabel}</Pill></td>
                            <td>{row.by}</td>
                            <td className="num">{formatDate(row.at, { year: false })}</td>
                        </tr>
                    ))}
                </OpsTable>
                <Note title="What trips a flag" className="mt">
                    <p>
                        Volume more than {rules.flag.volumeMultiple} times the account's own 30-day average, bounce rate above {rules.flag.bounceHourPct}% in an hour, complaints above {rules.flag.complaintPct}%, sending from a country the account has never used, or a successful sign-in after more than {rules.flag.failuresBeforeSuccess} failures. Thresholds are per account, not global, so a business that always sends 500 invoices a month is not flagged for doing it again.
                    </p>
                </Note>
            </section>

            <ReasonDialog open={Boolean(pending)} onClose={() => setPending(null)} title={meta?.title ?? ''} description={meta ? `${pending.flag.address}. ${meta.description}` : ''} confirmLabel={meta?.confirm ?? ''} tone={meta?.tone} onConfirm={confirm} />
        </OpsLayout>
    );
}
