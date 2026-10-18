import { formatMailTime } from '../../Lib/format';
import { initialsOf, tintOf } from '../../Lib/mail';
import Pill from '../ui/Pill';

const EYE = <path d="M1.3 8.2c1.9-3 4.1-4.5 6.7-4.5s4.8 1.5 6.7 4.5c-1.9 2.9-4.1 4.4-6.7 4.4S3.2 11.1 1.3 8.2z M8 6.2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" stroke="currentColor" strokeWidth="1.4" fill="none" />;
const TICK = <path d="M3 8.5 6 11.5l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />;

// Opened / Not opened yet on sent mail that asked for a receipt.
export function ReceiptState({ receipt }) {
    if (!receipt?.requested) return null;
    const opened = receipt.state === 'opened';

    return (
        <span className={`rr-state ${opened ? 'read' : 'sent'}`}>
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">{opened ? EYE : TICK}</svg>
            {opened ? 'Opened' : 'Not opened yet'}
        </span>
    );
}

/*
 * One folder's messages. A row opens the message (`onOpen`); the checkbox selects
 * it for the bulk bar. Sent and draft rows show who they went to.
 */
export default function MessageList({ messages, folder, activeUid, picked, onOpen, onPick }) {
    const outgoing = folder === 'sent' || folder === 'drafts';

    return (
        <>
            {messages.map((message) => {
                const person = outgoing ? message.to[0] : message.from;
                const name = person ? (outgoing ? `To ${person.name}` : person.name) : 'No recipient';
                const classes = ['msg', message.unread && 'unread', activeUid === message.uid && 'is-active', picked.has(message.uid) && 'is-picked'].filter(Boolean).join(' ');

                return (
                    <div className={classes} key={message.uid}>
                        <label className="pick">
                            <input type="checkbox" checked={picked.has(message.uid)} onChange={() => onPick(message.uid)} />
                            <span className="sr-only">Select message from {name}</span>
                        </label>
                        <button type="button" className="msg-hit" aria-current={activeUid === message.uid ? 'true' : undefined} onClick={() => onOpen(message.uid)}>
                            <span className={`msg-av ${tintOf(person?.address ?? 'x')}`.trim()} aria-hidden="true">{initialsOf(person?.name ?? '?')}</span>
                            <span className="msg-main">
                                <span className="msg-line"><span className="from">{name}</span><span className="when">{formatMailTime(message.receivedAt)}</span></span>
                                <span className="subj">{message.subject}</span>
                                <span className="prev">{message.preview}</span>
                                {(message.hasAttachment || message.receipt.requested) && (
                                    <span className="msg-flags">
                                        {message.hasAttachment && <Pill>Attachment</Pill>}
                                        <ReceiptState receipt={message.receipt} />
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                );
            })}
        </>
    );
}
