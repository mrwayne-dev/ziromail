// Says what appears here and offers the action that fills it.
export default function Empty({ icon, title, children, action }) {
    return (
        <div className="empty">
            {icon && (
                <span className="ic" aria-hidden="true">
                    {icon}
                </span>
            )}
            <h3>{title}</h3>
            {children && <p>{children}</p>}
            {action}
        </div>
    );
}
