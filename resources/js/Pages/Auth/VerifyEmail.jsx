import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Button from '../../Components/ui/Button';
import { CheckIcon, MailIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import useQuery from '../../Hooks/useQuery';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { route } from '../../Lib/route';

function WaitingForClick({ email }) {
    const { expiresInHours, resendAfterSeconds } = accountFixture.verifyEmail;
    const [seconds, setSeconds] = useState(resendAfterSeconds);
    const { toast } = useToast();

    useEffect(() => {
        if (seconds <= 0) return undefined;
        const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(id);
    }, [seconds]);

    function resend() {
        setSeconds(resendAfterSeconds);
        toast({ tone: 'ok', title: 'Sent again', message: `A fresh link is on its way to ${email}.` });
    }

    return (
        <>
            <span className="env"><MailIcon /></span>
            <div data-hero>
                <h1>Check your inbox</h1>
                <p className="lead">We sent a confirmation link to</p>
                <span className="addr">{email}</span>
                <p className="lead">Click it and your account is ready. The link works once and expires in {expiresInHours} hours.</p>
            </div>

            <Note title="Not there after a minute?">
                <p>
                    Check the spam folder. It is the irony of our business that a message from a mail company sometimes lands there. Marking it <b>not spam</b> helps.
                </p>
            </Note>

            <div className="resend">
                <Button variant="line" onClick={resend} disabled={seconds > 0}>Send it again</Button>
                {seconds > 0 && <span className="sm" role="status">You can resend in <b className="num">{seconds}</b>s</span>}
            </div>

            <p className="wrong-address">
                Wrong address? <Link href={route('signup')}>Go back and change it</Link>.
            </p>
        </>
    );
}

function Confirmed({ plan }) {
    return (
        <>
            <span className="env env-ok"><CheckIcon size={30} /></span>
            <div data-hero>
                <h1>Your email is confirmed</h1>
                <p className="lead">Your account is ready. Next you connect your domain, which is the step that makes the mailboxes real.</p>
            </div>
            <Button size="lg" full href={route('onboarding.domain', { plan })}>Continue to domain setup</Button>
        </>
    );
}

function Expired({ email, plan }) {
    return (
        <>
            <span className="env env-bad"><MailIcon /></span>
            <div data-hero>
                <h1>That link has expired</h1>
                <p className="lead">Confirmation links work once and last {accountFixture.verifyEmail.expiresInHours} hours. We can send a fresh one to <b className="strong">{email}</b>.</p>
            </div>
            <Button size="lg" full href={route('verification.notice', { email, plan })}>Send a new link</Button>
        </>
    );
}

export default function VerifyEmail() {
    const query = useQuery();
    const email = query.get('email') ?? accountFixture.user.email;
    const state = accountFixture.verifyEmail.tokens[query.get('token')] ?? 'waiting';

    return (
        <>
            <Seo title="Check your inbox | Ziroemail" description="Confirm your email address to finish creating your account." path="/verify-email" noindex />
            {state === 'confirmed' && <Confirmed plan={query.get('plan')} />}
            {state === 'expired' && <Expired email={email} plan={query.get('plan')} />}
            {state === 'waiting' && <WaitingForClick email={email} />}
        </>
    );
}

VerifyEmail.layout = (page) => <AuthLayout variant="centered">{page}</AuthLayout>;
