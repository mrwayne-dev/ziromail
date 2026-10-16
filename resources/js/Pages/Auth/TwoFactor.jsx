import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Button from '../../Components/ui/Button';
import CodeInput from '../../Components/ui/CodeInput';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import useQuery from '../../Hooks/useQuery';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { route } from '../../Lib/route';
import { simulateLatency } from '../../Lib/simulate';

export default function TwoFactor() {
    const email = useQuery().get('email') ?? accountFixture.user.email;
    const { digits, acceptedCode } = accountFixture.twoFactor;
    const formRef = useRef(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const { toast } = useToast();
    useFocusFirstError(formRef, error ? { code: error } : {});

    async function onSubmit(e) {
        e.preventDefault();
        if (code.length < digits) {
            setError(`Enter all ${digits} digits from your authenticator app.`);
            return;
        }
        setBusy(true);
        await simulateLatency();
        setBusy(false);
        if (code !== acceptedCode) {
            setError('That code did not work. Codes change every 30 seconds, so try the one showing now.');
            setCode('');
            return;
        }
        setError('');
        toast({ tone: 'ok', title: 'Code accepted', message: 'You are signed in. Your mailbox opens from here once webmail is built.' });
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
                    <CodeInput value={code} onChange={(v) => { setCode(v); setError(''); }} digits={digits} invalid={Boolean(error)} describedBy="code-help" autoFocus />
                    {error ? <p className="err" id="code-help" role="alert">{error}</p> : <p className="hint" id="code-help">The code changes every 30 seconds. Paste works too.</p>}
                </fieldset>

                <Button type="submit" size="lg" full busy={busy}>Verify and sign in</Button>
            </form>

            <Note title="Lost your phone?">
                <p>
                    Use one of the recovery codes you saved when you turned on two-factor.{' '}
                    <Link href={route('login.recovery', { email })}>Enter a recovery code</Link>, or ask whoever administers your domain to reset it.
                </p>
            </Note>

            <p className="auth-back"><Link href={route('login')}>&larr; Back to sign in</Link></p>
        </>
    );
}

TwoFactor.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
