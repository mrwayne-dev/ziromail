import { usePage } from '@inertiajs/react';
import DataTable from '../../Components/ui/DataTable';
import { MetricRow } from '../../Components/ui/MetricTile';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import SeriesChart from '../../Components/ops/SeriesChart';
import Note from '../../Components/ui/Note';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatPrice } from '../../Lib/money';

export default function Reports() {
    const { month, headline: h, usersByMonth, billing, earlier } = usePage().props;
    const tiles = [
        { k: 'New users', v: h.newUsers, d: `${h.newUsersLast} last month`, delta: typeof h.newUsersLast === 'number' ? { value: h.newUsers - h.newUsersLast, unit: '', label: 'vs last month' } : null },
        { k: 'New domains', v: h.newDomains, d: 'added this month' },
        { k: 'New mailboxes', v: h.newMailboxes, d: 'created this month' },
        { k: 'Billed', v: formatPrice(h.billedMinor, 'NGN'), d: 'paid invoices this month' },
        { k: 'Storage assigned', v: h.assignedGb, unit: 'GB', d: 'across all mailboxes' },
    ];
    const bars = usersByMonth.map((point, index, all) => ({ label: point.label, value: point.total, tone: index === all.length - 1 ? 'now' : 'plain' }));

    return (
        <OpsLayout page="ops-reports" title="Reports">
            <SectionHeader
                title={`Monthly report, ${month}`}
                description="Counted from our records: who joined, what was added, what was billed."
            />

            <MetricRow items={tiles} label={`Headline figures for ${month}`} />

            <SubSection id="gr-h" title="Users, month by month" description="Total accounts at the end of each of the last six months.">
                <section className="ops-card">
                    <div className="ops-reports-chart"><SeriesChart kind="bars" points={bars} label={`Accounts by month: ${usersByMonth.map((p) => `${p.label} ${p.total}`).join(', ')}`} height={132} /></div>
                    <div className="ops-axis-row">
                        {usersByMonth.map((p) => <span key={p.label} className="ops-center">{p.label}<br /><b className="ops-tnum">{p.total}</b></span>)}
                    </div>
                </section>
            </SubSection>

            <SubSection id="mn-h" title="Billing">
                <section className="ops-card">
                    <dl>
                        {[
                            ['Paid to date', formatPrice(billing.paidMinor, 'NGN')],
                            ['Invoices issued', billing.invoices],
                            ['Unpaid or failed', billing.overdue],
                        ].map(([k, v]) => (
                            <div className="ops-kv-row">
                                <dt>{k}</dt>
                                <dd className="num">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </SubSection>

            <Note title="Not in this report yet">
                <p>Uptime, support volume, departures and why customers left, and refunds are not recorded anywhere yet. They appear here once the systems that produce them are connected.</p>
            </Note>

            <SubSection id="ar-h" title="Earlier months">
                <DataTable
                    columns={[
                        { id: 'month', header: 'Month', accessor: (row) => row.month, nowrap: true },
                        { id: 'users', header: 'Accounts', accessor: (row) => row.users.toLocaleString('en-NG'), align: 'num', sortable: true, sortValue: (row) => row.users },
                        { id: 'billed', header: 'Billed', accessor: (row) => formatPrice(row.billedMinor, 'NGN'), align: 'num', sortable: true, sortValue: (row) => row.billedMinor },
                    ]}
                    rows={earlier}
                    rowKey={(row) => row.month}
                    emptyState={{ title: 'No history yet' }}
                />
            </SubSection>
        </OpsLayout>
    );
}
