// Pair with an aria-live="polite" region for anything that polls.
export default function Spinner({ label }) {
    return (
        <>
            <span className="spinner" role="presentation" />
            {label && <span className="sr-only">{label}</span>}
        </>
    );
}
