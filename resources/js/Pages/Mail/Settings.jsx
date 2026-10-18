import { Link } from '@inertiajs/react';
import { useState } from 'react';
import SecurityPanel from '../../Components/domain/SecurityPanel';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import CopyField from '../../Components/ui/CopyField';
import Field, { Input } from '../../Components/ui/Field';
import Pill from '../../Components/ui/Pill';
import Switch from '../../Components/ui/Switch';
import { useToast } from '../../Components/ui/Toast';
import MailLayout from '../../Layouts/MailLayout';
import { mailboxFixture, settingsFixture } from '../../fixtures/mail';
import { formatGb, formatRelative, initials } from '../../Lib/format';
import Meter from '../../Components/ui/Meter';
import { route } from '../../Lib/route';

const PREFERENCES = [
    ['askNoSubject', 'Ask before sending without a subject', 'Catches the one you meant to fill in'],
    ['undoSend', 'Undo send', 'Hold each message for ten seconds so you can take it back'],
    ['markReadOnOpen', 'Mark as read when opened', 'Off means you mark them yourself'],
    ['requestReceipts', 'Ask for a read receipt on every message', 'Normally better chosen per message'],
    ['confirmReceipts', 'Confirm when a sender asks for a read receipt', 'Off means we never tell a sender you opened it'],
];

function Section({ title, lead, children }) {
    return (
        <section className="sec-card">
            <h2>{title}</h2>
            {lead && <p>{lead}</p>}
            {children}
        </section>
    );
}

