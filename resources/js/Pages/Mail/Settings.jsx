import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SecurityPanel from '../../Components/domain/SecurityPanel';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import CopyField from '../../Components/ui/CopyField';
import Field, { Input } from '../../Components/ui/Field';
import SectionHeader from '../../Components/ui/SectionHeader';
import Switch from '../../Components/ui/Switch';
import { useToast } from '../../Components/ui/Toast';
import MailLayout from '../../Layouts/MailLayout';
import { formatGb, initials } from '../../Lib/format';
import Meter from '../../Components/ui/Meter';
import { route } from '../../Lib/route';

/*
 * Mailbox settings. The parts backed by real tables now read AND write live data:
 * - display_name, reply_to, signature_text, signature_on_replies, block_remote_images,
 *   auto_reply: PATCH mail.settings.update, writing to the mailboxes row + settings JSON.
 * - storage figures (quota and used): read-only, come from the mailboxes table.
 * - aliases: read-only here; a count feeds the "N addresses" switch description.
 *
 * The parts that still need a mail server (mail-app device list, IMAP/SMTP values,
 * per-mailbox read/write preferences) render as honest empty / disabled states and
 * will wire through once the mail-server decision lands.
 */

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

/* Patches the mail settings endpoint with only the keys the caller cares about,
 * toasts on success. The controller uses "sometimes" validation so a partial
 * payload leaves the untouched keys alone. */
function patchSettings(payload, { onSuccess, onError } = {}) {
    router.patch(route('mail.settings.update'), payload, {
        preserveScroll: true,
        preserveState: true,
        onSuccess,
        onError,
    });
}

