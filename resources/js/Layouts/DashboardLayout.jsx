import { Link } from '@inertiajs/react';
import { Activity, AtSign, CreditCard, ExternalLink, Globe, HelpCircle, LayoutDashboard, Mail, Users, UserCog } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import AccountMenu from '../Components/domain/AccountMenu';
import DomainSwitcher from '../Components/domain/DomainSwitcher';
import TwoFactorPrompt from '../Components/domain/TwoFactorPrompt';
import Seo from '../Components/seo/Seo';
import Logo from '../Components/ui/Logo';
import useCurrentDomain from '../Hooks/useCurrentDomain';
import { route } from '../Lib/route';

/*
 * Shell for the owner dashboard: header with the domain switcher and account
 * menu, side navigation, a mobile bottom dock with a motion active-pill (same
 * language as the ops console), the prototype notice and the two-factor prompt.
 * `page` becomes the :where(.pg-*) wrapper the page's styles are scoped to.
 *
 * References carried over from the ops redesign:
 *   https://21st.dev/@aicanvas/components/expanding-tabs     active-pill tab bar
 *   https://21st.dev/@ruixen.ui/components/pill-morph-tabs   spring animation
 */

const SPRING = { type: 'spring', stiffness: 400, damping: 32, mass: 0.6 };

const isCurrent = (pattern) => window.route().current(pattern);

export default function DashboardLayout({ page, title, description, children }) {
    const reduce = useReducedMotion();
    const { current, domains } = useCurrentDomain();
    const withDomain = (name, params) => `${route(name, params)}${domains.length > 1 ? `?domain=${current?.id}` : ''}`;
    const aria = (pattern) => (isCurrent(pattern) ? 'page' : undefined);
    const dock = [
        { key: 'dash',    label: 'Dashboard', href: withDomain('dashboard'),           icon: LayoutDashboard, match: 'dashboard' },
        { key: 'mbxs',    label: 'Mailboxes', href: withDomain('dashboard.mailboxes'), icon: Users,           match: 'dashboard.mailboxes*' },
        { key: 'billing', label: 'Billing',   href: withDomain('dashboard.billing'),   icon: CreditCard,      match: 'dashboard.billing*' },
        { key: 'mail',    label: 'Mail',      href: route('mail'),                     icon: Mail,            match: null, external: true },
    ];

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
                                <LayoutDashboard size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Dashboard</span>
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">Domains</p>
                            <Link href={withDomain('dashboard.domains.show', { domain: current?.id })} aria-current={aria('dashboard.domains.show')}>
                                <Globe size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">{current?.name}</span>
                            </Link>
                            <Link href={route('dashboard.domains')} aria-current={aria('dashboard.domains')}>
                                <Globe size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">All domains</span>
                                <span className="cnt">{domains.length}</span>
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">People</p>
                            <Link href={withDomain('dashboard.mailboxes')} aria-current={aria('dashboard.mailboxes*')}>
                                <Users size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Mailboxes</span>
                                <span className="cnt">{current?.mailboxCount ?? 0}</span>
                            </Link>
                            <Link href={withDomain('dashboard.aliases')} aria-current={aria('dashboard.aliases')}>
                                <AtSign size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Extra addresses</span>
                            </Link>
                            <Link href={route('dashboard.team')} aria-current={aria('dashboard.team')}>
                                <UserCog size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Team &amp; access</span>
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">Billing</p>
                            <Link href={withDomain('dashboard.billing')} aria-current={aria('dashboard.billing*')}>
                                <CreditCard size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Plan &amp; storage</span>
                            </Link>
                        </div>
                        <div className="side-grp">
                            <p className="side-ttl">Account</p>
                            <Link href={route('dashboard.audit')} aria-current={aria('dashboard.audit')}>
                                <Activity size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Activity log</span>
                            </Link>
                            <Link href={route('dashboard.help')} aria-current={aria('dashboard.help')}>
                                <HelpCircle size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Help</span>
                            </Link>
                            <a href={route('mail')} target="_blank" rel="noopener">
                                <Mail size={17} strokeWidth={1.75} aria-hidden="true" />
                                <span className="lbl">Open my mailbox</span>
                                <ExternalLink size={11} strokeWidth={1.75} aria-hidden="true" className="ext" />
                                <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                        </div>
                    </nav>

                    <main className="main" id="main">
                        <TwoFactorPrompt securityRoute={route('dashboard.team')} />
                        {children}
                    </main>
                </div>
            </div>

            <nav className="tabbar" aria-label="Sections">
                <LayoutGroup id="dash-dock">
                    {dock.map((item) => {
                        const current = item.match ? isCurrent(item.match) : false;
                        const Icon = item.icon;
                        const commonInner = (
                            <>
                                <span className="tabbar-ic" aria-hidden="true">
                                    {current && (
                                        <motion.span
                                            className="tabbar-pill"
                                            layoutId="dash-dock-pill"
                                            transition={reduce ? { duration: 0 } : SPRING}
                                            aria-hidden="true"
                                        />
                                    )}
                                    <Icon size={20} strokeWidth={1.8} />
                                </span>
                                <span className="tabbar-lbl">{item.label}</span>
                                {item.external && <span className="sr-only"> (opens in a new tab)</span>}
                            </>
                        );
                        return item.external ? (
                            <a key={item.key} href={item.href} target="_blank" rel="noopener">{commonInner}</a>
                        ) : (
                            <Link key={item.key} href={item.href} aria-current={current ? 'page' : undefined}>{commonInner}</Link>
                        );
                    })}
                </LayoutGroup>
            </nav>
        </div>
    );
}
