import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import OrderSummary from '../../Components/domain/OrderSummary';
import Button from '../../Components/ui/Button';
import { CheckIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import OptionCard, { OptionGroup } from '../../Components/ui/OptionCard';
import ProgressSteps from '../../Components/ui/ProgressSteps';
import Select from '../../Components/ui/Select';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import usePricingState from '../../Hooks/usePricingState';
import useQuery from '../../Hooks/useQuery';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { formatPrice } from '../../Lib/money';
import { buildOrder } from '../../Lib/order';
import { route } from '../../Lib/route';

const reassurances = [
    'Add or remove mailboxes any time',
    'Export your mail whenever you want',
    'Refunds by published policy',
];

export default function Payment() {
    const query = useQuery();
    const { term, currency } = usePricingState();
    const order = buildOrder({ planCode: query.get('plan'), term, currency });
    const { methods } = accountFixture.checkout;
    const [method, setMethod] = useState(methods[0].value);
    const [bank, setBank] = useState(methods.find((m) => m.banks).banks[0]);
    const { toast } = useToast();

    function onSubmit(e) {
        e.preventDefault();
        if (method === 'transfer') {
            router.visit(route('checkout.transfer', { plan: order.plan.code }));
            return;
        }
        toast({
            tone: 'warn',
            title: 'That method is not live yet',
            message: 'Card, USSD and dollar payments arrive with Paystack. Bank transfer shows the finished flow.',
        });
    }

    return (
        <>
            <Seo title="Payment | Ziroemail" description="Choose how to pay for your Ziroemail plan." path="/checkout" noindex />

            <div className="co-main">
                <ProgressSteps steps={accountFixture.checkout.steps} current="payment" label="Checkout progress" doneMarker="tick" />

                <div data-hero>
                    <h1>How would you like to pay?</h1>
                    <p className="lead">Bank transfer is what most of our customers use. Pick whichever suits you.</p>
                </div>

                <form onSubmit={onSubmit} noValidate>
                    <OptionGroup legend="Payment method" hideLegend>
                        {methods.map((m) => (
                            <OptionCard
                                key={m.value}
                                name="method"
                                value={m.value}
                                checked={method === m.value}
                                onChange={setMethod}
                                radio="end"
                                icon={m.icon}
                                title={m.title}
                                badge={m.badge}
                                description={m.description}
                                detail={m.banks ? (
                                    <>
                                        <span className="label">Choose your bank</span>
                                        <Select aria-label="Your bank" value={bank} onChange={(e) => setBank(e.target.value)} options={m.banks.map((b) => ({ value: b, label: b }))} />
                                        <span className="hint">{m.detail}</span>
                                    </>
                                ) : m.detail}
                            />
                        ))}
                    </OptionGroup>

                    <Button type="submit" size="lg" full>Continue to payment</Button>
                </form>

                <Note title="Why we put bank transfer first">
                    <p>
                        A Nigerian bank transfer cannot be reversed weeks later by someone disputing it, and it does not depend on a dollar card limit that fails at the worst moment. It is the most reliable way for a Nigerian business to pay, so it leads.
                    </p>
                </Note>
            </div>

            <OrderSummary
                order={order}
                totalLabel="Total due today"
                rows={[
                    { label: `${order.plan.name} plan, ${order.termLabel.toLowerCase()}`, note: `${order.plan.poolGb} GB pool, unlimited mailboxes`, value: formatPrice(order.subtotal, order.currency) },
                    { label: 'Mailboxes', note: 'As many as the pool carries, not charged per seat', value: 'Unlimited' },
                ]}
            >
                <Note title="One payment, not twelve">
                    <p>Paying for the year means a single transfer to remember instead of a renewal every month.</p>
                </Note>
                <ul className="o-ticks">
                    {reassurances.map((line) => (
                        <li key={line}><CheckIcon size={13} /> {line}</li>
                    ))}
                </ul>
                <p className="o-help">Questions? <Link href={route('contact')}>Message us on WhatsApp</Link></p>
            </OrderSummary>
        </>
    );
}

Payment.layout = (page) => <AuthLayout variant="checkout">{page}</AuthLayout>;
