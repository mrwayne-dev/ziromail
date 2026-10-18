import { useState } from 'react';
import { formatLongTime } from '../../Lib/format';
import { initialsOf, tintOf } from '../../Lib/mail';
import { route } from '../../Lib/route';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import Composer from './Composer';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

function IconButton({ label, onClick, children }) {
    return (
        <button type="button" className="icon-btn" aria-label={label} onClick={onClick}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">{children}</svg>
        </button>
    );
}

/* Message text as blocks. Nothing here is HTML, so a message can never inject markup. */
function Body({ blocks }) {
    return blocks.map((block, index) => (
        block.type === 'quote'
            ? <blockquote className="quoted" key={index}><p className="qh">{block.head}</p><p>{block.text}</p></blockquote>
            : <p key={index} className="pre">{block.text}</p>
    ));
}

/*
 * The open message: toolbar, sender, a read-receipt line on sent mail, the body,
 * attachments, and quick reply. Remote images stay blocked until shown for this
 * message only.
 */
export default function ReadingPane({ message, onClose, onAct, blockImages }) {
    const { toast } = useToast();
    const [shown, setShown] = useState(false);
    const [replying, setReplying] = useState(false);

    if (!message) {
        return (
            <section className="reader" aria-label="Message">
                <div className="mail-empty"><h2>Select a message</h2><p>Pick something from the list to read it here.</p></div>
            </section>
        );
    }

    const outgoing = message.folder === 'sent' || message.folder === 'drafts';
    const person = outgoing ? message.to[0] : message.from;
    const receipt = message.receipt;

    return (
        <section className="reader" aria-label="Message">
            <div className="reader-bar">
                <button type="button" className="icon-btn back-btn" aria-label="Back to messages" onClick={onClose}>
                    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><path d="M6.5 1 1 7l5.5 6M1 7h14" {...stroke} strokeWidth="1.7" /></svg>
                </button>
                <IconButton label="Archive" onClick={() => onAct('archive')}><rect x="1.5" y="2.5" width="13" height="3" rx="1" {...stroke} /><path d="M3 5.5v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7M6.5 8.5h3" {...stroke} /></IconButton>
                <IconButton label="Delete" onClick={() => onAct('trash')}><path d="M2.5 4h11M6 4V2.5h4V4M4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4" {...stroke} /></IconButton>
                <IconButton label="Report as spam" onClick={() => onAct('spam')}><path d="M8 1.5 15 14H1z" {...stroke} /><path d="M8 6v3.2" {...stroke} /></IconButton>
                <div className="reader-acts">
                    <Button variant="line" size="sm" onClick={() => setReplying(true)}>Reply</Button>
                    <Button variant="line" size="sm" className="hide-sm" href={route('mail.compose', { forward: message.uid })}>Forward</Button>
                </div>
            </div>

            <div className="reader-body">
                <h2>{message.subject}</h2>
                <div className="sender">
                    <span className={`msg-av reader-av ${tintOf(person?.address ?? 'x')}`.trim()} aria-hidden="true">{initialsOf(person?.name ?? '?')}</span>
                    <span className="meta"><b>{outgoing ? `To ${person?.name ?? 'no one yet'}` : person.name}</b><span className="addr">{person?.address}</span></span>
                    <span className="when">{formatLongTime(message.receivedAt)}</span>
                </div>

                {receipt.requested && (
                    <div className={`rr-line${receipt.state === 'opened' ? ' is-read' : ''}`}>
                        <span className="ic" aria-hidden="true" />
                        <span>{receipt.state === 'opened' ? `Opened ${formatLongTime(receipt.openedAt)}` : 'Not opened yet. The reader may also have receipts turned off.'}</span>
                    </div>
                )}

                {message.hasRemoteImages && blockImages && !shown && (
                    <div className="blocked">
                        <span>Images in this message were not loaded.</span>
                        <Button variant="line" size="sm" onClick={() => setShown(true)}>Show images</Button>
                    </div>
                )}
                {message.hasRemoteImages && shown && <p className="sm mut">Images shown for this message only.</p>}

                <div className="prose"><Body blocks={message.body} /></div>

                {message.attachments.map((file) => (
                    <div className="attach" key={file.id}>
                        <span className="ic" aria-hidden="true">{file.type}</span>
                        <span className="att-name"><b>{file.name}</b><span className="tiny muted">{file.sizeKb} KB</span></span>
                        <Button variant="line" size="sm" onClick={() => toast({ tone: 'warn', title: 'Downloads are not connected yet', message: `${file.name} would be saved from a signed link.` })}>Save</Button>
                    </div>
                ))}

                {replying && (
                    <Composer
                        variant="inline"
                        to={[outgoing ? message.to[0] : message.from].filter(Boolean)}
                        subject={message.subject.startsWith('Re:') ? message.subject : `Re: ${message.subject}`}
                        onClose={() => setReplying(false)}
                        fullHref={route('mail.compose', { reply: message.uid })}
                    />
                )}
            </div>
        </section>
    );
}
