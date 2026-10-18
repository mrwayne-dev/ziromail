import { usePage } from '@inertiajs/react';
import { organisationFixture } from '../fixtures/organisation';
import useQuery from './useQuery';

/*
 * The domain the dashboard is currently about. It travels in the `domain` query
 * value (a domain id) so a refresh or a shared link keeps it; an unknown or
 * missing value falls back to the first domain. With a backend the same id
 * becomes the `current` prop on every dashboard response.
 */
export default function useCurrentDomain() {
    const query = useQuery();
    const { url } = usePage();
    const { domains } = organisationFixture;
    const current = domains.find((domain) => domain.id === query.get('domain')) ?? domains[0];

    return { current, domains, path: url.split('?')[0] };
}
