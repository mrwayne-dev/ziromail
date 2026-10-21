import { useForm } from '@inertiajs/react';
import { useId } from 'react';
import { checkDomainInput } from '../../Lib/domain';
import { buildOrder } from '../../Lib/order';
import { formatPrice } from '../../Lib/money';
import { route } from '../../Lib/route';
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
export default function AddDomainDialog({ open, onClose }) {
    const id = useId();
    const { toast } = useToast();
    const form = useForm({ name: '', plan: 'starter' });
    const check = checkDomainInput(form.data.name);
    const order = buildOrder({ planCode: form.data.plan, term: 'annual', currency: 'NGN' });

    function submit(event) {
        event.preventDefault();
        if (check.error) return form.setError('name', check.error);
        form.post(route('dashboard.domains.store'), {
            onSuccess: () => {
                toast({ tone: 'ok', title: `${check.domain} added`, message: 'Add the four records, then pay, to start using it.' });
                form.reset();
                onClose();
            },
        });
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
                    <Button type="submit" form={`${id}-form`} busy={form.processing}>Add domain</Button>
                </>
            )}
        >
            <form id={`${id}-form`} noValidate onSubmit={submit}>
                <Field label="Domain" error={form.errors.name} hint="A domain your business already owns, for example yourbusiness.com.">
                    {(props) => <Input {...props} className="input mono" value={form.data.name} placeholder="yourbusiness.com" autoComplete="off" spellCheck="false" autoCapitalize="off" onChange={(e) => { form.setData('name', e.target.value); form.clearErrors('name'); }} />}
                </Field>
                <p className="label">Plan for this domain</p>
                <PlanPicker variant="select" value={form.data.plan} onChange={(plan) => form.setData('plan', plan)} />
                <OrderSummary order={order} rows={[{ label: `${order.plan.name} plan`, note: `${order.termLabel}, ${order.plan.poolGb} GB pool`, value: formatPrice(order.subtotal, order.currency) }]} totalLabel="Due when you pay" />
                <Banner tone="info" icon={<InfoIcon />} className="mt">
                    Nothing is charged now. Payment opens once the payment provider is connected.
                </Banner>
            </form>
        </Modal>
    );
}
