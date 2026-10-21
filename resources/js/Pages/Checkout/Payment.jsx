import { Link, usePage } from '@inertiajs/react';
import OrderSummary from '../../Components/domain/OrderSummary';
import Button from '../../Components/ui/Button';
import { CheckIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import ProgressSteps from '../../Components/ui/ProgressSteps';
import Seo from '../../Components/seo/Seo';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { buildOrder } from '../../Lib/order';
import { route } from '../../Lib/route';

const reassurances = [
    'Add or remove mailboxes any time',
    'Export your mail whenever you want',
    'Refunds by published policy',
];

export default function Payment() {
    const { checkout } = usePage().props;

    return (
        <>
            <Seo title="Payment | Ziroemail" description="Review your Ziroemail order." path="/checkout" noindex />

            <div className="co-main">
                <ProgressSteps steps={accountFixture.checkout.steps} current="payment" label="Checkout progress" doneMarker="tick" />

                {checkout === null ? (
                    <>
                        <div data-hero>
                            <h1>Nothing to pay for yet</h1>
                            <p className="lead">Add your domain and choose a plan first. Your order appears here.</p>
                        </div>
                        <Button href={route('onboarding.domain')}>Add your domain</Button>
                    </>
                ) : (
                    <>
                        <div data-hero>
                            <h1>{checkout.paid ? 'This domain is paid for' : 'Payment opens soon'}</h1>
                            <p className="lead">
                                {checkout.paid
                                    ? <><span className="mono">{checkout.domain.name}</span> is on its plan. Manage billing from your dashboard.</>
                                    : <>Your order for <span className="mono">{checkout.domain.name}</span> is saved. We are switching on card and bank payments, and we will email you the moment you can pay. Nothing is charged until then.</>}
                            </p>
                        </div>

                        <Note title="Why you cannot pay yet">
                            <p>Taking payment safely needs our payment provider's approval, and we will not ask you to send money any other way. If anyone asks you to transfer to an account number for Ziroemail, it is not us.</p>
                        </Note>

                        <div className="btn-row ob-actions">
                            <Button href={route('onboarding.records', { domain: checkout.domain.id })}>Continue setting up</Button>
                            <Button variant="line" href={route('dashboard')}>Go to dashboard</Button>
                        </div>
                    </>
                )}
            </div>

            {checkout !== null && (
                <OrderSummaryFor checkout={checkout} />
            )}
        </>
    );
}

function OrderSummaryFor({ checkout }) {
    const order = buildOrder({ planCode: checkout.planCode, term: checkout.term, currency: checkout.currency });

    return (
        <OrderSummary
            order={order}
            totalLabel="Total when payment opens"
            rows={[
                { label: 'Domain', value: checkout.domain.name, mono: true },
                { label: `${order.plan.name} plan, ${order.termLabel.toLowerCase()}`, note: `${order.plan.poolGb} GB pool, unlimited mailboxes`, value: '' },
                { label: 'Mailboxes', note: 'As many as the pool carries, not charged per seat', value: 'Unlimited' },
            ]}
        >
            <ul className="o-ticks">
                {reassurances.map((line) => (
                    <li key={line}><CheckIcon size={13} /> {line}</li>
                ))}
            </ul>
            <p className="o-help">Questions? <Link href={route('contact')}>Message us on WhatsApp</Link></p>
        </OrderSummary>
    );
}

Payment.layout = (page) => <AuthLayout variant="checkout">{page}</AuthLayout>;
