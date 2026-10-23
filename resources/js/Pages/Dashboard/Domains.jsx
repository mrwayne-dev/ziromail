import { usePage } from '@inertiajs/react';
import AddDomainDialog from '../../Components/dashboard/AddDomainDialog';
import Button from '../../Components/ui/Button';
import DataTable from '../../Components/ui/DataTable';
import { MetricRow } from '../../Components/ui/MetricTile';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import SectionHeader from '../../Components/ui/SectionHeader';
import useDisclosure from '../../Hooks/useDisclosure';
import useQuery from '../../Hooks/useQuery';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatDate, formatGb, pluralise } from '../../Lib/format';
import { route } from '../../Lib/route';

const PLAN_NAME = { starter: 'Starter', business: 'Business', premium: 'Premium' };

function StorageCell({ used, total }) {
    const share = total > 0 ? Math.round((used / total) * 100) : 0;
    const tone = share >= 90 ? 'bad' : share >= 75 ? 'watch' : null;
    return (
        <span className="ops-usage">
            <span className="ops-usage-bar">
                <i className={`ops-usage-fill ${tone ?? ''}`.trim()} style={{ width: `${Math.min(share, 100)}%` }} />
            </span>
            <span className="ops-sm ops-tnum">{formatGb(used)} of {formatGb(total)}</span>
        </span>
    );
}

export default function Domains() {
    const query = useQuery();
    const { domains, canAddDomain } = usePage().props;
    const dialog = useDisclosure(query.get('add') === '1' || window.location.hash === '#add');

    const totalMailboxes = domains.reduce((n, d) => n + d.mailboxCount, 0);
    const totalUsed = domains.reduce((n, d) => n + d.usedGb, 0);
    const totalPool = domains.reduce((n, d) => n + d.poolGb, 0);
    const unhealthy = domains.filter((d) => d.recordsPassing < d.recordsTotal).length;

    return (
        <DashboardLayout page="admin-domains" title="Your domains" description="Every domain on this account, its plan and its storage.">
            <SectionHeader
                title="Your domains"
                description="Each domain carries its own plan and its own storage pool. Nothing is shared between them."
                actions={canAddDomain ? <Button variant="ink" size="sm" onClick={dialog.open}>Add a domain</Button> : null}
            />

            <MetricRow label="Domain figures" items={[
                { k: 'Domains', v: domains.length, d: pluralise(domains.length, 'live domain', 'live domains') },
                { k: 'Mailboxes', v: totalMailboxes, d: 'across all domains' },
                { k: 'Storage used', v: formatGb(totalUsed), d: `of a ${formatGb(totalPool)} combined pool` },
                { k: 'Needs attention', v: unhealthy, tone: unhealthy > 0 ? 'watch' : undefined, d: unhealthy === 0 ? 'all records passing' : 'DNS records to fix' },
            ]} />

            <div className="mt-24">
                <DataTable
                    columns={[
                        { id: 'name', header: 'Domain', mono: true, sortable: true, accessor: (d) => d.name },
                        { id: 'plan', header: 'Plan', sortable: true, sortValue: (d) => PLAN_NAME[d.planCode] ?? 'zzz', accessor: (d) => PLAN_NAME[d.planCode] ?? 'No plan yet' },
                        { id: 'storage', header: 'Storage', sortable: true, sortValue: (d) => d.usedGb, accessor: (d) => <StorageCell used={d.usedGb} total={d.poolGb} /> },
                        { id: 'mailboxes', header: 'Mailboxes', align: 'num', sortable: true, accessor: (d) => d.mailboxCount },
                        { id: 'records', header: 'Records', accessor: (d) => d.recordsPassing === d.recordsTotal
                            ? <Pill tone="ok">All records passing</Pill>
                            : <Pill tone="warn">{d.healthNote}</Pill>
                        },
                        { id: 'renews', header: 'Renews', nowrap: true, sub: true, sortable: true, sortValue: (d) => d.renewsAt ?? '', accessor: (d) => d.renewsAt ? formatDate(d.renewsAt) : '—' },
                    ]}
                    rows={domains}
                    rowKey={(d) => d.id}
                    renderActions={(d) => {
                        const healthy = d.recordsPassing === d.recordsTotal;
                        return (
                            <Button variant={healthy ? 'line' : 'primary'} size="sm" href={`${route('dashboard.domains.show', { domain: d.id })}?domain=${d.id}`}>
                                {healthy ? 'Manage' : 'Fix records'}
                            </Button>
                        );
                    }}
                    emptyState={{ title: 'No domains yet', body: 'Add a domain to get started.' }}
                />
            </div>

            <Note title="Why each domain needs its own plan" className="mt-24">
                <p>
                    Storage is pooled per domain, not per account. That keeps the pricing honest: a domain with two mailboxes never
                    subsidises one with forty, and you can put a small plan on a side business without paying for it twice. Mailboxes
                    stay unlimited on every plan.
                </p>
            </Note>

            <AddDomainDialog open={dialog.isOpen} onClose={dialog.close} />
        </DashboardLayout>
    );
}
