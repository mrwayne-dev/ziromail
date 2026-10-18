import { formatRelative } from '../../Lib/format';

// Splits a sentence around the part that should be bold.
function Emphasised({ text, emphasis }) {
    const at = emphasis ? text.indexOf(emphasis) : -1;
    if (at < 0) return text;

    return (
        <>
            {text.slice(0, at)}
            <b>{emphasis}</b>
            {text.slice(at + emphasis.length)}
        </>
    );
}

/* A short list of recent changes: when, and what happened. */
export default function ActivityFeed({ items }) {
    return (
        <div>
            {items.map((item) => (
                <div className="act" key={item.id}>
                    <span className="when">{formatRelative(item.at)}</span>
                    <span className="what"><Emphasised text={item.text} emphasis={item.emphasis} /></span>
                </div>
            ))}
        </div>
    );
}
