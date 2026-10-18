import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CheckRow from '../../Components/ops/CheckRow';
import Metrics from '../../Components/ops/Metrics';
import OpsTable, { severityClass } from '../../Components/ops/OpsTable';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import OpsLayout from '../../Layouts/OpsLayout';
import { overviewChecks, overviewFeed, platform, stuckDomains, supportLoad } from '../../fixtures/ops';
import { asOf } from '../../fixtures/organisation';
import { formatDay, formatTime } from '../../Lib/format';
import { route } from '../../Lib/route';

const compact = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

function FeedText({ parts }) {
    return parts.map((part, index) => {
        if (typeof part === 'string') return part;
        return part[0] === 'b' ? <b key={index}>{part[1]}</b> : <b key={index} className="mono">{part[1]}</b>;
    });
}

export default function Index() {
    const [query, setQuery] = useState('');
    const figures = [
        { k: 'Organisations', v: platform.organisations, d: `+${platform.orgsDeltaWeek} this week`, tone: 'up' },
        { k: 'Mailboxes', v: platform.mailboxes.toLocaleString('en-NG'), d: `+${platform.mailboxesDeltaWeek} this week`, tone: 'up' },
        { k: 'Mail in 24h', v: compact(platform.mail24h.in + platform.mail24h.out), d: `${compact(platform.mail24h.in)} in · ${compact(platform.mail24h.out)} out` },
        { k: 'Bounce rate', v: `${platform.bounceRate}%`, d: 'under the 2% line', tone: 'up' },
        { k: 'Queue age', v: `${platform.queueAgeMinutes}m`, d: 'target is under 5m', tone: 'down', alert: true },
        { k: 'Storage used', v: `${platform.storage.usedTb} TB`, d: `of ${platform.storage.provisionedTb} TB provisioned` },
    ];

    return (
        <OpsLayout page="ops" title="Overview">
            <div className="ops-head">
                <div>
                    <h1>Operations</h1>
                    <p>{formatDay(asOf)} &middot; {formatTime(asOf)} WAT &middot; figures refresh every 60 seconds.</p>
                </div>
                <Button variant="line" size="sm" href={route('ops.reports')}>September report</Button>
            </div>

            <Metrics items={figures} label="Platform figures" />

            <div className="ops-grid">
                <div>
                    <section aria-labelledby="ck-h">
                        <h2 id="ck-h">This morning's checks</h2>
                        <p className="sm mut mt-s">Four things decide whether the business is healthy. Everything else on this console is detail.</p>
                        <div className="checks mt">{overviewChecks.map((check) => <CheckRow key={check.id} check={check} />)}</div>
                    </section>

                    <section aria-labelledby="dn-h" className="mt-l">
                        <div className="between"><h2 id="dn-h">Domains stuck in setup</h2><Link className="tlink" href={route('ops.domains')}>All domains</Link></div>
                        <p className="sm mut mt-s">Paid, but records never finished. These are the accounts most likely to ask for a refund.</p>
                        <OpsTable
                            className="mt"
                            caption="Domains with incomplete DNS records"
                            head={<tr><th scope="col">Domain</th><th scope="col">Organisation</th><th scope="col">Missing</th><th scope="col" className="num">Waiting</th><th scope="col"><span className="sr-only">Action</span></th></tr>}
                        >
                            {stuckDomains.slice(0, 3).map((row) => (
                                <tr key={row.domain} className={severityClass(row.severity)}>
                                    <td className="mono">{row.domain}</td>
                                    <td className="wide">{row.organisation}</td>
                                    <td>{row.missing.join(', ')}</td>
                                    <td className="num">{row.daysWaiting} days</td>
                                    <td><Button variant={row.severity === 'high' ? 'primary' : 'line'} size="sm" href={route('ops.orgs.show', { org: row.orgId })}>{row.severity === 'high' ? 'Call them' : 'Open'}</Button></td>
                                </tr>
                            ))}
                        </OpsTable>
                    </section>
                </div>

                <div className="stack">
                    <Card>
                        <h3>Find an account</h3>
                        <form onSubmit={(e) => { e.preventDefault(); router.get(route('ops.orgs'), { q: query }); }}>
                            <label className="sr-only" htmlFor="ops-q">Search by domain, email address or business name</label>
                            <input className="input" type="search" id="ops-q" autoComplete="off" spellCheck="false" placeholder="Domain, address or business name" value={query} onChange={(e) => setQuery(e.target.value)} />
                            <Button type="submit" full className="mt-s">Search</Button>
                        </form>
                        <p className="hint">Matches partial domains. A mailbox address opens the organisation it belongs to.</p>
                    </Card>

                    <Card>
                        <h3>Support load</h3>
                        <div className="between mt-s"><span className="mut">Unanswered on WhatsApp</span><b className="num">{supportLoad.whatsapp}</b></div>
                        <div className="between"><span className="mut">Unanswered by email</span><b className="num">{supportLoad.email}</b></div>
                        <div className="between"><span className="mut">Median first reply</span><b className="num">{supportLoad.medianFirstReply}</b></div>
                        <div className="between"><span className="mut">Migrations running</span><b className="num">{supportLoad.migrationsRunning}</b></div>
                        <p className="hint">Support runs on WhatsApp and <span className="mono">support@ziroemail.com</span>. These counts come from both, and are answered there rather than here. (Illustrative: no integration feeds them yet.)</p>
                    </Card>

                    <Card>
                        <h3>Last two hours</h3>
                        <div className="feed mt-s">
                            {overviewFeed.map((item) => (
                                <div className="it" key={item.id}><span className="tm">{formatTime(item.at)}</span><span className="bd"><FeedText parts={item.html} /></span></div>
                            ))}
                        </div>
                        <Link className="tlink mt" href={route('ops.audit')}>Full audit trail</Link>
                    </Card>
                </div>
            </div>
        </OpsLayout>
    );
}