export default function Settings() {
    const { toast } = useToast();
    const { mailbox, domain, aliases, errors } = usePage().props;

    const nameForm = useForm({ display_name: mailbox.displayName ?? '', reply_to: mailbox.settings.replyTo ?? '' });
    const sigForm = useForm({ signature_text: mailbox.settings.signature ?? '', signature_on_replies: mailbox.settings.signatureOnReplies });
    const autoReplyForm = useForm({ auto_reply: mailbox.settings.autoReply });

    const [defaultFrom, setDefaultFrom] = useState(false);
    const [blockImages, setBlockImages] = useState(mailbox.settings.blockRemoteImages);
    const share = Math.round((mailbox.usedGb / mailbox.quotaGb) * 100);

    const saveName = () => nameForm.patch(route('mail.settings.update'), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast({ tone: 'ok', title: 'Name and address saved' }),
    });

    const saveSignature = () => sigForm.patch(route('mail.settings.update'), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast({ tone: 'ok', title: 'Signature saved' }),
    });

    const saveAutoReply = (next) => {
        autoReplyForm.setData('auto_reply', next);
        patchSettings({ auto_reply: next }, { onSuccess: () => toast({ tone: 'ok', title: 'Out of office updated' }) });
    };

    const saveBlockImages = (next) => {
        setBlockImages(next);
        patchSettings({ block_remote_images: next }, { onSuccess: () => toast({ tone: 'ok', title: 'Remote images setting saved' }) });
    };

    return (
        <MailLayout page="mail-settings" title="Settings" current="settings" searchRoute="mail.search" searchLabel="Search mail">
            <main className="st" id="main">
                <div className="st-in">
                    <SectionHeader
                        title="Settings"
                        description={<>For <b className="mono lead-addr">{mailbox.address}</b>. These apply to this mailbox only.</>}
                    />

                    <Section title="Your name and address" lead="What people see when your mail arrives.">
                        <div className="preview mt">
                            <span className="pv-av" aria-hidden="true">{initials(nameForm.data.display_name || mailbox.address)}</span>
                            <span className="pv-bd"><b>{nameForm.data.display_name || mailbox.address}</b><span className="pv-addr">{mailbox.address}</span></span>
                            <span className="pv-tag">How it looks in their inbox</span>
                        </div>
                        <div className="mt">
                            <Field label="Display name" hint="Use the name a customer would recognise. A company name works as well as a person's." error={nameForm.errors.display_name || errors?.display_name}>
                                {(props) => <Input {...props} autoComplete="name" value={nameForm.data.display_name} onChange={(e) => nameForm.setData('display_name', e.target.value)} />}
                            </Field>
                            <Field label="Email address" hint={<>Set by whoever administers <span className="mono">{domain.name}</span>. Extra addresses that deliver here can be added from the business dashboard.</>}>
                                {(props) => <Input {...props} type="email" readOnly value={mailbox.address} className="input is-fixed" />}
                            </Field>
                            <Field label="Send replies to" optional hint="Only needed if replies should land somewhere else, a shared inbox for instance." error={nameForm.errors.reply_to || errors?.reply_to}>
                                {(props) => <Input {...props} type="email" autoComplete="email" placeholder="Leave empty to use this address" value={nameForm.data.reply_to} onChange={(e) => nameForm.setData('reply_to', e.target.value)} />}
                            </Field>
                        </div>
                        <Switch label="Send from this address by default" description={`You have ${aliases.length + 1} addresses on this mailbox`} checked={defaultFrom} onChange={setDefaultFrom} />
                        <Button size="sm" className="mt" onClick={saveName} disabled={nameForm.processing}>Save</Button>
                    </Section>

                    <Section title="Storage" lead="Your slice of the domain's shared pool.">
                        <div className="slice-nums mt">
                            <div><span className="k">Your quota</span><span className="v">{formatGb(mailbox.quotaGb)}</span></div>
                            <div><span className="k">Used</span><span className="v">{formatGb(mailbox.usedGb)}</span></div>
                            <div><span className="k">Free</span><span className="v">{formatGb(mailbox.quotaGb - mailbox.usedGb)}</span></div>
                        </div>
                        <Meter className="mt" used={mailbox.usedGb} total={mailbox.quotaGb} label={`${formatGb(mailbox.usedGb)} of ${formatGb(mailbox.quotaGb)} used`} />
                        {share >= 75 && (
                            <Banner tone="warn" className="mt" title={`You are at ${share}% of your quota`}>
                                <p>We warn again at 95%. Clear some large attachments, or ask whoever manages <span className="mono">{domain.name}</span> to move more of the pool your way. It takes them a few seconds.</p>
                            </Banner>
                        )}
                    </Section>

                    <Section title="Signature" lead="Added to new messages and replies from this mailbox.">
                        <textarea className="sig-box mt" aria-label="Your signature" rows={4} value={sigForm.data.signature_text} onChange={(e) => sigForm.setData('signature_text', e.target.value)} />
                        <Switch label="Include on replies too" description="Some people prefer it only on new messages" checked={sigForm.data.signature_on_replies} onChange={(onReplies) => sigForm.setData('signature_on_replies', onReplies)} />
                        <Button size="sm" className="mt" onClick={saveSignature} disabled={sigForm.processing}>Save signature</Button>
                    </Section>

                    <Section title="Out of office" lead="An automatic reply, sent once per sender per day.">
                        <Switch label={autoReplyForm.data.auto_reply.on ? 'Auto-reply is on' : 'Auto-reply is off'} description="Turn it on and set the dates below" checked={autoReplyForm.data.auto_reply.on} onChange={(on) => saveAutoReply({ ...autoReplyForm.data.auto_reply, on })} />
                        <div className="grid g2 mt">
                            <Field label="From" error={autoReplyForm.errors['auto_reply.from']}>{(props) => <Input {...props} type="date" disabled={!autoReplyForm.data.auto_reply.on} value={autoReplyForm.data.auto_reply.from} onChange={(e) => saveAutoReply({ ...autoReplyForm.data.auto_reply, from: e.target.value })} />}</Field>
                            <Field label="Until" error={autoReplyForm.errors['auto_reply.until']}>{(props) => <Input {...props} type="date" disabled={!autoReplyForm.data.auto_reply.on} value={autoReplyForm.data.auto_reply.until} onChange={(e) => saveAutoReply({ ...autoReplyForm.data.auto_reply, until: e.target.value })} />}</Field>
                        </div>
                    </Section>

                    <Section title="Your devices" lead="Mail apps this mailbox is connected to.">
                        <p className="hint mt">No mail apps connected yet. Mail apps show here once your mail server is connected.</p>
                        <Button variant="line" full className="mt" href={route('setup.device')}>Set up another device</Button>
                    </Section>

                    <section className="sec-card" aria-label="Security">
                        <SecurityPanel />
                        <Switch label="Block remote images" description="Stops senders knowing when you opened a message" checked={blockImages} onChange={saveBlockImages} />
                    </section>

                    <Section title="Manual settings" lead="Only needed if an app cannot configure itself.">
                        <div className="stack mt">
                            <CopyField label="Incoming (IMAP)" value="—" hint="Available once your mail server is picked" />
                            <CopyField label="Outgoing (SMTP)" value="—" hint="Available once your mail server is picked" />
                            <CopyField label="Contacts (CardDAV)" value="—" hint="Available once your mail server is picked" />
                        </div>
                        <p className="hint">Your username is always your full email address.</p>
                    </Section>

                    <Section title="Reading and writing" lead="Small preferences that change how the mailbox feels day to day.">
                        {PREFERENCES.map(([key, label, description]) => <Switch key={key} label={label} description={description} checked={false} disabled onChange={() => {}} />)}
                        <p className="hint mt">Reading and writing preferences become editable once your mail server is connected.</p>
                    </Section>

                    <p className="sm mut st-end">Looking for your contacts? <Link href={route('mail.contacts')}>Open contacts</Link>.</p>
                </div>
            </main>
        </MailLayout>
    );
}
