import { Link } from '@inertiajs/react';
import AccountMenu from '../Components/domain/AccountMenu';
import DomainSwitcher from '../Components/domain/DomainSwitcher';
import TwoFactorPrompt from '../Components/domain/TwoFactorPrompt';
import Seo from '../Components/seo/Seo';
import Logo from '../Components/ui/Logo';
import PrototypeNotice from '../Components/ui/PrototypeNotice';
import useCurrentDomain from '../Hooks/useCurrentDomain';
import useHeroAnimation from '../Hooks/useHeroAnimation';
import { route } from '../Lib/route';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 };
const ICON = {
    dashboard: (
        <>
            <rect x="2.5" y="2.5" width="6.4" height="6.4" rx="1.6" {...stroke} />
            <rect x="11.1" y="2.5" width="6.4" height="6.4" rx="1.6" {...stroke} />
            <rect x="2.5" y="11.1" width="6.4" height="6.4" rx="1.6" {...stroke} />
            <rect x="11.1" y="11.1" width="6.4" height="6.4" rx="1.6" {...stroke} />
        </>
    ),
    domain: (
        <>
            <circle cx="10" cy="10" r="7.4" {...stroke} />
            <path d="M2.6 10h14.8M10 2.6c1.9 2.3 1.9 12.5 0 14.8M10 2.6c-1.9 2.3-1.9 12.5 0 14.8" {...stroke} />
        </>
    ),
    domains: (
        <>
            <rect x="2.5" y="3.2" width="15" height="4.6" rx="1.5" {...stroke} />
            <rect x="2.5" y="12.2" width="15" height="4.6" rx="1.5" {...stroke} />
            <circle cx="5.8" cy="5.5" r=".9" fill="currentColor" />
            <circle cx="5.8" cy="14.5" r=".9" fill="currentColor" />
        </>
    ),
    mailboxes: (
        <>
            <circle cx="10" cy="6.8" r="3.1" {...stroke} />
            <path d="M4.2 16.8c0-2.9 2.6-4.8 5.8-4.8s5.8 1.9 5.8 4.8" {...stroke} strokeLinecap="round" />
        </>
    ),
    aliases: (
        <>
            <path d="M7.5 12.5 12.5 7.5" {...stroke} strokeLinecap="round" />
            <path d="M8.8 5.6 10 4.4a3.4 3.4 0 1 1 4.8 4.8l-1.2 1.2M11.2 14.4 10 15.6a3.4 3.4 0 1 1-4.8-4.8l1.2-1.2" {...stroke} strokeLinecap="round" />
        </>
    ),
    team: (
        <>
            <circle cx="7.4" cy="7.2" r="2.7" {...stroke} />
            <path d="M2.6 16.4c0-2.5 2.2-4.2 4.8-4.2s4.8 1.7 4.8 4.2" {...stroke} strokeLinecap="round" />
            <path d="M13.4 5.1a2.7 2.7 0 0 1 0 5.2M15.2 12.6c1.4.6 2.3 1.9 2.3 3.8" {...stroke} strokeLinecap="round" />
        </>
    ),
    billing: (
        <>
            <rect x="2.3" y="4.6" width="15.4" height="10.8" rx="2" {...stroke} />
            <path d="M2.3 8.4h15.4" {...stroke} />
        </>
    ),
    activity: (
        <>
            <circle cx="10" cy="10" r="7.4" {...stroke} />
            <path d="M10 5.8V10l2.8 1.8" {...stroke} strokeLinecap="round" strokeLinejoin="round" />
        </>
    ),
    help: (
        <>
            <circle cx="10" cy="10" r="7.4" {...stroke} />
            <path d="M7.8 7.7a2.3 2.3 0 1 1 2.9 2.2c-.5.2-.7.6-.7 1v.4" {...stroke} strokeLinecap="round" />
            <circle cx="10" cy="14.2" r="1" fill="currentColor" />
        </>
    ),
    mail: (
        <>
            <rect x="2.3" y="4.4" width="15.4" height="11.2" rx="2" {...stroke} />
            <path d="m2.8 5.6 7.2 5.2 7.2-5.2" {...stroke} />
        </>
    ),
};

function NavIcon({ name }) {
    return (
        <svg className="si" width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
            {ICON[name]}
        </svg>
    );
}

const isCurrent = (pattern) => window.route().current(pattern);

