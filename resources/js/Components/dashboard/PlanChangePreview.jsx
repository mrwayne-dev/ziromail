import { formatDate } from '../../Lib/format';
import Button from '../ui/Button';

/*
 * The consequences of a plan change, listed before anything is confirmed: when it
 * takes effect, what changes, and the confirm button worded to match. `preview`
 * is a PlanChangePreview (Lib/billing.js).
 */
export default function PlanChangePreview({ preview, onConfirm }) {
    if (preview.direction === 'same') return null;
    const up = preview.direction === 'up';

    return (
        <div className="chg-out" aria-live="polite">
            <div className={`chg-when ${up ? 'now' : 'later'}`}>{up ? 'Takes effect immediately' : `Takes effect ${formatDate(preview.effective)}`}</div>
            <ul className="chg-list">
                {preview.bullets.map((bullet) => (
                    <li key={bullet.text} className={bullet.warn ? 'warn' : undefined}>{bullet.text}</li>
                ))}
            </ul>
            <Button size="sm" full onClick={onConfirm} disabled={Boolean(preview.blocked)}>
                {up ? `Upgrade to ${preview.targetName} now` : `Schedule ${preview.targetName} for ${formatDate(preview.effective)}`}
            </Button>
            {preview.blocked && <p className="hint is-bad">Lower your mailbox quotas first. This change cannot be scheduled while {preview.blocked.assignedGb} GB is assigned.</p>}
        </div>
    );
}
