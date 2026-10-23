import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import PlanChangePreview from '../../Components/dashboard/PlanChangePreview';
import PlanPicker from '../../Components/domain/PlanPicker';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import DataTable from '../../Components/ui/DataTable';
import { AlertIcon } from '../../Components/ui/Icons';
import { MetricRow } from '../../Components/ui/MetricTile';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import { useToast } from '../../Components/ui/Toast';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { planChangePreview } from '../../Lib/billing';
import { formatDate, formatGb } from '../../Lib/format';
import { formatPrice } from '../../Lib/money';
import { route } from '../../Lib/route';

const PAID_BY = { transfer: 'Bank transfer', card: 'Card', ussd: 'USSD', usd: 'Dollar card' };
const STATE_BANNER = {
    incomplete: ['warn', 'Payment is needed to start this domain', 'Add the DNS records, then pay, and mail starts flowing. Payments open once the payment provider is connected.'],
    past_due: ['bad', 'Your last payment did not go through', 'Mail keeps working while we retry. Pay before the grace period ends to avoid a pause on sending.'],
    grace: ['warn', 'You are in the grace period', 'Mail still works. Pay soon: sending pauses when the grace period ends.'],
    suspended: ['bad', 'This domain is suspended', 'Sending is paused and mail is held. Pay the outstanding invoice to restore it.'],
    cancelled: ['warn', 'This plan is cancelled', 'It stays active until the end of the term, then mail stops.'],
};

