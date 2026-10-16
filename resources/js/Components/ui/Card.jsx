const VARIANT = {
    default: '',
    // Square panel meant to sit edge to edge with another; `featured` fills it with the brand blue.
    panel: 'card-panel',
};

export default function Card({
    as: Tag = 'div',
    variant = 'default',
    size,
    flat = false,
    ink = false,
    featured = false,
    className = '',
    children,
    ...rest
}) {
    const base = variant === 'default' ? 'card' : VARIANT[variant];
    const classes = [
        base,
        variant === 'default' && size === 'lg' && 'card-lg',
        variant === 'default' && flat && 'card-flat',
        variant === 'default' && ink && 'card-ink',
        variant === 'panel' && featured && 'is-featured',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Tag className={classes} {...rest}>
            {children}
        </Tag>
    );
}
