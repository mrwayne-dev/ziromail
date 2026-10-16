const TONE = { info: '', warn: 'note-warn', bad: 'note-bad', ok: 'note-ok' };

// The bordered callout with a coloured left edge (ziro.css .note). Not live: use Banner for status.
// The title is a paragraph, not a heading, so it never breaks the page's heading order.
export default function Note({ tone = 'info', title, className = '', children, ...rest }) {
    return (
        <div className={`note ${TONE[tone]} ${className}`.replace(/\s+/g, ' ').trim()} {...rest}>
            {title && <p className="note-title">{title}</p>}
            {typeof children === 'string' ? <p>{children}</p> : children}
        </div>
    );
}
