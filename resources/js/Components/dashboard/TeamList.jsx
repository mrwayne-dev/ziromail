import { Lock } from 'lucide-react';
import DataTable from '../ui/DataTable';
import { formatDate, initials } from '../../Lib/format';
import Button from '../ui/Button';
import Pill from '../ui/Pill';

const ROLE = { owner: ['info', 'Owner · account holder'], admin: ['muted', 'Administrator'], user: ['muted', 'User'] };

/*
 * Everyone with access to the account: the owner (locked), administrators invited
 * by the owner, and agency delegations. Built on `DataTable` so the row shape
 * matches every other list in the console; the owner row is pinned at the top
 * via the `kind` field (`owner`), and delegations sort last. `onChange` and
 * `onWithdraw` are only given to a role that may use them.
 */
function Person({ row }) {
    return (
        <span className="who">
            <span className={`pe-av${row.kind === 'owner' ? ' b' : ''}`} aria-hidden="true">{initials(row.name)}</span>
            <span className="nm"><b>{row.name}</b><span>{row.subtitle}</span></span>
        </span>
    );
}

function Role({ row }) {
    if (row.kind === 'owner') {
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <Pill tone={ROLE.owner[0]}>{ROLE.owner[1]}</Pill>
                <span className="lock" title="The owner address cannot be changed here" style={{ display: 'inline-flex' }}>
                    <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
                    <span className="sr-only">Locked</span>
                </span>
            </span>
        );
    }
    if (row.kind === 'delegation') return <Pill tone="warn">Delegated</Pill>;
    return (
        <>
            <Pill tone={ROLE[row.role]?.[0] ?? 'muted'}>{ROLE[row.role]?.[1] ?? row.role}</Pill>
            {row.pending && <> <Pill tone="muted">Invited</Pill></>}
        </>
    );
}

const BASE_COLUMNS = [
    { id: 'who', header: 'Person', accessor: (row) => <Person row={row} /> },
    { id: 'role', header: 'Role', accessor: (row) => <Role row={row} /> },
];

export default function TeamList({ people, delegations, onChange, onWithdraw }) {
    const rows = [
        ...people.map((person) => ({
            id: `person-${person.id}`,
            kind: person.role === 'owner' ? 'owner' : 'member',
            name: person.name,
            subtitle: person.email,
            role: person.role,
            pending: person.pending,
            source: person,
        })),
        ...delegations
            .filter((d) => !d.revokedAt)
            .map((d) => ({
                id: `del-${d.id}`,
                kind: 'delegation',
                name: d.granteeName,
                subtitle: `Agency · access granted ${formatDate(d.grantedAt)}`,
                source: d,
            })),
    ];

    const hasActions = Boolean(onChange || onWithdraw);
    const renderActions = hasActions
        ? (row) => {
            if (row.kind === 'owner') return null;
            if (row.kind === 'delegation' && onWithdraw) {
                return <Button variant="danger" size="sm" aria-label={`Withdraw access from ${row.name}`} onClick={() => onWithdraw(row.source)}>Withdraw</Button>;
            }
            if (row.kind === 'member' && onChange) {
                return <Button variant="line" size="sm" aria-label={`Remove ${row.name}`} onClick={() => onChange(row.source)}>Remove</Button>;
            }
            return null;
        }
        : undefined;

    return (
        <>
            <DataTable
                columns={BASE_COLUMNS}
                rows={rows}
                rowKey={(row) => row.id}
                renderActions={renderActions}
                emptyState={{ title: 'Only the owner has access right now' }}
                stagger={false}
            />
            {people.find((p) => p.role === 'owner') && (
                <p className="hint mt-s">
                    The owner address is the one you signed up with, not a mailbox on your domain. It is how we verify ownership if you are ever locked out, so it is changed by contacting support rather than from this screen.
                </p>
            )}
        </>
    );
}
