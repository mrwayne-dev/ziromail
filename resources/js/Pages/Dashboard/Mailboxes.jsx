import { Link, usePage } from '@inertiajs/react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import AddMailboxDialog from '../../Components/dashboard/AddMailboxDialog';
import { MailboxStatus } from '../../Components/dashboard/MailboxTable';
import PoolBar from '../../Components/domain/PoolBar';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Empty from '../../Components/ui/Empty';
import { AlertIcon } from '../../Components/ui/Icons';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import Table from '../../Components/ui/Table';
import useDisclosure from '../../Hooks/useDisclosure';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatGb, formatRelative, initials } from '../../Lib/format';
import { route } from '../../Lib/route';

export default function Mailboxes() {
    const owner = usePage().props.auth?.user?.ownerId ?? usePage().props.auth?.user?.id;
    useRealtimeReload({ channel: `account.${owner}`, map: { mailbox: ['mailboxes','pool','domain'], domain: ['domain','pool'] } });

    const { domain, plan, pool, mailboxes, can } = usePage().props;
    const dialog = useDisclosure();
    const withDomain = (name, params) => `${route(name, params)}?domain=${domain.id}`;
    const recordsBroken = domain.recordsPassing < domain.recordsTotal;

    const segments = mailboxes.map((mailbox) => ({ key: mailbox.id, gb: mailbox.quotaGb, label: `${mailbox.quotaGb} GB` }));
    const description = `${formatGb(pool.poolGb)} pool: ${mailboxes.map((mailbox) => `${mailbox.local} ${mailbox.quotaGb} GB`).join(', ')}${pool.unassignedGb > 0 ? `, ${formatGb(pool.unassignedGb)} unassigned` : ''}`;

    return (
        <DashboardLayout page="admin-mailboxes" title="Mailboxes" description="Every mailbox on this domain, its storage and status.">
            <div className="page-head">
                <div>
                    <h1>Mailboxes</h1>
                    <p>Everything here belongs to <span className="mono">{domain.name}</span>. Switch domain at the top to manage another.</p>
                </div>
                <div className="btn-row no-grow">
                    {can.create && <Button onClick={dialog.open}>Add a mailbox</Button>}
                    {can.buyStorage && <Button variant="line" href={withDomain('dashboard.storage')}>Add extra storage</Button>}
                </div>
            </div>

            <section className="pool-head" aria-labelledby="pool-h">
                <div className="between pool-top">
                    <div className="pool-stat">
                        <div>
                            <span className="k" id="pool-h">Assigned</span>
                            <span className="big">{pool.assignedGb} <span className="big-unit">of {pool.poolGb} GB</span></span>
                        </div>
                        <div>
                            <span className="k">Actually used</span>
                            <span className="big">{formatGb(pool.usedGb)}</span>
                        </div>
                        <div>
                            <span className="k">Plan</span>
                            <Pill tone="info">{plan.name}{pool.ceilingGb ? ` · expandable to ${pool.ceilingGb} GB` : ''}</Pill>
                        </div>
                    </div>
                    <div className="pool-acts">
                        <Button variant="quiet" size="sm" href={withDomain('dashboard.domains.show', { domain: domain.id })}>Domain settings</Button>
                    </div>
                </div>
                <PoolBar segments={segments} freeGb={Math.max(pool.unassignedGb, 0)} description={description} />
                <div className="pool-key">
                    {mailboxes.map((mailbox, index) => (
                        <span key={mailbox.id}><i className={`key-${(index % 5) + 1}`} /> {mailbox.local}@</span>
                    ))}
                    {pool.unassignedGb > 0 && <span><i className="key-free" /> unassigned</span>}
                </div>
            </section>

            {recordsBroken && (
                <Banner tone="warn" icon={<AlertIcon />} title={domain.healthNote} className="mb">
                    <p>Mail from this domain may be refused by Gmail and Outlook until the record is fixed. <Link href={withDomain('dashboard.domains.show', { domain: domain.id })}>Fix the records</Link>.</p>
                </Banner>
            )}

            {mailboxes.length === 0 ? (
                <Empty icon="@" title="No mailboxes yet" action={<Button onClick={dialog.open}>Add your first mailbox</Button>}>
                    Mailboxes you add to this domain draw from its storage pool.
                </Empty>
            ) : (
                <Table
                    caption={`Mailboxes on ${domain.name} with their assigned quota and usage`}
                    head={(
                        <tr>
                            <th scope="col">Mailbox</th>
                            <th scope="col">Quota</th>
                            <th scope="col">Last signed in</th>
                            <th scope="col">Status</th>
                            <th scope="col"><span className="sr-only">Actions</span></th>
                        </tr>
                    )}
                >
                    {mailboxes.map((mailbox, index) => {
                        const share = Math.round((mailbox.usedGb / mailbox.quotaGb) * 100);
                        const notSetUp = mailbox.state === 'not_set_up';
                        return (
                            <tr key={mailbox.id}>
                                <td>
                                    <span className="mb-row">
                                        <span className={`mb-av${index === 0 ? ' b' : ''}`} aria-hidden="true">{initials(mailbox.local)}</span>
                                        <span className="who"><b>{mailbox.local}@{domain.name}</b><span>{mailbox.roleLabel}</span></span>
                                    </span>
                                </td>
                                <td>
                                    <span className="quota">
                                        <span className="n">{mailbox.usedGb} of {mailbox.quotaGb} GB</span>
                                        <span className={`bar${share >= 75 ? ' warn' : ''}`}><i style={{ width: `${Math.min(share, 100)}%` }} /></span>
                                    </span>
                                </td>
                                <td className={`sm mut${notSetUp ? ' is-warn' : ''}`}>{formatRelative(mailbox.lastLoginAt)}</td>
                                <td><MailboxStatus mailbox={mailbox} /></td>
                                <td>
                                    <span className="act-btns">
                                        {notSetUp
                                            ? <Button size="sm" href={route('setup.device')}>Send setup link</Button>
                                            : <Button variant="line" size="sm" href={route('dashboard.mailboxes.show', { mailbox: mailbox.id })}>Manage</Button>}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </Table>
            )}

            <Note title="Changing a quota" className="mt-l">
                <p>
                    Raise or lower any mailbox from <b>Manage</b>. You cannot set a quota below what a mailbox already uses, so clear some
                    space first and nothing is lost. Unassigned storage stays in the pool until you hand it out.
                </p>
            </Note>

            <AddMailboxDialog
                open={dialog.isOpen}
                onClose={dialog.close}
                domain={domain}
                mailboxes={mailboxes}
                pool={pool}
            />
        </DashboardLayout>
    );
}
