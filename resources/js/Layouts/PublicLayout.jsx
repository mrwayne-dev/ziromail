import { Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Button, { ArrowUpRightIcon } from '../Components/ui/Button';
import Logo from '../Components/ui/Logo';
import useHeroAnimation from '../Hooks/useHeroAnimation';
import { route, routeIs } from '../Lib/route';

const NAV = [
    { name: 'features', label: 'Features', mobile: 'Features' },
    { name: 'pricing', label: 'Pricing', mobile: 'Pricing' },
    { name: 'migrate', label: 'Switching', mobile: 'Switching' },
    { name: 'help', label: 'Help', mobile: 'Help centre' },
];

const FOOTER = [
    {
        title: 'Product',
        links: [
            ['features', 'Features'],
            ['pricing', 'Pricing'],
            ['setup.device', 'Phone setup'],
            ['migrate', 'Switching'],
        ],
    },
    {
        title: 'Support',
        links: [
            ['help', 'Help centre'],
            ['contact', 'Contact us'],
            ['status', 'Status page'],
        ],
    },
    {
        title: 'Legal',
        links: [
            ['legal.terms', 'Terms of service'],
            ['legal.privacy', 'Privacy policy'],
            ['legal.aup', 'Acceptable use'],
            ['legal.refunds', 'Refund policy'],
        ],
    },
];

function Header({ variant }) {
    const { url } = usePage();
    const ink = variant === 'ink';
    const float = variant === 'float';
    const [stuck, setStuck] = useState(false);
    const [open, setOpen] = useState(false);
    const panel = useRef(null);
    const toggle = useRef(null);

    // The ink header turns opaque once the page scrolls.
    useEffect(() => {
        const onScroll = () => setStuck(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // A navigation always closes the sheet.
    useEffect(() => setOpen(false), [url]);

    /*
     * The panel animates max-height, which needs a real number, so it is
     * measured on each open — the menu is taller on pages that add links.
     * Opening: clamp to 0, flush, then set the measured height. Once the
     * transition ends the clamp is dropped, because scrollHeight rounds down and
     * misses late layout shifts (a webfont swapping in).
     */
    const first = useRef(true);
    useLayoutEffect(() => {
        const nav = panel.current;
        if (!nav) return undefined;
        if (first.current) {
            first.current = false;
            return undefined;
        }

        if (open) {
            nav.style.maxHeight = 'none';
            const h = nav.scrollHeight;
            nav.style.maxHeight = '0px';
            void nav.offsetHeight;
            nav.style.maxHeight = `${h}px`;
            const done = (ev) => {
                if (ev.propertyName !== 'max-height') return;
                nav.removeEventListener('transitionend', done);
                if (nav.classList.contains('open')) nav.style.maxHeight = 'none';
            };
            nav.addEventListener('transitionend', done);
            return () => nav.removeEventListener('transitionend', done);
        }

        // Pin the current height first: a transition out of `none` has nothing to interpolate from.
        nav.style.maxHeight = `${nav.scrollHeight}px`;
        void nav.offsetHeight;
        nav.style.maxHeight = '0px';
        return undefined;
    }, [open]);

    useEffect(() => {
        document.body.classList.toggle('nav-locked', open);
        return () => document.body.classList.remove('nav-locked');
    }, [open]);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (e) => {
            if (e.key === 'Escape') {
                close();
                toggle.current?.focus();
            }
        };
        const onClick = (e) => {
            if (!e.target.closest('.mnav') && !e.target.closest('[data-nav-toggle]')) close();
        };
        // Crossing into the desktop layout would otherwise leave the body locked.
        const onResize = () => {
            if (window.innerWidth >= 1000) close();
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener('click', onClick);
        window.addEventListener('resize', onResize);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);
        };
    }, [open, close]);

    const classes = ['hdr', ink && 'hdr-ink hdr-over', float && 'hdr-float hdr-over', (ink || float) && stuck && 'is-stuck', open && 'nav-open']
        .filter(Boolean)
        .join(' ');

    return (
        <header className={classes}>
            <div className={`wrap ${float ? 'wrap-edge' : 'wrap-wide'} bar`}>
                <Link className="brand" href={route('home')} aria-label="Ziroemail home">
                    <Logo variant="white" className="logo-light" />
                    <Logo variant="black" className="logo-dark" decorative />
                </Link>
                <nav className="nav" aria-label="Main">
                    {NAV.map((item) => (
                        <Link key={item.name} href={route(item.name)} aria-current={routeIs(item.name) ? 'page' : undefined}>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="hdr-act">
                    {float ? (
                        <>
                            <Button variant="quiet" size="sm" href={route('login')}>Sign in</Button>
                            <Button size="sm" split icon={<ArrowUpRightIcon />} href={route('signup')}>Get started</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="line" size="sm" href={route('login')}>Sign in</Button>
                            <Button size="sm" href={route('signup')}>Get started</Button>
                        </>
                    )}
                </div>
                <button
                    ref={toggle}
                    className="burger"
                    type="button"
                    data-nav-toggle=""
                    aria-expanded={open}
                    aria-controls="mnav"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    onClick={() => setOpen((v) => !v)}
                >
                    <svg className="i-open" width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
                        <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <svg className="i-close" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
            <div ref={panel} className={`mnav${open ? ' open' : ''}`} id="mnav">
                {NAV.map((item) => (
                    <Link key={item.name} href={route(item.name)}>{item.mobile}</Link>
                ))}
                <div className="btn-row">
                    <Button variant="line" full href={route('login')}>Sign in</Button>
                    <Button full href={route('signup')}>Get started</Button>
                </div>
            </div>
        </header>
    );
}

// Status page: a bare bar with no navigation, so the page does not depend on
// the rest of the site being healthy.
function StatusHeader() {
    return (
        <header className="s-top">
            <div className="wrap bar">
                <Link className="brand" href={route('home')} aria-label="Ziroemail home">
                    <Logo variant="black" />
                </Link>
                <Button variant="line" size="sm" href={route('home')}>Back to site</Button>
            </div>
        </header>
    );
}

function ArrowUpRight() {
    return (
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3.5 10.5 10.5 3.5M4.5 3.5h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function Footer({ compact = false, light = false }) {
    if (light) {
        return (
            <footer className="ftr-light">
                <div className="wrap wrap-edge">
                    <div className="ftr-l-grid">
                        <div>
                            <Logo variant="black" />
                            <p className="ftr-l-tag">
                                <span>Business email for Nigerian companies.</span>
                                <span>Built and run by Zirostack in Port Harcourt, Rivers State.</span>
                            </p>
                        </div>
                        {FOOTER.map((col) => (
                            <div key={col.title}>
                                <h4>{col.title}</h4>
                                <div className="ftr-l-links">
                                    {col.links.map(([name, label]) => (
                                        <Link key={name} href={route(name)}>
                                            {label}
                                            {name === 'status' && <ArrowUpRight />}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="ftr-l-btm">
                        <span>&copy; 2026 Zirostack Ltd.</span>
                        <span>Port Harcourt, Rivers State &middot; VAT charged at 7.5%</span>
                    </div>
                </div>
            </footer>
        );
    }

    if (compact) {
        return (
            <footer className="ftr" style={{ marginTop: 40 }}>
                <div className="wrap">
                    <div className="ftr-btm" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
                        <span>&copy; 2026 Zirostack Ltd.</span>
                        <span>Port Harcourt, Rivers State</span>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="ftr">
            <div className="wrap">
                <div className="ftr-grid">
                    <div>
                        <Logo variant="white" />
                        <p className="sm" style={{ marginTop: 16, maxWidth: '34ch', color: 'var(--tx-inv-3)' }}>
                            Business email for Nigerian companies. Built and run by Zirostack in Port Harcourt, Rivers State.
                        </p>
                        <Link className="tlink" style={{ marginTop: 18, color: 'var(--blue-300)', fontSize: '.9rem' }} href={route('status')}>
                            System status
                        </Link>
                    </div>
                    {FOOTER.map((col) => (
                        <div key={col.title}>
                            <h4>{col.title}</h4>
                            {col.links.map(([name, label]) => (
                                <Link key={name} href={route(name)}>{label}</Link>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="ftr-btm">
                    <span>&copy; 2026 Zirostack Ltd.</span>
                    <span>Port Harcourt, Rivers State &middot; VAT charged at 7.5%</span>
                </div>
            </div>
        </footer>
    );
}

/*
 * The public site shell.
 *   variant   'ink'    — transparent header over a dark hero (marketing pages)
 *             'light'  — white header (legal pages)
 *             'float'  — transparent header with floating nav capsules, over a light hero (home page)
 *             'status' — bare header and a one-line footer (status page)
 *   page      scopes the page's own stylesheet (resources/css/pages.css) as .pg-{page}
 *   mainClass extra classes for <main>
 *
 * <header> and <main> must stay adjacent siblings: ziro.css pulls the first
 * section up under the header with `.hdr-over + main > section:first-child`.
 */
export default function PublicLayout({ variant = 'ink', page, mainClass, children }) {
    useHeroAnimation();

    return (
        <div className={page ? `pg-${page}` : undefined}>
            <a className="skip-link" href="#main">Skip to content</a>
            {variant === 'status' ? <StatusHeader /> : <Header variant={variant} />}
            <main id="main" className={mainClass}>{children}</main>
            <Footer compact={variant === 'status'} light={variant === 'float'} />
        </div>
    );
}
