import { router, usePage } from '@inertiajs/react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import { useState } from 'react';
import RecordTable from '../../Components/domain/RecordTable';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import { AlertIcon } from '../../Components/ui/Icons';
import { MetricRow } from '../../Components/ui/MetricTile';
import SectionHeader, { SubSection } from '../../Components/ui/SectionHeader';
import { useToast } from '../../Components/ui/Toast';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { formatRelative } from '../../Lib/format';
import { route } from '../../Lib/route';

const DAYS = 20;

function History({ label, days }) {
    return (
        <span className="hist" role="img" aria-label={`${DAYS} day history for ${label}, ${days.length === 0 ? 'all inbox' : `${days.length} not in the inbox`}`}>
            {Array.from({ length: DAYS }, (_, index) => <i key={index} className={days.includes(index) ? 'bad' : undefined} />)}
        </span>
    );
}

export default function Domain() {
    const owner = usePage().props.auth?.user?.ownerId ?? usePage().props.auth?.user?.id;
    useRealtimeReload({ channel: `account.${owner}`, map: { domain: ['domain','records','checkedAt'] } });

    const { domain, records, checkedAt: checkedIso, placement, reputation } = usePage().props;
    const { toast } = useToast();
    const [checking, setChecking] = useState(false);
    const checkedAt = checkedIso ? formatRelative(checkedIso).toLowerCase() : 'never';
    const failing = records.filter((record) => record.status !== 'passing');
    const passing = records.length - failing.length;

    function check() {
        setChecking(true);
        router.post(route('dashboard.domains.recheck', { domain: domain.id }), {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.flash?.status === 'dns-unavailable') toast({ tone: 'warn', title: 'DNS checks are not connected yet', message: 'Your records have not been re-checked. We will check them automatically once the mail platform is connected.' });
            },
            onFinish: () => setChecking(false),
        });
    }

    const authTone = records.length === 0 ? 'off' : failing.length === 0 ? undefined : 'watch';
    const authDescription = records.length === 0
        ? 'DNS checks are not connected yet'
        : failing.length === 0 ? 'all records passing' : `${failing.length} to fix`;

    return (
        <DashboardLayout page="admin-domain" title={domain.name} description="Authentication and delivery health for this domain.">
            <SectionHeader
                eyebrow="DOMAIN"
                title={<span className="mono">{domain.name}</span>}
                description="Authentication and delivery health for your domain."
                actions={<>
                    <Button variant="line" size="sm" busy={checking} onClick={check}>Re-check now</Button>
                    <Button variant="line" size="sm" href={route('dashboard.domains')}>All domains</Button>
                </>}
            />

            <MetricRow label="Domain figures" items={[
                { k: 'Authentication', v: `${passing} / ${records.length || 0}`, tone: authTone, d: authDescription },
                { k: 'Last checked', v: checkedIso ? checkedAt : '—', tone: checkedIso ? undefined : 'off', d: checkedIso ? 'automatic every few hours' : 'not yet checked' },
                { k: 'Inbox placement', v: '—', tone: 'off', d: placement ? 'Loading placement data' : 'Not available yet, waiting on delivery data' },
                { k: 'Sending reputation', v: '—', tone: 'off', d: reputation ? 'Loading reputation data' : 'Not available yet, waiting on delivery data' },
            ]} />

            {failing.length > 0 && (
                <div className="stack mt-24">
                    {failing.map((record) => (
                        <Banner key={record.id} tone="bad" icon={<AlertIcon />} title={record.status === 'missing' ? `${record.type} has never been added for this domain` : `${record.type} no longer matches`}>
                            <p>
                                {record.status === 'missing'
                                    ? 'Without it your messages are unsigned, and Gmail and Outlook may place some of them in spam.'
                                    : 'It changed on your domain. Mail may start landing in spam until it matches again.'}
                            </p>
                        </Banner>
                    ))}
                </div>
            )}

            <SubSection id="rec-h" title="Authentication records" description="DKIM, SPF, DMARC and MX for this domain. We re-check automatically; use the button above to force a check.">
                <section className="ops-card">
                    <RecordTable records={records} checkedAt={checkedAt} checking={checking} onCheck={check} mode="monitor" />
                </section>
            </SubSection>

            <SubSection id="pl-h" title="Inbox placement" description="Where test messages land at Gmail, Outlook and Yahoo over the last 20 days.">
                <section className="ops-card">
                    {placement ? (
                        <>
                            <p className="ops-sm ops-mut mt-6">We send test messages to seeded accounts and record where they land. This is evidence, not a promise.</p>
                            <div className="place mt-14">
                                {[['gmail', 'Gmail'], ['outlook', 'Outlook'], ['yahoo', 'Yahoo']].map(([key, label]) => (
                                    <div className="place-i" key={key}>
                                        <b>{placement[key]}</b>
                                        <span>{label}</span>
                                        <History label={label} days={placement.badDays[key]} />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="ops-sm ops-mut m-0">Not available yet, waiting on delivery data. Placement results appear here once this domain has sent mail through the connected server.</p>
                    )}
                </section>
            </SubSection>

            <SubSection id="rep-h" title="Sending reputation" description="Bounce and complaint rates reported by receivers.">
                <section className="ops-card">
                    {reputation ? (
                        <dl className="ops-kv">
                            <div><dt>Bounce rate</dt><dd className="ops-tnum">{reputation.bounceRate}</dd></div>
                            <div><dt>Complaint rate</dt><dd className="ops-tnum">{reputation.complaintRate}</dd></div>
                            {reputation.note && <div><dt>Note</dt><dd>{reputation.note}</dd></div>}
                        </dl>
                    ) : (
                        <p className="ops-sm ops-mut m-0">Not available yet, waiting on delivery data. Bounce and complaint rates appear once this domain has sent mail through the connected server.</p>
                    )}
                </section>
            </SubSection>

            <SubSection id="help-h" title="Not confident doing this?">
                <section className="ops-card">
                    <p className="ops-sm ops-mut m-0">Send us a screenshot of your DNS page and we will tell you exactly which field to change, and re-check until it passes.</p>
                    <div className="ops-actions">
                        <Button variant="line" size="sm" href={route('contact')}>Message us</Button>
                    </div>
                </section>
            </SubSection>
        </DashboardLayout>
    );
}
