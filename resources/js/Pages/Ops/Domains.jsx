import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import useOpsLoading from '../../Hooks/useOpsLoading';
import DataTable from '../../Components/ops/DataTable';
import RecordStrip from '../../Components/ops/RecordStrip';
import SectionHeader from '../../Components/ops/SectionHeader';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatDate } from '../../Lib/format';
import { route } from '../../Lib/route';

const FILTERS = [['all', 'All'], ['live', 'Live'], ['pending', 'Not live yet'], ['broken', 'Records failing']];

export default function Domains() {
    const { query, filter, counts, rows, page } = usePage().props;
    const [text, setText] = useState(query ?? '');
    const loading = useOpsLoading();
    const go = (params) => router.get(route('ops.domains'), params, { preserveState: true });

    return (
        <OpsLayout page="ops-domains" title="Domains">
            <SectionHeader
                title="Domain status"
                description="Every domain on the platform and the account that holds it. A name several accounts are claiming is marked: only one can ever be live."
            />

            <DataTable
                loading={loading}
                toolbar={{
                    caption: 'Domains',
                    search: { value: text, onChange: (value) => { setText(value); go({ q: value || undefined, filter }); }, placeholder: 'Domain, business or email address' },
                    chips: FILTERS.map(([key, label]) => ({ value: key, label, count: counts[key], pressed: filter === key, onClick: () => go({ q: query || undefined, filter: key }) })),
                }}
                columns={[
                    { id: 'name', header: 'Domain', accessor: (row) => row.name, mono: true, sortable: true },
                    { id: 'owner', header: 'Held by', accessor: (row) => (
                        <span>
                            <b className="block">{row.owner}</b>
                            <span className="ops-sm ops-mut">{row.ownerEmail}</span>
                        </span>
                    ) },
                    { id: 'plan', header: 'Plan', accessor: (row) => `${row.plan ?? '—'}${row.subscriptionStatus === 'incomplete' ? ' (unpaid)' : ''}` },
                    { id: 'records', header: 'Records', accessor: (row) => <RecordStrip records={{ MX: 'na', SPF: 'na', DKIM: 'na', DMARC: 'na', ...row.records }} />, nowrap: true },
                    { id: 'state', header: 'State', accessor: (row) => (
                        <span className="ops-inline-gap">
                            <span className={`ops-pill ${row.state === 'live' ? 'ok' : 'watch'}`}>{row.state}</span>
                            {row.contested && <span className="ops-pill bad">Contested</span>}
                        </span>
                    ) },
                    { id: 'added', header: 'Added', accessor: (row) => formatDate(row.addedAt), align: 'num', sortable: true, sortValue: (row) => row.addedAt },
                ]}
                rows={rows}
                rowKey={(row) => row.id}
                rowHref={(row) => route('ops.users.show', { user: row.ownerId })}
                pagination={{ pageSize: page.perPage, totalRows: page.total, page: page.current, onPage: (p) => go({ q: query || undefined, filter, page: p }) }}
                emptyState={{ title: 'No domain matches', body: 'Try part of a domain, a business name or an email address.' }}
            />
        </OpsLayout>
    );
}
