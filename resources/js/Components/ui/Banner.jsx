const TONE = { bad: 'banner-bad', warn: 'banner-warn', ok: 'banner-ok', info: 'banner-info' };

// Inline status message. `live` makes it announce itself to screen readers.
export default function Banner({ tone = 'info', title, live = false, icon, className = '', children, ...rest }) {
    return (
        <div
            className={`banner ${TONE[tone]} ${className}`.trim()}
            role={live ? (tone === 'bad' ? 'alert' : 'status') : undefined}
            {...rest}
        >
            {icon}
            <div className="bd">
                {title && <b>{title}</b>}
                {children}
            </div>
        </div>
    );
}
