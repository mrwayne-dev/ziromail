import { router } from '@inertiajs/react';
import { useState } from 'react';
import { firstError, requestJson } from '../../Lib/http';
import Button from '../ui/Button';
import CodeInput from '../ui/CodeInput';
import CopyField from '../ui/CopyField';
import QrCode from './QrCode';
import RecoveryCodesList from './RecoveryCodesList';

/*
 * The enrolment steps: start (the secret and QR appear once), confirm with a code,
 * then the recovery codes appear once. `endpoints` names the start and confirm
 * URLs so the same flow serves users and staff. `ensureConfirmed` runs the
 * password re-confirmation before the secret is requested.
 */
export default function TwoFactorSetupFlow({ endpoints, ensureConfirmed, onDone, doneLabel = 'Done' }) {
    const [step, setStep] = useState('intro');
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState('');
    const [codes, setCodes] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);

    function begin() {
        ensureConfirmed(async () => {
            setBusy(true);
            const result = await requestJson('POST', endpoints.start);
            setBusy(false);
            if (!result.ok) {
                setError(firstError(result, 'code') ?? 'We could not start setup. Try again.');
                return;
            }
            setError('');
            setSetup(result.data);
            setStep('scan');
        });
    }

    async function confirm(e) {
        e.preventDefault();
        if (code.length < 6) {
            setError('Enter all 6 digits from your authenticator app.');
            return;
        }
        setBusy(true);
        const result = await requestJson('POST', endpoints.confirm, { code });
        setBusy(false);
        if (!result.ok) {
            setError(firstError(result, 'code') ?? 'That code did not match.');
            setCode('');
            return;
        }
        setError('');
        setSetup(null);
        setCodes(result.data.recoveryCodes);
        setStep('codes');
    }

    function finish() {
        router.reload({ only: ['auth'] });
        onDone?.();
    }

    if (step === 'intro') {
        return (
            <>
                <p className="lead">Two-factor adds a six-digit code from an authenticator app to every sign in, so a stolen password is not enough.</p>
                {error && <p className="err" role="alert">{error}</p>}
                <Button size="lg" full className="tf-start" onClick={begin} busy={busy}>Set up two-factor</Button>
            </>
        );
    }

    if (step === 'scan') {
        return (
            <form onSubmit={confirm} noValidate>
                <ol className="steps-list">
                    <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password or similar).</li>
                    <li>Scan this code, or type the key by hand.</li>
                    <li>Enter the six digits the app shows.</li>
                </ol>
                <div className="tf-scan">
                    <QrCode url={setup.otpauthUrl} label="QR code to add Ziroemail to your authenticator app" size={168} />
                    <CopyField kind="block" label="Setup key" value={setup.secret} hint="This key is shown once. It expires in 10 minutes." />
                </div>
                <fieldset className="tf-code">
                    <legend className="label">Six-digit code</legend>
                    <CodeInput value={code} onChange={(v) => { setCode(v); setError(''); }} digits={6} invalid={Boolean(error)} describedBy="tf-code-msg" autoFocus />
                    {error ? <p className="err" id="tf-code-msg" role="alert">{error}</p> : <p className="hint" id="tf-code-msg">The code changes every 30 seconds.</p>}
                </fieldset>
                <Button type="submit" size="lg" full busy={busy}>Turn on two-factor</Button>
            </form>
        );
    }

    return (
        <>
            <p className="lead">Two-factor is on. Save these recovery codes now: they are how you get in if you lose your phone.</p>
            <RecoveryCodesList codes={codes} />
            <label className="check tf-saved">
                <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
                <span>I have saved these codes somewhere safe.</span>
            </label>
            <Button size="lg" full onClick={finish} disabled={!saved}>{doneLabel}</Button>
        </>
    );
}
