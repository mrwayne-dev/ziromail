import { Link, usePage } from '@inertiajs/react';
import DataTable from '../../Components/ops/DataTable';
import { MetricRow } from '../../Components/ops/MetricTile';
import SectionHeader, { SubSection } from '../../Components/ops/SectionHeader';
import SeriesChart from '../../Components/ops/SeriesChart';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import OpsLayout from '../../Layouts/OpsLayout';
import { route } from '../../Lib/route';

const DASH = '—';
const count = (value) => (value === null ? DASH : value.toLocaleString('en-NG'));
const percent = (value, digits = 1) => (value === null ? DASH : `${value.toFixed(digits)}%`);

export default function Deliverability() {
    const { connected, headline, bounceSeries, worstDomains, authCoverage, limits } = usePage().props;
    const peak = bounceSeries.reduce((best, point) => (point.value > best.value ? point : best), { value: 0, label: '' });

    const bounceOver = headline.bouncePct !== null && headline.bouncePct > limits.bounceLimitPct;
    const complaintOver = headline.complaintPct !== null && headline.complaintPct > limits.complaintLimitPct;
    const tiles = [
        { k: 'Bounce rate, 24h', v: percent(headline.bouncePct), d: headline.bouncePct === null ? 'needs the mail server' : `limit ${limits.bounceLimitPct}%`, tone: headline.bouncePct === null ? 'off' : bounceOver ? 'bad' : null, delta: headline.bouncePct !== null ? { value: 0, tone: bounceOver ? 'bad' : 'ok', unit: '%', label: bounceOver ? 'above limit' : 'within limit' } : null },
        { k: 'Complaints, 24h', v: percent(headline.complaintPct, 2), d: headline.complaintPct === null ? 'needs the mail server' : `limit ${limits.complaintLimitPct}%`, tone: headline.complaintPct === null ? 'off' : complaintOver ? 'bad' : null },
        { k: 'Messages, 24h', v: count(headline.sent24h), d: connected ? 'all outcomes' : 'needs the mail server', tone: connected ? null : 'off' },
        { k: 'Deferred, 24h', v: count(headline.deferred24h), d: connected ? 'retrying, none lost' : 'needs the mail server', tone: connected ? null : 'off' },
    ];

    return (
        <OpsLayout page="ops-deliverability" title="Deliverability">
            <SectionHeader
                title="Deliverability"
                description="The numbers that decide whether the business lives. A blocklisting affects every customer at once, so this page gets checked first, every day."
                actions={<Button variant="line" size="sm" href={route('ops.queue')}>Delivery log</Button>}
            />

            {!connected && (
                <Note tone="warn" title="The mail server is not reporting yet" className="mb">
                    <p>These figures come from hourly counts the mail server sends us. Until it is connected nothing is measured here, and the page shows dashes instead of numbers nobody counted.</p>
                </Note>
            )}

            <MetricRow items={tiles} label="Headline deliverability figures" />

            <div className="ops-row2 mt-24">
                <div className="ops-stack">
                    <SubSection id="bt-h" title="Bounce rate, by day" description={`The dashed line is ${limits.bounceLimitPct}%. Above it, recipient providers start throttling us.`}>
                        {bounceSeries.length === 0
                            ? <p className="ops-sm ops-mut">No days measured yet.</p>
                            : (
                                <section className="ops-card">
                                    <SeriesChart points={bounceSeries} limit={limits.bounceLimitPct} label={`Bounce rate by day, peaking at ${peak.value} per cent on ${peak.label}, against a ${limits.bounceLimitPct} per cent limit`} />
                                    <div className="ops-axis-row">
                                        <span>{bounceSeries[0].label}</span>
                                        <span>Peak {peak.value}% on {peak.label}</span>
                                        <span>{bounceSeries.at(-1).label}</span>
                                    </div>
                                </section>
                            )}
                    </SubSection>

                    <SubSection id="wo-h" title="Domains raising our averages" description="One customer with a bad list damages delivery for everybody on the same IP. Domains with fewer than 50 messages in seven days are not ranked.">
                        <DataTable
                            columns={[
                                { id: 'domain', header: 'Domain', accessor: (row) => row.domain, mono: true, sortable: true },
                                { id: 'sent', header: 'Sent 7d', accessor: (row) => row.sent7d.toLocaleString('en-NG'), align: 'num', sortable: true, sortValue: (row) => row.sent7d },
                                { id: 'bounce', header: 'Bounce', accessor: (row) => `${row.bouncePct}%`, align: 'num', sortable: true, sortValue: (row) => row.bouncePct },
                            ]}
                            rows={worstDomains}
                            rowKey={(row) => row.domain}
                            rowHref={(row) => route('ops.users.show', { user: row.ownerId })}
                            emptyState={{ title: 'Nothing to rank yet', body: 'Needs at least 50 messages in 7 days.' }}
                        />
                    </SubSection>
                </div>

                <div className="ops-stack">
                    <section className="ops-card">
                        <h3 className="ops-card-h">Authentication</h3>
                        <p className="ops-card-lede">Domains whose records pass, out of all domains.</p>
                        <div className="mt-12">
                            {authCoverage.map(([label, value]) => (
                                <div key={label} className="ops-kv-row">
                                    <span className="ops-mut">{label}</span>
                                    <b className="ops-tnum">{value}</b>
                                </div>
                            ))}
                        </div>
                        <Link href={route('ops.domains')} className="ops-link mt-10">See which are missing</Link>
                    </section>

                    <Note tone="warn" title="Blocklists and inbox placement are not measured yet">
                        <p>Checking our sending addresses against Spamhaus and the others, and the weekly seed test of where mail lands, both need the mail server's addresses. They appear here once it is connected.</p>
                    </Note>
                    <Note title="Why this page exists">
                        <p>Shared IP reputation is the largest technical risk in email hosting. One customer sending a purchased list can put every other customer's mail in the spam folder. Catching it here is cheaper than earning a reputation back.</p>
                    </Note>
                </div>
            </div>
        </OpsLayout>
    );
}
