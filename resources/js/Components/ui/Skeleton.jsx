// Placeholder matching the shape of the final content — never a bare spinner.
export default function Skeleton({ lines = 3, className = '' }) {
    return (
        <div className={className} aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => (
                <div key={i} className="skel skel-line" />
            ))}
        </div>
    );
}
