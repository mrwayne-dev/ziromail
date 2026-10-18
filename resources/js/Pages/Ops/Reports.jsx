import Metrics from '../../Components/ops/Metrics';
import OpsTable from '../../Components/ops/OpsTable';
import SeriesChart from '../../Components/ops/SeriesChart';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Note from '../../Components/ui/Note';
import { useToast } from '../../Components/ui/Toast';
import OpsLayout from '../../Layouts/OpsLayout';
import { reports } from '../../fixtures/ops';
import { formatPrice } from '../../Lib/money';

function Rows({ rows }) {
    return <div className="kv">{rows.map(([k, v, tone]) => <div className="r" key={k}><span>{k}</span><b className={tone}>{v}</b></div>)}</div>;
}

export default function Reports() {
    const { toast } = useToast();
    const { headline: h } = reports;
    const notReady = () => toast({ tone: 'warn', title: 'PDF reports are not connected yet' });
    const figures = [
        { k: 'New customers', v: h.newCustomers, d: `+${h.newDelta} on August`, tone: 'up' },
        { k: 'Left', v: h.left, d: `${h.leftPct}% of the base` },
        { k: 'Billed', v: `₦${(h.billed / 1e6).toFixed(2)}m`, d: `+${h.billedDeltaPct}% on August`, tone: 'up' },
        { k: 'Refunded', v: `₦${(h.refunded / 1000).toFixed(1)}k`, d: `${h.refundedPct}% of billings` },
        { k: 'Uptime', v: `${h.uptime}%`, d: `${h.downMinutes} minutes down`, tone: 'up' },
        { k: 'Storage sold', v: `${h.storageSoldGb} GB`, d: `${h.addOns} add-ons` },
    ];
    const bars = reports.customersByMonth.map(([label, value], index, all) => ({ label, value, tone: index === all.length - 1 ? 'now' : 'plain' }));

    return (
        <OpsLayout page="ops-reports" title="Reports">
            <div className="ops-head">
                <div>
                    <h1>Monthly report</h1>
                    <p>{reports.month}, to 29 September. The numbers a founder actually needs: who joined, who left, what it earned, and whether it stayed up. (Illustrative figures.)</p>
                </div>
                <Button variant="line" size="sm" onClick={notReady}>Download as PDF</Button>
            </div>

            <Metrics items={figures} label={`Headline figures for ${reports.month}`} />

            <section aria-labelledby="gr-h" className="mt-l">
                <h2 id="gr-h">Customers, month by month</h2>
                <p className="sm mut mt-s">Total paying organisations at the end of each month since launch.</p>
                <Card className="mt">
                    <div className="bars-wrap"><SeriesChart kind="bars" points={bars} label="Customer growth from 34 in March 2026 to 412 in September 2026, rising every month" height={132} /></div>
                    <div className="bars-ax">{reports.customersByMonth.map(([label, value]) => <span key={label}>{label}<br />{value}</span>)}</div>
                </Card>
            </section>

            <div className="rp-grid mt-l">
                <Card as="section" aria-labelledby="mn-h"><h3 id="mn-h">Money</h3><Rows rows={reports.money} /><p className="hint">{reports.moneyNote}</p></Card>
                <Card as="section" aria-labelledby="ch-h"><h3 id="ch-h">Who left, and why</h3><Rows rows={reports.departures} /><p className="hint">{reports.departuresNote}</p></Card>
                <Card as="section" aria-labelledby="sv-h"><h3 id="sv-h">Service</h3><Rows rows={reports.service} /></Card>
                <Card as="section" aria-labelledby="sp-h"><h3 id="sp-h">Support</h3><Rows rows={reports.support} /><p className="hint">{reports.supportNote}</p></Card>
            </div>

            <Note title="What this month says" className="mt"><p>{reports.narrative}</p></Note>

            <section aria-labelledby="ar-h" className="mt-l">
                <h2 id="ar-h">Earlier reports</h2>
                <OpsTable
                    className="mt"
                    caption="Previous monthly reports"
                    head={<tr><th scope="col">Month</th><th scope="col" className="num">Customers</th><th scope="col" className="num">Billed</th><th scope="col" className="num">Left</th><th scope="col" className="num">Uptime</th><th scope="col"><span className="sr-only">Download</span></th></tr>}
                >
                    {reports.earlier.map((row) => (
                        <tr key={row.month}><td>{row.month}</td><td className="num">{row.customers}</td><td className="num">{formatPrice(row.billed * 100, 'NGN')}</td><td className="num">{row.left}</td><td className="num">{row.uptime}</td><td><Button variant="line" size="sm" aria-label={`PDF for ${row.month}`} onClick={notReady}>PDF</Button></td></tr>
                    ))}
                </OpsTable>
            </section>
        </OpsLayout>
    );
}
