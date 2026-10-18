import { useId, useState } from 'react';
import Button from '../ui/Button';
import Field, { Textarea } from '../ui/Field';
import Modal from '../ui/Modal';

const MIN = 12;

/*
 * Every action that changes something in the console asks why. It will not submit
 * until a sentence is written, and the sentence goes into the audit trail (and, for
 * customer-facing actions, the email). `onConfirm(reason)` runs only with a reason.
 * `children` are extra fields the action needs, shown above the reason.
 */
export default function ReasonDialog({ open, onClose, title, description, confirmLabel, tone = 'ink', onConfirm, children }) {
    const id = useId();
    const [reason, setReason] = useState('');
    const [touched, setTouched] = useState(false);
    const trimmed = reason.trim();
    const error = touched && trimmed.length < MIN ? 'Write a sentence saying why. It is kept in the audit trail.' : '';

    function submit(event) {
        event.preventDefault();
        setTouched(true);
        if (trimmed.length < MIN) return;
        onConfirm(trimmed);
        setReason('');
        setTouched(false);
    }

    function close() {
        setReason('');
        setTouched(false);
        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title={title}
            size="sm"
            footer={(
                <>
                    <Button variant="quiet" onClick={close}>Cancel</Button>
                    <Button variant={tone} type="submit" form={`${id}-form`}>{confirmLabel}</Button>
                </>
            )}
        >
            <form id={`${id}-form`} noValidate onSubmit={submit}>
                {description && <p className="sm">{description}</p>}
                {children}
                <Field label="Reason" error={error} hint="Appears in the audit trail with your name.">
                    {(props) => <Textarea {...props} className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
                </Field>
            </form>
        </Modal>
    );
}
