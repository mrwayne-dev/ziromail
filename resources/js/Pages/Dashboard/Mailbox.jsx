import { Link } from '@inertiajs/react';
import { useState } from 'react';
import ActivityFeed from '../../Components/dashboard/ActivityFeed';
import { MailboxStatus } from '../../Components/dashboard/MailboxTable';
import QuotaEditor from '../../Components/dashboard/QuotaEditor';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Field, { Input, Textarea } from '../../Components/ui/Field';
import Modal from '../../Components/ui/Modal';
import Note from '../../Components/ui/Note';
import StrengthMeter from '../../Components/ui/StrengthMeter';
import Switch from '../../Components/ui/Switch';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import useScenario from '../../Hooks/useScenario';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { mailboxProps } from '../../fixtures/dashboard';
import { formatDate, formatGb, formatRelative, initials } from '../../Lib/format';
import { route, routeParam } from '../../Lib/route';

const SECTIONS = [
    ['overview', 'Overview'],
    ['identity', 'Name & picture'],
    ['security', 'Password & security'],
    ['storage', 'Storage'],
    ['routing', 'Aliases & forwarding'],
    ['away', 'Auto-reply'],
    ['filtering', 'Filtering & limits'],
    ['activity', 'Activity'],
];

const GENERATED = 'Planting-Garri-47-Market';

