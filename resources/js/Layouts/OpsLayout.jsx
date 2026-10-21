import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'; // AnimatePresence used for the MoreSheet only
import { Archive, BarChart3, BookOpen, Globe, IdCard, Inbox, LayoutDashboard, LineChart, MoreHorizontal, Receipt, Scroll, Search as SearchIcon, Shield, ShieldAlert, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AccountMenu from '../Components/domain/AccountMenu';
import CommandPalette, { useCommandPalette } from '../Components/ops/CommandPalette';
import Seo from '../Components/seo/Seo';
import Logo from '../Components/ui/Logo';
import useDismissible from '../Hooks/useDismissible';
import { refunds } from '../fixtures/ops';
import { route } from '../Lib/route';

/*
 * Shell for the operations console. Dark 240px sidebar / 52px topbar / near-white main on
 * desktop. Tablet collapses the sidebar to an icon rail. Mobile hides the sidebar entirely
 * and replaces it with a bottom dock + More sheet. There is no hamburger.
 *
 * References:
 *   https://21st.dev/@arunjdass/components/dashboard-sidebar  dark palette + grouped nav
 *   https://21st.dev/@aicanvas/components/expanding-tabs      active-pill tab bar
 *   https://21st.dev/@ruixen.ui/components/pill-morph-tabs    spring animation for the pill
 */

const PRIMARY = ['ops', 'ops.deliverability', 'ops.abuse', 'ops.users'];

const NAV = (counts) => [
    { title: 'Watch', items: [
        { name: 'ops',                 label: 'Overview',       icon: LayoutDashboard },
        { name: 'ops.deliverability',  label: 'Deliverability', icon: LineChart },
        { name: 'ops.queue',           label: 'Delivery log',   icon: Scroll },
        { name: 'ops.domains',         label: 'Domain status',  icon: Globe },
    ]},
    { title: 'Act', items: [
        { name: 'ops.abuse',           label: 'Abuse queue',    icon: ShieldAlert, badge: counts.abuse, hot: true },
        { name: 'ops.spam-rules',      label: 'Spam rules',     icon: Shield },
        { name: 'ops.refunds',         label: 'Refunds',        icon: Receipt, badge: counts.refunds },
    ]},
    { title: 'Accounts', items: [
        { name: 'ops.users',           label: 'Users',          icon: Users },
        { name: 'ops.mailboxes',       label: 'Mailboxes',      icon: Inbox },
    ]},
    { title: 'Platform', items: [
        { name: 'ops.backups',         label: 'Backups',        icon: Archive },
        { name: 'ops.reports',         label: 'Reports',        icon: BarChart3 },
        { name: 'ops.staff',           label: 'Staff',          icon: IdCard },
        { name: 'ops.audit',           label: 'Audit trail',    icon: BookOpen },
    ]},
];

const SPRING = { type: 'spring', stiffness: 400, damping: 32, mass: 0.6 };

function isCurrent(name) {
    const current = window.route().current.bind(window.route());
    return name === 'ops' ? current('ops') : current(`${name}*`);
}

function initials(name) {
    return (name ?? '')
        .split(/\s+/)
        .filter(Boolean).slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?';
}

function Crumbs({ parent, title }) {
    return (
        <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={route('ops')}>Ops</Link>
            {parent && <><span className="sep">/</span><Link href={parent.href}>{parent.label}</Link></>}
            <span className="sep">/</span>
            <span className="cur">{title}</span>
        </nav>
    );
}

function SidebarItem({ item }) {
    const current = isCurrent(item.name);
    const Icon = item.icon;
    return (
        <Link href={route(item.name)} aria-current={current ? 'page' : undefined}>
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            <span className="lbl">{item.label}</span>
            {typeof item.badge === 'number' && item.badge > 0 && (
                <span className={`badge${item.hot ? ' hot' : ''}`}>{item.badge}</span>
            )}
        </Link>
    );
}

/* Mobile bottom dock with motion active pill. */
function MobileDock({ sections, counts, onOpenMore }) {
    const reduce = useReducedMotion();
    const primary = useMemo(() => sections.flatMap((group) => group.items).filter((item) => PRIMARY.includes(item.name)), [sections]);

    return (
        <nav className="ops-dock" aria-label="Operations primary">
            <LayoutGroup id="ops-dock">
                {primary.map((item) => {
                    const current = isCurrent(item.name);
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} href={route(item.name)} aria-current={current ? 'page' : undefined} aria-label={item.label}>
                            <span className="ops-dock-ic" aria-hidden="true">
                                {current && (
                                    <motion.span
                                        className="ops-dock-pill"
                                        layoutId="ops-dock-pill"
                                        transition={reduce ? { duration: 0 } : SPRING}
                                        aria-hidden="true"
                                    />
                                )}
                                <Icon size={20} strokeWidth={1.8} />
                                {item.name === 'ops.abuse' && counts.abuse > 0 && <span className="ops-dock-dot" aria-hidden="true" />}
                            </span>
                            <span className="ops-dock-lbl">{item.label}</span>
                        </Link>
                    );
                })}
                <button type="button" className="ops-dock-more" onClick={onOpenMore} aria-haspopup="dialog" aria-label="More destinations">
                    <span className="ops-dock-ic" aria-hidden="true"><MoreHorizontal size={20} strokeWidth={1.8} /></span>
                    <span className="ops-dock-lbl">More</span>
                </button>
            </LayoutGroup>
        </nav>
    );
}

