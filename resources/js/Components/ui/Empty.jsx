// Says what appears here and offers the action that fills it.
export default function Empty({ icon, title, children, action, headingLevel = 2 }) {
    const Heading = `h${headingLevel}`;
    return (
        <div className="empty">
            {icon && (
                <span className="ic" aria-hidden="true">
                    {icon}
                </span>
            )}
            <Heading>{title}</Heading>
            {children && <p>{children}</p>}
            {action}
        </div>
    );
}