/*
 * Shell for the owner dashboard: header with the domain switcher and account
 * menu, side navigation (tab bar on phones), the prototype notice and the
 * two-factor prompt. `page` becomes the :where(.pg-*) wrapper the page's
 * styles are scoped to.
 */
export default function DashboardLayout({ page, title, description, children }) {
    useHeroAnimation();
    const { current, domains } = useCurrentDomain();
    const withDomain = (name, params) => `${route(name, params)}${domains.length > 1 ? `?domain=${current.id}` : ''}`;
    const aria = (pattern) => (isCurrent(pattern) ? 'page' : undefined);

    return (
        <div className={`pg-${page} has-tabbar`}>
            <Seo title={`${title} - Ziroemail`} description={description ?? title} noindex />
            <a className="skip-link" href="#main">Skip to content</a>
            <div className="app">
                <header className="app-hdr">
                    <div className="wrap bar bar-wide">
                        <Link className="brand" href={route('home')} aria-label="Ziroemail home">
                            <Logo variant="white" />
                        </Link>
                        <div className="app-hdr-end">
                            <DomainSwitcher />
                            <AccountMenu links={[{ href: route('dashboard.team'), label: 'Security and sign-in' }, { href: route('mail'), label: 'Open my mailbox' }]} />
                        </div>
                    </div>
                </header>

                <div className="app-body">
                    <nav className="side" aria-label="Dashboard sections">
                        <div className="side-grp">
                            <p className="side-ttl">Overview</p>
                            <Link href={withDomain('dashboard')} aria-current={aria('dashboard')}>
                                <NavIcon name="dashboard" />Dashboard
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">Domains</p>
                            <Link href={withDomain('dashboard.domains.show', { domain: current.id })} aria-current={aria('dashboard.domains.show')}>
                                <NavIcon name="domain" /><span>{current.name}</span>
                            </Link>
                            <Link href={route('dashboard.domains')} aria-current={aria('dashboard.domains')}>
                                <NavIcon name="domains" />All domains <span className="cnt">{domains.length}</span>
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">People</p>
                            <Link href={withDomain('dashboard.mailboxes')} aria-current={aria('dashboard.mailboxes*')}>
                                <NavIcon name="mailboxes" />Mailboxes <span className="cnt">{current.mailboxCount}</span>
                            </Link>
                            <Link href={withDomain('dashboard.aliases')} aria-current={aria('dashboard.aliases')}>
                                <NavIcon name="aliases" />Extra addresses
                            </Link>
                            <Link href={route('dashboard.team')} aria-current={aria('dashboard.team')}>
                                <NavIcon name="team" />Team &amp; access
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">Billing</p>
                            <Link href={withDomain('dashboard.billing')} aria-current={aria('dashboard.billing*')}>
                                <NavIcon name="billing" />Plan &amp; storage
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">Account</p>
                            <Link href={route('dashboard.audit')} aria-current={aria('dashboard.audit')}>
                                <NavIcon name="activity" />Activity log
                            </Link>
                            <Link href={route('dashboard.help')} aria-current={aria('dashboard.help')}>
                                <NavIcon name="help" />Help
                            </Link>
                            <a href={route('mail')} target="_blank" rel="noopener">
                                <NavIcon name="mail" />Open my mailbox
                                <svg className="ext" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                    <path d="M4.5 1.5h6v6M10.5 1.5 5 7M8.5 8.2v2.3h-7v-7h2.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                        </div>
                    </nav>

                    <main className="main" id="main">
                        <PrototypeNotice />
                        <TwoFactorPrompt securityRoute={route('dashboard.team')} />
                        {children}
                    </main>
                </div>
            </div>

            <nav className="tabbar" aria-label="Sections">
                <Link href={withDomain('dashboard')} aria-current={aria('dashboard')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">{ICON.dashboard}</svg>
                    Dashboard
                </Link>
                <Link href={withDomain('dashboard.mailboxes')} aria-current={aria('dashboard.mailboxes*')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">{ICON.mailboxes}</svg>
                    Mailboxes
                </Link>
                <Link href={withDomain('dashboard.billing')} aria-current={aria('dashboard.billing*')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">{ICON.billing}</svg>
                    Billing
                </Link>
                <a href={route('mail')} target="_blank" rel="noopener">
                    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">{ICON.mail}</svg>
                    Mail
                    <span className="sr-only"> (opens in a new tab)</span>
                </a>
            </nav>
        </div>
    );
}
