import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import Button from '../../Components/ui/Button';
import Field, { Input } from '../../Components/ui/Field';
import Seo from '../../Components/seo/Seo';
import useFocusFirstError from '../../Hooks/useFocusFirstError';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

export default function ConfirmPassword() {
    const formRef = useRef(null);
    const form = useForm({ password: '' });
    useFocusFirstError(formRef, form.errors);

    function onSubmit(e) {
        e.preventDefault();
        form.post(route('password.confirm.store'), { onFinish: () => form.reset('password') });
    }

    return (
        <>
            <Seo title="Confirm your password | Ziroemail" description="Confirm your password to continue." path="/confirm-password" noindex />

            <div data-hero>
                <h1>Confirm your password</h1>
                <p className="lead">This is a sensitive step, so we ask for your password again. It stays confirmed for 15 minutes.</p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} noValidate>
                <Field label="Password" error={form.errors.password}>
                    {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />}
                </Field>
                <Button type="submit" size="lg" full busy={form.processing}>Confirm</Button>
            </form>
        </>
    );
}

ConfirmPassword.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
