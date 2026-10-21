import { Link } from '@inertiajs/react';
import { LockIcon } from '../Components/ui/Icons';
import Logo from '../Components/ui/Logo';
import useHeroAnimation from '../Hooks/useHeroAnimation';
import { route } from '../Lib/route';

const PAGE = { centered: 'auth', split: 'auth', checkout: 'checkout', device: 'setup' };

function Brand() {
    // Visually a wordmark; wrapped in a <div role="banner"> so screen readers see one top-level
    // banner on these pages. On the checkout variant the Brand is rendered inside the <header>
    // bar instead, so there is still just one banner. See the variant blocks below.
    return (
        <div role="banner" className="auth-brand-bar">
            <Link className="brand" href={route('home')} aria-label="Ziroemail home">
                <Logo variant="black" />
            </Link>
        </div>
    );
}

function SidePanel({ children }) {
    return (
        <aside className="auth-side">
            <span className="shape shape-ring auth-ring" aria-hidden="true" />
            <svg className="shape shape-flap auth-flap" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <path d="M8 30 L50 62 L92 30" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {children}
        </aside>
    );
}

/*
 * Shell for every screen a visitor reaches before they have an account page:
 * no site navigation, only the logo and a way home.
 *   centered  one card in the middle: two-factor, recovery, reset, verify
 *   split     form column beside a dark panel (`aside`): sign-up, sign-in
 *   checkout  header bar with a secure-checkout note, wide two-column body
 *   device    narrow single column, opened on a phone
 */
export default function AuthLayout({ variant = 'centered', aside, children }) {
    useHeroAnimation();

    return (
        <div className={`pg-${PAGE[variant]}`}>
            <a className="skip-link" href="#main">Skip to content</a>

            {variant === 'split' && (
                <div className="auth">
                    <div className="auth-main">
                        <Brand />
                        <main className="auth-body" id="main">{children}</main>
                    </div>
                    <SidePanel>{aside}</SidePanel>
                </div>
            )}

            {variant === 'centered' && (
                <div className="shell">
                    <div className="shell-top"><Brand /></div>
                    <main className="shell-body" id="main">
                        <div className="auth-card">{children}</div>
                    </main>
                </div>
            )}

            {variant === 'checkout' && (
                <>
                    <header className="co-header">
                        <div className="wrap co-bar">
                            <Link className="brand" href={route('home')} aria-label="Ziroemail home"><Logo variant="black" /></Link>
                            <span className="secure"><LockIcon size={14} /> Secure checkout</span>
                        </div>
                    </header>
                    <main id="main">
                        <div className="wrap co">{children}</div>
                    </main>
                </>
            )}

            {variant === 'device' && (
                <>
                    <header className="dev-header">
                        <div className="wrap dev-bar"><Link className="brand" href={route('home')} aria-label="Ziroemail home"><Logo variant="black" /></Link></div>
                    </header>
                    <main id="main" className="dev-main">{children}</main>
                </>
            )}
        </div>
    );
}
