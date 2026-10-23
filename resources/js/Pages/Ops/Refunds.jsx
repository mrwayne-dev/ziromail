import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '../../Components/ui/DataTable';
import { MetricRow } from '../../Components/ui/MetricTile';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import Button from '../../Components/ui/Button';
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

const PLAN_PRICE = { starter: 1612500, business: 2967000, premium: 5805000 };

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

    const tiles = refundFigures.map((row) => ({ k: row.k, v: row.v, d: row.d }));

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
            <SectionHeader
                title="Refunds"
                description={`Money going back out. Anything above ${formatPrice(rules.refundSecondApproverMinor, 'NGN')} needs a second person to approve it, and every refund records who asked and who agreed.`}
                badge={`${waiting.length} waiting`}
                actions={can('refund.request') ? <Button variant="line" size="sm" onClick={start.open}>Start a refund</Button> : null}
            />

            <MetricRow items={tiles} label="Refund figures" />

            <SubSection id="pd-h" title="Waiting for a decision">
                {waiting.length === 0 && (
                    <div className="ops-card ops-empty"><b>Nothing is waiting</b></div>
                )}
                <div className="ops-stack">
                    {waiting.map((refund) => (
                        <article key={refund.id} className="ops-card" aria-labelledby={`${refund.id}-h`}>
                            <div className="ops-flag-top">
                                <div>
                                    <h3 id={`${refund.id}-h`} className="ops-card-h">{refund.orgName}</h3>
                                    <p className="ops-card-lede"><span className="mono">{refund.domain}</span> &middot; {refund.planName} plan &middot; paid {formatDate(refund.paidAt)}</p>
                                </div>
                                <span className="ops-refund-amt">{formatPrice(refund.paid.minor, refund.paid.currency)}</span>
                            </div>
                            <dl className="mt-14">
                                {[
                                    ['Reason given', refund.reason],
                                    ['Days since payment', `${refund.daysSincePayment}${refund.insideGuarantee ? `, inside the ${rules.refundGuaranteeDays}-day guarantee` : ''}`],
                                    ['Mail ever delivered', refund.mailEverDelivered],
                                    ...refund.extra,
                                    ['Requested by', `${refund.requestedBy} · ${formatDate(refund.requestedAt, { year: false })}, ${formatTime(refund.requestedAt)}`],
                                ].map(([k, v]) => (
                                    <div className="ops-kv-row">
                                        <dt>{k}</dt>
                                        <dd className="right">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="ops-sm ops-mut mt-10">{refund.recommendation}</p>
                            <div className="ops-actions">
                                <Button size="sm" disabled={!canApprove(refund)} title={canApprove(refund) ? undefined : 'An Owner other than the requester must approve'} onClick={() => setPending({ kind: 'approve', refund })}>Approve {formatPrice(refund.paid.minor, refund.paid.currency)}</Button>
                                <Button variant="line" size="sm" href="tel:+2348034112287">Call before deciding</Button>
                                <Button variant="quiet" size="sm" disabled={!can('refund.approve')} onClick={() => setPending({ kind: 'decline', refund })}>Decline with a reason</Button>
                                <span className="ops-sm ops-mut ops-approver-hint">{approverHint(refund)}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </SubSection>

            <SubSection id="ph-h" title="Paid out this month">
                <DataTable
                    columns={[
                        { id: 'org', header: 'Organisation', accessor: (row) => row.orgName, sortable: true },
                        { id: 'reason', header: 'Reason', accessor: (row) => row.reason },
                        { id: 'amount', header: 'Amount', accessor: (row) => formatPrice(row.amount.minor, row.amount.currency), align: 'num', sortable: true, sortValue: (row) => row.amount.minor },
                        { id: 'approver', header: 'Approved by', accessor: (row) => row.approvedBy },
                        { id: 'paid', header: 'Paid', accessor: (row) => formatDate(row.paidAt, { year: false }), align: 'num', sortable: true, sortValue: (row) => row.paidAt },
                    ]}
                    rows={refunds.paid}
                    rowKey={(row) => row.id}
                    emptyState={{ title: 'No refunds this month' }}
                />
                <Note title="What we promise" className="mt">
                    <p>Fourteen days, no questions, full amount: that is what the pricing page says, so that is what we honour without argument. Outside fourteen days it is a judgement call, and the deciding question is whether the service actually worked. If mail never flowed, refund it however long ago they paid.</p>
                </Note>
            </SubSection>

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
                <p className="ops-sm"><b>{formatPrice(draftAmount.minor, 'NGN')}</b>. {draftAmount.note}</p>
            </ReasonDialog>
        </OpsLayout>
    );
}
