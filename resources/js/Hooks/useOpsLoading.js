import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/*
 * A short "something is coming" flag for ops pages. True while an Inertia visit targeted at the
 * same ops surface is in flight for longer than 180 ms (ignores instant navigations), false
 * otherwise. Reads for a sort/filter/pagination that fires a `router.get(..., { preserveState })`
 * and shows a skeleton while the server works.
 */
export default function useOpsLoading(scope = '/ops') {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let delayed = null;
        const stopStart = router.on('start', (event) => {
            const url = event.detail.visit.url?.pathname ?? '';
            if (!url.startsWith(scope)) return;
            delayed = window.setTimeout(() => setLoading(true), 180);
        });
        const stopFinish = router.on('finish', () => {
            if (delayed) {
                window.clearTimeout(delayed);
                delayed = null;
            }
            setLoading(false);
        });
        return () => { stopStart(); stopFinish(); if (delayed) window.clearTimeout(delayed); };
    }, [scope]);

    return loading;
}
