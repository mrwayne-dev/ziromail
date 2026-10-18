import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import { CheckIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

export default function ForgotPassword() {
    const formRef = useRef(null);
    const { flash } = usePage().props;
    const form = useForm({ email: '' });
    const sent = flash?.status === 'reset-link-sent';
    useFocusFirstError(formRef, form.errors);

    function onSubmit(e) {
        e.preventDefault();
        form.post(route('password.email'), { preserveScroll: true });
    }

    return (
        <>
            <Seo title="Reset your password | Ziroemail" description="Get a link to set a new password for your mailbox." path="/forgot-password" noindex />

            <div data-hero>
                <h1>Reset your password</h1>
                <p className="lead">Type your address and we will send you a link to set a new one.</p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                <Field label="Email address" error={form.errors.email} hint="Use the address you sign in with, not a personal one.">
                    {(p) => (
                        <Input {...p} name="email" type="email" placeholder="you@yourbusiness.com" autoComplete="username" spellCheck="false" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                    )}
                </Field>

                <Button type="submit" size="lg" full busy={form.processing}>Send the reset link</Button>

                {sent && (
                    <Banner tone="ok" live icon={<CheckIcon size={17} />} title="If that address has a mailbox, the link is on its way">
                        <p>We word it that way deliberately. Confirming which addresses exist would let anyone test them. Check your inbox, and the spam folder.</p>
                    </Banner>
                )}
            </form>

            <Note tone="warn" title="Your domain administrator can also do this">
                <p>
                    If you work for a business on Ziroemail, whoever manages your domain can reset your password from their dashboard in seconds. That is often faster than waiting for email, especially if the problem is that you cannot receive it.
                </p>
            </Note>

            <p className="auth-back"><Link href={route('login')}>&larr; Back to sign in</Link></p>
        </>
    );
}

ForgotPassword.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
