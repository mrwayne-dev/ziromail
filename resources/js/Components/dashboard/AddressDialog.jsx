import { useId, useState } from 'react';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';

const LOCAL = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

/*
 * Creates or edits an extra address. Delivering to one mailbox makes it an alias;
 * to several makes it a forward. The type follows from how many are chosen.
 */
export default function AddressDialog({ open, onClose, domainName, mailboxes, existing, editing, onSave }) {
    const id = useId();
    const { toast } = useToast();
    const [local, setLocal] = useState(editing ? editing.address.split('@')[0] : '');
    const [chosen, setChosen] = useState(editing ? editing.destinations : []);
    const [touched, setTouched] = useState(false);

    const address = `${local.trim().toLowerCase()}@${domainName}`;
    const errors = {};
    if (!local.trim()) errors.local = 'Type the part before the @.';
    else if (!LOCAL.test(local.trim().toLowerCase())) errors.local = 'Use letters, numbers, dots, dashes or underscores.';
    else if (existing.some((alias) => alias.address === address && alias.id !== editing?.id)) errors.local = 'This address is already in use.';
    else if (mailboxes.some((mailbox) => mailbox.address === address)) errors.local = 'A mailbox already uses this address.';
    if (chosen.length === 0) errors.destinations = 'Choose at least one mailbox to deliver to.';

    function toggle(value) {
        setChosen(chosen.includes(value) ? chosen.filter((item) => item !== value) : [...chosen, value]);
    }

    function submit(event) {
        event.preventDefault();
        setTouched(true);
        if (Object.keys(errors).length > 0) return;
        onSave({ id: editing?.id ?? `al_new_${local}`, address, destinations: chosen, type: chosen.length > 1 ? 'forward' : 'alias' });
        toast({ tone: 'ok', title: editing ? 'Address updated' : 'Address added', message: address });
        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? 'Edit address' : 'Add an address'}
            footer={(
                <>
                    <Button variant="quiet" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={`${id}-form`}>{editing ? 'Save' : 'Add address'}</Button>
                </>
            )}
        >
            <form id={`${id}-form`} noValidate onSubmit={submit}>
                <Field label="Address" error={touched ? errors.local : undefined} hint="Uses no storage and is not charged.">
                    {(props) => (
                        <span className="addr-in">
                            <Input {...props} className="input mono" value={local} placeholder="info" autoComplete="off" spellCheck="false" autoCapitalize="off" onChange={(e) => setLocal(e.target.value)} />
                            <span className="at mono">@{domainName}</span>
                        </span>
                    )}
                </Field>
                <fieldset className="pw-fieldset">
                    <legend className="label">Delivers to</legend>
                    <div className="pw-opts">
                        {mailboxes.map((mailbox) => (
                            <label className="pw-opt" key={mailbox.id}>
                                <input type="checkbox" checked={chosen.includes(mailbox.address)} onChange={() => toggle(mailbox.address)} />
                                <span className="bd"><b className="mono">{mailbox.address}</b></span>
                            </label>
                        ))}
                    </div>
                    {touched && errors.destinations && <p className="err" role="alert">{errors.destinations}</p>}
                </fieldset>
            </form>
        </Modal>
    );
}
