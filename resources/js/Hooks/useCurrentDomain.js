import { usePage } from '@inertiajs/react';
import useQuery from './useQuery';

/*
 * The domain the dashboard is currently about. It travels in the `domain` query
 * value (a domain id) so a refresh or a shared link keeps it. The server decides
 * which domains exist for this account (shared `account.domains`); an unknown or
 * missing value falls back to the first.
 */
export default function useCurrentDomain() {
    const query = useQuery();
    const { url, props } = usePage();
    const domains = props.account?.domains ?? [];
    const current = domains.find((domain) => domain.id === query.get('domain')) ?? domains[0] ?? null;

    return { current, domains, path: url.split('?')[0] };
}
