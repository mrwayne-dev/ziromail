import { useForm } from '@inertiajs/react';
import { useId, useState } from 'react';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import Modal from '../ui/Modal';
import { route } from '../../Lib/route';
import { useToast } from '../ui/Toast';

const LOCAL = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

/*
 * Creates or edits an extra address. Delivering to one mailbox makes it an alias;
 * to several makes it a forward. The type follows from how many are chosen.
 */
export default function AddressDialog({ open, onClose, domain, mailboxes, editing }) {
    const id = useId();
    const { toast } = useToast();
    const form = useForm({ domain: domain.id, local_part: editing ? editing.address.split('@')[0] : '', destinations: editing ? editing.destinations : [] });
    const [touched, setTouched] = useState(false);
    const local = form.data.local_part.trim().toLowerCase();
    const errors = { ...(touched ? {} : {}), ...form.errors };
    if (touched && !local) errors.local_part = 'Type the part before the @.';
    else if (touched && !LOCAL.test(local)) errors.local_part = 'Use letters, numbers, dots, dashes or underscores.';
    if (touched && form.data.destinations.length === 0) errors.destinations = 'Choose at least one mailbox to deliver to.';

    function toggle(value) {
        const next = form.data.destinations.includes(value) ? form.data.destinations.filter((item) => item !== value) : [...form.data.destinations, value];
        form.setData('destinations', next);
    }

    function submit(event) {
        event.preventDefault();
        setTouched(true);
        if (!local || !LOCAL.test(local) || form.data.destinations.length === 0) return;
        const options = {
            preserveScroll: true,
            onSuccess: () => { toast({ tone: 'ok', title: editing ? 'Address updated' : 'Address added', message: `${local}@${domain.name}` }); onClose(); },
        };
        if (editing) form.put(route('dashboard.aliases.update', { alias: editing.id }), options);
        else form.post(route('dashboard.aliases.store'), options);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? 'Edit address' : 'Add an address'}
            footer={(
                <>
                    <Button variant="quiet" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={`${id}-form`} busy={form.processing}>{editing ? 'Save' : 'Add address'}</Button>
                </>
            )}
        >
            <form id={`${id}-form`} noValidate onSubmit={submit}>
                <Field label="Address" error={errors.local_part} hint="Uses no storage and is not charged.">
                    {(props) => (
                        <span className="addr-in">
                            <Input {...props} className="input mono" value={form.data.local_part} placeholder="info" autoComplete="off" spellCheck="false" autoCapitalize="off" onChange={(e) => form.setData('local_part', e.target.value)} />
                            <span className="at mono">@{domain.name}</span>
                        </span>
                    )}
                </Field>
                <fieldset className="pw-fieldset">
                    <legend className="label">Delivers to</legend>
                    <div className="pw-opts">
                        {mailboxes.map((mailbox) => (
                            <label className="pw-opt" key={mailbox.id}>
                                <input type="checkbox" checked={form.data.destinations.includes(mailbox.address)} onChange={() => toggle(mailbox.address)} />
                                <span className="bd"><b className="mono">{mailbox.address}</b></span>
                            </label>
                        ))}
                    </div>
                    {errors.destinations && <p className="err" role="alert">{errors.destinations}</p>}
                </fieldset>
            </form>
        </Modal>
    );
}
