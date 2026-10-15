// Flat geometric marks echoing the logo's circle and envelope flap. Purely
// decorative, so always aria-hidden. Position and size come from className.
export default function Shape({ variant = 'ring', className = '', style }) {
    if (variant === 'flap') {
        return (
            <svg
                className={`shape shape-flap ${className}`.trim()}
                style={style}
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
            >
                <path d="M8 30 L50 62 L92 30" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    return <span className={`shape shape-${variant} ${className}`.trim()} style={style} aria-hidden="true" />;
}
