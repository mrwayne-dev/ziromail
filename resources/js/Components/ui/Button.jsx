import { Link } from '@inertiajs/react';

const VARIANT = {
    primary: 'btn-pri',
    ink: 'btn-ink',
    line: 'btn-line',
    quiet: 'btn-quiet',
    white: 'btn-white',
    glass: 'btn-glass',
    danger: 'btn-danger',
};

const SIZE = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

/*
 * `split` gives the icon its own square cell at the end (pair with ArrowUpRightIcon);
 * `pill` rounds the button fully; `icon` is a node shown after the label and nudged
 * on hover (use ArrowIcon). `glass` is the translucent variant for dark surfaces.
 * Renders an Inertia <Link> when given `href`, a <button> otherwise.
 * `busy` swaps the label for a spinner (data-busy) and blocks pointer events.
 */
export default function Button({
    variant = 'primary',
    size = 'md',
    full = false,
    pill = false,
    split = false,
    icon,
    busy = false,
    href,
    className = '',
    children,
    ...rest
}) {
    const classes = ['btn', VARIANT[variant], SIZE[size], pill && 'btn-pill', split && 'btn-split', full && 'full', className]
        .filter(Boolean)
        .join(' ');

    if (href !== undefined) {
        return (
            <Link href={href} className={classes} {...rest}>
                {children}
                {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} data-busy={busy ? '' : undefined} {...rest}>
            {children}
            {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
        </button>
    );
}

export function ArrowIcon({ size = 16 }) {
    return (
        <svg className="arr" width={size} height={Math.round(size * 0.75)} viewBox="0 0 17 13" fill="none" aria-hidden="true">
            <path d="M10.2 1 15.5 6.5 10.2 12M15 6.5H1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ArrowUpRightIcon({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3.5 10.5 10.5 3.5M4.5 3.5h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
