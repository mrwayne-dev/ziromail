/*
 * A numbered annotation for a diagram: number, a short leader line, and text.
 * `side` is which side of the diagram it sits on — a left callout reads
 * text → line → number so the number is always the end nearest the diagram.
 * Below the desktop breakpoint the leader line is hidden and it reads as a plain
 * numbered row.
 */
export default function Callout({ n, side = 'right', title, children }) {
    return (
        <div className={`callout callout-${side}`}>
            <span className="callout-n" aria-hidden="true">{n}</span>
            <span className="callout-line" aria-hidden="true" />
            <div className="callout-body">
                <b>{title}</b>
                <p>{children}</p>
            </div>
        </div>
    );
}
