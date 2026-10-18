import { formatMailTime, initials } from '../../Lib/format';
import Button from '../ui/Button';
import Pill from '../ui/Pill';

const METHOD = { authenticator: 'authenticator app', passkey: 'passkey' };
const ROLE = { owner: 'Owner', engineer: 'Engineer', support: 'Support' };

/* The roster. Permissions are chips; the role itself is the first, in strong type. */
export default function StaffList({ people, viewerEmail, canManage, onChange, onResend }) {
    return (
        <div>
            {people.map((person) => (
                <article className="person" key={person.id}>
                    <span className="av" aria-hidden="true">{initials(person.name)}</span>
                    <div className="bd">
                        <b>{person.name}</b>
                        <span className="em">{person.email}</span>
                        <div className="perms">
                            <span className="strong">{ROLE[person.role]}</span>
                            {person.perms.map((perm) => <span key={perm}>{perm}</span>)}
                            {person.strong && <span className="strong">{person.strong}</span>}
                        </div>
                        <span className="last">
                            {person.invited
                                ? `Invited ${new Date(person.invitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}: has not signed in yet`
                                : `Signed in ${formatMailTime(person.lastSignInAt).toLowerCase()} from ${person.place} · ${METHOD[person.method]}`}
                        </span>
                    </div>
                    {person.email === viewerEmail
                        ? <Pill tone="info">You</Pill>
                        : canManage && (person.invited
                            ? <Button variant="line" size="sm" onClick={() => onResend(person)}>Resend invitation</Button>
                            : <Button variant="line" size="sm" aria-label={`Change access for ${person.name}`} onClick={() => onChange(person)}>Change access</Button>)}
                </article>
            ))}
        </div>
    );
}
