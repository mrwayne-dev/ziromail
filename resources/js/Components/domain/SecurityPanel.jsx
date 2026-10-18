import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import useConfirmPassword from '../../Hooks/useConfirmPassword';
import { webEndpoints } from '../../Lib/identityEndpoints';
import { firstError, requestJson } from '../../Lib/http';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import Field, { Input } from '../ui/Field';
import Modal from '../ui/Modal';
import Pill from '../ui/Pill';
import StrengthMeter from '../ui/StrengthMeter';
import { useToast } from '../ui/Toast';
import DeviceList from './DeviceList';
import RecoveryCodesList from './RecoveryCodesList';
import TwoFactorSetupDialog from './TwoFactorSetupDialog';

/*
 * The signed-in person's own security: two-factor, password, and where they are
 * signed in. Everything here is real: it calls the identity endpoints. Sensitive
 * steps ask for the password again first (useConfirmPassword), and the server
 * enforces the same rule. `account` is the signed-in person (`staff` on the console);
 * it defaults to the customer's `auth.user`.
 */
export default function SecurityPanel({ endpoints: custom, mandatoryTwoFactor = false, account }) {
    const endpoints = custom ?? webEndpoints();
    const { auth } = usePage().props;
    const user = account ?? auth.user;
    const { toast } = useToast();
    const { confirm, dialog } = useConfirmPassword(endpoints.confirmPassword);

    const [sessions, setSessions] = useState(null);
    const [busyHandle, setBusyHandle] = useState(null);
    const [setupOpen, setSetupOpen] = useState(false);
    const [codes, setCodes] = useState(null);
    const [disableOpen, setDisableOpen] = useState(false);
    const [disableCode, setDisableCode] = useState('');
    const [disableError, setDisableError] = useState('');
    const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const loadSessions = useCallback(async () => {
        const result = await requestJson('GET', endpoints.sessions);
        if (result.ok) setSessions(result.data.sessions);
    }, [endpoints.sessions]);

    useEffect(() => { loadSessions(); }, [loadSessions]);

    function revoke(session) {
        confirm(async () => {
            setBusyHandle(session.handle);
            const result = await requestJson('DELETE', endpoints.revokeSession(session.handle));
            setBusyHandle(null);
            if (!result.ok) return toast({ tone: 'warn', title: 'Could not sign that device out', message: firstError(result, 'message') ?? 'Try again.' });
            toast({ tone: 'ok', title: 'Device signed out' });
            loadSessions();
        });
    }

    function revokeOthers() {
        confirm(async () => {
            const result = await requestJson('POST', endpoints.revokeOthers);
            if (!result.ok) return toast({ tone: 'warn', title: 'Could not sign out other devices' });
            toast({ tone: 'ok', title: 'Signed out everywhere else', message: `${result.data.ended} other ${result.data.ended === 1 ? 'session' : 'sessions'} ended.` });
            loadSessions();
        });
    }

    function regenerate() {
        confirm(async () => {
            const result = await requestJson('POST', endpoints.recoveryCodes);
            if (!result.ok) return toast({ tone: 'warn', title: 'Could not make new codes', message: firstError(result, 'message') ?? 'Try again.' });
            setCodes(result.data.recoveryCodes);
            router.reload({ only: ['auth'] });
        });
    }

    async function disable(e) {
        e.preventDefault();
        const result = await requestJson('DELETE', endpoints.twoFactorDisable, { code: disableCode });
        if (!result.ok) return setDisableError(firstError(result, 'code') ?? 'That code did not work.');
        setDisableOpen(false);
        setDisableCode('');
        setDisableError('');
        router.reload({ only: ['auth'] });
        toast({ tone: 'ok', title: 'Two-factor is off', message: 'Your other devices were signed out.' });
        loadSessions();
    }

    function changePassword(e) {
        e.preventDefault();
        confirm(() => {
            setSaving(true);
            router.post(endpoints.password, form, {
                preserveScroll: true,
                preserveState: true,
                onError: setErrors,
                onSuccess: () => {
                    setErrors({});
                    setForm({ current_password: '', password: '', password_confirmation: '' });
                    toast({ tone: 'ok', title: 'Password changed', message: 'Your other devices were signed out.' });
                    loadSessions();
                },
                onFinish: () => setSaving(false),
            });
        });
    }

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    return (
        <section className="security-panel" aria-labelledby="security-h">
            <h2 id="security-h">Your sign-in and security</h2>

            <div className="sec-block">
                <div className="sec-head">
                    <h3>Two-factor sign in</h3>
                    {user.twoFactorEnabled ? <Pill tone="ok">On</Pill> : <Pill tone="muted">Off</Pill>}
                </div>
                {user.twoFactorEnabled ? (
                    <>
                        <p className="sm">{user.recoveryCodesUnused} of 10 recovery codes unused. Each works once.</p>
                        <div className="btn-row sec-actions">
                            <Button variant="line" size="sm" onClick={regenerate}>Make new recovery codes</Button>
                            {!mandatoryTwoFactor && <Button variant="line" size="sm" onClick={() => confirm(() => setDisableOpen(true))}>Turn off</Button>}
                        </div>
                    </>
                ) : (
                    <>
                        <p className="sm">Add an authenticator app so a stolen password is not enough to sign in.</p>
                        <Button size="sm" onClick={() => setSetupOpen(true)}>Turn on two-factor</Button>
                    </>
                )}
            </div>

            <form className="sec-block" onSubmit={changePassword} noValidate>
                <h3>Change your password</h3>
                <Field label="Current password" error={errors.current_password}>
                    {(p) => <Input {...p} type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} />}
                </Field>
                <Field label="New password" error={errors.password}>
                    {(p) => (
                        <>
                            <Input {...p} type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
                            <StrengthMeter password={form.password} />
                        </>
                    )}
                </Field>
                <Field label="Type the new password again">
                    {(p) => <Input {...p} type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} />}
                </Field>
                <Button type="submit" size="sm" busy={saving}>Change password</Button>
            </form>

            <div className="sec-block">
                <div className="sec-head">
                    <h3>Where you are signed in</h3>
                    <Button variant="line" size="sm" onClick={revokeOthers}>Sign out everywhere else</Button>
                </div>
                {sessions === null ? <p className="sm" role="status">Loading your sessions.</p> : <DeviceList sessions={sessions} onRevoke={revoke} busyHandle={busyHandle} />}
            </div>

            <TwoFactorSetupDialog open={setupOpen} onClose={() => setSetupOpen(false)} endpoints={{ start: endpoints.twoFactorStart, confirm: endpoints.twoFactorConfirm, confirmPassword: endpoints.confirmPassword }} />
            {dialog}

            <Modal open={codes !== null} onClose={() => setCodes(null)} title="Your new recovery codes" dismissOnBackdrop={false} footer={<Button onClick={() => setCodes(null)}>I have saved them</Button>}>
                {codes && (
                    <>
                        <Banner tone="warn" title="Shown once">
                            <p>The old codes no longer work. These cannot be shown again.</p>
                        </Banner>
                        <RecoveryCodesList codes={codes} />
                    </>
                )}
            </Modal>

            <Modal
                open={disableOpen}
                onClose={() => setDisableOpen(false)}
                title="Turn off two-factor"
                size="sm"
                footer={<><Button variant="line" onClick={() => setDisableOpen(false)}>Cancel</Button><Button type="submit" form="disable-2fa" variant="danger">Turn off</Button></>}
            >
                <form id="disable-2fa" onSubmit={disable} noValidate>
                    <p className="sm">Enter a code from your app, or a recovery code. Your other devices will be signed out.</p>
                    <Field label="Code" error={disableError}>
                        {(p) => <Input {...p} type="text" autoComplete="one-time-code" value={disableCode} onChange={(e) => { setDisableCode(e.target.value); setDisableError(''); }} />}
                    </Field>
                </form>
            </Modal>
        </section>
    );
}
