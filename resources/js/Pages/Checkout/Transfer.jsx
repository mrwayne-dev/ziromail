import OrderSummary from '../../Components/domain/OrderSummary';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import ProgressSteps from '../../Components/ui/ProgressSteps';
import Spinner from '../../Components/ui/Spinner';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import useCopy from '../../Hooks/useCopy';
import usePricingState from '../../Hooks/usePricingState';
import useQuery from '../../Hooks/useQuery';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { formatPrice } from '../../Lib/money';
import { buildOrder } from '../../Lib/order';
import { route } from '../../Lib/route';

const groupAccountNumber = (digits) => digits.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

export default function Transfer() {
    const query = useQuery();
    const { term, currency } = usePricingState();
    const order = buildOrder({ planCode: query.get('plan'), term, currency });
    const { accountNumber, bank, accountName, expiresIn } = accountFixture.checkout.transfer;
    const { copied, copy } = useCopy();
    const { toast } = useToast();
    const amount = `${formatPrice(order.total, order.currency)}.00`;

    async function onCopy() {
        if (!(await copy(accountNumber))) {
            toast({ tone: 'warn', title: 'Could not copy', message: 'Select the account number and copy it by hand.' });
        }
    }

    return (
        <>
            <Seo title="Bank transfer | Ziroemail" description="Transfer to your business's own account number and your mailboxes activate automatically." path="/checkout/transfer" noindex />

            <div className="co-main">
                <ProgressSteps steps={accountFixture.checkout.steps} current="payment" label="Checkout progress" doneMarker="tick" />

                <div data-hero>
                    <h1>Transfer {formatPrice(order.total, order.currency)} to activate</h1>
                    <p className="lead">
                        This account number belongs to your business alone. Transfer from any Nigerian bank app and we detect it automatically, usually within a minute.
                    </p>
                </div>

                <section className="acct" aria-label="Transfer details">
                    <p className="k">Account number</p>
                    <p className="acct-num">{groupAccountNumber(accountNumber)}</p>
                    <dl className="acct-grid">
                        <div><dt className="k">Bank</dt><dd>{bank}</dd></div>
                        <div><dt className="k">Account name</dt><dd>{accountName}</dd></div>
                        <div><dt className="k">Amount</dt><dd>{amount}</dd></div>
                        <div><dt className="k">Expires</dt><dd>{expiresIn}</dd></div>
                    </dl>
                    <Button variant="white" onClick={onCopy}>{copied ? 'Copied' : 'Copy account number'}</Button>
                    <span className="sr-only" role="status">{copied ? 'Account number copied' : ''}</span>
                </section>

                <div className="waiting" role="status">
                    <Spinner />
                    <div>
                        <b>Waiting for your transfer</b>
                        <p>You can close this page. We will send you a WhatsApp message and an email the moment the money arrives, and your mailboxes will be ready.</p>
                    </div>
                </div>

                <section>
                    <h2 className="how">How to do it</h2>
                    <ol className="steps-list">
                        <li>Open your bank app and choose to send money.</li>
                        <li>Enter the account number above and pick <b>{bank}</b>.</li>
                        <li>Send exactly <b>{amount}</b>. Sending a different amount delays activation.</li>
                        <li>Come back here, or wait for our message. Nothing else to do.</li>
                    </ol>
                </section>

                <Note title="Paid but nothing happened?">
                    <p>
                        Transfers occasionally take a few minutes at busy times. If it has been more than fifteen minutes, message us on WhatsApp with your transfer receipt and we will activate you by hand.
                    </p>
                </Note>

                <div className="btn-row co-actions">
                    <Button variant="line" href={route('checkout.payment', { plan: order.plan.code })}>Use a different method</Button>
                    <Button href={route('onboarding.domain')}>I have paid, continue</Button>
                </div>
            </div>

            <OrderSummary
                order={order}
                rows={[
                    { label: `${order.plan.name} plan, ${order.termLabel.toLowerCase()}`, value: formatPrice(order.subtotal, order.currency) },
                    { label: 'Mailboxes', value: 'Unlimited' },
                ]}
            >
                <Note title="No chargebacks, ever">
                    <p>A bank transfer cannot be reversed by a dispute weeks later. It is the cleanest way for both of us.</p>
                </Note>
            </OrderSummary>
        </>
    );
}

Transfer.layout = (page) => <AuthLayout variant="checkout">{page}</AuthLayout>;
