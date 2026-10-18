import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { firstError, requestJson } from '../../Lib/http';
import { route } from '../../Lib/route';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import { AlertIcon } from '../ui/Icons';

/*
 * Owners are asked, not forced, to turn on two-factor. Dismissing it snoozes the
 * prompt on the server (the date comes back as `auth.user.snoozedUntil`).
 * `securityRoute` is the page that holds the SecurityPanel.
 */
export default function TwoFactorPrompt({ securityRoute }) {
    const { user } = usePage().props.auth;
    const [hidden, setHidden] = useState(false);
    const [error, setError] = useState(null);

    const snoozed = user.snoozedUntil && new Date(user.snoozedUntil) > new Date();
    if (user.twoFactorEnabled || snoozed || hidden) return null;

    async function snooze() {
        const result = await requestJson('POST', route('two-factor.snooze'));
        if (result.ok) return setHidden(true);
        setError(firstError(result, 'message') ?? 'Could not snooze that. Try again.');
    }

    return (
        <Banner tone="warn" live className="tf-prompt" title="Protect your account with a second step" icon={<AlertIcon />}>
            <p>
                You run the billing and the mailboxes for your business. Two-factor sign-in stops anyone who learns your password.
            </p>
            {error && <p className="field-error">{error}</p>}
            <div className="tf-prompt-acts">
                <Button size="sm" href={securityRoute}>Set it up</Button>
                <Button variant="quiet" size="sm" onClick={snooze}>Remind me later</Button>
            </div>
        </Banner>
    );
}
