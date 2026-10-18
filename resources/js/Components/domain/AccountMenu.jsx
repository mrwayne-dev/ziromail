import { Link, router, usePage } from '@inertiajs/react';
import useDisclosure from '../../Hooks/useDisclosure';
import useDismissible from '../../Hooks/useDismissible';
import { initials } from '../../Lib/format';
import { route } from '../../Lib/route';

/*
 * The avatar menu in the dashboard and webmail headers. It shows the real
 * signed-in person (the shared `auth.user`) and signs out with a real POST.
 * `links` are the surface's own destinations; the sign-out button is always last.
 * The console passes the signed-in staff member as `user` and its own `signOutRoute`.
 */
export default function AccountMenu({ links = [], user: given, signOutRoute = 'logout' }) {
    const shared = usePage().props.auth.user;
    const user = given ?? shared;
    const { isOpen, close, toggle } = useDisclosure();
    const ref = useDismissible(isOpen, close);

    function signOut() {
        close();
        router.post(route(signOutRoute));
    }

    return (
        <div className="acct" ref={ref}>
            <button type="button" className="avatar" aria-expanded={isOpen} aria-haspopup="true" aria-controls="acct-menu" onClick={toggle}>
                <span className="sr-only">Account menu for </span>
                {initials(user.name)}
            </button>
            <div className="acct-menu" id="acct-menu" hidden={!isOpen}>
                <div className="who">
                    <span className="av" aria-hidden="true">{initials(user.name)}</span>
                    <div className="bd">
                        <b>{user.name}</b>
                        <span className="mono">{user.email}</span>
                    </div>
                </div>
                {links.length > 0 && <div className="sep" />}
                {links.map((link) => (
                    <Link key={link.href} href={link.href} onClick={close}>{link.label}</Link>
                ))}
                <div className="sep" />
                <button type="button" className="out" onClick={signOut}>Sign out</button>
            </div>
        </div>
    );
}
