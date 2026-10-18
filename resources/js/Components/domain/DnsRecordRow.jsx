import { useEffect, useState } from 'react';
import Banner from '../ui/Banner';
import CopyField from '../ui/CopyField';
import { AlertIcon, CheckIcon, ChevronDownIcon, ClockIcon, CrossIcon } from '../ui/Icons';
import Pill from '../ui/Pill';
import { formatDate } from '../../Lib/format';

/*
 * The four states a record can be in, as the resolver reports them:
 *   passing    found and correct
 *   needs_fix  found, but wrong or in conflict with something already on the domain
 *   waiting    not seen yet, still inside the time DNS usually takes to spread
 *   missing    not seen after repeated checks; the customer has to add it
 */
const STATES = {
    passing: { tone: 'ok', pill: 'Passing', icon: <CheckIcon />, fallback: 'Verified just now' },
    needs_fix: { tone: 'bad', pill: 'Needs a fix', icon: <CrossIcon />, fallback: 'Found, but it needs changing' },
    waiting: { tone: 'warn', pill: 'Waiting', icon: <ClockIcon />, fallback: 'Not found yet' },
    missing: { tone: 'bad', pill: 'Not found', icon: <AlertIcon size={13} />, fallback: 'Not found after repeated checks' },
};

/*
 * One DNS record: its type and purpose, how the last check went, and the exact
 * values to paste, each with a Copy button. `record` is one item of the
 * GET /domains/{id}/records response:
 *   { id, type, title, status, message, fields: [{ key, label, value, hint? }],
 *     observed?: [{ key, label, value }] | null,   what is on the domain now (monitor mode)
 *     brokenSince?: ISO date | null,
 *     conflict?: { title, found, advice } }
 * Rows that need action open themselves, and rows that pass fold away. In
 * `monitor` mode a record that is not passing is a regression, not a wait, so
 * the "still spreading" wording is not used.
 */
export default function DnsRecordRow({ record, mode = 'onboarding' }) {
    const { type, title, status, message, fields, conflict, observed, brokenSince } = record;
    const state = STATES[status];
    const needsAction = status === 'needs_fix' || status === 'missing';
    const [open, setOpen] = useState(status !== 'waiting');

    useEffect(() => {
        setOpen(needsAction);
    }, [needsAction]);

    return (
        <details className="rec" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
            <summary className="rec-head">
                <span className={`rec-ic rec-ic-${state.tone}`} aria-hidden="true">{state.icon}</span>
                <span className="rec-name">
                    <b>{type}, {title}</b>
                    <span>{message ?? state.fallback}</span>
                </span>
                <Pill tone={state.tone}>{state.pill}</Pill>
                <span className="rec-chev"><ChevronDownIcon /></span>
            </summary>

            <div className="rec-body">
                {conflict && status === 'needs_fix' && (
                    <Banner tone="bad" icon={<AlertIcon />} title={conflict.title}>
                        <p>
                            We found <span className="mono">{conflict.found}</span>. {conflict.advice}
                        </p>
                    </Banner>
                )}
                {status === 'missing' && (
                    <Banner tone="warn" icon={<AlertIcon />} title="We still cannot see this record">
                        <p>Check it was saved exactly as shown, with nothing extra on the end, then check again.</p>
                    </Banner>
                )}
                {mode === 'monitor' && brokenSince && status !== 'passing' && (
                    <p className="rec-since">Not passing since {formatDate(brokenSince)}.</p>
                )}
                {mode === 'monitor' && observed && observed.length > 0 && (
                    <dl className="rec-observed">
                        {observed.map((field) => (
                            <div key={field.key}>
                                <dt>{field.label} on your domain now</dt>
                                <dd className="mono">{field.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
                {fields.map((field) => (
                    <CopyField key={field.key} label={field.label} value={field.value} hint={field.hint} />
                ))}
            </div>
        </details>
    );
}
