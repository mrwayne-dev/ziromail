import { useId, useState } from 'react';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import CodeInput from '../ui/CodeInput';
import Field, { Input } from '../ui/Field';
import { CheckIcon, InfoIcon } from '../ui/Icons';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
 * Three steps: their address, the six-digit code they were sent, done. In the
 * preview no email is sent and any six digits are accepted; the real flow sends a
 * one-time code valid for 10 minutes, rate limited, and the server checks it.
 */
export default function AddAdminPanel({ onCancel, onAdded }) {
    const id = useId();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    function send() {
        if (!EMAIL.test(email.trim())) return setError('Enter a full email address, like ngozi@example.com.');
        setError('');
        setStep(2);
    }

    function confirm() {
        if (code.length !== 6) return setError('Enter all six digits.');
        setError('');
        onAdded(email.trim());
        setStep(3);
    }

    return (
        <section className="addadm" aria-labelledby={`${id}-h`}>
            <h2 className="heading-sm" id={`${id}-h`}>Add an administrator</h2>
            <p className="sm mut mt-s">Enter their address and we send a six-digit code. Once they read it back to you, or type it themselves, they are an administrator immediately.</p>

            {step === 1 && (
                <div className="aa-step">
                    <div className="mt">
                        <Field label="Their email address" error={error} hint="This can be a mailbox on your domain, or any address outside it: your accountant's Gmail, your web developer's work address. They do not need a mailbox here to administer the account.">
                            {(props) => <Input {...props} type="email" placeholder="ngozi@adaobifoods.com" autoComplete="off" spellCheck="false" value={email} onChange={(e) => setEmail(e.target.value)} />}
                        </Field>
                    </div>
                    <div className="btn-row no-grow">
                        <Button onClick={send}>Send the code</Button>
                        <Button variant="quiet" onClick={onCancel}>Cancel</Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="aa-step">
                    <Banner tone="info" live icon={<InfoIcon />} title={`Code sent to ${email.trim()}`} className="mt">
                        <p>It is valid for 10 minutes. If they are with you, they can read it out and you can type it here yourself. (Preview: no email is sent. Any six digits work.)</p>
                    </Banner>
                    <div className="field mt">
                        <span className="label" id={`${id}-otp`}>Six-digit code</span>
                        <CodeInput value={code} onChange={setCode} invalid={Boolean(error)} describedBy={`${id}-otp`} autoFocus />
                        {error && <p className="err" role="alert">{error}</p>}
                    </div>
                    <div className="btn-row no-grow">
                        <Button onClick={confirm}>Confirm administrator</Button>
                        <Button variant="line" onClick={() => setCode('')}>Send it again</Button>
                        <Button variant="quiet" onClick={onCancel}>Cancel</Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="aa-step">
                    <Banner tone="ok" live icon={<CheckIcon size={17} />} title={`${email.trim()} is now an administrator`} className="mt">
                        <p>They can create mailboxes, move storage and change DNS records. They cannot change the plan, export all mail, or withdraw anyone's access: those stay with you as owner.</p>
                    </Banner>
                    <Button variant="line" className="mt" onClick={onCancel}>Done</Button>
                </div>
            )}
        </section>
    );
}
