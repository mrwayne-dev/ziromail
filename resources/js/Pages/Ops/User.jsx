import { usePage } from '@inertiajs/react';
import ActivityFeed from '../../Components/ui/ActivityFeed';
import DataTable from '../../Components/ui/DataTable';
import RecordStrip from '../../Components/ops/RecordStrip';
import SectionHeader from '../../Components/ui/SectionHeader';
import Note from '../../Components/ui/Note';
import OpsLayout from '../../Layouts/OpsLayout';
import { formatDate, formatGb, formatRelative } from '../../Lib/format';
import { formatPrice } from '../../Lib/money';
import { route } from '../../Lib/route';

const STATE_TONE = { active: 'ok', not_set_up: null, suspended: 'bad', locked: 'bad' };
const USER_TONE = { healthy: 'ok', payment_overdue: 'bad', setup_incomplete: 'watch', no_domain: null };

export default function User() {
    const { user, domains, activity } = usePage().props;

    return (
        <OpsLayout page="ops-user" title={user.business} parent={{ href: route('ops.users'), label: 'Users' }}>
            <SectionHeader
                title={user.business}
                description={`${user.name} · ${user.email} · joined ${formatDate(user.createdAt)}`}
                badge={<span className={`ops-pill ${USER_TONE[user.state] ?? ''}`}>{user.state.replace('_', ' ')}</span>}
            />

            <div className="ops-row2">
                <div className="ops-stack">
                    {domains.length === 0 && (
                        <section className="ops-card ops-empty"><b>No domain yet</b><p>This account has not added a domain.</p></section>
                    )}
                    {domains.map((domain) => (
                        <section key={domain.id} className="ops-card" aria-labelledby={`d-${domain.id}`}>
                            <div className="ops-card-head-row">
                                <h2 className="ops-card-h mono" id={`d-${domain.id}`}>{domain.name}</h2>
                                <span className={`ops-pill ${domain.state === 'live' ? 'ok' : 'watch'}`}>{domain.state}</span>
                            </div>
                            <dl className="mt-10">
                                {[
                                    ['Plan', `${domain.plan ?? '—'}${domain.subscriptionStatus ? ` · ${domain.subscriptionStatus}` : ''}`],
                                    ['Renews', domain.renewsAt ? formatDate(domain.renewsAt) : 'Not set'],
                                    ['Registrar', domain.registrar ?? 'Not given'],
                                    ['Storage', `${formatGb(domain.assignedGb)} assigned of ${domain.poolGb} GB, ${formatGb(domain.usedGb)} used`],
                                    ['Records', <RecordStrip key="r" records={{ MX: 'na', SPF: 'na', DKIM: 'na', DMARC: 'na', ...domain.records }} />],
                                ].map(([k, v]) => (
                                    <div className="ops-kv-row sm">
                                        <dt>{k}</dt>
                                        <dd className="right">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-14">
                                <DataTable
                                    columns={[
                                        { id: 'address', header: 'Address', accessor: (row) => row.address, mono: true, sortable: true },
                                        { id: 'quota', header: 'Quota', accessor: (row) => `${row.quotaGb} GB`, align: 'num', sortable: true, sortValue: (row) => row.quotaGb },
                                        { id: 'used', header: 'Used', accessor: (row) => `${row.usedGb} GB`, align: 'num', sortable: true, sortValue: (row) => row.usedGb },
                                        { id: 'last', header: 'Last sign-in', accessor: (row) => <span className="ops-mut">{formatRelative(row.lastLoginAt)}</span> },
                                        { id: 'state', header: 'State', accessor: (row) => <span className={`ops-pill ${STATE_TONE[row.state] ?? ''}`}>{row.state.replace('_', ' ')}</span> },
                                    ]}
                                    rows={domain.mailboxes}
                                    rowKey={(row) => row.address}
                                    emptyState={{ title: 'No mailboxes yet' }}
                                />
                            </div>
                        </section>
                    ))}
                </div>

                <div className="ops-stack">
                    <section className="ops-card">
                        <h3 className="ops-card-h-sm">Account</h3>
                        <dl className="mt-10">
                            {[
                                ['Email', `${user.email}${user.emailVerified ? '' : ' (not confirmed)'}`],
                                ['Phone', user.phone ?? 'Not given'],
                                ['Two-factor', user.twoFactorEnabled ? 'On' : 'Off'],
                                ['Last sign-in', formatRelative(user.lastLoginAt)],
                                ['Paid to date', `${formatPrice(user.paidToDateMinor, 'NGN')} in ${user.invoiceCount} invoices`],
                            ].map(([k, v]) => (
                                <div className="ops-kv-row sm">
                                    <dt>{k}</dt>
                                    <dd>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                    <section className="ops-card">
                        <h3 className="ops-card-h-sm">Activity</h3>
                        <div className="mt-10">
                            {activity.length === 0 ? <p className="ops-sm ops-mut">Nothing recorded yet.</p> : <ActivityFeed items={activity} />}
                        </div>
                    </section>
                    <Note title="What staff can and cannot see">
                        <p>Staff see sizes, states and billing facts. Nobody on staff can open a customer's mailbox, and no message content is stored on our side to show.</p>
                    </Note>
                </div>
            </div>
        </OpsLayout>
    );
}
