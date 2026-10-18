import { useState } from 'react';
import Metrics from '../../Components/ops/Metrics';
import OpsTable from '../../Components/ops/OpsTable';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Field, { Input } from '../../Components/ui/Field';
import Note from '../../Components/ui/Note';
import Select from '../../Components/ui/Select';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import useOpsCan from '../../Hooks/useOpsCan';
import OpsLayout from '../../Layouts/OpsLayout';
import { orgRows, refundFigures, refunds, rules } from '../../fixtures/ops';
import { formatDate, formatTime } from '../../Lib/format';
import { formatPrice } from '../../Lib/money';
import { usePage } from '@inertiajs/react';

const PLAN_PRICE = { starter: 1612500, business: 2967000, premium: 5805000 };

// The published policy, as arithmetic: inside the guarantee a full refund; after it, only unused whole months of a yearly plan.
function policyAmount(planCode, days) {
    const price = PLAN_PRICE[planCode];
    if (days <= rules.refundGuaranteeDays) return { minor: price, note: `Inside the ${rules.refundGuaranteeDays}-day guarantee: full refund.` };
    const unused = Math.max(12 - Math.ceil(days / 30), 0);
    return { minor: Math.round((price * unused) / 12), note: `Outside the guarantee: ${unused} unused whole months of twelve.` };
}

