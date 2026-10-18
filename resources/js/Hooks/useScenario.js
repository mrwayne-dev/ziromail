import { usePage } from '@inertiajs/react';
import useQuery from './useQuery';

// The preview's staged-state switch (?scenario=). Ignored unless the site is in prototype mode.
export default function useScenario() {
    const { site } = usePage().props;
    const query = useQuery();

    return site.prototype ? (query.get('scenario') ?? 'healthy') : 'healthy';
}
