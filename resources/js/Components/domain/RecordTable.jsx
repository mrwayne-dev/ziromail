import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { CheckIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import DnsRecordRow from './DnsRecordRow';

/*
 * The whole verification panel: an overall status line with a Check now button,
 * a progress bar, then one DnsRecordRow per record. `records` is the `items` of
 * the GET /domains/{id}/records response and `checkedAt` its human-readable
 * "last checked" label. The page decides where fresh data comes from: today a
 * fixture-driven simulation, later polling.
 *
 * `mode` is 'onboarding' (a new domain still being connected: expects records to
 * appear, checks on a timer) or 'monitor' (a live domain being watched: it never
 * says it is waiting for DNS to spread, and Re-check now is always offered).
 */
export default function RecordTable({ records, checkedAt, checking = false, onCheck, mode = 'onboarding' }) {
    const monitor = mode === 'monitor';
    const needsAction = (record) => record.status === 'needs_fix' || record.status === 'missing';
    const [openId, setOpenId] = useState(() => records.find(needsAction)?.id ?? null);

    // One row open at a time, so the page never grows past the screen. When the open row stops
    // needing attention (it passes), move to the next one that does.
    const statuses = records.map((record) => `${record.id}:${record.status}`).join('|');
    useEffect(() => {
        setOpenId((current) => {
            const open = records.find((record) => record.id === current);
            return open && needsAction(open) ? current : (records.find(needsAction)?.id ?? null);
        });
    }, [statuses]);
    const total = records.length;
    const passing = records.filter((r) => r.status === 'passing').length;
    const done = passing === total;

    return (
        <section className="records" aria-label="DNS records">
            <div className={`records-top${done ? ' is-done' : ''}`} role="status">
                {done ? <span className="records-ok"><CheckIcon size={14} /></span> : <Spinner label={checking ? 'Checking your records' : undefined} />}
                <span className="records-msg">
                    <b>{monitor ? (done ? `All ${total} records passing` : `${passing} of ${total} records passing`) : (done ? `All ${total} records found` : `${passing} of ${total} records found`)}</b>
                    <p>{checking ? 'Checking now' : `Last checked ${checkedAt}`}{!monitor && !done && !checking && '. Changes usually appear within 30 minutes'}</p>
                </span>
                {(monitor || !done) && <Button variant="line" size="sm" onClick={onCheck} busy={checking}>{monitor ? 'Re-check now' : 'Check now'}</Button>}
            </div>
            <div
                className="records-bar"
                role="progressbar"
                aria-label="Records verified"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={passing}
                aria-valuetext={`${passing} of ${total} records verified`}
            >
                <i style={{ width: `${(passing / total) * 100}%` }} />
            </div>
            {records.map((record) => <DnsRecordRow key={record.id} record={record} mode={mode} open={openId === record.id} onToggle={(isOpen) => setOpenId(isOpen ? record.id : (current) => (current === record.id ? null : current))} />)}
        </section>
    );
}
