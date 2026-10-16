import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import useQuery from '../../Hooks/useQuery';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { route } from '../../Lib/route';
import { simulateLatency } from '../../Lib/simulate';

const clean = (value) => value.replace(/[^a-z0-9]/gi, '').toUpperCase();

export default function Recovery() {
    const email = useQuery().get('email') ?? accountFixture.user.email;
    const { total, unused, acceptedCode } = accountFixture.recovery;
    const formRef = useRef(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const { toast } = useToast();
    useFocusFirstError(formRef, error ? { code: error } : {});

    async function onSubmit(e) {
        e.preventDefault();
        if (!clean(code)) {
            setError('Enter one of your recovery codes.');
            return;
        }
        setBusy(true);
        await simulateLatency();
        setBusy(false);
        if (clean(code) !== clean(acceptedCode)) {
            setError('That code did not work. Check for typos, or try another one. Each code works only once.');
            return;
        }
        setError('');
        toast({ tone: 'ok', title: 'Recovery code accepted', message: `You are signed in. ${unused - 1} of ${total} codes are still unused.` });
    }

    return (
        <>
            <Seo title="Use a recovery code | Ziroemail" description="Sign in with one of the recovery codes you saved." path="/login/recovery" noindex />

            <div data-hero>
                <h1>Use a recovery code</h1>
                <p className="lead">
                    Enter one of the codes you saved when you turned on two-factor authentication for <b className="strong">{email}</b>.
                </p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                <Field label="Recovery code" error={error} hint="Each code works once. Dashes optional.">
                    {(p) => (
                        <Input
                            {...p}
                            className="input code-in"
                            name="code"
                            type="text"
                            placeholder="xxxx-xxxx-xxxx"
                            autoComplete="one-time-code"
                            spellCheck="false"
                            autoCapitalize="off"
                            value={code}
                            onChange={(e) => { setCode(e.target.value); setError(''); }}
                        />
                    )}
                </Field>

                <p className="used">
                    <span className="pips" aria-hidden="true">
                        {Array.from({ length: total }, (_, i) => <i key={i} className={i < total - unused ? 'spent' : undefined} />)}
                    </span>
                    {unused} of {total} codes still unused
                </p>

                <Button type="submit" size="lg" full busy={busy}>Sign in</Button>
            </form>

            <Note tone="warn" title="Out of codes, or never saved them?">
                <p>
                    Ask whoever administers your domain to reset two-factor on your mailbox. If you are the owner and locked out of your own account,{' '}
                    <Link href={route('contact')}>contact us</Link>. We will verify who you are before changing anything, which takes a little time but is the point.
                </p>
            </Note>

            <p className="auth-back"><Link href={route('login.two-factor', { email })}>&larr; Back to the code screen</Link></p>
        </>
    );
}

Recovery.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
