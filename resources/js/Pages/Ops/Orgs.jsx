import { Link } from '@inertiajs/react';
import { useState } from 'react';
import OpsTable, { severityClass } from '../../Components/ops/OpsTable';
import Pager from '../../Components/ops/Pager';
import Button from '../../Components/ui/Button';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import useQuery from '../../Hooks/useQuery';
import OpsLayout from '../../Layouts/OpsLayout';
import { orgFilters, orgRows } from '../../fixtures/ops';
import { formatDate } from '../../Lib/format';
import { route } from '../../Lib/route';

const PLAN = { starter: 'Starter', business: 'Business', premium: 'Premium' };
const TONE = { healthy: 'ok', rate_limited: 'bad', mx_missing: 'bad', storage: 'warn', setup_incomplete: 'warn', never_set_up: 'warn', dkim_broken: 'warn' };
const PAGE_SIZE = 8;

export default function Orgs() {
    const { toast } = useToast();
    const initial = useQuery().get('q') ?? '';
    const [text, setText] = useState(initial);
    const [query, setQuery] = useState(initial);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const term = query.trim().toLowerCase();
    const rows = orgRows.filter((row) => (filter === 'all' || row.filters.includes(filter)) && (!term || `${row.name} ${row.domain}`.toLowerCase().includes(term) || (term.includes('@') && row.domain.includes(term.split('@')[1] ?? ''))));
    const last = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
    const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const total = filter === 'all' && !term ? 412 : rows.length;

    return (
        <OpsLayout page="ops-orgs" title="Organisations">
            <div className="ops-head">
                <div>
                    <h1>Organisations</h1>
                    <p>Every business on the platform. Search by domain, mailbox address, business name or invoice number: whatever the caller happens to have in front of them.</p>
                </div>
                <Button variant="line" size="sm" onClick={() => toast({ tone: 'warn', title: 'Export is not connected yet' })}>Export as CSV</Button>
            </div>

            <form className="srch" role="search" onSubmit={(e) => { e.preventDefault(); setQuery(text); setPage(1); }}>
                <div className="srch-row">
                    <div><label htmlFor="oq">Search</label><input className="input" type="search" id="oq" autoComplete="off" spellCheck="false" placeholder="adaobifoods.com, sales@, INV-2026-0412" value={text} onChange={(e) => setText(e.target.value)} /></div>
                    <Button type="submit">Search</Button>
                    <Button variant="line" onClick={() => { setText(''); setQuery(''); setPage(1); }}>Clear</Button>
                </div>
                <div className="chips" role="group" aria-label="Filter organisations">
                    {orgFilters.map(([key, label, count]) => (
                        <button type="button" className="chip" key={key} aria-pressed={filter === key} onClick={() => { setFilter(key); setPage(1); }}>{label}<span className="c">{count}</span></button>
                    ))}
                </div>
            </form>

            <p className="sm mut mt">{term ? `Matching "${query}".` : 'Showing all organisations, most recently active first.'}</p>
            <OpsTable
                className="mt-s"
                wide
                caption="Customer organisations"
                head={<tr><th scope="col">Business</th><th scope="col">Domain</th><th scope="col">Plan</th><th scope="col" className="num">Mailboxes</th><th scope="col" className="num">Storage</th><th scope="col">State</th><th scope="col" className="num">Renews</th></tr>}
            >
                {shown.length === 0 && <tr><td colSpan={7} className="empty-cell">No organisation matches. Try part of a domain.</td></tr>}
                {shown.map((row) => (
                    <tr key={row.id} className={severityClass(row.severity)}>
                        <td className="wide"><Link href={route('ops.orgs.show', { org: row.id })}>{row.name}</Link></td>
                        <td className="mono">{row.domain}</td>
                        <td>{PLAN[row.planCode]}</td>
                        <td className="num">{row.mailboxCount}</td>
                        <td className="num">{row.usedGb} / {row.poolGb} GB</td>
                        <td><Pill tone={TONE[row.state]}>{row.stateLabel}</Pill></td>
                        <td className="num">{formatDate(row.renewsAt, { year: false })} {String(new Date(row.renewsAt).getFullYear()).slice(2)}</td>
                    </tr>
                ))}
            </OpsTable>
            <Pager shown={shown.length} total={total} noun="organisations" page={page} last={last} onPage={setPage} />
        </OpsLayout>
    );
}