export default function Billing() {
    const { domain, subscription, plan, plans, invoices, storage, paymentMethod, can } = usePage().props;
    const { toast } = useToast();
    const [changing, setChanging] = useState(false);
    const [target, setTarget] = useState(plan.code);
    const preview = planChangePreview({ domain, subscription, plans, targetCode: target });
    const net = subscription.priceNet;
    const total = net + subscription.vat;
    const banner = STATE_BANNER[subscription.status];
    const ceilingPct = storage.ceilingGb ? 100 / storage.ceilingGb : 0;
    const withDomain = (name) => `${route(name)}?domain=${domain.id}`;

    function confirm() {
        toast({ tone: 'warn', title: 'Plan changes open soon', message: 'Payments are not connected yet, so nothing was changed.' });
        setChanging(false);
        setTarget(plan.code);
    }

    const storageTiles = [
        { k: 'In your pool',  v: formatGb(storage.poolGb) },
        { k: 'Assigned',      v: formatGb(storage.assignedGb) },
        { k: 'Actually used', v: formatGb(storage.usedGb) },
    ];

    return (
        <DashboardLayout page="admin-billing" title="Plan & storage" description="Your plan, storage and invoices.">
            <SectionHeader
                title="Plan & storage"
                description={<>One plan covering <span className="mono">{domain.name}</span>.</>}
                actions={<Button variant="line" size="sm" disabled title="Invoice downloads are not connected yet">Download invoices</Button>}
            />

            {banner && (
                <Banner tone={banner[0]} live icon={<AlertIcon />} title={banner[1]} className="mb">
                    <p>{banner[2]}</p>
                </Banner>
            )}

            <div className="two">
                <div>
                    <SubSection
                        id="st-h"
                        title="Storage"
                        actions={storage.ceilingGb ? <Pill tone="info">Expandable to {storage.ceilingGb} GB</Pill> : null}
                    >
                        <MetricRow items={storageTiles} label="Storage figures" />
                        {storage.ceilingGb && (
                            <section className="ops-card mt">
                                <div className="ceiling">
                                    <div className="track" role="img" aria-label={`${formatGb(storage.poolGb)} pool: ${storage.planGb} GB from the ${plan.name} plan plus ${storage.boughtGb} GB bought, out of a ${storage.ceilingGb} GB ceiling`}>
                                        <span className="fill" style={{ width: `${storage.planGb * ceilingPct}%` }} />
                                        <span className="extra" style={{ width: `${storage.boughtGb * ceilingPct}%` }} />
                                    </div>
                                    <div className="marks"><span>{storage.planGb} GB plan &middot; {storage.boughtGb} GB bought</span><span>{storage.ceilingGb} GB ceiling</span></div>
                                </div>
                                {can.buyStorage && (
                                    <div className="blocks">
                                        <div className="blocks-copy">
                                            <b>Need more room?</b>
                                            <span className="sm mut">{formatPrice(plan.extraStorage.price.NGN.yearly, 'NGN')} for each {storage.extra.blockGb} GB a year, renewing with the plan. Added to the pool immediately.</span>
                                        </div>
                                        <Button variant="ink" size="sm" href={withDomain('dashboard.storage')}>Add {storage.extra.blockGb} GB</Button>
                                    </div>
                                )}
                            </section>
                        )}
                    </SubSection>

                    <SubSection id="inv-h" title="Invoices">
                        <DataTable
                            columns={[
                                { id: 'date', header: 'Date', nowrap: true, sortable: true, sortValue: (row) => row.issuedAt, accessor: (row) => formatDate(row.issuedAt) },
                                { id: 'what', header: 'What for', accessor: (row) => row.description },
                                { id: 'amount', header: 'Amount', align: 'num', sortable: true, sortValue: (row) => row.total.minor, accessor: (row) => formatPrice(row.total.minor, row.total.currency) },
                                { id: 'status', header: 'Status', accessor: (row) => <Pill tone={row.status === 'paid' ? 'ok' : 'warn'}>{row.status === 'paid' ? 'Paid' : row.status}</Pill> },
                            ]}
                            rows={invoices}
                            rowKey={(row) => row.id}
                            renderActions={(row) => <Button variant="line" size="sm" disabled title="PDF invoices are not connected yet" aria-label={`PDF for ${row.number} (not available yet)`}>PDF</Button>}
                            emptyState={{ title: 'No invoices yet', body: 'Invoices appear here after the first payment.' }}
                        />
                        <p className="hint">Amounts include VAT at 7.5%. Invoices are kept for as long as Nigerian tax law requires.</p>
                    </SubSection>
                </div>

                <div className="stack">
                    <section className="ops-card" aria-labelledby="plan-h">
                        <h2 className="ops-card-h" id="plan-h">Your plan</h2>
                        <p className="ops-plan-amt">
                            <b>{formatPrice(total, 'NGN')}</b>
                            <span className="ops-plan-amt-unit">/ {subscription.term === 'annual' ? 'year' : 'month'}</span>
                        </p>
                        <p className="ops-sm ops-mut">{formatPrice(net, 'NGN')} plus VAT</p>
                        <dl className="mt-14">
                            <div className="ops-kv-row sm"><dt>Plan</dt><dd className="right">{plan.name}</dd></div>
                            <div className="ops-kv-row sm"><dt>Domain</dt><dd className="right mono small-mono">{domain.name}</dd></div>
                            <div className="ops-kv-row sm"><dt>Renews</dt><dd className="right">{subscription.renewsAt ? formatDate(subscription.renewsAt) : 'Not set'}</dd></div>
                            <div className="ops-kv-row sm"><dt>Paid by</dt><dd className="right">{PAID_BY[paymentMethod.channel] ?? 'Not paid yet'}</dd></div>
                        </dl>
                        <div className="btn-row no-grow mt">
                            {can.changePlan && <Button size="sm" onClick={() => setChanging(true)}>Change plan</Button>}
                            <Button variant="line" size="sm" disabled title="Payment methods are not connected yet">Payment method</Button>
                        </div>
                    </section>

                    {changing ? (
                        <section className="ops-card" aria-labelledby="chg-h">
                            <h3 className="ops-card-h-sm" id="chg-h">Change plan</h3>
                            <p className="ops-sm ops-mut mt-6">You are on <b>{plan.name}</b>, {plan.poolGb} GB for {formatPrice(plan.price.NGN.yearly, 'NGN')} a year.</p>
                            <PlanPicker variant="select" value={target} onChange={setTarget} currentCode={plan.code} plans={plans} />
                            <PlanChangePreview preview={preview} onConfirm={confirm} />
                            <Button variant="quiet" size="sm" full className="mt-s" onClick={() => { setChanging(false); setTarget(plan.code); }}>Cancel</Button>
                        </section>
                    ) : (
                        subscription.extraStorageGb > 0 && (
                            <Note tone="warn" title="Extra storage does not carry over">
                                <p>The {subscription.extraStorageGb} GB you bought is attached to your current plan. Changing plan releases it, and you would buy it again if you still need it. We say so plainly before you confirm.</p>
                            </Note>
                        )
                    )}

                    <section className="ops-card">
                        <h3 className="ops-card-h-sm">Need a VAT invoice in the company name?</h3>
                        <p className="ops-card-lede">Every invoice should carry your registered business name and our VAT details. If something needs correcting, <a href={route('contact')}>tell us</a> and we will reissue it.</p>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
