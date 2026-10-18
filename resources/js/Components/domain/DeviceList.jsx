import Button from '../ui/Button';
import Pill from '../ui/Pill';

const when = (iso) => new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

/*
 * Browser sessions for the signed-in account. Each row is a real session. The
 * current one is marked and is ended with Sign out, not Revoke. `sessions` is
 * [{ handle, label, ip, lastActiveAt, current }].
 */
export default function DeviceList({ sessions, onRevoke, busyHandle }) {
    if (sessions.length === 0) {
        return <p className="sm">No other sessions are signed in.</p>;
    }

    return (
        <ul className="devices" aria-label="Signed-in devices">
            {sessions.map((session) => (
                <li key={session.handle} className="device">
                    <span className="device-main">
                        <b>{session.label}</b>
                        <span>{session.ip} · last active {when(session.lastActiveAt)}</span>
                    </span>
                    {session.current ? (
                        <Pill tone="info">This device</Pill>
                    ) : (
                        <Button variant="line" size="sm" busy={busyHandle === session.handle} onClick={() => onRevoke(session)} aria-label={`Sign out ${session.label}`}>Sign out</Button>
                    )}
                </li>
            ))}
        </ul>
    );
}
