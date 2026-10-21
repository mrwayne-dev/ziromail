import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import PlanChangePreview from '../../Components/dashboard/PlanChangePreview';
import PlanPicker from '../../Components/domain/PlanPicker';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import { AlertIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import Table from '../../Components/ui/Table';
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

    return (
        <DashboardLayout page="admin-billing" title="Plan & storage" description="Your plan, storage and invoices.">
            <div className="page-head">
                <div>
                    <h1>Plan &amp; storage</h1>
                    <p>One plan covering <span className="mono">{domain.name}</span>.</p>
                </div>
                <Button variant="line" disabled title="Invoice downloads are not connected yet">Download invoices</Button>
            </div>

            {banner && (
                <Banner tone={banner[0]} live icon={<AlertIcon />} title={banner[1]} className="mb">
                    <p>{banner[2]}</p>
                </Banner>
            )}

            <div className="two">
                <div>
                    <section className="store-card" aria-labelledby="st-h">
                        <div className="between pool-top">
                            <h2 className="heading-sm" id="st-h">Storage</h2>
                            {storage.ceilingGb && <Pill tone="info">Expandable to {storage.ceilingGb} GB</Pill>}
                        </div>
                        <div className="store-nums mt">
                            <div><span className="k">In your pool</span><span className="v">{formatGb(storage.poolGb)}</span></div>
                            <div><span className="k">Assigned</span><span className="v">{formatGb(storage.assignedGb)}</span></div>
                            <div><span className="k">Actually used</span><span className="v">{formatGb(storage.usedGb)}</span></div>
                        </div>
                        {storage.ceilingGb && (
                            <div className="ceiling">
                                <div className="track" role="img" aria-label={`${formatGb(storage.poolGb)} pool: ${storage.planGb} GB from the ${plan.name} plan plus ${storage.boughtGb} GB bought, out of a ${storage.ceilingGb} GB ceiling`}>
                                    <span className="fill" style={{ width: `${storage.planGb * ceilingPct}%` }} />
                                    <span className="extra" style={{ width: `${storage.boughtGb * ceilingPct}%` }} />
                                </div>
                                <div className="marks"><span>{storage.planGb} GB plan &middot; {storage.boughtGb} GB bought</span><span>{storage.ceilingGb} GB ceiling</span></div>
                            </div>
                        )}
                        {can.buyStorage && (
                            <div className="blocks">
                                <div className="blocks-copy">
                                    <b>Need more room?</b>
                                    <span className="sm mut">{formatPrice(plan.extraStorage.price.NGN.yearly, 'NGN')} for each {storage.extra.blockGb} GB a year, renewing with the plan. Added to the pool immediately.</span>
                                </div>
                                <Button href={withDomain('dashboard.storage')}>Add {storage.extra.blockGb} GB</Button>
                            </div>
                        )}
                    </section>

                    <h2 className="heading-sm spaced">Invoices</h2>
                    <Table
                        caption="Invoice history"
                        className="mt"
                        head={<tr><th scope="col">Date</th><th scope="col">What for</th><th scope="col" className="r">Amount</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Download</span></th></tr>}
                    >
                        {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="num">{formatDate(invoice.issuedAt)}</td>
                                <td>{invoice.description}</td>
                                <td className="r num">{formatPrice(invoice.total.minor, invoice.total.currency)}</td>
                                <td><span className="inv-status"><Pill tone={invoice.status === 'paid' ? 'ok' : 'warn'}>{invoice.status === 'paid' ? 'Paid' : invoice.status}</Pill></span></td>
                                <td className="r"><Button variant="line" size="sm" disabled title="PDF invoices are not connected yet" aria-label={`PDF for ${invoice.number} (not available yet)`}>PDF</Button></td>
                            </tr>
                        ))}
                    </Table>
                    <p className="hint">Amounts include VAT at 7.5%. Invoices are kept for as long as Nigerian tax law requires.</p>
                </div>

                <div className="stack">
                    <section className="plan-now" aria-labelledby="plan-h">
                        <h2 id="plan-h">Your plan</h2>
                        <div className="amt"><b>{formatPrice(total, 'NGN')}</b><span>/ {subscription.term === 'annual' ? 'year' : 'month'}</span></div>
                        <p className="sm plan-sub">{formatPrice(net, 'NGN')} plus VAT</p>
                        <div className="plan-rows">
                            <div className="plan-row"><span>Plan</span><b>{plan.name}</b></div>
                            <div className="plan-row"><span>Domain</span><b className="mono small-mono">{domain.name}</b></div>
                            <div className="plan-row"><span>Renews</span><b>{subscription.renewsAt ? formatDate(subscription.renewsAt) : 'Not set'}</b></div>
                            <div className="plan-row"><span>Paid by</span><b>{PAID_BY[paymentMethod.channel] ?? 'Not paid yet'}</b></div>
                        </div>
                        <div className="btn-row no-grow mt">
                            {can.changePlan && <Button variant="white" size="sm" onClick={() => setChanging(true)}>Change plan</Button>}
                            <Button variant="line" size="sm" disabled title="Payment methods are not connected yet">Payment method</Button>
                        </div>
                    </section>

                    {changing ? (
                        <section className="chg" aria-labelledby="chg-h">
                            <h3 className="heading-sm" id="chg-h">Change plan</h3>
                            <p className="sm mut mt-s">You are on <b>{plan.name}</b>, {plan.poolGb} GB for {formatPrice(plan.price.NGN.yearly, 'NGN')} a year.</p>
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

                    <Card>
                        <h3 className="heading-sm">Need a VAT invoice in the company name?</h3>
                        <p className="sm mut mt-s">Every invoice should carry your registered business name and our VAT details. If something needs correcting, <a href={route('contact')}>tell us</a> and we will reissue it.</p>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
