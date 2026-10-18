import { Link } from '@inertiajs/react';
import Pill from '../ui/Pill';
import { initials } from '../../Lib/format';
import { route } from '../../Lib/route';

/* The status pill for a mailbox row, from its used/quota share and state. */
export function MailboxStatus({ mailbox }) {
    const share = Math.round((mailbox.usedGb / mailbox.quotaGb) * 100);
    if (mailbox.state === 'not_set_up') return <Pill tone="muted">Not set up</Pill>;
    if (mailbox.state === 'locked') return <Pill tone="bad">Sending paused</Pill>;
    if (mailbox.state === 'suspended') return <Pill tone="bad">Suspended</Pill>;
    if (share >= 75) return <Pill tone="warn">{share}% full</Pill>;
    return <Pill tone="ok">Active</Pill>;
}

/*
 * Compact mailbox list used on the overview: avatar, address, role and use.
 * Each row opens that mailbox.
 */
export default function MailboxTable({ mailboxes, domainName }) {
    return (
        <div>
            {mailboxes.map((mailbox, index) => (
                <div className="mini-row" key={mailbox.id}>
                    <div className="who">
                        <span className={`mini-av${index === 0 ? ' g' : ''}`} aria-hidden="true">{initials(mailbox.local)}</span>
                        <div className="who-text">
                            <b><Link href={route('dashboard.mailboxes.show', { mailbox: mailbox.id })}>{mailbox.local}@{domainName}</Link></b>
                            <span className="sub">{mailbox.roleLabel} &middot; {mailbox.usedGb} GB used</span>
                        </div>
                    </div>
                    <MailboxStatus mailbox={mailbox} />
                </div>
            ))}
        </div>
    );
}
