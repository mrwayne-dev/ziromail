// The hand-drawn underline stroke. pathLength=100 keeps the dash maths correct
// however the viewBox is stretched (DESIGN.md §5).
export function MarkStroke({ path = 'M6 17 C 58 6, 104 19, 150 11 C 196 4, 244 18, 294 9' }) {
    return (
        <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength="100" d={path} />
        </svg>
    );
}

// A word with a hand-drawn underline swept beneath it.
export default function Marked({ children, path }) {
    return (
        <i className="marked">
            {children}
            <MarkStroke path={path} />
        </i>
    );
}
