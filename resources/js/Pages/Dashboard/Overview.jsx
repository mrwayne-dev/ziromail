import { Link, usePage } from '@inertiajs/react';
import { AtSign, FileText, KeyRound, Mail } from 'lucide-react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import ActivityFeed from '../../Components/ui/ActivityFeed';
import MailboxTable from '../../Components/dashboard/MailboxTable';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import { AlertIcon } from '../../Components/ui/Icons';
import Meter from '../../Components/ui/Meter';
import { MetricRow } from '../../Components/ui/MetricTile';
import Pill from '../../Components/ui/Pill';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatDate, formatGb, greeting } from '../../Lib/format';
import { formatPrice } from '../../Lib/money';
import { route } from '../../Lib/route';


const QUICK_ACTIONS = [
    { icon: Mail,     title: 'Add a mailbox',    note: 'For a new staff member',    routeName: 'dashboard.mailboxes' },
    { icon: AtSign,   title: 'Resend setup link',note: 'By WhatsApp or email',      routeName: 'setup.device' },
    { icon: KeyRound, title: 'Reset a password', note: 'Without calling support',   routeName: 'dashboard.mailboxes' },
    { icon: FileText, title: 'View invoices',    note: 'Download receipts',         routeName: 'dashboard.billing' },
];

export default function Overview() {
    const owner = usePage().props.auth?.user?.ownerId ?? usePage().props.auth?.user?.id;
    useRealtimeReload({ channel: `account.${owner}`, map: { domain: ['account','cards','alerts'], mailbox: ['cards','alerts'], security: ['alerts','activity'] } });

    const { org, domain, stats, alerts, mailboxes, subscription, activity } = usePage().props;
    const term = subscription.term === 'annual' ? 'yearly' : 'monthly';
    const price = subscription.priceNet;
    const withDomain = (name, params) => `${route(name, params)}?domain=${domain.id}`;
    const healthTone = stats.recordsPassing === stats.recordsTotal ? 'ok' : 'watch';

    return (
        <DashboardLayout page="admin" title="Dashboard" description="Your domain, mailboxes, plan and what needs attention.">
            <SectionHeader
                eyebrow={org.name}
                title={<span className="mono">{domain.name}</span>}
                description={`${greeting()}, ${org.owner.name.split(' ')[0]}. Everything below is for this domain.`}
                actions={<>
                    <Button variant="ink" size="sm" href={withDomain('dashboard.mailboxes')}>Add a mailbox</Button>
                    <Button variant="line" size="sm" href={route('dashboard.domains')}>Switch domain</Button>
                </>}
            />

            <MetricRow label="Domain figures" items={[
                { k: 'Mailboxes',     v: stats.mailboxCount, d: 'no seat limit' },
                { k: 'Storage used',  v: formatGb(stats.usedGb), d: `of a ${formatGb(stats.poolGb)} pool` },
                { k: 'Plan',          v: stats.planName, d: `renews ${stats.renewsAt ? formatDate(stats.renewsAt) : 'not set'}` },
                { k: 'Domain health', v: `${stats.recordsPassing} / ${stats.recordsTotal}`, tone: healthTone, d: stats.recordsPassing === stats.recordsTotal ? 'all records passing' : stats.healthNote },
            ]} />

            {alerts.length > 0 && (
                <section aria-labelledby="att-h" className="mt-l">
                    <h2 id="att-h" className="sr-only">What needs your attention</h2>
                    <div className="stack">
                        {alerts.map((alert) => (
                            <Banner key={alert.id} tone={alert.kind} icon={<AlertIcon />} title={alert.title}>
                                <p>{alert.body}</p>
                                <div className="alert-cta">
                                    <Button variant="line" size="sm" href={withDomain(alert.cta.routeName, alert.cta.params)}>{alert.cta.label}</Button>
                                </div>
                            </Banner>
                        ))}
                    </div>
                </section>
            )}

            <SubSection id="qa-h" title="Quick actions">
                <div className="qa-grid">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link className="qa" key={action.title} href={withDomain(action.routeName)}>
                                <span className="ic" aria-hidden="true"><Icon size={18} strokeWidth={1.75} /></span>
                                <b>{action.title}</b>
                                <span>{action.note}</span>
                            </Link>
                        );
                    })}
                </div>
            </SubSection>

            <div className="ops-row2 mt-24">
                <div className="ops-stack">
                    <SubSection id="mb-h" title="Your mailboxes" tLink={{ href: withDomain('dashboard.mailboxes'), label: 'See all' }}>
                        <section className="ops-card">
                            {mailboxes.length > 0 ? (
                                <MailboxTable mailboxes={mailboxes} domainName={domain.name} />
                            ) : (
                                <p className="ops-sm ops-mut">No mailboxes on this domain yet.</p>
                            )}
                            <div className="mt-16">
                                <Meter used={stats.assignedGb} total={stats.poolGb} label={`${formatGb(stats.assignedGb)} of ${formatGb(stats.poolGb)} assigned to mailboxes`} />
                                <p className="ops-sm ops-mut mt-8">{formatGb(stats.assignedGb)} of {formatGb(stats.poolGb)} assigned to mailboxes</p>
                            </div>
                        </section>
                    </SubSection>

                    <SubSection id="act-h" title="Recent activity" tLink={{ href: route('dashboard.audit'), label: 'See the full log' }}>
                        <section className="ops-card">
                            <ActivityFeed items={activity} emptyLabel="Nothing to show yet." />
                        </section>
                    </SubSection>
                </div>

                <div className="ops-stack">
                    <SubSection id="plan-h" title="Your plan" tLink={{ href: withDomain('dashboard.billing'), label: 'Change plan' }}>
                        <section className="ops-card">
                            <dl className="ops-kv">
                                <div>
                                    <dt>Plan</dt>
                                    <dd>
                                        <b>{subscription.planName}</b>, {term}
                                        <span className="ops-inline-gap" style={{ marginLeft: 8 }}>
                                            <Pill tone={subscription.status === 'active' ? 'ok' : 'bad'}>{subscription.status === 'active' ? 'Active' : 'Payment overdue'}</Pill>
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt>Pool</dt>
                                    <dd>{formatGb(subscription.poolGb)}, unlimited mailboxes</dd>
                                </div>
                                <div>
                                    <dt>Price</dt>
                                    <dd>{formatPrice(price, subscription.currency)} per {term === 'yearly' ? 'year' : 'month'}, plus VAT</dd>
                                </div>
                                <div>
                                    <dt>Renews</dt>
                                    <dd>{formatDate(subscription.renewsAt)}</dd>
                                </div>
                            </dl>
                            <div className="ops-actions">
                                <Button variant="line" size="sm" href={withDomain('dashboard.billing')}>Change plan</Button>
                                <Button variant="line" size="sm" href={withDomain('dashboard.billing')}>Invoices</Button>
                            </div>
                        </section>
                    </SubSection>
                </div>
            </div>
        </DashboardLayout>
    );
}
