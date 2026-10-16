import { Link } from '@inertiajs/react';
import { useState } from 'react';
import QrCode from '../../Components/domain/QrCode';
import Button, { ArrowIcon } from '../../Components/ui/Button';
import CopyField from '../../Components/ui/CopyField';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import Seo from '../../Components/seo/Seo';
import AuthLayout from '../../Layouts/AuthLayout';
import { accountFixture } from '../../fixtures/account';
import { route } from '../../Lib/route';

const AppleIcon = () => (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="currentColor" aria-hidden="true">
        <path d="M18.2 13.6c0-3 2.4-4.4 2.5-4.5-1.4-2-3.5-2.3-4.2-2.3-1.8-.2-3.5 1-4.4 1-.9 0-2.3-1-3.8-1-2 0-3.8 1.1-4.8 2.9-2 3.5-.5 8.8 1.5 11.7 1 1.4 2.1 3 3.6 2.9 1.4-.1 2-.9 3.7-.9s2.2.9 3.7.9c1.5 0 2.5-1.4 3.4-2.9.7-1 1.2-2.2 1.5-3.2-3.3-1.3-2.7-5.5-2.7-5.6zM15.4 4.6c.8-1 1.3-2.3 1.2-3.6-1.2 0-2.6.8-3.4 1.7-.7.9-1.4 2.2-1.2 3.5 1.3.1 2.6-.7 3.4-1.6z" />
    </svg>
);

const AndroidIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 9v8a1.5 1.5 0 0 0 1.5 1.5H8V22a1.5 1.5 0 0 0 3 0v-3.5h2V22a1.5 1.5 0 0 0 3 0v-3.5h.5A1.5 1.5 0 0 0 18 17V9zM3.5 9A1.5 1.5 0 0 0 2 10.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 9zm17 0a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 20.5 9zM15.6 3.2l1-1.7a.4.4 0 1 0-.7-.4l-1 1.8a6.9 6.9 0 0 0-5.8 0l-1-1.8a.4.4 0 1 0-.7.4l1 1.7A5.9 5.9 0 0 0 6 8h12a5.9 5.9 0 0 0-2.4-4.8zM9.5 6.2a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4zm5 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z" />
    </svg>
);

const ComputerIcon = () => (
    <svg width="24" height="22" viewBox="0 0 24 22" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="21" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 19.5h8M12 15.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const devices = [
    { key: 'ios', title: 'iPhone or iPad', note: 'One tap, nothing to type', icon: <AppleIcon /> },
    { key: 'android', title: 'Android phone', note: 'Guided steps for Gmail and other apps', icon: <AndroidIcon /> },
    { key: 'desktop', title: 'Computer', note: 'Outlook, Apple Mail or Thunderbird', icon: <ComputerIcon /> },
];

// Mark the likeliest device up front; the others stay one tap away.
function guessDevice() {
    const agent = navigator.userAgent;
    if (/android/i.test(agent)) return 'android';
    if (/iphone|ipad|ipod/i.test(agent)) return 'ios';
    return 'ios';
}

export default function Device() {
    const { email, servers, qrUrl } = accountFixture.setup;
    const [device, setDevice] = useState(guessDevice);
    const { toast } = useToast();

    function installProfile() {
        toast({ tone: 'warn', title: 'Setup profiles are not live yet', message: 'This button downloads your personal profile once signed setup links exist.' });
    }

    return (
        <>
            <Seo title="Set up your phone | Ziroemail" description="Get your Ziroemail mailbox onto your phone in about thirty seconds." path="/setup" noindex />

            <div className="who-card" data-hero>
                <span className="k">Setting up</span>
                <b>{email}</b>
            </div>

            <h1>Let&rsquo;s get your email on your phone</h1>
            <p className="lead">Choose what you are using. It takes about thirty seconds and you will not need to type any settings.</p>

            <nav className="devs" aria-label="Choose your device">
                {devices.map((d) => (
                    <a key={d.key} className={`dev${device === d.key ? ' is-primary' : ''}`} href={`#${d.key}`} onClick={() => setDevice(d.key)}>
                        <span className="dev-ic">{d.icon}</span>
                        <span><b>{d.title}</b><span>{d.note}</span></span>
                        <span className="go"><ArrowIcon size={15} /></span>
                    </a>
                ))}
            </nav>

            <section className="block" id="ios" aria-labelledby="ios-h">
                <h2 id="ios-h">On your iPhone</h2>
                <p className="sm">Tap the button below on the phone itself. If you are reading this on a computer, scan the code instead.</p>
                <Button size="lg" full onClick={installProfile}>Install the setup profile</Button>
                <ol className="steps-list">
                    <li>Tap the button. Your phone asks if you want to allow a download. Tap <b>Allow</b>.</li>
                    <li>Open <b>Settings</b>. Near the top you will see <b>Profile Downloaded</b>. Tap it.</li>
                    <li>Tap <b>Install</b> in the top right, and enter your phone passcode.</li>
                    <li>Enter your email password when asked. Open the Mail app and your mail is there.</li>
                </ol>
                <Note title="Do not have your password?">
                    <p>Ask whoever set up your account. They can reset it for you in seconds from their dashboard, without contacting support.</p>
                </Note>
            </section>

            <section className="block" id="android" aria-labelledby="android-h">
                <h2 id="android-h">On your Android phone</h2>
                <p className="sm">These settings are already filled in for you. Tap any Copy button to copy that value.</p>
                <ol className="steps-list">
                    <li>Open the <b>Gmail</b> app, tap your picture in the corner, then <b>Add another account</b>.</li>
                    <li>Choose <b>Other</b>, not Google.</li>
                    <li>Enter the address and password below, then tap <b>Next</b>.</li>
                    <li>If it asks for server settings, use the values underneath.</li>
                </ol>
                <div className="values">
                    <CopyField kind="block" label="Your email address" value={email} />
                    <CopyField kind="block" label="Incoming server (IMAP)" value={servers.imap.host} hint={`Port ${servers.imap.port}, security ${servers.imap.security}`} />
                    <CopyField kind="block" label="Outgoing server (SMTP)" value={servers.smtp.host} hint={`Port ${servers.smtp.port}, security ${servers.smtp.security}`} />
                </div>
            </section>

            <section className="block" id="desktop" aria-labelledby="desktop-h">
                <h2 id="desktop-h">On your computer</h2>
                <p className="sm">Outlook and Apple Mail usually configure themselves. Type your address and password and they will find the rest.</p>
                <Note title="If it asks for settings">
                    <p>
                        Incoming <span className="mono">{servers.imap.host}</span> port {servers.imap.port} ({servers.imap.security}).<br />
                        Outgoing <span className="mono">{servers.smtp.host}</span> port {servers.smtp.port} ({servers.smtp.security}).<br />
                        Your username is your full email address.
                    </p>
                </Note>
            </section>

            <section className="qr-box" aria-labelledby="qr-h">
                <h2 id="qr-h">Setting up from a computer?</h2>
                <p className="sm">Scan this with the phone you want to set up.</p>
                <QrCode url={qrUrl} label={`QR code that opens this setup page for ${email}`} />
            </section>

            <Note className="help-note" title="Something not working?">
                <p>
                    Message us on WhatsApp if a device will not connect. This is the one thing we really do not want you struggling with.{' '}
                    <Link href={route('contact')}>Get help</Link>
                </p>
            </Note>
        </>
    );
}

Device.layout = (page) => <AuthLayout variant="device">{page}</AuthLayout>;
