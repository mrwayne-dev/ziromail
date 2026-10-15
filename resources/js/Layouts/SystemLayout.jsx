import { Link } from '@inertiajs/react';
import Logo from '../Components/ui/Logo';
import useHeroAnimation from '../Hooks/useHeroAnimation';
import { route } from '../Lib/route';

/*
 * Shell for 404 / 500 / maintenance / offline. Deliberately has no navigation:
 * these pages must keep working when most of the site cannot, and the card
 * itself carries the ways back.
 */
export default function SystemLayout({ children }) {
    useHeroAnimation();

    return (
        <div className="pg-system">
            <a className="skip-link" href="#main">Skip to content</a>
            <div className="sys">
                <div className="sys-top">
                    <Link className="brand" href={route('home')} aria-label="Ziroemail home">
                        <Logo variant="black" />
                    </Link>
                </div>
                <main className="sys-body" id="main">{children}</main>
            </div>
        </div>
    );
}
