import { usePage } from '@inertiajs/react';
import { opsCan } from '../fixtures/ops';

/*
 * Whether the signed-in staff member's role may do something. This only hides
 * what a role cannot use; the server will re-check every action. The role comes
 * from the real `staff` guard.
 */
export default function useOpsCan() {
    const role = usePage().props.staff?.role ?? 'support';
    return (permission) => (opsCan[role] ?? []).includes(permission);
}
