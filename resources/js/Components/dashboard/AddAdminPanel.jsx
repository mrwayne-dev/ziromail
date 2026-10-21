import { useForm } from '@inertiajs/react';
import { useId, useState } from 'react';
import { route } from '../../Lib/route';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import { CheckIcon } from '../ui/Icons';

/*
 * Invite someone to help run the account. We email them; once they sign in and confirm that
 * address, your account appears on their dashboard. Nothing is shared until then, and there
 * is no code to read out.
 */
export default function AddAdminPanel({ onCancel }) {
    const id = useId();
    const form = useForm({ email: '' });
    const [sentTo, setSentTo] = useState(null);

    function send(event) {
        event.preventDefault();
        const email = form.data.email.trim();
        form.post(route('dashboard.team.invite'), { preserveScroll: true, onSuccess: () => { setSentTo(email); form.reset(); } });
    }

    return (
        <section className="addadm" aria-labelledby={`${id}-h`}>
            <h2 className="heading-sm" id={`${id}-h`}>Add an administrator</h2>
            <p className="sm mut mt-s">Enter their address. We email them, and once they sign in with that address they can help run your account.</p>

            {sentTo ? (
                <div className="aa-step">
                    <Banner tone="ok" live icon={<CheckIcon size={17} />} title={`Invitation sent to ${sentTo}`} className="mt">
                        <p>They can create mailboxes, move storage and change DNS records. They cannot change the plan, export all mail, or withdraw anyone's access: those stay with you as owner.</p>
                    </Banner>
                    <Button variant="line" className="mt" onClick={onCancel}>Done</Button>
                </div>
            ) : (
                <form className="aa-step" noValidate onSubmit={send}>
                    <div className="mt">
                        <Field label="Their email address" error={form.errors.email} hint="Any address works, on your domain or not: your accountant's Gmail, your web developer's work address. They do not need a mailbox here.">
                            {(props) => <Input {...props} type="email" placeholder="ngozi@example.com" autoComplete="off" spellCheck="false" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />}
                        </Field>
                    </div>
                    <div className="btn-row no-grow">
                        <Button type="submit" busy={form.processing}>Send the invitation</Button>
                        <Button variant="quiet" onClick={onCancel}>Cancel</Button>
                    </div>
                </form>
            )}
        </section>
    );
}