export default function Settings() {
    const { toast } = useToast();
    const { quota, address, domain } = mailboxFixture;
    const [identity, setIdentity] = useState(settingsFixture.identity);
    const [signature, setSignature] = useState(settingsFixture.signature);
    const [autoReply, setAutoReply] = useState(settingsFixture.autoReply);
    const [devices, setDevices] = useState(settingsFixture.devices);
    const [blockImages, setBlockImages] = useState(settingsFixture.security.blockRemoteImages);
    const [prefs, setPrefs] = useState(settingsFixture.preferences);
    const share = Math.round((quota.usedGb / quota.quotaGb) * 100);
    const saved = (title) => () => toast({ tone: 'ok', title, message: 'Preview: nothing is stored yet.' });

    return (
        <MailLayout page="mail-settings" title="Settings" current="settings" searchRoute="mail.search" searchLabel="Search mail">
            <main className="st" id="main">
                <div className="st-in">
                    <h1>Settings</h1>
                    <p className="lead mt-s lead-sm">For <b className="mono lead-addr">{address}</b>. These apply to this mailbox only.</p>

                    <Section title="Your name and address" lead="What people see when your mail arrives.">
                        <div className="preview mt">
                            <span className="pv-av" aria-hidden="true">{initials(identity.displayName || address)}</span>
                            <span className="pv-bd"><b>{identity.displayName || address}</b><span className="pv-addr">{address}</span></span>
                            <span className="pv-tag">How it looks in their inbox</span>
                        </div>
                        <div className="mt">
                            <Field label="Display name" hint="Use the name a customer would recognise. A company name works as well as a person's.">
                                {(props) => <Input {...props} autoComplete="name" value={identity.displayName} onChange={(e) => setIdentity({ ...identity, displayName: e.target.value })} />}
                            </Field>
                            <Field label="Email address" hint={<>Set by whoever administers <span className="mono">{domain}</span>. Extra addresses that deliver here can be added from the business dashboard.</>}>
                                {(props) => <Input {...props} type="email" readOnly value={address} className="input is-fixed" />}
                            </Field>
                            <Field label="Send replies to" optional hint="Only needed if replies should land somewhere else, a shared inbox for instance.">
                                {(props) => <Input {...props} type="email" autoComplete="email" placeholder="Leave empty to use this address" value={identity.replyTo} onChange={(e) => setIdentity({ ...identity, replyTo: e.target.value })} />}
                            </Field>
                        </div>
                        <Switch label="Send from this address by default" description={`You have ${identity.addresses.length} addresses on this mailbox`} checked={identity.defaultFrom} onChange={(defaultFrom) => setIdentity({ ...identity, defaultFrom })} />
                        <Button size="sm" className="mt" onClick={saved('Name and address saved')}>Save</Button>
                    </Section>

                    <Section title="Storage" lead="Your slice of the domain's shared pool.">
                        <div className="slice-nums mt">
                            <div><span className="k">Your quota</span><span className="v">{formatGb(quota.quotaGb)}</span></div>
                            <div><span className="k">Used</span><span className="v">{formatGb(quota.usedGb)}</span></div>
                            <div><span className="k">Free</span><span className="v">{formatGb(quota.quotaGb - quota.usedGb)}</span></div>
                        </div>
                        <Meter className="mt" used={quota.usedGb} total={quota.quotaGb} label={`${formatGb(quota.usedGb)} of ${formatGb(quota.quotaGb)} used`} />
                        {share >= 75 && (
                            <Banner tone="warn" className="mt" title={`You are at ${share}% of your quota`}>
                                <p>We warn again at 95%. Clear some large attachments, or ask whoever manages <span className="mono">{domain}</span> to move more of the pool your way. It takes them a few seconds.</p>
                            </Banner>
                        )}
                    </Section>

                    <Section title="Signature" lead="Added to new messages and replies from this mailbox.">
                        <textarea className="sig-box mt" aria-label="Your signature" rows={4} value={signature.text} onChange={(e) => setSignature({ ...signature, text: e.target.value })} />
                        <Switch label="Include on replies too" description="Some people prefer it only on new messages" checked={signature.onReplies} onChange={(onReplies) => setSignature({ ...signature, onReplies })} />
                        <Button size="sm" className="mt" onClick={saved('Signature saved')}>Save signature</Button>
                    </Section>

                    <Section title="Out of office" lead="An automatic reply, sent once per sender per day.">
                        <Switch label={autoReply.on ? 'Auto-reply is on' : 'Auto-reply is off'} description="Turn it on and set the dates below" checked={autoReply.on} onChange={(on) => setAutoReply({ ...autoReply, on })} />
                        <div className="grid g2 mt">
                            <Field label="From">{(props) => <Input {...props} type="date" disabled={!autoReply.on} value={autoReply.from} onChange={(e) => setAutoReply({ ...autoReply, from: e.target.value })} />}</Field>
                            <Field label="Until">{(props) => <Input {...props} type="date" disabled={!autoReply.on} value={autoReply.until} onChange={(e) => setAutoReply({ ...autoReply, until: e.target.value })} />}</Field>
                        </div>
                    </Section>

                    <Section title="Your devices" lead="Mail apps this mailbox is connected to. Apps show when they last synced.">
                        {devices.map((device) => (
                            <div className="row" key={device.id}>
                                <span className="nm"><b>{device.label}</b><span>{device.place} &middot; last synced {formatRelative(device.lastActiveAt).toLowerCase()}</span></span>
                                {device.revocable
                                    ? <Button variant="line" size="sm" aria-label={`Sign out ${device.label}`} onClick={() => setDevices(devices.filter((d) => d.id !== device.id))}>Sign out</Button>
                                    : <Pill tone="ok">Active</Pill>}
                            </div>
                        ))}
                        <Button variant="line" full className="mt" href={route('setup.device')}>Set up another device</Button>
                    </Section>

                    <section className="sec-card" aria-label="Security">
                        <SecurityPanel />
                        <Switch label="Block remote images" description="Stops senders knowing when you opened a message" checked={blockImages} onChange={setBlockImages} />
                    </section>

                    <Section title="Manual settings" lead="Only needed if an app cannot configure itself.">
                        <div className="stack mt">
                            <CopyField label="Incoming (IMAP)" value={settingsFixture.manual.imap} />
                            <CopyField label="Outgoing (SMTP)" value={settingsFixture.manual.smtp} />
                            <CopyField label="Contacts (CardDAV)" value={settingsFixture.manual.carddav} />
                        </div>
                        <p className="hint">Your username is always your full email address.</p>
                    </Section>

                    <Section title="Reading and writing" lead="Small preferences that change how the mailbox feels day to day.">
                        {PREFERENCES.map(([key, label, description]) => <Switch key={key} label={label} description={description} checked={prefs[key]} onChange={(value) => setPrefs({ ...prefs, [key]: value })} />)}
                    </Section>

                    <p className="sm mut st-end">Looking for your contacts? <Link href={route('mail.contacts')}>Open contacts</Link>.</p>
                </div>
            </main>
        </MailLayout>
    );
}