function MoreSheet({ open, onClose, sections, user }) {
    const ref = useDismissible(open, onClose);
    const reduce = useReducedMotion();

    useEffect(() => {
        if (!open) return;
        const onKey = (event) => { if (event.key === 'Escape') onClose(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    const secondary = useMemo(() => sections.flatMap((group) => group.items).filter((item) => !PRIMARY.includes(item.name)), [sections]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="ops-sheet" role="dialog" aria-modal="true" aria-label="More destinations"
                    onClick={onClose}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.18 }}
                >
                    <motion.div
                        className="ops-sheet-body" ref={ref} onClick={(event) => event.stopPropagation()}
                        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
                        transition={reduce ? { duration: 0 } : { ...SPRING, mass: 0.5 }}
                    >
                        <div className="ops-sheet-grab" aria-hidden="true" />
                        <p className="ops-sheet-ttl">More</p>
                        <ul className="ops-sheet-list">
                            {secondary.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.name}>
                                        <Link href={route(item.name)} onClick={onClose} aria-current={isCurrent(item.name) ? 'page' : undefined}>
                                            <span className="ops-sheet-ic" aria-hidden="true"><Icon size={16} strokeWidth={1.75} /></span>
                                            <span className="ops-sheet-lbl">{item.label}</span>
                                            {typeof item.badge === 'number' && item.badge > 0 && <span className={`badge${item.hot ? ' hot' : ''}`}>{item.badge}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        {user && (
                            <div className="ops-sheet-user">
                                <span className="av" aria-hidden="true">{initials(user.name)}</span>
                                <span className="meta">
                                    <b>{user.name}</b>
                                    <span>{user.email}</span>
                                </span>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function OpsLayout({ page, title, parent, children }) {
    const { staff, opsCounts } = usePage().props;
    const counts = { abuse: opsCounts?.abuse ?? 0, refunds: refunds.waiting.length };
    const sections = NAV(counts);
    const user = staff ? { name: staff.name, email: `${staff.email} · ${staff.role}` } : null;
    const [sheetOpen, setSheetOpen] = useState(false);
    const palette = useCommandPalette();

    return (
        <div className={`ops pg-${page}`}>
            <Seo title={`${title} - Ziroemail operations`} description={title} noindex />
            <a className="skip-link" href="#main">Skip to content</a>

            <aside className="ops-sidebar" aria-label="Operations navigation">
                <div className="ops-brand">
                    <Link href={route('ops')} aria-label="Operations overview" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Logo variant="white" />
                    </Link>
                    <span className="tag">Internal</span>
                </div>
                <div className="ops-nav">
                    {sections.map((group) => (
                        <div className="grp" key={group.title}>
                            <p className="ttl">{group.title}</p>
                            {group.items.map((item) => <SidebarItem key={item.name} item={item} />)}
                        </div>
                    ))}
                </div>
                {user && (
                    <div className="ops-user">
                        <span className="av" aria-hidden="true">{initials(user.name)}</span>
                        <span className="meta">
                            <b>{user.name}</b>
                            <span>{user.email}</span>
                        </span>
                    </div>
                )}
            </aside>

            <header className="ops-topbar" role="banner">
                <Crumbs parent={parent} title={title} />
                <span className="space" />
                <button type="button" className="search" onClick={palette.toggle} aria-label="Open command palette">
                    <SearchIcon size={14} strokeWidth={2} />
                    <span>Search ops</span>
                    <kbd>&#8984;K</kbd>
                </button>
                <span className="env">{import.meta.env.VITE_APP_ENV === 'production' ? 'Live' : 'Preview'}</span>
                {user && <AccountMenu user={user} signOutRoute="ops.logout" links={[{ href: route('ops.staff'), label: 'Staff and security' }]} />}
            </header>

            <main className="ops-main" id="main">
                {/* No wrapper animation here. The content shows immediately; row-level stagger inside
                 * DataTable, ActivityFeed and the Abuse flag cards carries the entry delight.
                 * Reasons the old wrapper went: a brief motion stall left the whole page at opacity 0
                 * on some navigations, which read as a blank screen. See docs/BUILD_LOG.md. */}
                {children}
            </main>

            <MobileDock sections={sections} counts={counts} onOpenMore={() => setSheetOpen(true)} />
            <MoreSheet open={sheetOpen} onClose={() => setSheetOpen(false)} sections={sections} user={user} />
            <CommandPalette open={palette.open} onClose={() => palette.setOpen(false)} />
        </div>
    );
}
