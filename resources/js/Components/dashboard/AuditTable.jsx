import { formatDate, formatRelative, formatTime } from '../../Lib/format';

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

// "Today 09:14", "Yesterday 14:20", or a date for anything older than a month.
function when(at) {
    const relative = formatRelative(at);
    if (relative === 'Yesterday' || relative.endsWith('hr ago') || relative === 'Just now' || relative.endsWith('min ago')) {
        return `${relative.endsWith('ago') || relative === 'Just now' ? 'Today' : relative} ${formatTime(at)}`;
    }
    return relative.endsWith('days ago') ? relative : formatDate(at);
}

/* The full log: when, what happened, and the detail underneath. */
export default function AuditTable({ entries }) {
    return (
        <div className="log">
            {entries.map((entry) => (
                <div className="log-row" key={entry.id}>
                    <span className="log-when">{when(entry.at)}</span>
                    <span className="log-what">
                        <Emphasised text={entry.text} emphasis={entry.emphasis} />
                        {entry.detail && <><br /><span className="log-who">{entry.detail}</span></>}
                    </span>
                </div>
            ))}
        </div>
    );
}
