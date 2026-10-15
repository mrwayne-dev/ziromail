// A seamless loop: the track is rendered twice and translated by exactly 50%.
// The second copy is hidden from assistive tech so items are not read twice.
export default function Marquee({ children, label }) {
    return (
        <div className="marquee" role="group" aria-label={label}>
            <div className="marquee-track">
                <div className="row">{children}</div>
                <div className="row" aria-hidden="true">{children}</div>
            </div>
        </div>
    );
}

export function MarqueeItem({ children }) {
    return <span className="marquee-item">{children}</span>;
}
