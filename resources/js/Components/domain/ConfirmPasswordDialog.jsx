import { router } from '@inertiajs/react';
import { useState } from 'react';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import Modal from '../ui/Modal';
import { route } from '../../Lib/route';

/*
 * Asks for the account password again before a sensitive action. It posts to the
 * real confirm-password endpoint; on success the server records the confirmation
 * (valid for 15 minutes) and `onConfirmed` runs the action the person was after.
 */
export default function ConfirmPasswordDialog({ open, onClose, onConfirmed, confirmUrl }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    function submit(e) {
        e.preventDefault();
        setBusy(true);
        router.post(confirmUrl ?? route('password.confirm.store'), { password }, {
            preserveScroll: true,
            preserveState: true,
            onError: (errors) => setError(errors.password ?? 'That password is not right.'),
            onSuccess: () => {
                setPassword('');
                setError('');
                onConfirmed();
            },
            onFinish: () => setBusy(false),
        });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Confirm your password"
            size="sm"
            footer={(
                <>
                    <Button variant="line" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="confirm-password-form" busy={busy}>Confirm</Button>
                </>
            )}
        >
            <form id="confirm-password-form" onSubmit={submit} noValidate>
                <p className="sm">This is a sensitive step, so we ask for your password again. It stays confirmed for 15 minutes.</p>
                <Field label="Password" error={error}>
                    {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />}
                </Field>
            </form>
        </Modal>
    );
}
