import { Link, usePage } from '@inertiajs/react';
import AccountMenu from '../Components/domain/AccountMenu';
import Seo from '../Components/seo/Seo';
import Logo from '../Components/ui/Logo';
import PrototypeNotice from '../Components/ui/PrototypeNotice';
import { route } from '../Lib/route';
import { abuseFlags, refunds } from '../fixtures/ops';

const GROUPS = [
    ['Watch', [['ops', 'Overview'], ['ops.deliverability', 'Deliverability'], ['ops.queue', 'Delivery log'], ['ops.domains', 'Domain status']]],
    ['Act', [['ops.abuse', 'Abuse queue', abuseFlags.length, true], ['ops.refunds', 'Refunds', refunds.waiting.length]]],
    ['Accounts', [['ops.orgs', 'Organisations'], ['ops.mailboxes', 'Mailboxes']]],
    ['Platform', [['ops.backups', 'Backups'], ['ops.reports', 'Reports'], ['ops.staff', 'Staff'], ['ops.audit', 'Audit trail']]],
];

const isCurrent = (name) => window.route().current(name === 'ops' ? 'ops' : `${name}*`);

/*
 * Shell for the operations console: black header marked Internal, a dark side
 * navigation (a scrolling strip on narrow screens), and the page. The signed-in
 * staff member comes from the shared `staff` prop; sign-out posts to the staff
 * guard's own route.
 */
export default function OpsLayout({ page, title, children }) {
    const { staff } = usePage().props;
    const user = staff ? { name: staff.name, email: `${staff.email} · ${staff.role}` } : null;

    return (
        <div className={`pg-${page} ops`}>
            <Seo title={`${title} - Ziroemail operations`} description={title} noindex />
            <a className="skip-link" href="#main">Skip to content</a>
            <header className="ops-hdr">
                <div className="wrap bar bar-wide">
                    <Link href={route('ops')} aria-label="Operations overview"><Logo variant="white" /></Link>
                    <span className="tag">Internal</span>
                    <span className="who">
                        <span className="mono hide-sm small-mono">ops.ziroemail.com</span>
                        {user && <AccountMenu user={user} signOutRoute="ops.logout" links={[{ href: route('ops.staff'), label: 'Staff and security' }]} />}
                    </span>
                </div>
            </header>

            <nav className="ops-tabs" aria-label="Operations sections">
                {GROUPS.flatMap(([, items]) => items).map(([name, label]) => (
                    <Link key={name} href={route(name)} aria-current={isCurrent(name) ? 'page' : undefined}>{label}</Link>
                ))}
            </nav>

            <div className="ops-body">
                <nav className="ops-side" aria-label="Operations sections">
                    {GROUPS.map(([group, items]) => (
                        <div className="grp" key={group}>
                            <p className="ttl">{group}</p>
                            {items.map(([name, label, count, hot]) => (
                                <Link key={name} href={route(name)} aria-current={isCurrent(name) ? 'page' : undefined}>
                                    {label}{count ? <span className={`n${hot ? ' hot' : ''}`}>{count}</span> : null}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>
                <main className="ops-main" id="main">
                    <div className="ops-notice"><PrototypeNotice /></div>
                    {children}
                </main>
            </div>
        </div>
    );
}
