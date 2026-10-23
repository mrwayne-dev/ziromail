import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import useOpsLoading from '../../Hooks/useOpsLoading';
import DataTable from '../../Components/ui/DataTable';
import SectionHeader from '../../Components/ui/SectionHeader';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatDate, formatTime } from '../../Lib/format';
import { route } from '../../Lib/route';

const STATES = [
    { value: 'any', label: 'Any outcome' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'deferred', label: 'Deferred' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'rejected', label: 'Rejected' },
];
const PERIODS = [
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
];

export default function Queue() {
    const { filters, totals, rows } = usePage().props;
    const [text, setText] = useState(filters.q ?? '');
    const loading = useOpsLoading();
    const total = totals.delivered + totals.deferred + totals.bounced + totals.rejected;
    const go = (next) => router.get(route('ops.queue'), { ...filters, ...next, q: next.q !== undefined ? next.q || undefined : (filters.q || undefined) }, { preserveState: true, replace: true });

    return (
        <OpsLayout page="ops-queue" title="Delivery log">
            <SectionHeader
                title="Delivery log"
                description={<>Hourly outcomes for each customer domain and the provider it mails. Answers &ldquo;is mail reaching Gmail from this domain?&rdquo;</>}
                actions={<Button variant="line" size="sm" href={route('ops.deliverability')}>Deliverability</Button>}
            />

            <p className="ops-sm ops-mut mb-12">
                {total === 0
                    ? 'Nothing matches. If the mail server is not connected yet, nothing is reported.'
                    : <>In this period: <b>{totals.delivered.toLocaleString('en-NG')}</b> delivered, <b>{totals.deferred.toLocaleString('en-NG')}</b> deferred, <b>{totals.bounced.toLocaleString('en-NG')}</b> bounced, <b>{totals.rejected.toLocaleString('en-NG')}</b> rejected.</>}
            </p>

            <DataTable
                loading={loading}
                toolbar={{
                    caption: 'Delivery outcomes',
                    search: { value: text, onChange: (value) => { setText(value); go({ q: value }); }, placeholder: 'Customer domain or provider' },
                    chips: [
                        ...PERIODS.map((p) => ({ value: 'period:' + p.value, label: p.label, pressed: filters.period === p.value, onClick: () => go({ period: p.value }) })),
                    ],
                    right: (
                        <select className="input" value={filters.state} onChange={(e) => go({ state: e.target.value })} aria-label="Outcome" className="ops-toolbar-sel">
                            {STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    ),
                }}
                columns={[
                    { id: 'hour', header: 'Hour', accessor: (row) => `${formatDate(row.at, { year: false })} ${formatTime(row.at)}`, mono: true, nowrap: true, align: 'num', sortable: true, sortValue: (row) => row.at },
                    { id: 'domain', header: 'Customer domain', accessor: (row) => row.domain, mono: true, sortable: true },
                    { id: 'recipient', header: 'Provider', accessor: (row) => row.recipientDomain, mono: true, sortable: true },
                    { id: 'delivered', header: 'Delivered', accessor: (row) => row.delivered.toLocaleString('en-NG'), align: 'num', sortable: true },
                    { id: 'deferred', header: 'Deferred', accessor: (row) => row.deferred.toLocaleString('en-NG'), align: 'num', sortable: true },
                    { id: 'bounced', header: 'Bounced', accessor: (row) => row.bounced.toLocaleString('en-NG'), align: 'num', sortable: true },
                    { id: 'rejected', header: 'Rejected', accessor: (row) => row.rejected.toLocaleString('en-NG'), align: 'num', sortable: true },
                    { id: 'reply', header: 'Last reply', accessor: (row) => row.replyCode ?? '—', mono: true, nowrap: true },
                ]}
                rows={rows}
                rowKey={(row) => row.id}
                emptyState={{ title: 'No rows', body: 'Widen the period or clear the search.' }}
            />

            <Note title="Why there is no message-by-message view" className="mt">
                <p>We do not keep subject lines, recipient addresses or message ids, so staff cannot look up a single message. A 451 or 421 in the last reply means that provider is asking us to slow down: the mail is held and retried, not lost. If one provider keeps deferring, move that domain to the backup relay.</p>
            </Note>
        </OpsLayout>
    );
}
