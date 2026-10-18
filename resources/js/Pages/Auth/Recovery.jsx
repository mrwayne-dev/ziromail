import { Link, useForm } from '@inertiajs/react';
import { useRef } from 'react';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import Note from '../../Components/ui/Note';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

export default function Recovery({ email, total, unused, action, backUrl }) {
    const formRef = useRef(null);
    const form = useForm({ code: '' });
    useFocusFirstError(formRef, form.errors);

    function onSubmit(e) {
        e.preventDefault();
        form.post(action ?? route('login.recovery.store'), { onFinish: () => form.reset('code') });
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
                <Field label="Recovery code" error={form.errors.code} hint="Each code works once. Dashes optional.">
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
                            value={form.data.code}
                            onChange={(e) => { form.setData('code', e.target.value); form.clearErrors('code'); }}
                        />
                    )}
                </Field>

                <p className="used">
                    <span className="pips" aria-hidden="true">
                        {Array.from({ length: total }, (_, i) => <i key={i} className={i < total - unused ? 'spent' : undefined} />)}
                    </span>
                    {unused} of {total} codes still unused
                </p>

                <Button type="submit" size="lg" full busy={form.processing}>Sign in</Button>
            </form>

            <Note tone="warn" title="Out of codes, or never saved them?">
                <p>
                    Ask whoever administers your domain to reset two-factor on your mailbox. If you are the owner and locked out of your own account,{' '}
                    <Link href={route('contact')}>contact us</Link>. We will verify who you are before changing anything, which takes a little time but is the point.
                </p>
            </Note>

            <p className="auth-back"><Link href={backUrl ?? route('login.two-factor')}>&larr; Back to the code screen</Link></p>
        </>
    );
}

Recovery.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
