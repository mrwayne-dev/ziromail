import { Link, usePage } from '@inertiajs/react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import AddMailboxDialog from '../../Components/dashboard/AddMailboxDialog';
import { MailboxStatus } from '../../Components/dashboard/MailboxTable';
import PoolBar from '../../Components/domain/PoolBar';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import DataTable from '../../Components/ui/DataTable';
import { AlertIcon } from '../../Components/ui/Icons';
import { MetricRow } from '../../Components/ui/MetricTile';
import Note from '../../Components/ui/Note';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import useDisclosure from '../../Hooks/useDisclosure';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatGb, formatRelative } from '../../Lib/format';
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
            <SectionHeader
                title="Mailboxes"
                description={<>Everything here belongs to <span className="mono">{domain.name}</span>. Switch domain at the top to manage another.</>}
                actions={<>
                    {can.create && <Button variant="ink" size="sm" onClick={dialog.open}>Add a mailbox</Button>}
                    {can.buyStorage && <Button variant="line" size="sm" href={withDomain('dashboard.storage')}>Add extra storage</Button>}
                </>}
            />

            <MetricRow label="Pool figures" items={[
                { k: 'Assigned', v: pool.assignedGb, unit: `of ${pool.poolGb} GB`, d: 'given to mailboxes' },
                { k: 'Actually used', v: formatGb(pool.usedGb), d: 'across all mailboxes' },
                { k: 'Unassigned', v: formatGb(Math.max(pool.unassignedGb, 0)), d: pool.unassignedGb > 0 ? 'still in the pool' : 'everything is handed out' },
                { k: 'Plan', v: plan.name, d: pool.ceilingGb ? `expandable to ${pool.ceilingGb} GB` : 'at pool limit' },
            ]} />

            {recordsBroken && (
                <div className="mt-24">
                    <Banner tone="warn" icon={<AlertIcon />} title={domain.healthNote}>
                        <p>Mail from this domain may be refused by Gmail and Outlook until the record is fixed. <Link href={withDomain('dashboard.domains.show', { domain: domain.id })}>Fix the records</Link>.</p>
                    </Banner>
                </div>
            )}

            <SubSection id="pool-h" title="Storage pool" description="How the pool is split between mailboxes right now.">
                <section className="ops-card">
                    <PoolBar segments={segments} freeGb={Math.max(pool.unassignedGb, 0)} description={description} />
                    <div className="pool-key mt-12">
                        {mailboxes.map((mailbox, index) => (
                            <span key={mailbox.id}><i className={`key-${(index % 5) + 1}`} /> {mailbox.local}@</span>
                        ))}
                        {pool.unassignedGb > 0 && <span><i className="key-free" /> unassigned</span>}
                    </div>
                </section>
            </SubSection>

            <SubSection id="list-h" title="Every mailbox" description={mailboxes.length === 0 ? 'None added yet.' : `${mailboxes.length} on ${domain.name}.`}>
                <DataTable
                    columns={[
                        {
                            id: 'mailbox',
                            header: 'Mailbox',
                            sortable: true,
                            sortValue: (row) => row.local,
                            accessor: (row) => (
                                <span className="ops-inline-gap" style={{ alignItems: 'center' }}>
                                    <b className="mono">{row.local}@{domain.name}</b>
                                    <span className="ops-sm ops-mut">· {row.roleLabel}</span>
                                </span>
                            ),
                        },
                        {
                            id: 'quota',
                            header: 'Quota',
                            sortable: true,
                            sortValue: (row) => row.usedGb,
                            accessor: (row) => {
                                const share = row.quotaGb > 0 ? row.usedGb / row.quotaGb : 0;
                                const tone = share >= 0.9 ? 'bad' : share >= 0.75 ? 'watch' : null;
                                return (
                                    <span className="ops-usage">
                                        <span className="ops-usage-bar">
                                            <i className={`ops-usage-fill ${tone ?? ''}`.trim()} style={{ width: `${Math.min(share * 100, 100)}%` }} />
                                        </span>
                                        <span className="ops-sm ops-tnum">{row.usedGb} / {row.quotaGb} GB</span>
                                    </span>
                                );
                            },
                        },
                        {
                            id: 'last',
                            header: 'Last signed in',
                            nowrap: true,
                            sub: true,
                            sortable: true,
                            sortValue: (row) => row.lastLoginAt ?? '',
                            accessor: (row) => formatRelative(row.lastLoginAt),
                        },
                        { id: 'status', header: 'Status', accessor: (row) => <MailboxStatus mailbox={row} /> },
                    ]}
                    rows={mailboxes}
                    rowKey={(row) => row.id}
                    renderActions={(row) => row.state === 'not_set_up'
                        ? <Button size="sm" href={route('setup.device')}>Send setup link</Button>
                        : <Button variant="line" size="sm" href={route('dashboard.mailboxes.show', { mailbox: row.id })}>Manage</Button>}
                    emptyState={{
                        title: 'No mailboxes yet',
                        body: 'Mailboxes you add to this domain draw from its storage pool.',
                        action: can.create ? <Button variant="ink" size="sm" onClick={dialog.open}>Add your first mailbox</Button> : null,
                    }}
                />
            </SubSection>

            <Note title="Changing a quota" className="mt-24">
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
