import { useState } from 'react';
import DeliveryTrace from '../../Components/ops/DeliveryTrace';
import OpsTable, { severityClass } from '../../Components/ops/OpsTable';
import Button from '../../Components/ui/Button';
import Card from '../../Components/ui/Card';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import OpsLayout from '../../Layouts/OpsLayout';
import { deliveryRows, deliverySummary, deliveryStates, deliveryTrace, rules } from '../../fixtures/ops';
import { formatTime } from '../../Lib/format';
import { route } from '../../Lib/route';

const STATE = { delivered: ['done', 'Delivered'], deferred: ['wait', 'Deferred'], bounced: ['fail', 'Bounced'], rejected: ['fail', 'Rejected'] };
const PERIODS = [['1h', 'Last hour', 1], ['24h', 'Last 24 hours', 24], ['7d', 'Last 7 days', 168], ['30d', 'Last 30 days', 720]];

export default function Queue() {
    const { toast } = useToast();
    const [form, setForm] = useState({ q: '', state: 'deferred', period: '24h' });
    const [applied, setApplied] = useState(form);
    const [selected, setSelected] = useState('dl_1');
    const hours = PERIODS.find(([key]) => key === applied.period)[2];
    const rows = deliveryRows.filter((row) => (
        (applied.state === 'any' || row.state === applied.state)
        && (!applied.q || `${row.from} ${row.to} ${row.subject}`.toLowerCase().includes(applied.q.toLowerCase()))
        && (new Date('2026-09-29T09:30:00+01:00') - new Date(row.at)) / 3600000 <= hours
    ));
    const row = deliveryRows.find((candidate) => candidate.id === selected);
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <OpsLayout page="ops-queue" title="Delivery log">
            <div className="ops-head">
                <div>
                    <h1>Delivery log</h1>
                    <p>Every message in and out, kept for 30 days. This is how you answer &ldquo;did it send?&rdquo; with a fact rather than a guess.</p>
                </div>
                <Button variant="line" size="sm" href={route('ops.deliverability')}>Deliverability</Button>
            </div>

            <form className="filters" onSubmit={(e) => { e.preventDefault(); setApplied(form); }}>
                <div><label htmlFor="f-q">Address, subject or message ID</label><input className="input" type="search" id="f-q" autoComplete="off" spellCheck="false" placeholder="sales@adaobifoods.com" value={form.q} onChange={set('q')} /></div>
                <div><label htmlFor="f-st">State</label><select className="input" id="f-st" value={form.state} onChange={set('state')}>{deliveryStates.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div><label htmlFor="f-wh">Period</label><select className="input" id="f-wh" value={form.period} onChange={set('period')}>{PERIODS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <Button type="submit">Search</Button>
            </form>

            <div className="between mt">
                <p className="sm mut">
                    {applied.state === 'deferred' && applied.period === '24h' && !applied.q
                        ? <>Showing <b>{deliverySummary.deferred.toLocaleString('en-NG')} deferred</b> messages from the last 24 hours. {deliverySummary.waitingOnOneDomain.toLocaleString('en-NG')} are waiting on one recipient domain. The rows below are a sample.</>
                        : <>Showing <b>{rows.length}</b> {rows.length === 1 ? 'message' : 'messages'} matching your filters.</>}
                </p>
                <Button variant="line" size="sm" onClick={() => toast({ tone: 'warn', title: 'Export is not connected yet' })}>Export as CSV</Button>
            </div>

            <OpsTable
                className="mt"
                caption="Messages matching the filters"
                head={<tr><th scope="col" className="num">Time</th><th scope="col">From</th><th scope="col">To</th><th scope="col" className="wide">Subject</th><th scope="col">State</th><th scope="col" className="num">Attempts</th></tr>}
            >
                {rows.length === 0 && <tr><td colSpan={6} className="empty-cell">No messages match. Widen the period or clear the search.</td></tr>}
                {rows.map((message) => (
                    <tr key={message.id} className={severityClass(message.severity)} aria-selected={selected === message.id}>
                        <td className="num mono"><button type="button" className="row-pick" aria-label={`Trace the ${formatTime(message.at)} message to ${message.to}`} onClick={() => setSelected(message.id)}>{formatTime(message.at)}</button></td>
                        <td className="mono">{message.from}</td>
                        <td className="mono">{message.to}</td>
                        <td className="wide">{message.subject}</td>
                        <td><span className={`st ${STATE[message.state][0]}`}>{STATE[message.state][1]}</span></td>
                        <td className="num">{message.attempts}</td>
                    </tr>
                ))}
            </OpsTable>

            <section aria-labelledby="tr-h" className="mt-l">
                <h2 id="tr-h">Message trace</h2>
                {selected === 'dl_1' ? (
                    <>
                        <p className="sm mut mt-s">Selected: the {formatTime(row.at)} message to <span className="mono">{deliveryTrace.recipientDomain}</span>. Every hop, with the receiving server's own words.</p>
                        <Card className="mt">
                            <div className="between">
                                <div><b>{deliveryTrace.subject}</b><p className="sm mut">Message ID <span className="mono">{deliveryTrace.messageId}</span></p></div>
                                <Pill tone="warn">Deferred &middot; retrying</Pill>
                            </div>
                            <DeliveryTrace hops={deliveryTrace.hops} />
                            <Note tone="warn" title="This is the recipient's limit, not ours" className="mt">
                                <p>A 451 is a temporary refusal: that server is asking us to slow down. The mail is held and nothing is lost. If it persists past {rules.queueEscalateMinutes} minutes, route this domain through the backup relay, which opens fewer connections at once.</p>
                            </Note>
                        </Card>
                    </>
                ) : (
                    <p className="sm mut mt-s">The preview only holds a full trace for the first deferred message. Select it to see the hops.</p>
                )}
            </section>
        </OpsLayout>
    );
}
