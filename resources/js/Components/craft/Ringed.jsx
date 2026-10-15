// A phrase with a ring scrawled around it.
export default function Ringed({
    children,
    path = 'M 20 40 C 20 14, 120 6, 200 10 C 285 14, 330 32, 318 62 C 306 92, 190 100, 120 96 C 50 92, 8 74, 22 46',
}) {
    return (
        <span className="ringed">
            {children}
            <svg viewBox="0 0 340 110" preserveAspectRatio="none" aria-hidden="true">
                <path d={path} />
            </svg>
        </span>
    );
}
