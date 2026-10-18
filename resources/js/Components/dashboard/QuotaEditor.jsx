import { useId, useState } from 'react';
import { checkQuota, quotaBounds } from '../../Lib/pool';
import { formatGb } from '../../Lib/format';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import { useToast } from '../ui/Toast';

/*
 * Edits one mailbox's quota. The track shows what is used and marks the floor:
 * the quota cannot go below it. Limits are a convenience; the server re-checks.
 */
export default function QuotaEditor({ mailbox, pool }) {
    const id = useId();
    const { toast } = useToast();
    const [value, setValue] = useState(String(mailbox.quotaGb));
    const bounds = quotaBounds(mailbox, pool);
    const check = checkQuota(mailbox, parseFloat(value), pool);
    const share = Math.round((mailbox.usedGb / mailbox.quotaGb) * 100);
    const floor = Math.min(Math.round((mailbox.usedGb / Math.max(parseFloat(value) || mailbox.quotaGb, 0.1)) * 100), 100);

    function save() {
        if (!check.ok) return;
        toast({ tone: 'ok', title: 'Quota saved', message: `${mailbox.address} now has ${formatGb(parseFloat(value))}.` });
    }

    return (
        <div>
            <div className="q-edit mt">
                <span className="q-in">
                    <Input id={id} type="number" min={bounds.min} max={bounds.max} step="0.5" value={value} aria-label="Quota in gigabytes" aria-invalid={check.ok ? undefined : true} aria-describedby={`${id}-msg`} onChange={(e) => setValue(e.target.value)} />
                    <span className="gb">GB</span>
                </span>
                <Button onClick={save} disabled={!check.ok}>Save quota</Button>
            </div>
            <p className={`hint${check.ok ? '' : ' is-bad'}`} id={`${id}-msg`} role={check.ok ? undefined : 'alert'}>
                {check.ok ? `Between ${formatGb(bounds.min)} and ${formatGb(bounds.max)} for this mailbox.` : check.message}
            </p>
            <div className="q-track" role="img" aria-label={`${formatGb(mailbox.usedGb)} used of a ${formatGb(parseFloat(value) || mailbox.quotaGb)} quota`}>
                <span className="used" style={{ width: `${floor}%` }} />
                <span className="floor" style={{ left: `${floor}%` }} />
            </div>
            <div className="q-marks">
                <span>{formatGb(mailbox.usedGb)} used, cannot go below this</span>
                <span>{formatGb(parseFloat(value) || mailbox.quotaGb)} assigned</span>
            </div>
            {share >= 75 && (
                <p className="hint">This mailbox is at {share}%. We warn the user again at 95% and hold delivery at 100%; queued mail is held, not discarded.</p>
            )}
        </div>
    );
}
