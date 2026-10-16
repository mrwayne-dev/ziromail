import { usePage } from '@inertiajs/react';

// The current URL's query string. Until there is a backend, values handed
// from one step to the next (an address, a domain) travel here.
export default function useQuery() {
    const { url } = usePage();
    return new URLSearchParams(url.split('?')[1] ?? '');
}
