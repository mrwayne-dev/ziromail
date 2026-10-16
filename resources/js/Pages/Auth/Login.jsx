import { Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import { AlertIcon } from '../../Components/ui/Icons';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { route } from '../../Lib/route';
import { simulateLatency } from '../../Lib/simulate';

export default function Login() {
    const formRef = useRef(null);
    const [values, setValues] = useState({ email: '', password: '', remember: true });
    const [errors, setErrors] = useState({});
    const [rejected, setRejected] = useState(false);
    const [busy, setBusy] = useState(false);
    useFocusFirstError(formRef, errors);

    const set = (key) => (e) => {
        setValues((v) => ({ ...v, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
        setRejected(false);
    };

    async function onSubmit(e) {
        e.preventDefault();
        const next = {};
        if (!values.email.trim()) next.email = 'Enter the address for your mailbox.';
        if (!values.password) next.password = 'Enter your password.';
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setBusy(true);
        await simulateLatency();
        if (values.password === accountFixture.login.rejectedPassword) {
            setBusy(false);
            setRejected(true);
            return;
        }
        router.visit(route('login.two-factor', { email: values.email.trim().toLowerCase() }));
    }

    return (
        <>
            <Seo title="Sign in | Ziroemail" description="Sign in to your Ziroemail mailbox or dashboard." path="/login" noindex />

            <div data-hero>
                <h1>Sign in</h1>
                <p className="lead">Use the address and password for your mailbox.</p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                {rejected && (
                    <Banner tone="bad" live icon={<AlertIcon />} title="That email and password do not match">
                        <p>Check for a typo, or <Link href={route('password.request')}>reset your password</Link>.</p>
                    </Banner>
                )}

                <Field label="Email address" error={errors.email}>
                    {(p) => <Input {...p} name="email" type="email" placeholder="you@yourbusiness.com" autoComplete="username" spellCheck="false" value={values.email} onChange={set('email')} />}
                </Field>

                <Field label="Password" error={errors.password}>
                    {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" value={values.password} onChange={set('password')} />}
                </Field>
                <p className="forgot"><Link href={route('password.request')}>Forgot your password?</Link></p>

                <div className="field">
                    <label className="check">
                        <input type="checkbox" name="remember" checked={values.remember} onChange={set('remember')} />
                        <span>Keep me signed in on this device</span>
                    </label>
                </div>

                <Button type="submit" size="lg" full busy={busy}>Sign in</Button>
            </form>

            <div className="or">or</div>

            <Button variant="line" full href={route('setup.device')}>I only need to set up my phone</Button>

            <p className="auth-foot">New to Ziroemail? <Link href={route('signup')}>Create an account</Link></p>
        </>
    );
}

Login.layout = (page) => (
    <AuthLayout
        variant="split"
        aside={(
            <>
                <span className="eyebrow">Ziroemail</span>
                <blockquote>Mail that arrives.</blockquote>
                <cite>Business email, built in Port Harcourt</cite>
            </>
        )}
    >
        {page}
    </AuthLayout>
);
