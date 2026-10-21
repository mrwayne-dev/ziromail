import { Link, usePage } from '@inertiajs/react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import ActivityFeed from '../../Components/dashboard/ActivityFeed';
import MailboxTable from '../../Components/dashboard/MailboxTable';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import { AlertIcon } from '../../Components/ui/Icons';
import Meter from '../../Components/ui/Meter';
import Pill from '../../Components/ui/Pill';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatDate, formatGb, greeting } from '../../Lib/format';
import { formatPrice } from '../../Lib/money';
import { route } from '../../Lib/route';

const QUICK_ACTIONS = [
    { icon: '+', title: 'Add a mailbox', note: 'For a new staff member', routeName: 'dashboard.mailboxes' },
    { icon: '☷', title: 'Resend setup link', note: 'By WhatsApp or email', routeName: 'setup.device' },
    { icon: '↺', title: 'Reset a password', note: 'Without calling support', routeName: 'dashboard.mailboxes' },
    { icon: '₦', title: 'View invoices', note: 'Download receipts', routeName: 'dashboard.billing' },
];

export default function Overview() {
    const owner = usePage().props.auth?.user?.ownerId ?? usePage().props.auth?.user?.id;
    useRealtimeReload({ channel: `account.${owner}`, map: { domain: ['account','cards','alerts'], mailbox: ['cards','alerts'], security: ['alerts','activity'] } });

    const { org, domain, stats, alerts, mailboxes, subscription, activity } = usePage().props;
    const term = subscription.term === 'annual' ? 'yearly' : 'monthly';
    const price = subscription.priceNet;
    const withDomain = (name, params) => `${route(name, params)}?domain=${domain.id}`;

    return (
        <DashboardLayout page="admin" title="Dashboard" description="Your domain, mailboxes, plan and what needs attention.">
            <section className="hero-band" aria-labelledby="hero-domain">
                <div className="hb-top">
                    <div>
                        <p className="hb-eyebrow">{org.name}</p>
                        <h1 className="hb-dom mono" id="hero-domain">{domain.name}</h1>
                        <p className="hb-sub">{greeting()}, {org.owner.name.split(' ')[0]}. Everything below is for this domain.</p>
                    </div>
                    <div className="hb-acts">
                        <Button variant="white" size="sm" href={withDomain('dashboard.mailboxes')}>Add a mailbox</Button>
                        <Button variant="line" size="sm" href={route('dashboard.domains')}>Switch domain</Button>
                    </div>
                </div>

                <div className="hb-figs">
                    <div className="hb-fig">
                        <span className="k">Mailboxes</span>
                        <span className="v">{stats.mailboxCount}</span>
                        <span className="s">no seat limit</span>
                    </div>
                    <div className="hb-fig">
                        <span className="k">Storage used</span>
                        <span className="v">{formatGb(stats.usedGb)}</span>
                        <span className="s">of a {formatGb(stats.poolGb)} pool</span>
                    </div>
                    <div className="hb-fig">
                        <span className="k">Plan</span>
                        <span className="v">{stats.planName}</span>
                        <span className="s">renews {stats.renewsAt ? formatDate(stats.renewsAt) : 'not set'}</span>
                    </div>
                    <div className="hb-fig">
                        <span className="k">Domain health</span>
                        <span className="v">{stats.recordsPassing} of {stats.recordsTotal}</span>
                        <span className="s">{stats.recordsPassing === stats.recordsTotal ? 'all records passing' : stats.healthNote}</span>
                    </div>
                </div>
            </section>

            <section aria-labelledby="att-h">
                <h2 id="att-h" className="sr-only">What needs your attention</h2>
                {alerts.length > 0 && (
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
                )}
            </section>

            <h2 className="heading-sm spaced">Quick actions</h2>
            <div className="qa-grid">
                {QUICK_ACTIONS.map((action) => (
                    <Link className="qa" key={action.title} href={withDomain(action.routeName)}>
                        <span className="ic" aria-hidden="true">{action.icon}</span>
                        <b>{action.title}</b>
                        <span>{action.note}</span>
                    </Link>
                ))}
            </div>

            <div className="two mt-l">
                <Card as="section" aria-labelledby="mb-h">
                    <div className="between mb">
                        <h2 className="heading-sm" id="mb-h">Your mailboxes</h2>
                        <Link className="small link-strong" href={withDomain('dashboard.mailboxes')}>See all</Link>
                    </div>
                    {mailboxes.length > 0 ? (
                        <MailboxTable mailboxes={mailboxes} domainName={domain.name} />
                    ) : (
                        <p className="small">No mailboxes on this domain yet.</p>
                    )}
                    <div className="mt-s">
                        <Meter used={stats.assignedGb} total={stats.poolGb} label={`${formatGb(stats.assignedGb)} of ${formatGb(stats.poolGb)} assigned to mailboxes`} />
                        <p className="small mt-s">{formatGb(stats.assignedGb)} of {formatGb(stats.poolGb)} assigned to mailboxes</p>
                    </div>
                </Card>

                <div className="stack">
                    <Card as="section" aria-labelledby="plan-h">
                        <h2 className="heading-sm mb" id="plan-h">Your plan</h2>
                        <div className="mini-row">
                            <div>
                                <b>{subscription.planName}, {term}</b>
                                <span className="sub">{formatGb(subscription.poolGb)} pool, unlimited mailboxes</span>
                            </div>
                            <Pill tone={subscription.status === 'active' ? 'ok' : 'bad'}>{subscription.status === 'active' ? 'Active' : 'Payment overdue'}</Pill>
                        </div>
                        <div className="mini-row">
                            <div>
                                <b>{formatPrice(price, subscription.currency)} per {term === 'yearly' ? 'year' : 'month'}</b>
                                <span className="sub">Plus VAT at checkout</span>
                            </div>
                        </div>
                        <div className="mini-row">
                            <div>
                                <b>Renews {formatDate(subscription.renewsAt)}</b>
                                <span className="sub">We will remind you before</span>
                            </div>
                        </div>
                        <div className="btn-row mt">
                            <Button variant="line" size="sm" href={withDomain('dashboard.billing')}>Change plan</Button>
                            <Button variant="line" size="sm" href={withDomain('dashboard.billing')}>Invoices</Button>
                        </div>
                    </Card>

                    <Card as="section" aria-labelledby="act-h">
                        <h2 className="heading-sm mb" id="act-h">Recent activity</h2>
                        <ActivityFeed items={activity} />
                        <Link className="small mt-s link-strong inline-block" href={route('dashboard.audit')}>See the full log</Link>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