export default function Refunds() {
    const { toast } = useToast();
    const can = useOpsCan();
    const { staff } = usePage().props;
    const [waiting, setWaiting] = useState(refunds.waiting);
    const [pending, setPending] = useState(null);
    const start = useDisclosure();
    const [draft, setDraft] = useState({ org: orgRows[0].id, days: '3' });
    const draftOrg = orgRows.find((row) => row.id === draft.org);
    const draftAmount = policyAmount(draftOrg.planCode, Number(draft.days) || 0);

    function decide(reason) {
        const verb = { approve: 'approved', decline: 'declined' }[pending.kind];
        setWaiting((list) => list.filter((item) => item.id !== pending.refund.id));
        toast({ tone: 'ok', title: `Refund ${verb}`, message: `${pending.refund.orgName}. Preview: no money moved. Reason kept: "${reason}"` });
        setPending(null);
    }

    const approverHint = (refund) => {
        if (!refund.needsSecondApprover) return `Under ${formatPrice(rules.refundSecondApproverMinor, 'NGN')}, so one approver is enough.`;
        if (refund.requestedBy === staff?.name) return `Over ${formatPrice(rules.refundSecondApproverMinor, 'NGN')}, so this needs a second approver. You requested it, so someone else must approve.`;
        return `Over ${formatPrice(rules.refundSecondApproverMinor, 'NGN')}, so this needs a second approver. You are the second approver on this one.`;
    };
    const canApprove = (refund) => can('refund.approve') && refund.requestedBy !== staff?.name;

    return (
        <OpsLayout page="ops-refunds" title="Refunds">
            <div className="ops-head">
                <div>
                    <h1>Refunds</h1>
                    <p>Money going back out. Anything above {formatPrice(rules.refundSecondApproverMinor, 'NGN')} needs a second person to approve it, and every refund records who asked and who agreed.</p>
                </div>
                {can('refund.request') && <Button variant="line" size="sm" onClick={start.open}>Start a refund</Button>}
            </div>

            <Metrics items={refundFigures} label="Refund figures" />

            <section aria-labelledby="pd-h" className="mt-l">
                <h2 id="pd-h">Waiting for a decision</h2>
                {waiting.length === 0 && <p className="sm mut mt-s">Nothing is waiting.</p>}
                {waiting.map((refund) => (
                    <article className="rf" key={refund.id} aria-labelledby={`${refund.id}-h`}>
                        <div className="rf-top">
                            <div>
                                <h3 id={`${refund.id}-h`}>{refund.orgName}</h3>
                                <p className="sm mut"><span className="mono">{refund.domain}</span> &middot; {refund.planName} plan &middot; paid {formatDate(refund.paidAt)}</p>
                            </div>
                            <span className="rf-amt">{formatPrice(refund.paid.minor, refund.paid.currency)}</span>
                        </div>
                        <div className="kv">
                            <div className="r"><span>Reason given</span><b>{refund.reason}</b></div>
                            <div className="r"><span>Days since payment</span><b>{refund.daysSincePayment}{refund.insideGuarantee ? `, inside the ${rules.refundGuaranteeDays}-day guarantee` : ''}</b></div>
                            <div className="r"><span>Mail ever delivered</span><b>{refund.mailEverDelivered}</b></div>
                            {refund.extra.map(([k, v]) => <div className="r" key={k}><span>{k}</span><b>{v}</b></div>)}
                            <div className="r"><span>Requested by</span><b>{refund.requestedBy} &middot; {formatDate(refund.requestedAt, { year: false })}, {formatTime(refund.requestedAt)}</b></div>
                        </div>
                        <p className="sm mut mt">{refund.recommendation}</p>
                        <div className="rf-acts">
                            <Button size="sm" disabled={!canApprove(refund)} title={canApprove(refund) ? undefined : 'An Owner other than the requester must approve'} onClick={() => setPending({ kind: 'approve', refund })}>Approve {formatPrice(refund.paid.minor, refund.paid.currency)}</Button>
                            <Button variant="line" size="sm" href={`tel:+2348034112287`}>Call before deciding</Button>
                            <Button variant="quiet" size="sm" disabled={!can('refund.approve')} onClick={() => setPending({ kind: 'decline', refund })}>Decline with a reason</Button>
                        </div>
                        <p className="hint">{approverHint(refund)}</p>
                    </article>
                ))}
            </section>

            <section aria-labelledby="ph-h" className="mt-l">
                <h2 id="ph-h">Paid out this month</h2>
                <OpsTable
                    className="mt"
                    caption="Refunds paid this month"
                    head={<tr><th scope="col">Organisation</th><th scope="col">Reason</th><th scope="col" className="num">Amount</th><th scope="col">Approved by</th><th scope="col" className="num">Paid</th></tr>}
                >
                    {refunds.paid.map((row) => (
                        <tr key={row.id}><td>{row.orgName}</td><td className="wide">{row.reason}</td><td className="num">{formatPrice(row.amount.minor, row.amount.currency)}</td><td>{row.approvedBy}</td><td className="num">{formatDate(row.paidAt, { year: false })}</td></tr>
                    ))}
                </OpsTable>
                <Note title="What we promise" className="mt">
                    <p>Fourteen days, no questions, full amount: that is what the pricing page says, so that is what we honour without argument. Outside fourteen days it is a judgement call, and the deciding question is whether the service actually worked. If mail never flowed, refund it however long ago they paid.</p>
                </Note>
            </section>

            <ReasonDialog
                open={Boolean(pending)}
                onClose={() => setPending(null)}
                title={pending ? `${pending.kind === 'approve' ? 'Approve' : 'Decline'} refund for ${pending.refund.orgName}` : ''}
                description={pending ? (pending.kind === 'approve' ? `${formatPrice(pending.refund.paid.minor, 'NGN')} goes back to the customer.` : 'The customer is told, with your reason.') : ''}
                confirmLabel={pending?.kind === 'approve' ? 'Approve refund' : 'Decline refund'}
                tone={pending?.kind === 'approve' ? 'primary' : 'ink'}
                onConfirm={decide}
            />

            <ReasonDialog
                open={start.isOpen}
                onClose={start.close}
                title="Start a refund"
                description="Pick the customer and how long ago they paid. The amount follows the published policy."
                confirmLabel="Request the refund"
                onConfirm={() => { start.close(); toast({ tone: 'ok', title: 'Refund requested', message: `${draftOrg.name}: ${formatPrice(draftAmount.minor, 'NGN')}. Preview: nothing was saved.` }); }}
            >
                <Field label="Organisation">{(props) => <Select {...props} value={draft.org} onChange={(e) => setDraft({ ...draft, org: e.target.value })}>{orgRows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</Select>}</Field>
                <Field label="Days since payment">{(props) => <Input {...props} type="number" min="0" value={draft.days} onChange={(e) => setDraft({ ...draft, days: e.target.value })} />}</Field>
                <p className="sm"><b>{formatPrice(draftAmount.minor, 'NGN')}</b>. {draftAmount.note}</p>
            </ReasonDialog>
        </OpsLayout>
    );
}
