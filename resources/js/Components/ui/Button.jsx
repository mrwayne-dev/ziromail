import { Link } from '@inertiajs/react';

const VARIANT = {
    primary: 'btn-pri',
    ink: 'btn-ink',
    line: 'btn-line',
    quiet: 'btn-quiet',
    white: 'btn-white',
    danger: 'btn-danger',
};

const SIZE = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

/*
 * Renders an Inertia <Link> when given `href`, a <button> otherwise.
 * `busy` swaps the label for a spinner (data-busy) and blocks pointer events.
 */
export default function Button({
    variant = 'primary',
    size = 'md',
    full = false,
    busy = false,
    href,
    className = '',
    children,
    ...rest
}) {
    const classes = ['btn', VARIANT[variant], SIZE[size], full && 'full', className]
        .filter(Boolean)
        .join(' ');

    if (href !== undefined) {
        return (
            <Link href={href} className={classes} {...rest}>
                {children}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} data-busy={busy ? '' : undefined} {...rest}>
            {children}
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
