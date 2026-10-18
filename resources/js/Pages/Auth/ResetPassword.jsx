import { Link, useForm } from '@inertiajs/react';
import { useRef } from 'react';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import { AlertIcon } from '../../Components/ui/Icons';
import StrengthMeter from '../../Components/ui/StrengthMeter';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

export default function ResetPassword({ token, email }) {
    const formRef = useRef(null);
    const form = useForm({ token, email, password: '', password_confirmation: '' });
    const { errors } = form;
    useFocusFirstError(formRef, errors);

    function onSubmit(e) {
        e.preventDefault();
        form.post(route('password.store'), { onFinish: () => form.reset('password', 'password_confirmation') });
    }

    return (
        <>
            <Seo title="Choose a new password | Ziroemail" description="Set a new password for your Ziroemail account." path="/reset-password" noindex />

            <div data-hero>
                <h1>Choose a new password</h1>
                <p className="lead">Pick something long that you do not use anywhere else. Every device is signed out when you save it.</p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                {errors.email && (
                    <Banner tone="bad" live icon={<AlertIcon />} title={errors.email}>
                        <p><Link href={route('password.request')}>Ask for a new link</Link></p>
                    </Banner>
                )}

                <Field label="New password" error={errors.password}>
                    {(p) => (
                        <>
                            <Input {...p} name="password" type="password" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                            <StrengthMeter password={form.data.password} />
                        </>
                    )}
                </Field>

                <Field label="Type it again">
                    {(p) => <Input {...p} name="password_confirmation" type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} />}
                </Field>

                <Button type="submit" size="lg" full busy={form.processing}>Save the new password</Button>
            </form>

            <p className="auth-back"><Link href={route('login')}>&larr; Back to sign in</Link></p>
        </>
    );
}

ResetPassword.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
