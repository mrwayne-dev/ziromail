import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ActivityFeed from '../../Components/ui/ActivityFeed';
import QuotaEditor from '../../Components/dashboard/QuotaEditor';
import Button from '../../Components/ui/Button';
import Field, { Input, Textarea } from '../../Components/ui/Field';
import { MetricRow } from '../../Components/ui/MetricTile';
import Modal from '../../Components/ui/Modal';
import Note from '../../Components/ui/Note';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import Switch from '../../Components/ui/Switch';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatDate, formatGb, formatRelative } from '../../Lib/format';
import { route } from '../../Lib/route';

export default function Mailbox() {
    const { mailbox, domain, pool, forwarding, autoReply, filtering, limits, activity } = usePage().props;
    const { toast } = useToast();
    const confirm = useDisclosure();
    const [pending, setPending] = useState('suspend');
    const [displayName, setDisplayName] = useState(mailbox.displayName);
    const [requireChange, setRequireChange] = useState(mailbox.requirePasswordChange);
    const [twoFactor, setTwoFactor] = useState(mailbox.requireTwoFactor);
    const [forward, setForward] = useState(forwarding);
    const [reply, setReply] = useState(autoReply);
    const [filters, setFilters] = useState(filtering);
    const [sendLimits, setSendLimits] = useState({ hourly: limits.hourly, daily: limits.daily });
    const [errors, setErrors] = useState({});
    const share = Math.round((mailbox.usedGb / mailbox.quotaGb) * 100);
    const mailboxesLink = `${route('dashboard.mailboxes')}?domain=${domain.id}`;

    // One save path for every section: the server validates, and its message is shown beside the control.
    function save(data, title) {
        router.patch(route('dashboard.mailboxes.update', { mailbox: mailbox.id }), data, {
            preserveScroll: true,
            onSuccess: () => { setErrors({}); toast({ tone: 'ok', title }); },
            onError: (e) => { setErrors(e); toast({ tone: 'warn', title: 'Not saved', message: Object.values(e)[0] }); },
        });
    }

    function openConfirm(kind) {
        setPending(kind);
        confirm.open();
    }

    function confirmed() {
        confirm.close();
        if (pending === 'delete') router.delete(route('dashboard.mailboxes.destroy', { mailbox: mailbox.id }));
        else router.post(route('dashboard.mailboxes.suspend', { mailbox: mailbox.id }), {}, { preserveScroll: true, onSuccess: () => toast({ tone: 'ok', title: 'Mailbox suspended', message: 'Sign-in and sending have stopped. Mail still arrives.' }) });
    }

    const quotaTone = share >= 90 ? 'bad' : share >= 75 ? 'watch' : undefined;

    return (
        <DashboardLayout page="admin-mailbox" title={mailbox.address} description="One mailbox: identity, password, storage, routing and limits.">
            <SectionHeader
                eyebrow="MAILBOX"
                title={<span className="mono">{mailbox.address}</span>}
                description={`Created ${formatDate(mailbox.createdAt)} · last signed in ${mailbox.lastLoginAt ? formatRelative(mailbox.lastLoginAt).toLowerCase() : 'never'}`}
                actions={<>
                    <Button variant="line" size="sm" href={route('setup.device')}>Send a setup link</Button>
                    <Button variant="line" size="sm" href={mailboxesLink}>All mailboxes</Button>
                </>}
            />

            <MetricRow label="Mailbox figures" items={[
                { k: 'Storage', v: `${mailbox.usedGb} / ${mailbox.quotaGb}`, unit: 'GB', tone: quotaTone, d: `${share}% of this mailbox's quota` },
                { k: 'State', v: mailbox.state.replace(/_/g, ' '), d: mailbox.state === 'not_set_up' ? 'awaiting first sign-in' : 'current state' },
                { k: 'Devices signed in', v: mailbox.devices.length, d: mailbox.devices.length === 0 ? 'none yet' : mailbox.devices.map((d) => d.client).join(' and ') },
                { k: 'Mail this month', v: '—', tone: 'off', d: 'Not available yet, waiting on mail server' },
            ]} />

            <SubSection id="identity" title="Name &amp; picture" description="What recipients see when this mailbox sends mail. Without a picture we use the first two letters of the address.">
                <section className="ops-card">
                    <Field label="Display name" hint="Shown as the sender name. The address cannot be changed once mail has been delivered to it. Create a new mailbox and an alias instead.">
                        {(props) => <Input {...props} value={displayName} autoComplete="off" onChange={(e) => setDisplayName(e.target.value)} />}
                    </Field>
                    <Field label="Address" hint="Fixed. Add another address under Aliases and forwarding.">
                        {(props) => <Input {...props} className="input mono is-fixed" value={mailbox.address} readOnly />}
                    </Field>
                    <div className="ops-actions">
                        <Button variant="ink" size="sm" onClick={() => save({ display_name: displayName }, 'Name saved')}>Save changes</Button>
                    </div>
                </section>
            </SubSection>

            <SubSection id="security" title="Password &amp; security" description="This mailbox is reached with its own address and password. Resetting it is how you take the mailbox back.">
                <section className="ops-card">
                    <Note title="Setting a password">
                        <p>Passwords are set on the mail server, which is not connected yet. Until it is, turn on "Require a new password at next sign-in" below and the person chooses their own.</p>
                    </Note>
                    <Switch label="Require a new password at next sign-in" description="The user chooses their own, and you never know it." checked={requireChange} onChange={(v) => { setRequireChange(v); save({ require_password_change: v }, 'Saved'); }} />
                    <Switch label="Two-factor sign-in" description="An authenticator code on top of the password. Strongly recommended for any mailbox that sends invoices." checked={twoFactor} onChange={(v) => { setTwoFactor(v); save({ require_two_factor: v }, 'Saved'); }} />

                    <h3 className="ops-card-h-sm mt-16">Signed-in devices</h3>
                    <p className="ops-sm ops-mut mt-6">Mail apps connected to this mailbox will be listed here once the mail server is connected.</p>
                </section>
            </SubSection>

            <SubSection id="storage" title="Storage" description={`Taken from the domain's ${formatGb(pool.poolGb)} pool. There is ${formatGb(Math.max(pool.unassignedGb, 0))} unassigned.`}>
                <section className="ops-card">
                    <QuotaEditor mailbox={mailbox} pool={pool} />
                    <p className="ops-sm ops-mut mt-14">No room left in the pool? <Link className="ops-link" href={`${route('dashboard.storage')}?domain=${domain.id}`}>Add extra storage</Link> to this domain.</p>
                </section>
            </SubSection>

            <SubSection id="routing" title="Aliases &amp; forwarding" description="An alias is another address that delivers here. It uses no storage of its own and is not charged.">
                <section className="ops-card">
                    {mailbox.aliases.length === 0 && <p className="ops-sm ops-mut m-0">No aliases on this mailbox.</p>}
                    {mailbox.aliases.length > 0 && (
                        <dl className="ops-kv">
                            {mailbox.aliases.map((alias) => (
                                <div key={alias.id}>
                                    <dt className="mono">{alias.address}</dt>
                                    <dd>Alias · added {formatRelative(alias.addedAt).toLowerCase()}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    <div className="ops-actions">
                        <Button variant="line" size="sm" href={`${route('dashboard.aliases')}?domain=${domain.id}`}>Add an alias</Button>
                    </div>

                    <h3 className="ops-card-h-sm mt-16">Forwarding</h3>
                    <p className="ops-sm ops-mut mt-6">Send a copy of every message to another address.</p>
                    <Field label="Forward to">
                        {(props) => <Input {...props} type="email" placeholder="someone@example.com" autoComplete="off" value={forward.to} onChange={(e) => setForward({ ...forward, to: e.target.value })} />}
                    </Field>
                    <Switch label="Keep a copy here" description="Off means forwarded mail does not stay in this mailbox. Leave it on unless you are certain." checked={forward.keepCopy} onChange={(keepCopy) => setForward({ ...forward, keepCopy })} />
                    <div className="ops-actions">
                        <Button variant="ink" size="sm" onClick={() => save({ forwarding: forward }, 'Forwarding saved')}>Save forwarding</Button>
                    </div>
                </section>
            </SubSection>

            <SubSection id="away" title="Auto-reply" description="An automatic answer to anyone who writes in. The user can also set this themselves from their webmail.">
                <section className="ops-card">
                    <Switch label={reply.on ? 'Auto-reply is on' : 'Auto-reply is off'} description="Turn it on to answer every incoming message once per sender per day." checked={reply.on} onChange={(on) => setReply({ ...reply, on })} />
                    <div className="lim-grid">
                        <Field label="From">{(props) => <Input {...props} type="date" value={reply.from} onChange={(e) => setReply({ ...reply, from: e.target.value })} />}</Field>
                        <Field label="Until">{(props) => <Input {...props} type="date" value={reply.until} onChange={(e) => setReply({ ...reply, until: e.target.value })} />}</Field>
                    </div>
                    <Field label="Message">
                        {(props) => <Textarea {...props} rows={3} placeholder="Thank you for writing. We reply to orders within one working day." value={reply.message} onChange={(e) => setReply({ ...reply, message: e.target.value })} />}
                    </Field>
                    <div className="ops-actions">
                        <Button variant="ink" size="sm" onClick={() => save({ auto_reply: reply }, 'Auto-reply saved')}>Save auto-reply</Button>
                    </div>
                </section>
            </SubSection>

            <SubSection id="filtering" title="Filtering &amp; limits" description="What arrives, and how much this mailbox may send. Sending limits are what stop one compromised password from damaging every other customer's delivery.">
                <section className="ops-card">
                    <Switch label="Spam filtering" description="Suspected spam goes to the Spam folder rather than the inbox." checked={filters.spam} onChange={(spam) => setFilters({ ...filters, spam })} />
                    <Switch label="Reject executable attachments" description="Blocks .exe, .scr and similar before they reach the inbox." checked={filters.rejectExecutables} onChange={(rejectExecutables) => setFilters({ ...filters, rejectExecutables })} />
                    <h3 className="ops-card-h-sm mt-16">Sending limits</h3>
                    <div className="lim-grid">
                        <Field label="Messages an hour">{(props) => <Input {...props} type="number" min="1" step="10" value={sendLimits.hourly} onChange={(e) => setSendLimits({ ...sendLimits, hourly: e.target.value })} />}</Field>
                        <Field label="Messages a day">{(props) => <Input {...props} type="number" min="1" step="50" value={sendLimits.daily} onChange={(e) => setSendLimits({ ...sendLimits, daily: e.target.value })} />}</Field>
                    </div>
                    <p className="ops-sm ops-mut mt-6">The plan default is {limits.planDefaults.hourly} an hour and {limits.planDefaults.daily} a day. A mailbox that suddenly sends far above its own pattern is locked automatically and we tell you.</p>
                    <div className="ops-actions">
                        <Button variant="ink" size="sm" onClick={() => save({ filtering: filters, limits: { hourly: Number(sendLimits.hourly), daily: Number(sendLimits.daily) } }, 'Filtering and limits saved')}>Save limits</Button>
                    </div>
                </section>
            </SubSection>

            <SubSection id="activity" title="Activity" tLink={{ href: route('dashboard.audit'), label: 'See the full log' }}>
                <section className="ops-card">
                    {activity.length === 0 ? <p className="ops-sm ops-mut m-0">Nothing has changed on this mailbox yet.</p> : <ActivityFeed items={activity} />}
                </section>
            </SubSection>

            <SubSection id="danger" title="Suspend or delete">
                <Note tone="bad" title="Suspending or deleting">
                    <p><b>Suspend</b> stops sign-in and sending; mail still arrives and nothing is lost. <b>Delete</b> removes the mailbox and its contents permanently after 30 days, and returns its quota to the pool.</p>
                    <div className="ops-actions">
                        <Button variant="line" size="sm" onClick={() => openConfirm('suspend')}>Suspend</Button>
                        <Button variant="danger" size="sm" onClick={() => openConfirm('delete')}>Delete</Button>
                    </div>
                </Note>
            </SubSection>

            <Modal
                open={confirm.isOpen}
                onClose={confirm.close}
                title={pending === 'delete' ? `Delete ${mailbox.address}?` : `Suspend ${mailbox.address}?`}
                size="sm"
                footer={(
                    <>
                        <Button variant="quiet" onClick={confirm.close}>Cancel</Button>
                        <Button variant={pending === 'delete' ? 'danger' : 'ink'} onClick={confirmed}>{pending === 'delete' ? 'Delete after 30 days' : 'Suspend'}</Button>
                    </>
                )}
            >
                <p>
                    {pending === 'delete'
                        ? `${mailbox.address} is held for 30 days, then removed with everything in it. Its ${formatGb(mailbox.quotaGb)} returns to the pool.`
                        : `Sign-in and sending stop for ${mailbox.address}. Mail still arrives and nothing is lost. You can turn it back on at any time.`}
                </p>
                {share >= 75 && pending === 'delete' && <p className="hint">This mailbox holds {formatGb(mailbox.usedGb)} of mail.</p>}
            </Modal>
        </DashboardLayout>
    );
}
