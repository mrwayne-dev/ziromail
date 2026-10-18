import { Link } from '@inertiajs/react';
import BlocklistGrid from '../../Components/ops/BlocklistGrid';
import Metrics from '../../Components/ops/Metrics';
import OpsTable, { severityClass } from '../../Components/ops/OpsTable';
import SeriesChart from '../../Components/ops/SeriesChart';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import OpsLayout from '../../Layouts/OpsLayout';
import { deliverability, rules } from '../../fixtures/ops';
import { route } from '../../Lib/route';

export default function Deliverability() {
    const { headline, blocklists, bounceSeries, worstDomains, placement, authCoverage } = deliverability;
    const peak = bounceSeries.reduce((best, point) => (point.value > best.value ? point : best));
    const listed = Object.values(blocklists.matrix).some((row) => Object.values(row).includes('listed'));

    return (
        <OpsLayout page="ops-deliverability" title="Deliverability">
            <div className="ops-head">
                <div>
                    <h1>Deliverability</h1>
                    <p>The numbers that decide whether the business lives. A blocklisting affects every customer at once, so this page gets checked first, every day.</p>
                </div>
                <Button variant="line" size="sm" href={route('ops.queue')}>Delivery log</Button>
            </div>

            <Metrics items={headline} label="Headline deliverability figures" />

            <div className="dl-grid">
                <div>
                    <section aria-labelledby="bl-h" className="mt-l">
                        <h2 id="bl-h">Blocklist status {listed && <Pill tone="bad">Listed</Pill>}</h2>
                        <p className="sm mut mt-s">Every sending IP against the four lists that matter to Nigerian and international recipients. Polled every {blocklists.polledEveryMinutes} minutes.</p>
                        <div className="mt"><BlocklistGrid blocklists={blocklists} /></div>
                        <p className="hint">A listing pages the on-call engineer immediately. The delisting steps and each list's contact form are in the runbook.</p>
                    </section>

                    <section aria-labelledby="bt-h" className="mt-l">
                        <h2 id="bt-h">Bounce rate, last 14 days</h2>
                        <p className="sm mut mt-s">The dashed line is {rules.bounceLimitPct}%. Above it, recipient providers start throttling us.</p>
                        <Card className="mt">
                            <SeriesChart points={bounceSeries} limit={rules.bounceLimitPct} label={`Bounce rate over 14 days, between 1.1 and ${peak.value} per cent, staying below the ${rules.bounceLimitPct} per cent limit`} />
                            <div className="between"><span>{bounceSeries[0].label}</span><span>Peak {peak.value}% on {peak.label}</span><span>{bounceSeries.at(-1).label}</span></div>
                        </Card>
                    </section>

                    <section aria-labelledby="wo-h" className="mt-l">
                        <h2 id="wo-h">Domains raising our averages</h2>
                        <p className="sm mut mt-s">One customer with a bad list damages delivery for everybody on the same IP. These get a conversation before they get a limit.</p>
                        <OpsTable
                            className="mt"
                            wide
                            caption="Customer domains with the highest bounce and complaint rates"
                            head={<tr><th scope="col">Domain</th><th scope="col" className="num">Sent 7d</th><th scope="col" className="num">Bounce</th><th scope="col" className="num">Complaints</th><th scope="col">State</th><th scope="col"><span className="sr-only">Action</span></th></tr>}
                        >
                            {worstDomains.map((row) => (
                                <tr key={row.domain} className={severityClass(row.severity)}>
                                    <td className="mono wide">{row.domain}</td>
                                    <td className="num">{row.sent7d.toLocaleString('en-NG')}</td>
                                    <td className="num">{row.bounce}</td>
                                    <td className="num">{row.complaints}</td>
                                    <td><Pill tone={row.state}>{row.stateLabel}</Pill></td>
                                    <td><Button variant={row.action.primary ? 'primary' : 'line'} size="sm" href={route(row.action.routeName, row.action.params)}>{row.action.label}</Button></td>
                                </tr>
                            ))}
                        </OpsTable>
                    </section>
                </div>

                <div className="stack">
                    <Card>
                        <h3>Inbox placement</h3>
                        <p className="sm mut mt-s">Weekly seed test: 40 addresses across five providers.</p>
                        <div className="place">
                            {placement.map((row) => (
                                <div className="p" key={row.provider}>
                                    <span className="nm">{row.provider}</span>
                                    <span className="track" role="img" aria-label={`${row.provider}: ${row.inbox} per cent inbox${row.spam ? `, ${row.spam} per cent spam` : ''}${row.miss ? `, ${row.miss} per cent not delivered` : ''}`}>
                                        <span className="inbox" style={{ width: `${row.inbox}%` }} />
                                        {row.spam > 0 && <span className="spam" style={{ width: `${row.spam}%` }} />}
                                        {row.miss > 0 && <span className="miss" style={{ width: `${row.miss}%` }} />}
                                    </span>
                                    <span className="pc">{row.inbox}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="legend"><span><i className="lg-inbox" /> Inbox</span><span><i className="lg-spam" /> Spam folder</span><span><i className="lg-miss" /> Not delivered</span></div>
                        <p className="hint">Tested every Monday at 05:00. Outlook is the number worth watching: most Nigerian businesses correspond with Outlook users.</p>
                    </Card>

                    <Card>
                        <h3>Authentication</h3>
                        {authCoverage.map(([label, value], index) => <div className={`between${index === 0 ? ' mt-s' : ''}`} key={label}><span className="mut">{label}</span><b className="num">{value}</b></div>)}
                        <Link className="tlink mt" href={route('ops.domains')}>See which are missing</Link>
                    </Card>

                    <Note tone="warn" title="Queue age is over target">
                        <p>One recipient domain began deferring at 07:12. Delivery is retrying on schedule and nothing has been lost, but the oldest message is now 18 minutes old. If it passes {rules.queueEscalateMinutes} minutes, move that domain to the backup relay.</p>
                        <Link className="tlink mt" href={route('ops.queue')}>Open the delivery log</Link>
                    </Note>
                    <Note title="Why this page exists">
                        <p>Shared IP reputation is the largest technical risk in email hosting. One customer sending a purchased list can put every other customer's mail in the spam folder. Catching it here is cheaper than earning a reputation back.</p>
                    </Note>
                </div>
            </div>
        </OpsLayout>
    );
}
