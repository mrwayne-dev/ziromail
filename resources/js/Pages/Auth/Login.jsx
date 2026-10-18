import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import { AlertIcon, CheckIcon } from '../../Components/ui/Icons';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

// Server messages that describe the attempt rather than a field.
const isAttemptMessage = (text) => typeof text === 'string' && (text.startsWith('That email') || text.startsWith('Too many'));

export default function Login({ guard = 'web', action, title = 'Sign in', lead = 'Use the address and password for your mailbox.' }) {
    const staff = guard === 'staff';
    const formRef = useRef(null);
    const { flash } = usePage().props;
    const form = useForm({ email: '', password: '', remember: true });
    const { errors } = form;
    const attempt = isAttemptMessage(errors.email) ? errors.email : null;
    const fieldErrors = attempt ? { ...errors, email: undefined } : errors;
    useFocusFirstError(formRef, errors);

    const set = (key) => (e) => form.setData(key, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

    function onSubmit(e) {
        e.preventDefault();
        form.post(action ?? route('login.store'), { onFinish: () => form.reset('password') });
    }

    return (
        <>
            <Seo title="Sign in | Ziroemail" description="Sign in to your Ziroemail mailbox or dashboard." path="/login" noindex />

            <div data-hero>
                <h1>{title}</h1>
                <p className="lead">{lead}</p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                {flash?.status && (
                    <Banner tone="ok" live icon={<CheckIcon size={17} />} title={flash.status} />
                )}
                {attempt && (
                    <Banner tone="bad" live icon={<AlertIcon />} title={attempt}>
                        <p>Check for a typo, or <Link href={route('password.request')}>reset your password</Link>.</p>
                    </Banner>
                )}

                <Field label="Email address" error={fieldErrors.email}>
                    {(p) => <Input {...p} name="email" type="email" placeholder="you@yourbusiness.com" autoComplete="username" spellCheck="false" value={form.data.email} onChange={set('email')} />}
                </Field>

                <Field label="Password" error={fieldErrors.password}>
                    {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" value={form.data.password} onChange={set('password')} />}
                </Field>
                {!staff && <p className="forgot"><Link href={route('password.request')}>Forgot your password?</Link></p>}

                {!staff && (
                    <div className="field">
                        <label className="check">
                            <input type="checkbox" name="remember" checked={form.data.remember} onChange={set('remember')} />
                            <span>Keep me signed in on this device</span>
                        </label>
                    </div>
                )}

                <Button type="submit" size="lg" full busy={form.processing}>Sign in</Button>
            </form>

            {!staff && (
                <>
                    <div className="or">or</div>

                    <Button variant="line" full href={route('setup.device')}>I only need to set up my phone</Button>

                    <p className="auth-foot">New to Ziroemail? <Link href={route('signup')}>Create an account</Link></p>
                </>
            )}
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
