import { Link } from '@inertiajs/react';
import RecordTable from '../../Components/domain/RecordTable';
import Banner from '../../Components/ui/Banner';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import { AlertIcon } from '../../Components/ui/Icons';
import Pill from '../../Components/ui/Pill';
import useRecordChecks from '../../Hooks/useRecordChecks';
import useScenario from '../../Hooks/useScenario';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { domainDetailProps } from '../../fixtures/dashboard';
import { route, routeParam } from '../../Lib/route';

const DAYS = 20;

function History({ label, days }) {
    return (
        <span className="hist" role="img" aria-label={`${DAYS} day history for ${label}, ${days.length === 0 ? 'all inbox' : `${days.length} not in the inbox`}`}>
            {Array.from({ length: DAYS }, (_, index) => <i key={index} className={days.includes(index) ? 'bad' : undefined} />)}
        </span>
    );
}

export default function Domain() {
    const scenario = useScenario();
    const { domain, records: initial, checkedAt: opened, placement, reputation } = domainDetailProps(routeParam('domain'), scenario);
    const { records, checkedAt, checking, check } = useRecordChecks({
        items: initial.map((record) => ({ ...record, messages: { [record.status]: record.message } })),
        checks: [initial.map((record) => record.status), initial.map((record) => record.status)],
        checkedAt: opened,
    });
    const failing = records.filter((record) => record.status !== 'passing');
    const passing = records.length - failing.length;

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
                    <p className="sm mut mt-s">We send test messages to seeded accounts and record where they land. This is evidence, not a promise. The figures cover the whole platform, not only this domain.</p>
                    <div className="place mt">
                        {[['gmail', 'Gmail'], ['outlook', 'Outlook'], ['yahoo', 'Yahoo']].map(([key, label]) => (
                            <div className="place-i" key={key}>
                                <b>{placement[key]}</b>
                                <span>{label}</span>
                                <History label={label} days={placement.badDays[key]} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stack">
                    <Card>
                        <h3 className="heading-sm">Sending reputation</h3>
                        <div className="between mt rep-row"><span className="mut">Bounce rate</span><b className="num">{reputation.bounceRate}</b></div>
                        <div className="between rep-row"><span className="mut">Complaint rate</span><b className="num">{reputation.complaintRate}</b></div>
                        <div className="between rep-row"><span className="mut">Blocklists</span><Pill tone="ok">Clear</Pill></div>
                        <p className="hint">{reputation.note}</p>
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
