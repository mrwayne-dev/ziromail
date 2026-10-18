import { Link, useForm } from '@inertiajs/react';
import { useRef } from 'react';
import Button from '../../Components/ui/Button';
import CodeInput from '../../Components/ui/CodeInput';
import Note from '../../Components/ui/Note';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

const DIGITS = 6;

export default function TwoFactor({ email, action, recoveryUrl, backUrl }) {
    const formRef = useRef(null);
    const form = useForm({ code: '' });
    const error = form.errors.code;
    useFocusFirstError(formRef, error ? { code: error } : {});

    function onSubmit(e) {
        e.preventDefault();
        if (form.data.code.length < DIGITS) {
            form.setError('code', `Enter all ${DIGITS} digits from your authenticator app.`);
            return;
        }
        form.post(action ?? route('login.two-factor.store'), { onFinish: () => form.reset('code') });
    }

    return (
        <>
            <Seo title="Enter your code | Ziroemail" description="Confirm it is you with the code from your authenticator app." path="/login/two-factor" noindex />

            <div data-hero>
                <h1>Enter your code</h1>
                <p className="lead">
                    Open your authenticator app and type the six digits shown for <b className="strong">{email}</b>.
                </p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                <fieldset>
                    <legend className="label">Six-digit code</legend>
                    <CodeInput value={form.data.code} onChange={(v) => { form.setData('code', v); form.clearErrors('code'); }} digits={DIGITS} invalid={Boolean(error)} describedBy="code-help" autoFocus />
                    {error ? <p className="err" id="code-help" role="alert">{error}</p> : <p className="hint" id="code-help">The code changes every 30 seconds. Paste works too.</p>}
                </fieldset>

                <Button type="submit" size="lg" full busy={form.processing}>Verify and sign in</Button>
            </form>

            <Note title="Lost your phone?">
                <p>
                    Use one of the recovery codes you saved when you turned on two-factor.{' '}
                    <Link href={recoveryUrl ?? route('login.recovery')}>Enter a recovery code</Link>, or ask whoever administers your domain to reset it.
                </p>
            </Note>

            <p className="auth-back"><Link href={backUrl ?? route('login')}>&larr; Back to sign in</Link></p>
        </>
    );
}

TwoFactor.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
