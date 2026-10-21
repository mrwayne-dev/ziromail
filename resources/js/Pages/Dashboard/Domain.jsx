import { Link, router, usePage } from '@inertiajs/react';
import useRealtimeReload from '../../Hooks/useRealtimeReload';
import { useState } from 'react';
import RecordTable from '../../Components/domain/RecordTable';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import { AlertIcon } from '../../Components/ui/Icons';
import Pill from '../../Components/ui/Pill';
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

    return (
        <DashboardLayout page="admin-domain" title={domain.name} description="Authentication and delivery health for this domain.">
            <div className="page-head">
                <div>
                    <h1 className="mono domain-title">{domain.name}</h1>
                    <p>Authentication and delivery health for your domain.</p>
                </div>
                <Button variant="line" busy={checking} onClick={check}>Re-check now</Button>
            </div>

            {failing.length > 0 && (
                <div className="stack mb">
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

            <div className="two">
                <div>
                    <section className="dom-records">
                        <div className="dom-records-head between">
                            <h2 className="heading-sm">Authentication records</h2>
                            <Pill tone={failing.length === 0 ? 'ok' : 'warn'}>{passing} of {records.length} passing</Pill>
                        </div>
                        <RecordTable records={records} checkedAt={checkedAt} checking={checking} onCheck={check} mode="monitor" />
                    </section>

                    <h2 className="heading-sm spaced">Inbox placement</h2>
                    {placement ? (
                        <>
                            <p className="sm mut mt-s">We send test messages to seeded accounts and record where they land. This is evidence, not a promise.</p>
                            <div className="place mt">
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
                        <p className="sm mut mt-s">Not enough data yet. Placement results appear here once this domain has sent mail.</p>
                    )}
                </div>

                <div className="stack">
                    <Card>
                        <h3 className="heading-sm">Sending reputation</h3>
                        {reputation ? (
                            <>
                                <div className="between mt rep-row"><span className="mut">Bounce rate</span><b className="num">{reputation.bounceRate}</b></div>
                                <div className="between rep-row"><span className="mut">Complaint rate</span><b className="num">{reputation.complaintRate}</b></div>
                                <p className="hint">{reputation.note}</p>
                            </>
                        ) : (
                            <p className="sm mut mt-s">Not enough data yet. Bounce and complaint rates appear once this domain has sent mail.</p>
                        )}
                    </Card>

                    <Card>
                        <h3 className="heading-sm">Not confident doing this?</h3>
                        <p className="sm mut mt-s">Send us a screenshot of your DNS page and we will tell you exactly which field to change, and re-check until it passes.</p>
                        <Button variant="line" full className="mt" href={route('contact')}>Message us</Button>
                    </Card>
                    <p className="sm mut"><Link className="back-link" href={route('dashboard.domains')}>&larr; All domains</Link></p>
                </div>
            </div>
        </DashboardLayout>
    );
}