export default function Mailbox() {
    const scenario = useScenario();
    const { mailbox, domain, pool, forwarding, autoReply, filtering, limits } = mailboxProps(routeParam('mailbox'), scenario);
    const { toast } = useToast();
    const confirm = useDisclosure();
    const [pending, setPending] = useState('suspend');
    const [displayName, setDisplayName] = useState(mailbox.displayName);
    const [password, setPassword] = useState('');
    const [requireChange, setRequireChange] = useState(mailbox.requirePasswordChange);
    const [twoFactor, setTwoFactor] = useState(mailbox.requireTwoFactor);
    const [devices, setDevices] = useState(mailbox.devices);
    const [aliases, setAliases] = useState(mailbox.aliases);
    const [forward, setForward] = useState(forwarding);
    const [reply, setReply] = useState(autoReply);
    const [filters, setFilters] = useState(filtering);
    const [sendLimits, setSendLimits] = useState({ hourly: limits.hourly, daily: limits.daily });
    const share = Math.round((mailbox.usedGb / mailbox.quotaGb) * 100);
    const saved = (title) => () => toast({ tone: 'ok', title });
    const mailboxesLink = `${route('dashboard.mailboxes')}?domain=${domain.id}`;

    function openConfirm(kind) {
        setPending(kind);
        confirm.open();
    }

    function confirmed() {
        toast({ tone: 'ok', title: pending === 'delete' ? 'Mailbox scheduled for deletion' : 'Mailbox suspended', message: pending === 'delete' ? 'It is held for 30 days, then removed.' : 'Sign-in and sending have stopped. Mail still arrives.' });
        confirm.close();
    }

    return (
        <DashboardLayout page="admin-mailbox" title={mailbox.address} description="One mailbox: identity, password, storage, routing and limits.">
            <p className="sm mut mb"><Link className="back-link" href={mailboxesLink}>&larr; All mailboxes</Link></p>

            <div className="page-head">
                <div className="mb-hero">
                    <span className="av" aria-hidden="true">{initials(mailbox.local)}</span>
                    <div>
                        <h1 className="mono mb-title">{mailbox.address}</h1>
                        <p>Created {formatDate(mailbox.createdAt)} &middot; last signed in {mailbox.lastLoginAt ? formatRelative(mailbox.lastLoginAt).toLowerCase() : 'never'}</p>
                    </div>
                </div>
                <MailboxStatus mailbox={mailbox} />
            </div>

            <div className="mb-layout">
                <nav className="mb-nav" aria-label="Mailbox sections">
                    <div className="mb-nav-in">
                        <p className="ttl">This mailbox</p>
                        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
                        <hr />
                        <a href="#danger" className="danger">Suspend or delete</a>
                    </div>
                </nav>

                <div className="mb-sections">
                    <Card as="section" className="sec" id="overview" aria-labelledby="ov-h">
                        <h2 className="heading-sm" id="ov-h">Overview</h2>
                        <p className="sm mut mt-s">How this mailbox is doing. Everything here is also editable in the sections below.</p>
                        <div className="row mt-s">
                            <span className="nm"><b>Storage</b><span>{formatGb(mailbox.usedGb)} used of a {formatGb(mailbox.quotaGb)} quota</span></span>
                            <MailboxStatus mailbox={mailbox} />
                        </div>
                        <div className="row"><span className="nm"><b>Received this month</b><span>Within the normal range</span></span><b className="num">{mailbox.receivedMonth.toLocaleString('en-NG')}</b></div>
                        <div className="row"><span className="nm"><b>Sent this month</b><span>{mailbox.bouncedMonth} bounced</span></span><b className="num">{mailbox.sentMonth.toLocaleString('en-NG')}</b></div>
                        <div className="row"><span className="nm"><b>Devices signed in</b><span>{devices.length === 0 ? 'None yet' : devices.map((d) => d.client).join(' and ')}</span></span><b className="num">{devices.length}</b></div>
                        <div className="btn-row mt no-grow">
                            <Button variant="line" size="sm" href={route('setup.device')}>Send a setup link</Button>
                            <Button variant="quiet" size="sm" href="#security">Reset the password</Button>
                        </div>
                    </Card>

                    <Card as="section" className="sec" id="identity" aria-labelledby="id-h">
                        <h2 className="heading-sm" id="id-h">Name &amp; picture</h2>
                        <p className="sm mut mt-s">What recipients see when this mailbox sends mail. Without a picture we use the first two letters of the address.</p>
                        <div className="mt">
                            <Field label="Display name" hint="Shown as the sender name. The address cannot be changed once mail has been delivered to it. Create a new mailbox and an alias instead.">
                                {(props) => <Input {...props} value={displayName} autoComplete="off" onChange={(e) => setDisplayName(e.target.value)} />}
                            </Field>
                            <Field label="Address" hint="Fixed. Add another address under Aliases and forwarding.">
                                {(props) => <Input {...props} className="input mono is-fixed" value={mailbox.address} readOnly />}
                            </Field>
                        </div>
                        <Button className="mt" onClick={saved('Name saved')}>Save changes</Button>
                    </Card>

                    <Card as="section" className="sec" id="security" aria-labelledby="se-h">
                        <h2 className="heading-sm" id="se-h">Password &amp; security</h2>
                        <p className="sm mut mt-s">This mailbox is reached with its own address and password. Whoever holds the password holds the mailbox, which is why resetting it is how you take it back.</p>
                        <div className="mt">
                            <Field label="Set a new password" hint="The user is signed out of every device and must sign in again.">
                                {(props) => (
                                    <>
                                        <Input {...props} type="text" autoComplete="off" placeholder="At least 12 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                                        <StrengthMeter password={password} />
                                    </>
                                )}
                            </Field>
                        </div>
                        <div className="btn-row no-grow">
                            <Button disabled={password.length < 12} onClick={() => { saved('Password set')(); setPassword(''); }}>Set password</Button>
                            <Button variant="line" onClick={() => setPassword(GENERATED)}>Generate a strong one</Button>
                        </div>
                        <Switch label="Require a new password at next sign-in" description="The user chooses their own, and you never know it." checked={requireChange} onChange={setRequireChange} />
                        <Switch label="Two-factor sign-in" description="An authenticator code on top of the password. Strongly recommended for any mailbox that sends invoices." checked={twoFactor} onChange={setTwoFactor} />

                        <h3 className="heading-xs">Signed-in devices</h3>
                        {devices.length === 0 && <p className="sm mut mt-s">No devices have signed in yet.</p>}
                        {devices.map((device) => (
                            <div className="row" key={device.id}>
                                <span className="nm"><b>{device.label}</b><span>{device.client} &middot; last active {formatRelative(device.lastActiveAt).toLowerCase()}</span></span>
                                <Button variant="line" size="sm" aria-label={`Sign out ${device.label}`} onClick={() => setDevices(devices.filter((d) => d.id !== device.id))}>Sign out</Button>
                            </div>
                        ))}
                        {devices.length > 0 && <Button variant="line" full className="mt" onClick={() => setDevices([])}>Sign out everywhere</Button>}
                    </Card>

                    <Card as="section" className="sec" id="storage" aria-labelledby="q-h">
                        <h2 className="heading-sm" id="q-h">Storage</h2>
                        <p className="sm mut mt-s">Taken from the domain's {formatGb(pool.poolGb)} pool. There is {formatGb(Math.max(pool.unassignedGb, 0))} unassigned.</p>
                        <QuotaEditor mailbox={mailbox} pool={pool} />
                        <p className="sm mut mt">No room left in the pool? <Link href={`${route('dashboard.storage')}?domain=${domain.id}`}>Add extra storage</Link> to this domain.</p>
                    </Card>

                    <Card as="section" className="sec" id="routing" aria-labelledby="ro-h">
                        <h2 className="heading-sm" id="ro-h">Aliases &amp; forwarding</h2>
                        <p className="sm mut mt-s">An alias is another address that delivers here. It uses no storage of its own and is not charged.</p>
                        {aliases.length === 0 && <p className="sm mut mt-s">No aliases on this mailbox.</p>}
                        {aliases.map((alias) => (
                            <div className="row" key={alias.id}>
                                <span className="nm"><b className="mono">{alias.address}</b><span>Alias &middot; added {formatRelative(alias.addedAt).toLowerCase()}</span></span>
                                <Button variant="line" size="sm" aria-label={`Remove ${alias.address}`} onClick={() => setAliases(aliases.filter((a) => a.id !== alias.id))}>Remove</Button>
                            </div>
                        ))}
                        <Button variant="line" full className="mt" href={`${route('dashboard.aliases')}?domain=${domain.id}`}>Add an alias</Button>

                        <h3 className="heading-xs">Forwarding</h3>
                        <p className="sm mut mt-s">Send a copy of every message to another address.</p>
                        <Field label="Forward to">
                            {(props) => <Input {...props} type="email" placeholder="someone@example.com" autoComplete="off" value={forward.to} onChange={(e) => setForward({ ...forward, to: e.target.value })} />}
                        </Field>
                        <Switch label="Keep a copy here" description="Off means forwarded mail does not stay in this mailbox. Leave it on unless you are certain." checked={forward.keepCopy} onChange={(keepCopy) => setForward({ ...forward, keepCopy })} />
                        <Button className="mt" onClick={saved('Forwarding saved')}>Save forwarding</Button>
                    </Card>

                    <Card as="section" className="sec" id="away" aria-labelledby="aw-h">
                        <h2 className="heading-sm" id="aw-h">Auto-reply</h2>
                        <p className="sm mut mt-s">An automatic answer to anyone who writes in. The user can also set this themselves from their webmail.</p>
                        <Switch label={reply.on ? 'Auto-reply is on' : 'Auto-reply is off'} description="Turn it on to answer every incoming message once per sender per day." checked={reply.on} onChange={(on) => setReply({ ...reply, on })} />
                        <div className="lim-grid">
                            <Field label="From">{(props) => <Input {...props} type="date" value={reply.from} onChange={(e) => setReply({ ...reply, from: e.target.value })} />}</Field>
                            <Field label="Until">{(props) => <Input {...props} type="date" value={reply.until} onChange={(e) => setReply({ ...reply, until: e.target.value })} />}</Field>
                        </div>
                        <Field label="Message">
                            {(props) => <Textarea {...props} rows={3} placeholder="Thank you for writing. We reply to orders within one working day." value={reply.message} onChange={(e) => setReply({ ...reply, message: e.target.value })} />}
                        </Field>
                        <Button onClick={saved('Auto-reply saved')}>Save auto-reply</Button>
                    </Card>

                    <Card as="section" className="sec" id="filtering" aria-labelledby="fl-h">
                        <h2 className="heading-sm" id="fl-h">Filtering &amp; limits</h2>
                        <p className="sm mut mt-s">What arrives, and how much this mailbox may send. Sending limits are what stop one compromised password from damaging every other customer's delivery.</p>
                        <Switch label="Spam filtering" description="Suspected spam goes to the Spam folder rather than the inbox." checked={filters.spam} onChange={(spam) => setFilters({ ...filters, spam })} />
                        <Switch label="Reject executable attachments" description="Blocks .exe, .scr and similar before they reach the inbox." checked={filters.rejectExecutables} onChange={(rejectExecutables) => setFilters({ ...filters, rejectExecutables })} />
                        <h3 className="heading-xs">Sending limits</h3>
                        <div className="lim-grid">
                            <Field label="Messages an hour">{(props) => <Input {...props} type="number" min="1" step="10" value={sendLimits.hourly} onChange={(e) => setSendLimits({ ...sendLimits, hourly: e.target.value })} />}</Field>
                            <Field label="Messages a day">{(props) => <Input {...props} type="number" min="1" step="50" value={sendLimits.daily} onChange={(e) => setSendLimits({ ...sendLimits, daily: e.target.value })} />}</Field>
                        </div>
                        <p className="hint">The plan default is {limits.planDefaults.hourly} an hour and {limits.planDefaults.daily} a day. A mailbox that suddenly sends far above its own pattern is locked automatically and we tell you.</p>
                        <Button className="mt-s" onClick={saved('Limits saved')}>Save limits</Button>
                    </Card>

                    <Card as="section" className="sec" id="activity" aria-labelledby="ac-h">
                        <h2 className="heading-sm" id="ac-h">Activity</h2>
                        {mailbox.activity.length === 0 ? <p className="sm mut mt-s">Nothing has changed on this mailbox yet.</p> : <ActivityFeed items={mailbox.activity} />}
                        <Link className="small mt link-strong inline-block" href={route('dashboard.audit')}>See the full log</Link>
                    </Card>

                    <section className="sec" id="danger" aria-labelledby="dg-h">
                        <Note tone="bad" title="Suspending or deleting" id="dg-h">
                            <p><b>Suspend</b> stops sign-in and sending; mail still arrives and nothing is lost. <b>Delete</b> removes the mailbox and its contents permanently after 30 days, and returns its quota to the pool.</p>
                            <div className="btn-row mt no-grow">
                                <Button variant="line" size="sm" onClick={() => openConfirm('suspend')}>Suspend</Button>
                                <Button variant="danger" size="sm" onClick={() => openConfirm('delete')}>Delete</Button>
                            </div>
                        </Note>
                    </section>
                </div>
            </div>

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
