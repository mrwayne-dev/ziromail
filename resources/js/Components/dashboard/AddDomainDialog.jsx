import { useId, useState } from 'react';
import { checkDomainInput } from '../../Lib/domain';
import { buildOrder } from '../../Lib/order';
import { formatPrice } from '../../Lib/money';
import PlanPicker from '../domain/PlanPicker';
import OrderSummary from '../domain/OrderSummary';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import { InfoIcon } from '../ui/Icons';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';

/*
 * Adds a domain to the account: the name, the plan for it, and what is charged today.
 * Submitting would check the name, take payment, then show the records to add; in
 * the preview it adds the domain to the list as "verifying".
 */
export default function AddDomainDialog({ open, onClose, existing, onAdd }) {
    const id = useId();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [planCode, setPlanCode] = useState('starter');
    const [touched, setTouched] = useState(false);
    const check = checkDomainInput(name);
    const taken = existing.some((domain) => domain.name === check.domain);
    const error = touched ? check.error || (taken ? `${check.domain} is already on this account.` : '') : '';
    const order = buildOrder({ planCode, term: 'annual', currency: 'NGN' });

    function submit(event) {
        event.preventDefault();
        setTouched(true);
        if (check.error || taken) return;
        onAdd({
            id: `dom_new_${check.domain}`,
            name: check.domain,
            planCode,
            state: 'verifying',
            mailboxCount: 0,
            assignedGb: 0,
            usedGb: 0,
            poolGb: order.plan.poolGb,
            planGb: order.plan.poolGb,
            boughtGb: 0,
            ceilingGb: order.plan.ceilingGb,
            renewsAt: '2027-09-29',
            recordsPassing: 0,
            recordsTotal: 4,
            healthNote: 'Waiting for records',
        });
        toast({ tone: 'ok', title: `${check.domain} added`, message: 'Add the four records to start using it.' });
        setName('');
        setTouched(false);
        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add a domain"
            size="lg"
            footer={(
                <>
                    <Button variant="quiet" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={`${id}-form`}>Pay {formatPrice(order.total, order.currency)} and continue</Button>
                </>
            )}
        >
            <form id={`${id}-form`} noValidate onSubmit={submit}>
                <Field label="Domain" error={error} hint="A domain your business already owns, for example yourbusiness.com.">
                    {(props) => <Input {...props} className="input mono" value={name} placeholder="yourbusiness.com" autoComplete="off" spellCheck="false" autoCapitalize="off" onChange={(e) => setName(e.target.value)} />}
                </Field>
                <p className="label">Plan for this domain</p>
                <PlanPicker variant="select" value={planCode} onChange={setPlanCode} />
                <OrderSummary order={order} rows={[{ label: `${order.plan.name} plan`, note: `${order.termLabel}, ${order.plan.poolGb} GB pool`, value: formatPrice(order.subtotal, order.currency) }]} totalLabel="Charged today" />
                <Banner tone="info" icon={<InfoIcon />} className="mt">
                    Preview: no payment is taken. The domain is added to this list only.
                </Banner>
            </form>
        </Modal>
    );
}
