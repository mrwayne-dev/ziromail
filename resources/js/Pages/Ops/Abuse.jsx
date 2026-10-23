import { Link, router, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import DataTable from '../../Components/ui/DataTable';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import { AlertIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import useOpsCan from '../../Hooks/useOpsCan';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatDate } from '../../Lib/format';
import { route } from '../../Lib/route';

const OUTCOME_TONE = { locked: 'bad', cleared: 'ok', warned: 'watch' };
const OUTCOME_LABEL = { locked: 'Locked', cleared: 'Cleared', warned: 'Warned' };
const DIALOG = {
    locked:  { title: 'Lock sending', confirm: 'Lock sending', tone: 'danger', description: 'Sending stops now. Mail still arrives and nothing is deleted. The owner is emailed with your reason.' },
    warned:  { title: 'Email them about it', confirm: 'Send the email', tone: 'primary', description: 'The owner gets an email with your reason. Nothing more is limited.' },
    cleared: { title: 'Not abuse: clear the flag', confirm: 'Clear the flag', tone: 'ink', description: 'The flag is closed, any automatic slow-down is lifted, and the reason is kept.' },
    unlock:  { title: 'Unlock sending', confirm: 'Unlock sending', tone: 'ink', description: 'Sending is restored. The reason is kept in the audit trail.' },
};

export default function Abuse() {
    useRealtimeReload({ channel: 'ops', map: { abuse: ['flags', 'resolved', 'restricted'] } });

    const { flags: open, resolved, restricted, rules, mode } = usePage().props;
    const { toast } = useToast();
    const can = useOpsCan();
    const reduce = useReducedMotion();
    const [pending, setPending] = useState(null);

    function confirm(reason) {
        const finished = () => setPending(null);
        const options = {
            preserveScroll: true,
            onSuccess: () => toast({ tone: 'ok', title: pending.action === 'unlock' ? 'Sending restored.' : 'Decision recorded.', message: 'It is in the audit trail with your name on it.' }),
            onFinish: finished,
        };
        if (pending.action === 'unlock') {
            router.post(route('ops.abuse.unlock', { mailbox: pending.target.id }), { reason }, options);
        } else {
            router.post(route('ops.abuse.resolve', { flag: pending.target.id }), { outcome: pending.action, reason }, options);
        }
    }

    const meta = pending ? DIALOG[pending.action] : null;
    const toneForSeverity = (severity) => (severity === 'high' ? 'bad' : severity === 'medium' ? 'watch' : 'info');

    return (
        <OpsLayout page="ops-abuse" title="Abuse queue">
            <SectionHeader
                title="Abuse queue"
                description="Accounts sending unlike themselves. Anomaly detection flags; a person decides. Locking is one click because the cost of waiting is a blocklisting."
                badge={`${open.length} waiting`}
                actions={<Button variant="line" size="sm" href={route('ops.spam-rules')}>Spam rules</Button>}
            />

            {mode !== 'live' && (
                <Banner tone="info" icon={<AlertIcon />} title="The bot is in practice mode" className="mb">
                    <p>It flags what it sees and says what it would have done, but slows and locks nothing until it is switched to live. Flags below marked &ldquo;would have&rdquo; show what live mode would have done.</p>
                </Banner>
            )}

            <section aria-labelledby="fl-h" className="mt-8">
                <h2 id="fl-h" className="sr-only">Flagged accounts</h2>
                {open.length === 0 && (
                    <div className="ops-card ops-empty">
                        <b>Nothing is waiting</b>
                        <p>The bot checks sending counts every five minutes.</p>
                    </div>
                )}
                <div className="ops-stack">
                    {open.map((flag, index) => (
                        <motion.article
                            className={`ops-card tone-${flag.severity === 'high' ? 'high' : flag.severity === 'medium' ? 'med' : 'low'}`}
                            key={flag.id}
                            aria-labelledby={`${flag.id}-h`}
                            initial={reduce ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={reduce ? { duration: 0 } : { duration: 0.26, delay: Math.min(index * 0.045, 0.3), ease: [0.22, 0.9, 0.2, 1] }}
                        >
                            <div className="ops-flag-top">
                                <div>
                                    <h3 id={`${flag.id}-h`} className="addr">{flag.address}</h3>
                                    <p className="ops-card-lede">{flag.orgName} &middot; {flag.planName ?? 'No'} plan &middot; customer since {formatDate(flag.customerSince)}</p>
                                </div>
                                <span className={`ops-pill ${toneForSeverity(flag.severity)}`}>{flag.autoAction === 'would_lock' ? 'Would have locked' : flag.autoAction === 'would_limit' ? 'Would have slowed' : flag.stateLabel}</span>
                            </div>
                            <dl className="ops-evidence">
                                {flag.evidence.map((item) => (
                                    <div key={item.key}>
                                        <dt>{item.k}</dt>
                                        <dd className={item.hot ? 'hot' : undefined}>{item.v}</dd>
                                        <dd className="sub">{item.n}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="ops-sm ops-mut mt-12">{flag.verdict}</p>
                            <div className="ops-actions">
                                {can('lock')
                                    ? <Button variant="danger" size="sm" onClick={() => setPending({ target: flag, action: 'locked' })} disabled={flag.sendingState === 'locked'}>Lock sending</Button>
                                    : <Button variant="line" size="sm" disabled title="Only Engineers and Owners can lock an account">Lock sending</Button>}
                                <Button size="sm" onClick={() => setPending({ target: flag, action: 'warned' })}>Email them about it</Button>
                                <Button variant="line" size="sm" href={route('ops.abuse.show', { flag: flag.id })}>Full sending history</Button>
                                <span className="spacer"><Button variant="quiet" size="sm" onClick={() => setPending({ target: flag, action: 'cleared' })}>Not abuse, clear the flag</Button></span>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </section>

            {restricted.length > 0 && (
                <SubSection id="rt-h" title="Sending restricted now" description="Mailboxes whose sending is slowed or locked.">
                    <DataTable
                        columns={[
                            { id: 'address', header: 'Address', accessor: (row) => row.address, mono: true, sortable: true },
                            { id: 'owner', header: 'Owner', accessor: (row) => row.owner, sortable: true },
                            { id: 'state', header: 'State', accessor: (row) => <span className={`ops-pill ${row.state === 'locked' ? 'bad' : 'watch'}`}>{row.state === 'locked' ? 'Locked' : 'Slowed'}</span> },
                        ]}
                        rows={restricted}
                        rowKey={(row) => row.id}
                        renderActions={(row) => can('lock') ? <Button variant="line" size="sm" onClick={() => setPending({ target: row, action: 'unlock' })}>Unlock</Button> : null}
                    />
                </SubSection>
            )}

            <SubSection id="rs-h" title="Resolved this week" description="Kept visible so patterns are obvious." tLink={{ href: route('ops.audit'), label: 'Audit trail' }}>
                <DataTable
                    columns={[
                        { id: 'address', header: 'Address', accessor: (row) => row.address, mono: true, sortable: true },
                        { id: 'reason', header: 'Flagged for', accessor: (row) => row.flaggedFor },
                        { id: 'outcome', header: 'Outcome', accessor: (row) => <span className={`ops-pill ${OUTCOME_TONE[row.outcome]}`}>{OUTCOME_LABEL[row.outcome]}</span> },
                        { id: 'by', header: 'By', accessor: (row) => row.by },
                        { id: 'at', header: 'When', accessor: (row) => formatDate(row.at, { year: false }), align: 'num', sortable: true, sortValue: (row) => row.at },
                    ]}
                    rows={resolved}
                    rowKey={(row) => row.id}
                    emptyState={{ title: 'No resolved flags in the last 7 days' }}
                />
            </SubSection>

            <Note title="What trips a flag" className="mt">
                <p>
                    Volume more than {rules.volumeMultiple} times the mailbox's own 30-day average (and at least {rules.minVolume} an hour), a bounce rate above {rules.bounceHourPct}% in an hour, complaints above {rules.complaintPct}%, or more than {rules.filterPct}% of messages flagged by the outbound filter. Thresholds are per mailbox, not global. The bot sees counts only, never what a message says. <Link href={route('ops.spam-rules')}>How the bot works</Link>.
                </p>
            </Note>

            <ReasonDialog open={Boolean(pending)} onClose={() => setPending(null)} title={meta?.title ?? ''} description={meta ? `${pending.target.address}. ${meta.description}` : ''} confirmLabel={meta?.confirm ?? ''} tone={meta?.tone} onConfirm={confirm} />
        </OpsLayout>
    );
}
