import { Link } from '@inertiajs/react';
import { useState } from 'react';
import Metrics from '../../Components/ops/Metrics';
import OpsTable, { severityClass } from '../../Components/ops/OpsTable';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import OpsLayout from '../../Layouts/OpsLayout';
import { mailboxFigures, mailboxFilters, opsMailboxRows } from '../../fixtures/ops';
import { formatRelative } from '../../Lib/format';
import { route } from '../../Lib/route';

const TONE = { full: 'bad', near: 'warn', limited: 'bad', not_set_up: 'muted', locked: 'bad' };

export default function Mailboxes() {
    const { toast } = useToast();
    const [text, setText] = useState('');
    const [filter, setFilter] = useState('attention');
    const term = text.trim().toLowerCase();
    const rows = opsMailboxRows.filter((row) => (filter === 'all' || row.filters.includes(filter)) && (!term || row.address.includes(term) || row.orgName.toLowerCase().includes(term)));

    return (
        <OpsLayout page="ops-mailboxes" title="Mailboxes">
            <div className="ops-head">
                <div>
                    <h1>Mailboxes</h1>
                    <p>All 3,106 mailboxes on the platform. Sorted by the ones about to cause a problem: full, dormant, or never set up.</p>
                </div>
                <Button variant="line" size="sm" onClick={() => toast({ tone: 'warn', title: 'Export is not connected yet' })}>Export as CSV</Button>
            </div>

            <Metrics items={mailboxFigures} label="Mailbox figures" />

            <form className="mt" role="search" onSubmit={(e) => e.preventDefault()}>
                <label className="sr-only" htmlFor="mq">Search mailboxes by address or domain</label>
                <input className="input" type="search" id="mq" autoComplete="off" spellCheck="false" placeholder="Address or domain" value={text} onChange={(e) => setText(e.target.value)} />
                <div className="chips" role="group" aria-label="Filter mailboxes">
                    {mailboxFilters.map(([key, label, count]) => <button type="button" className="chip" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}<span className="c">{count.toLocaleString('en-NG')}</span></button>)}
                </div>
            </form>

            <OpsTable
                className="mt"
                caption="Mailboxes matching the filter"
                head={<tr><th scope="col" className="wide">Address</th><th scope="col">Organisation</th><th scope="col">Storage</th><th scope="col">Last sign-in</th><th scope="col">State</th><th scope="col"><span className="sr-only">Action</span></th></tr>}
            >
                {rows.length === 0 && <tr><td colSpan={6} className="empty-cell">No mailbox matches.</td></tr>}
                {rows.map((row) => {
                    const share = row.usedGb / row.quotaGb;
                    const action = row.action ?? { label: 'Open', routeName: 'ops.orgs.show', params: { org: row.orgId } };
                    return (
                        <tr key={row.address} className={severityClass(row.severity)}>
                            <td className="mono">{row.address}</td>
                            <td className="wide"><Link href={route('ops.orgs.show', { org: row.orgId })}>{row.orgName}</Link></td>
                            <td className="use"><span className="bar-mini"><i className={share >= 0.9 ? 'bad' : share >= 0.75 ? 'warn' : undefined} style={{ width: `${Math.min(share * 100, 100)}%` }} /></span>{row.usedGb} / {row.quotaGb} GB</td>
                            <td>{formatRelative(row.lastLoginAt)}</td>
                            <td><Pill tone={TONE[row.state]}>{row.stateLabel}</Pill></td>
                            <td><Button variant={action.primary ? 'primary' : 'line'} size="sm" href={route(action.routeName, action.params)}>{action.label}</Button></td>
                        </tr>
                    );
                })}
            </OpsTable>

            <Note title="What happens when a mailbox fills up" className="mt">
                <p>At 90% the owner is emailed. At 100% incoming mail is held in the queue for 72 hours rather than rejected, so nothing is lost while somebody frees space or raises the quota from the pool. If the pool itself is full, that is a sales conversation, not a support one.</p>
            </Note>
        </OpsLayout>
    );
}
