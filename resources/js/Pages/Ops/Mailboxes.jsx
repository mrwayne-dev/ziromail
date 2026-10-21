import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import useOpsLoading from '../../Hooks/useOpsLoading';
import DataTable from '../../Components/ops/DataTable';
import { MetricRow } from '../../Components/ops/MetricTile';
import SectionHeader from '../../Components/ops/SectionHeader';
import Note from '../../Components/ui/Note';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatRelative } from '../../Lib/format';
import { route } from '../../Lib/route';

const FILTERS = [['attention', 'Needs attention'], ['full', 'Over 90% full'], ['never', 'Never signed in'], ['suspended', 'Suspended'], ['all', 'All']];

function state(row) {
    const share = row.quotaGb > 0 ? row.usedGb / row.quotaGb : 0;
    if (row.state === 'locked' || row.state === 'suspended') return { tone: 'bad', label: row.state === 'locked' ? 'Sending locked' : 'Suspended' };
    if (share >= 0.9) return { tone: 'bad', label: `${Math.round(share * 100)}% full` };
    if (share >= 0.75) return { tone: 'watch', label: `${Math.round(share * 100)}% full` };
    if (!row.lastLoginAt) return { tone: null, label: 'Never signed in' };
    return { tone: 'ok', label: 'Active' };
}

export default function Mailboxes() {
    useRealtimeReload({ channel: 'ops', map: { mailboxes: ['rows', 'filters'], abuse: ['rows'] } });

    const { query, filter, counts, figures, rows, page } = usePage().props;
    const [text, setText] = useState(query ?? '');
    const loading = useOpsLoading();
    const go = (params) => router.get(route('ops.mailboxes'), params, { preserveState: true });

    const tiles = [
        { k: 'Total', v: figures.total.toLocaleString('en-NG'), d: 'on the platform' },
        { k: 'Active in 30d', v: figures.active30.toLocaleString('en-NG'), d: 'signed in recently' },
        { k: 'Over 90% full', v: figures.over90, d: 'delivery stops at 100%', tone: figures.over90 > 0 ? 'watch' : undefined },
        { k: 'Never signed in', v: figures.never, d: 'created but unused' },
        { k: 'Suspended', v: figures.suspended, d: 'or sending locked', tone: figures.suspended > 0 ? 'watch' : undefined },
        { k: 'Median size', v: figures.medianGb === null ? '—' : figures.medianGb, unit: figures.medianGb === null ? undefined : 'GB', d: 'used per mailbox' },
    ];

    return (
        <OpsLayout page="ops-mailboxes" title="Mailboxes">
            <SectionHeader
                title="Mailboxes"
                description="Every mailbox on the platform by size, state and last sign-in. The fullest and the dormant come first."
            />

            <MetricRow items={tiles} label="Mailbox figures" />

            <div className="mt-24">
                <DataTable
                    toolbar={{
                        caption: 'Mailboxes',
                        search: { value: text, onChange: (value) => { setText(value); go({ q: value || undefined, filter }); }, placeholder: 'Address, domain or business' },
                        chips: FILTERS.map(([key, label]) => ({
                            value: key, label, count: counts[key], pressed: filter === key,
                            onClick: () => go({ q: query || undefined, filter: key }),
                        })),
                    }}
                    columns={[
                        { id: 'address', header: 'Address', accessor: (row) => row.address, mono: true, sortable: true },
                        { id: 'owner', header: 'Held by', accessor: (row) => row.owner, sortable: true },
                        { id: 'storage', header: 'Storage', accessor: (row) => {
                            const share = row.quotaGb > 0 ? row.usedGb / row.quotaGb : 0;
                            const tone = share >= 0.9 ? 'bad' : share >= 0.75 ? 'watch' : null;
                            return <span className="ops-usage">
                                <span className="ops-usage-bar">
                                    <i className={`ops-usage-fill ${tone ?? ''}`.trim()} style={{ width: `${Math.min(share * 100, 100)}%` }} />
                                </span>
                                <span className="ops-sm ops-tnum">{row.usedGb} / {row.quotaGb} GB</span>
                            </span>;
                        }, sortValue: (row) => row.usedGb },
                        { id: 'last', header: 'Last sign-in', accessor: (row) => <span className="ops-mut">{formatRelative(row.lastLoginAt)}</span>, sortable: true, sortValue: (row) => row.lastLoginAt ?? '' },
                        { id: 'state', header: 'State', accessor: (row) => { const value = state(row); return <span className={`ops-pill${value.tone ? ' ' + value.tone : ''}`}>{value.label}</span>; } },
                    ]}
                    rows={rows}
                    rowKey={(row) => row.id}
                    rowHref={(row) => route('ops.users.show', { user: row.ownerId })}
                    pagination={{ pageSize: page.perPage, totalRows: page.total, page: page.current, onPage: (p) => go({ q: query || undefined, filter, page: p }) }}
                    emptyState={{ title: 'No mailbox matches', body: 'Try a different filter or clear the search.' }}
                />
            </div>

            <Note title="What happens when a mailbox fills up" className="mt">
                <p>At 90% the owner is emailed. At 100% incoming mail is held in the queue for 72 hours rather than rejected, so nothing is lost while somebody frees space or raises the quota. If the pool itself is full, that is a sales conversation, not a support one.</p>
            </Note>
        </OpsLayout>
    );
}
