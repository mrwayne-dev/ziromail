import { Link } from '@inertiajs/react';
import { useState } from 'react';
import Metrics from '../../Components/ops/Metrics';
import OpsTable from '../../Components/ops/OpsTable';
import ReasonDialog from '../../Components/ops/ReasonDialog';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import useOpsCan from '../../Hooks/useOpsCan';
import OpsLayout from '../../Layouts/OpsLayout';
import { orgDetailProps } from '../../fixtures/ops';
import { formatDate, formatRelative } from '../../Lib/format';
import { route, routeParam } from '../../Lib/route';

const STATE_TONE = { active: 'ok', not_set_up: 'muted', near_full: 'warn' };
const STATE_WORD = { active: 'Active', not_set_up: 'Not set up', near_full: '76% full' };

export default function Org() {
    const { org, figures, mailboxes, domain, billing, contact, business, tickets, assigned } = orgDetailProps(routeParam('org'));
    const { toast } = useToast();
    const can = useOpsCan();
    const viewAs = useDisclosure();
    const [busy, setBusy] = useState(false);

    function recheck() {
        setBusy(true);
        setTimeout(() => { setBusy(false); toast({ tone: 'ok', title: 'Records re-checked', message: 'Preview: nothing was queued.' }); }, 700);
    }

    return (
        <OpsLayout page="ops-org" title={org.name}>
            <div className="ops-head">
                <div>
                    <h1>{org.name}</h1>
                    <p>{org.planName} plan &middot; <span className="mono">{org.domain}</span> &middot; customer since {formatDate(org.customerSince)}</p>
                </div>
                <Pill tone={org.severity === 'high' ? 'bad' : org.severity === 'med' ? 'warn' : 'ok'}>{org.stateLabel}</Pill>
            </div>
            <p className="sm mut mb"><Link href={route('ops.orgs')}>&larr; Organisations</Link></p>

            <Metrics items={figures} label="Account figures" />

            <div className="og-grid mt">
                <div>
                    <Card as="section" aria-labelledby="mb-h">
                        <div className="between"><h2 id="mb-h" className="heading-sm">Mailboxes</h2><Link className="tlink" href={route('ops.mailboxes')}>All platform mailboxes</Link></div>
                        <OpsTable
                            className="mt-s"
                            wide
                            caption={`Mailboxes belonging to ${org.name}`}
                            head={<tr><th scope="col">Address</th><th scope="col" className="num">Quota</th><th scope="col" className="num">Used</th><th scope="col">Last sign-in</th><th scope="col">State</th></tr>}
                        >
                            {mailboxes.map((mailbox) => (
                                <tr key={mailbox.address}>
                                    <td className="mono wide">{mailbox.address}</td>
                                    <td className="num">{mailbox.quotaGb} GB</td>
                                    <td className="num">{mailbox.usedGb} GB</td>
                                    <td>{formatRelative(mailbox.lastLoginAt)}</td>
                                    <td><Pill tone={STATE_TONE[mailbox.state] ?? 'ok'}>{STATE_WORD[mailbox.state] ?? 'Active'}</Pill></td>
                                </tr>
                            ))}
                        </OpsTable>
                        <p className="hint">{assigned} GB assigned. The customer can move quota between these themselves; you only need to intervene if they want more than the pool holds.</p>
                    </Card>

                    <Card as="section" aria-labelledby="dn-h" className="mt">
                        <h2 id="dn-h" className="heading-sm">Domain and records</h2>
                        <div className="kv mt-s">
                            <div className="r"><span>Domain</span><b className="mono">{domain.name}</b></div>
                            <div className="r"><span>Registrar</span><b>{domain.registrar}</b></div>
                            {domain.records.map((record) => <div className="r" key={record.type}><span>{record.type}</span><b>{record.status}</b></div>)}
                            <div className="r"><span>Last checked</span><b>{domain.lastChecked}</b></div>
                        </div>
                        {can('recheck') && <Button variant="line" size="sm" className="mt" busy={busy} onClick={recheck}>Re-check records now</Button>}
                    </Card>

                    <Card as="section" aria-labelledby="bl-h" className="mt">
                        <h2 id="bl-h" className="heading-sm">Billing</h2>
                        <div className="kv mt-s">{billing.map(([k, v]) => <div className="r" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
                        <div className="btn-row no-grow mt">
                            <Button variant="line" size="sm" disabled title="Invoices are not connected yet">All invoices</Button>
                            {can('refund.request') && <Button variant="line" size="sm" href={route('ops.refunds')}>Issue a refund</Button>}
                        </div>
                    </Card>
                </div>

                <div className="stack">
                    <div className="contact">
                        <h3>Who to call</h3>
                        <span className="big">{contact.phone}</span>
                        <span className="lil">{contact.name}</span>
                        <span className="lil"><a href={`mailto:${contact.email}`}>{contact.email}</a></span>
                        <p className="sm">{contact.note}</p>
                    </div>
                    <Card>
                        <h3>Business details</h3>
                        <div className="kv mt-s">{business.map(([k, v]) => <div className="r" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
                        <p className="hint">Illustrative: no screen collects these yet.</p>
                    </Card>
                    <div className="impersonate">
                        <h4>Open their admin dashboard</h4>
                        <p className="sm">You will see exactly what the customer sees, in read-only mode. Nothing can be changed and a banner tells them afterwards that support viewed the account.</p>
                        <div className="stack mt-s">
                            {can('viewAs')
                                ? <Button variant="line" size="sm" full onClick={viewAs.open}>View as {org.name}</Button>
                                : <Button variant="line" size="sm" full disabled>View as {org.name}</Button>}
                            <p className="hint">Logged to the audit trail with your name, the time, and the reason you give.</p>
                        </div>
                    </div>
                    <Card>
                        <h3>Recent contact</h3>
                        {tickets.map((ticket) => <p className="sm tk" key={ticket.id}><b>{ticket.id}</b>: {ticket.text}</p>)}
                        <a className="tlink mt" href="mailto:support@ziroemail.com">Write to this customer</a>
                    </Card>
                </div>
            </div>

            <ReasonDialog
                open={viewAs.isOpen}
                onClose={viewAs.close}
                title={`View as ${org.name}`}
                description="Read-only. The customer is told afterwards that support viewed the account."
                confirmLabel="Open read-only view"
                onConfirm={() => { viewAs.close(); toast({ tone: 'ok', title: 'Logged', message: 'Preview: the read-only dashboard is not opened.' }); }}
            />
        </OpsLayout>
    );
}
