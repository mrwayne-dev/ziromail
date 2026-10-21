import { formatDate, initials } from '../../Lib/format';
import Button from '../ui/Button';
import Pill from '../ui/Pill';

const ROLE = { owner: ['info', 'Owner · account holder'], admin: ['muted', 'Administrator'], user: ['muted', 'User'] };

/*
 * Everyone with access: the owner (locked), administrators, and delegated agencies.
 * `onChange` and `onWithdraw` are only given to a role that may use them.
 */
export default function TeamList({ people, delegations, onChange, onWithdraw }) {
    const owner = people.find((person) => person.role === 'owner');
    const others = people.filter((person) => person.role !== 'owner');

    return (
        <div>
            {owner && (
                <>
                    <div className="row owner-row mt-s">
                        <span className="who">
                            <span className="pe-av b" aria-hidden="true">{initials(owner.name)}</span>
                            <span className="nm"><b>{owner.name}</b><span>{owner.email}</span></span>
                        </span>
                        <Pill tone="info">{ROLE.owner[1]}</Pill>
                        <span className="lock" title="The owner address cannot be changed here">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <span className="sr-only">Locked</span>
                        </span>
                    </div>
                    <p className="hint">
                        This is the address you signed up with, not a mailbox on your domain. It is how we verify ownership if you are ever locked out, so it is changed by contacting support rather than from this screen.
                    </p>
                </>
            )}
            {others.map((person) => (
                <div className="row" key={person.id}>
                    <span className="who">
                        <span className="pe-av" aria-hidden="true">{initials(person.name)}</span>
                        <span className="nm"><b>{person.name}</b><span>{person.email}</span></span>
                    </span>
                    <Pill tone={ROLE[person.role][0]}>{ROLE[person.role][1]}</Pill>
                    {person.pending && <Pill tone="muted">Invited</Pill>}
                    {onChange && <Button variant="line" size="sm" aria-label={`Remove ${person.name}`} onClick={() => onChange(person)}>Remove</Button>}
                </div>
            ))}
            {delegations.filter((delegation) => !delegation.revokedAt).map((delegation) => (
                <div className="row" key={delegation.id}>
                    <span className="who">
                        <span className="pe-av" aria-hidden="true">{initials(delegation.granteeName)}</span>
                        <span className="nm"><b>{delegation.granteeName}</b><span>Agency &middot; access granted {formatDate(delegation.grantedAt)}</span></span>
                    </span>
                    <Pill tone="warn">Delegated</Pill>
                    {onWithdraw && <Button variant="danger" size="sm" aria-label={`Withdraw access from ${delegation.granteeName}`} onClick={() => onWithdraw(delegation)}>Withdraw</Button>}
                </div>
            ))}
        </div>
    );
}
