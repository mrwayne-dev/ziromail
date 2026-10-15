export default function Card({ as: Tag = 'div', size, flat = false, ink = false, className = '', children, ...rest }) {
    const classes = ['card', size === 'lg' && 'card-lg', flat && 'card-flat', ink && 'card-ink', className]
        .filter(Boolean)
        .join(' ');
    return (
        <Tag className={classes} {...rest}>
            {children}
        </Tag>
    );
}
