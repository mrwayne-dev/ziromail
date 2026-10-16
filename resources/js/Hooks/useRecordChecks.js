import { useCallback, useMemo, useState } from 'react';
import { simulateLatency } from '../Lib/simulate';

/*
 * Stands in for polling GET /domains/{id}/records. Each call to `check` moves
 * the records on one step through `checks` (the status of every record after
 * each successive check) and settles on the last. It returns the same shape the
 * endpoint will: `records` with a `status` and `message` each, and `checkedAt`.
 * Swapping in the real endpoint replaces this hook, not the components.
 */
export default function useRecordChecks({ items, checks, checkedAt }) {
    const [round, setRound] = useState(0);
    const [checking, setChecking] = useState(false);
    const [label, setLabel] = useState(checkedAt);

    const records = useMemo(
        () => items.map((item, i) => {
            const status = round === 0 ? item.status : checks[round][i];
            return { ...item, status, message: item.messages?.[status] };
        }),
        [items, checks, round],
    );

    const check = useCallback(async () => {
        setChecking(true);
        await simulateLatency(900);
        setRound((r) => Math.min(r + 1, checks.length - 1));
        setLabel('just now');
        setChecking(false);
    }, [checks.length]);

    return { records, checkedAt: label, checking, check };
}
