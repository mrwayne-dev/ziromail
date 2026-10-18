import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Button from '../../Components/ui/Button';
import { MailIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import AuthLayout from '../../Layouts/AuthLayout';
import { route } from '../../Lib/route';

const secondsLeft = (availableAt) => Math.max(0, availableAt - Math.floor(Date.now() / 1000));

export default function VerifyEmail({ email, state, expiresInHours, resendAvailableAt }) {
    const [seconds, setSeconds] = useState(() => secondsLeft(resendAvailableAt));
    const [busy, setBusy] = useState(false);
    const { flash } = usePage().props;
    const { toast } = useToast();
    const expired = state === 'expired';

    useEffect(() => setSeconds(secondsLeft(resendAvailableAt)), [resendAvailableAt]);

    useEffect(() => {
        if (seconds <= 0) return undefined;
        const id = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
        return () => clearTimeout(id);
    }, [seconds]);

    useEffect(() => {
        if (flash?.status === 'sent') toast({ tone: 'ok', title: 'Sent again', message: 'A fresh link is on its way.' });
    }, [flash?.status]);

    function resend() {
        setBusy(true);
        router.post(route('verification.send'), {}, { preserveScroll: true, onFinish: () => setBusy(false) });
    }

    if (!email) {
        return (
            <>
                <Seo title="Check your inbox | Ziroemail" description="Confirm your email address to finish creating your account." path="/verify-email" noindex />
                <h1>Nothing to confirm yet</h1>
                <p className="lead">Create an account first and we will send the link.</p>
                <Button size="lg" full href={route('signup')}>Create an account</Button>
            </>
        );
    }

    return (
        <>
            <Seo title="Check your inbox | Ziroemail" description="Confirm your email address to finish creating your account." path="/verify-email" noindex />
            <span className="env"><MailIcon /></span>
            <div data-hero>
                <h1>{expired ? 'That link has expired' : 'Check your inbox'}</h1>
                <p className="lead">
                    {expired
                        ? `Links work once and last ${expiresInHours} hours. We can send a fresh one to`
                        : 'We sent a confirmation link to'}
                </p>
                <span className="addr">{email}</span>
                {!expired && <p className="lead">Click it and your account is ready. The link works once and expires in {expiresInHours} hours.</p>}
            </div>

            <Note title="Not there after a minute?">
                <p>
                    Check the spam folder. It is the irony of our business that a message from a mail company sometimes lands there. Marking it <b>not spam</b> helps.
                </p>
            </Note>

            <div className="resend">
                <Button variant="line" onClick={resend} disabled={seconds > 0} busy={busy}>Send it again</Button>
                {seconds > 0 && <span className="sm" role="status">You can resend in <b className="num">{seconds}</b>s</span>}
            </div>

            <p className="wrong-address">
                Wrong address? <Link href={route('signup')}>Go back and change it</Link>.
            </p>
        </>
    );
}

VerifyEmail.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
