import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import useOpsLoading from '../../Hooks/useOpsLoading';
import DataTable from '../../Components/ops/DataTable';
import SectionHeader from '../../Components/ops/SectionHeader';
import Button from '../../Components/ui/Button';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatDate } from '../../Lib/format';
import { route } from '../../Lib/route';

const STATE = { healthy: ['ok', 'Healthy'], setup_incomplete: ['watch', 'Setup incomplete'], payment_overdue: ['bad', 'Payment overdue'], no_domain: [null, 'No domain yet'] };

export default function Users() {
    const { query, rows, page } = usePage().props;
    const [text, setText] = useState(query ?? '');
    const loading = useOpsLoading();

    return (
        <OpsLayout page="ops-users" title="Users">
            <SectionHeader
                title="Users"
                description="Every customer account. Search by business, person, email address, domain or mailbox address: whatever the caller has in front of them."
            />

            <DataTable
                loading={loading}
                toolbar={{
                    caption: 'Users',
                    search: { value: text, onChange: setText, placeholder: 'Business, name, email, domain or mailbox address' },
                    right: <>
                        <Button size="sm" onClick={() => router.get(route('ops.users'), { q: text }, { preserveState: true })}>Search</Button>
                        {query && <Button variant="line" size="sm" onClick={() => { setText(''); router.get(route('ops.users'), {}, { preserveState: true }); }}>Clear</Button>}
                    </>,
                }}
                columns={[
                    { id: 'business', header: 'Business', accessor: (row) => (
                        <span>
                            <b className="block">{row.business}</b>
                            <span className="ops-sm ops-mut">{row.email}</span>
                        </span>
                    ), sortable: true, sortValue: (row) => row.business },
                    { id: 'domains', header: 'Domains', accessor: (row) => row.domains.length === 0 ? '—' : row.domains.map((domain) => domain.name).join(', '), mono: true },
                    { id: 'mailboxes', header: 'Mailboxes', accessor: (row) => row.mailboxCount, align: 'num', sortable: true },
                    { id: 'storage', header: 'Storage', accessor: (row) => `${row.usedGb} / ${row.poolGb} GB`, align: 'num', sortValue: (row) => row.usedGb },
                    { id: 'state', header: 'State', accessor: (row) => {
                        const [tone, label] = STATE[row.state] ?? [null, row.state];
                        return <span className={`ops-pill${tone ? ' ' + tone : ''}`}>{label}</span>;
                    } },
                    { id: 'joined', header: 'Joined', accessor: (row) => formatDate(row.createdAt), align: 'num', sortable: true, sortValue: (row) => row.createdAt },
                ]}
                rows={rows}
                rowKey={(row) => row.id}
                rowHref={(row) => route('ops.users.show', { user: row.id })}
                pagination={{ pageSize: page.perPage, totalRows: page.total, page: page.current, onPage: (p) => router.get(route('ops.users'), { q: query || undefined, page: p }, { preserveState: true }) }}
                emptyState={{ title: query ? 'No account matches' : 'No accounts yet', body: query ? 'Try part of a domain or an email address.' : 'New sign-ups appear here.' }}
            />
        </OpsLayout>
    );
}
