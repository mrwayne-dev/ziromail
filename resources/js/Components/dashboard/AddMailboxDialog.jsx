import { useForm } from '@inertiajs/react';
import { useId, useState } from 'react';
import { fitsInPool } from '../../Lib/pool';
import { formatGb } from '../../Lib/format';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import { InfoIcon } from '../ui/Icons';
import Modal from '../ui/Modal';
import { route } from '../../Lib/route';
import { useToast } from '../ui/Toast';

const ADDRESS = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

/*
 * The checks for a new mailbox, as one result. A convenience for the person
 * typing: the server re-validates the address and the pool before creating anything.
 */
export function checkNewMailbox({ local, quota }, existing, pool) {
    const address = local.trim().toLowerCase();
    const errors = {};
    if (!address) errors.local = 'Type the part before the @.';
    else if (!ADDRESS.test(address)) errors.local = 'Use letters, numbers, dots, dashes or underscores.';
    else if (existing.some((mailbox) => mailbox.local === address)) errors.local = 'A mailbox with this address already exists on this domain.';

    const gb = parseFloat(quota);
    if (!(gb > 0)) errors.quota = 'Enter a number of GB, more than zero.';
    else if (!fitsInPool(gb, pool)) errors.quota = `Only ${formatGb(Math.max(pool.unassignedGb, 0))} is unassigned in the pool. Choose a smaller quota or add storage.`;

    return { address, gb, errors, valid: Object.keys(errors).length === 0 };
}

/* Adds a mailbox to this domain's pool. The checks here are a convenience; the server re-checks the pool and the address. */
export default function AddMailboxDialog({ open, onClose, domain, mailboxes, pool }) {
    const id = useId();
    const { toast } = useToast();
    const form = useForm({ domain: domain.id, local_part: '', display_name: '', quota_gb: '2', password_mode: 'link', first_password: '' });
    const [touched, setTouched] = useState(false);
    const result = checkNewMailbox({ local: form.data.local_part, quota: form.data.quota_gb }, mailboxes, pool);
    const set = (key) => (event) => form.setData(key, event.target.value);
    const show = (field, serverField = field) => form.errors[serverField] ?? (touched ? result.errors[field] : undefined);

    function submit(event) {
        event.preventDefault();
        setTouched(true);
        if (!result.valid) return;
        form.transform((data) => ({ ...data, domain: domain.id }));
        form.post(route('dashboard.mailboxes.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast({ tone: 'ok', title: `${result.address}@${domain.name} added`, message: form.data.password_mode === 'link' ? 'A setup link is ready to send.' : 'They will be asked to change the password at first sign-in.' });
                form.reset();
                setTouched(false);
                onClose();
            },
        });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add a mailbox"
            footer={(
                <>
                    <Button variant="quiet" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form={`${id}-form`} busy={form.processing}>Add mailbox</Button>
                </>
            )}
        >
            <form id={`${id}-form`} noValidate onSubmit={submit}>
                <p className="hint">On <span className="mono">{domain.name}</span>. Its storage comes out of this domain's pool.</p>

                <Field label="Address" error={show('local', 'local_part')} hint="Letters, numbers, dots and hyphens. This becomes the sign-in name.">
                    {(props) => (
                        <span className="addr-in">
                            <Input {...props} className="input mono" value={form.data.local_part} placeholder="sales" autoComplete="off" spellCheck="false" autoCapitalize="off" onChange={set('local_part')} />
                            <span className="at mono">@{domain.name}</span>
                        </span>
                    )}
                </Field>

                <Field label="Display name" optional hint="What recipients see as the sender. You can change it later.">
                    {(props) => <Input {...props} value={form.data.display_name} placeholder="Adaobi Foods Sales" autoComplete="off" onChange={set('display_name')} />}
                </Field>

                <Field label="Storage for this mailbox" error={show('quota', 'quota_gb')} hint={`${formatGb(Math.max(pool.unassignedGb, 0))} is unassigned in the pool.`}>
                    {(props) => (
                        <span className="q-in">
                            <Input {...props} type="number" min="0.5" step="0.5" value={form.data.quota_gb} onChange={set('quota_gb')} />
                            <span className="gb">GB</span>
                        </span>
                    )}
                </Field>

                <fieldset className="pw-fieldset">
                    <legend className="label">First password</legend>
                    <div className="pw-opts">
                        <label className="pw-opt">
                            <input type="radio" name={`${id}-pw`} value="link" checked={form.data.password_mode === 'link'} onChange={set('password_mode')} />
                            <span className="bd"><b>Send a setup link</b><span>They choose their own password and set up their phone. You never see it.</span></span>
                        </label>
                        <label className="pw-opt">
                            <input type="radio" name={`${id}-pw`} value="set" checked={form.data.password_mode === 'set'} onChange={set('password_mode')} />
                            <span className="bd"><b>Set one myself</b><span>Hand it over in person. They are asked to change it at first sign-in.</span></span>
                        </label>
                    </div>
                    {form.data.password_mode === 'set' && (
                        <Field label="Password" error={form.errors.first_password} hint="At least 12 characters. It goes to the mail server and is never kept by us.">
                            {(props) => <Input {...props} type="text" value={form.data.first_password} autoComplete="off" onChange={set('first_password')} />}
                        </Field>
                    )}
                </fieldset>

                <Banner tone="info" icon={<InfoIcon />} className="mt">
                    The mail server is not connected yet, so the mailbox is saved here and activated when it is.
                </Banner>
            </form>
        </Modal>
    );
}
