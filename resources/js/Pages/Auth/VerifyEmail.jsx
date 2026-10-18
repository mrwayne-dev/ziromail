import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Button from '../../Components/ui/Button';
import CodeInput from '../../Components/ui/CodeInput';
import { MailIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

const secondsLeft = (availableAt) => Math.max(0, availableAt - Math.floor(Date.now() / 1000));

export default function VerifyEmail({ email, digits, expiresInMinutes, resendAvailableAt }) {
    const [seconds, setSeconds] = useState(() => secondsLeft(resendAvailableAt));
    const [resending, setResending] = useState(false);
    const { flash } = usePage().props;
    const { toast } = useToast();
    const form = useForm({ code: '' });
    const error = form.errors.code;

    useEffect(() => setSeconds(secondsLeft(resendAvailableAt)), [resendAvailableAt]);

    useEffect(() => {
        if (seconds <= 0) return undefined;
        const id = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
        return () => clearTimeout(id);
    }, [seconds]);

    useEffect(() => {
        if (flash?.status === 'sent') toast({ tone: 'ok', title: 'Sent again', message: 'A new code is on its way. The old one no longer works.' });
    }, [flash?.status]);

    function submit(code) {
        form.transform(() => ({ code }));
        form.post(route('verification.confirm'), { preserveScroll: true, onError: () => form.setData('code', '') });
    }

    function change(value) {
        form.setData('code', value);
        if (value.length === digits && !form.processing) submit(value);
    }

    function resend() {
        setResending(true);
        router.post(route('verification.send'), {}, { preserveScroll: true, onFinish: () => setResending(false) });
    }

    if (!email) {
        return (
            <>
                <Seo title="Confirm your email | Ziroemail" description="Confirm your email address to finish creating your account." path="/verify-email" noindex />
                <h1>Nothing to confirm yet</h1>
                <p className="lead">Create an account first and we will send the code.</p>
                <Button size="lg" full href={route('signup')}>Create an account</Button>
            </>
        );
    }

    return (
        <>
            <Seo title="Confirm your email | Ziroemail" description="Confirm your email address to finish creating your account." path="/verify-email" noindex />
            <span className="env"><MailIcon /></span>
            <div data-hero>
                <h1>Enter your code</h1>
                <p className="lead">We sent a {digits}-digit code to</p>
                <span className="addr">{email}</span>
                <p className="lead">It works once and expires in {expiresInMinutes} minutes.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (form.data.code.length === digits) submit(form.data.code); }} noValidate>
                <div className="field">
                    <span className="label" id="code-label">Confirmation code</span>
                    <CodeInput value={form.data.code} onChange={change} digits={digits} invalid={Boolean(error)} describedBy={error ? 'code-error' : 'code-label'} autoFocus />
                    {error && <p className="err" id="code-error" role="alert">{error}</p>}
                </div>
                <Button type="submit" size="lg" full busy={form.processing} disabled={form.data.code.length !== digits}>Confirm email</Button>
            </form>

            <Note title="Not there after a minute?">
                <p>
                    Check the spam folder. It is the irony of our business that a message from a mail company sometimes lands there. Marking it <b>not spam</b> helps.
                </p>
            </Note>

            <div className="resend">
                <Button variant="line" onClick={resend} disabled={seconds > 0} busy={resending}>Send a new code</Button>
                {seconds > 0 && <span className="sm" role="status">You can resend in <b className="num">{seconds}</b>s</span>}
            </div>

            <p className="wrong-address">
                Wrong address? <Link href={route('signup')}>Go back and change it</Link>.
            </p>
        </>
    );
}

VerifyEmail.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
