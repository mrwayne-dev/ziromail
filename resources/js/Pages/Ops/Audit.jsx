import { useState } from 'react';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import Select from '../../Components/ui/Select';
import { useToast } from '../../Components/ui/Toast';
import OpsLayout from '../../Layouts/OpsLayout';
import { auditKinds, opsAudit, staffRoster } from '../../fixtures/ops';
import { formatDay, formatTime } from '../../Lib/format';

const dayKey = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

export default function Audit() {
    const { toast } = useToast();
    const [form, setForm] = useState({ q: '', who: 'any', kind: 'all' });
    const [applied, setApplied] = useState(form);
    const [pages, setPages] = useState(1);
    const term = applied.q.trim().toLowerCase();
    const entries = opsAudit.filter((entry) => (
        (applied.who === 'any' || entry.actor === applied.who)
        && (applied.kind === 'all' || entry.kind === applied.kind)
        && (!term || `${entry.text} ${entry.detail} ${entry.reason ?? ''}`.toLowerCase().includes(term))
    ));
    const groups = entries.reduce((acc, entry) => {
        const key = dayKey(entry.at);
        (acc[key] ??= []).push(entry);
        return acc;
    }, {});
    const people = ['System', ...staffRoster.map((person) => person.name)];
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <OpsLayout page="ops-audit" title="Audit trail">
            <div className="ops-head">
                <div>
                    <h1>Audit trail</h1>
                    <p>Every action any member of staff has taken. Append-only: nothing here can be edited or deleted by anybody, including an owner.</p>
                </div>
                <Button variant="line" size="sm" onClick={() => toast({ tone: 'warn', title: 'Export is not connected yet' })}>Export as CSV</Button>
            </div>

            <form className="flt" onSubmit={(e) => { e.preventDefault(); setApplied(form); }}>
                <div><label htmlFor="aq">Search</label><input className="input" type="search" id="aq" autoComplete="off" spellCheck="false" placeholder="Domain, address or action" value={form.q} onChange={set('q')} /></div>
                <div><label htmlFor="aw">Person</label><Select id="aw" value={form.who} onChange={set('who')}><option value="any">Anybody</option>{people.map((name) => <option key={name} value={name}>{name}</option>)}</Select></div>
                <div><label htmlFor="ak">Kind</label><Select id="ak" value={form.kind} onChange={set('kind')}>{auditKinds.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></div>
                <Button type="submit">Filter</Button>
            </form>

            {entries.length === 0 && <p className="sm mut mt">Nothing matches those filters.</p>}
            {Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([day, list]) => (
                <section key={day} aria-label={formatDay(list[0].at)}>
                    <p className="day">{formatDay(list[0].at)}</p>
                    <div>
                        {list.map((entry) => (
                            <div className={`ent${entry.grave ? ' grave' : ''}`} key={entry.id}>
                                <span className="tm">{formatTime(entry.at)}</span>
                                <span className="bd">
                                    <b>{entry.text}</b>: {entry.detail}
                                    {entry.reason && <span className="why">{entry.reason.endsWith('.') && !entry.reason.startsWith('Automatic') && !entry.reason.startsWith('Written') ? `“${entry.reason}”` : entry.reason}</span>}
                                </span>
                                <span className="who">{entry.actor}</span>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            <div className="btn-row no-grow mt">
                <Button variant="line" size="sm" disabled={pages > 1} onClick={() => { setPages(2); toast({ title: 'No older entries in the preview' }); }}>Load older entries</Button>
            </div>

            <Note title="Why the reason field is compulsory" className="mt">
                <p>An entry saying &ldquo;account locked&rdquo; is almost useless six months later. An entry saying why, by whom, and what the customer was told is a defence if the decision is ever questioned: by the customer, by a regulator, or by us reviewing our own judgement. Entries are kept for seven years.</p>
            </Note>
        </OpsLayout>
    );
}
