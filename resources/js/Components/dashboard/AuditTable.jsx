import DataTable from '../ui/DataTable';
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

/*
 * The full activity log on the owner dashboard. Built on `DataTable` so the sticky
 * header, numeric alignment, pagination and row stagger match every other list in
 * the console. The old `.log / .log-row / .log-when / .log-what` CSS has been
 * replaced with the standard table shape.
 */
const COLUMNS = [
    {
        id: 'at',
        header: 'When',
        width: 180,
        nowrap: true,
        sortable: true,
        accessor: (row) => when(row.at),
        sortValue: (row) => row.at,
    },
    {
        id: 'what',
        header: 'What happened',
        accessor: (row) => (
            <>
                <Emphasised text={row.text} emphasis={row.emphasis} />
                {row.detail && <><br /><span className="sub">{row.detail}</span></>}
            </>
        ),
    },
];

export default function AuditTable({ entries, toolbar }) {
    return (
        <DataTable
            columns={COLUMNS}
            rows={entries}
            rowKey={(row) => row.id}
            toolbar={toolbar}
            emptyState={{ title: 'Nothing recorded in this category yet' }}
            pagination={{ pageSize: 50 }}
        />
    );
}
