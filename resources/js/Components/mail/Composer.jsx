import { useEffect, useId, useRef, useState } from 'react';
import { mailboxFixture, settingsFixture } from '../../fixtures/mail';
import { route } from '../../Lib/route';
import { router } from '@inertiajs/react';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import RecipientChips, { isEmail } from './RecipientChips';

const MAX_ATTACH_MB = 25;
const UNDO_SECONDS = 10;
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const asParagraphs = (text) => text.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);

/*
 * One composer, three shapes:
 *   popup   the corner window over the inbox (minimise, full screen, close)
 *   page    the full-screen composer
 *   inline  quick reply under an open message (plain text)
 * Nothing is sent anywhere in the preview: Send holds the message for the undo
 * window, then says it is "sent". `onSent` lets the caller add it to Sent.
 */
export default function Composer({ variant = 'page', to = [], subject: initialSubject = '', onClose, onSent, fullHref }) {
    const id = useId();
    const { toast, dismiss } = useToast();
    const bodyRef = useRef(null);
    const [recipients, setRecipients] = useState(to);
    const [cc, setCc] = useState([]);
    const [showCc, setShowCc] = useState(false);
    const [subject, setSubject] = useState(initialSubject);
    const [plain, setPlain] = useState('');
    const [files, setFiles] = useState([]);
    const [receipt, setReceipt] = useState(settingsFixture.preferences.requestReceipts);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [size, setSize] = useState('open');
    const dirty = recipients.length + cc.length > 0 || subject || plain || files.length > 0;

    // Autosave a moment after typing stops. In the live product this is an IMAP APPEND to Drafts.
    useEffect(() => {
        if (variant === 'inline' || !dirty) return undefined;
        setSaved(false);
        const timer = setTimeout(() => setSaved(true), 1200);
        return () => clearTimeout(timer);
    }, [recipients, cc, subject, plain, files, variant, dirty]);

    function format(command) {
        bodyRef.current?.focus();
        if (command === 'createLink') {
            const url = window.prompt('Link address');
            if (url && /^https?:\/\//i.test(url)) document.execCommand('createLink', false, url);
            return;
        }
        document.execCommand(command);
    }

    function addFiles(list) {
        const next = [...files];
        for (const file of Array.from(list)) {
            if (file.size > MAX_ATTACH_MB * 1024 * 1024) {
                setError(`${file.name} is larger than ${MAX_ATTACH_MB} MB.`);
                continue;
            }
            next.push({ name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)) });
        }
        setFiles(next);
    }

    function send() {
        const all = [...recipients, ...cc];
        if (all.length === 0) return setError('Add at least one recipient.');
        if (all.some((chip) => !isEmail(chip.address))) return setError('One of the recipients is not a valid email address.');
        if (!subject.trim() && settingsFixture.preferences.askNoSubject && !window.confirm('Send without a subject?')) return setError('');
        setError('');

        const body = variant === 'inline' ? plain : (bodyRef.current?.innerText ?? '');
        const message = { to: recipients, cc, subject: subject.trim() || '(no subject)', body: asParagraphs(body), attachments: files, receipt };
        const finish = () => { setSent(true); onSent?.(message); };

        if (!settingsFixture.preferences.undoSend) return finish();
        let undone = false;
        const toastId = toast({
            tone: 'ok',
            title: 'Sending',
            message: `Held for ${UNDO_SECONDS} seconds so you can take it back.`,
            duration: UNDO_SECONDS * 1000,
            action: <Button variant="quiet" size="sm" onClick={() => { undone = true; dismiss?.(toastId); }}>Undo</Button>,
        });
        setTimeout(() => { if (!undone) finish(); }, UNDO_SECONDS * 1000);
        if (variant !== 'inline') onClose?.({ undoable: true });
    }

    if (variant === 'inline') {
        return (
            <section className="quick-reply" aria-label="Reply">
                <div className="qr-to"><span className="tiny muted">To</span>{recipients.map((chip) => <span className="chip" key={chip.address}>{chip.name}</span>)}</div>
                <label className="sr-only" htmlFor={`${id}-qr`}>Your reply</label>
                <textarea className="textarea" id={`${id}-qr`} rows={4} placeholder="Type your reply" value={plain} onChange={(e) => setPlain(e.target.value)} />
                {error && <p className="err" role="alert">{error}</p>}
                <div className="btn-row no-grow mt-s">
                    <Button size="sm" onClick={send} disabled={sent}>Send</Button>
                    <Button variant="line" size="sm" onClick={() => router.visit(fullHref)}>Open full composer</Button>
                    <Button variant="quiet" size="sm" onClick={onClose}>Cancel</Button>
                </div>
                {sent && <Banner tone="ok" live className="mt-s" title="Sent"><p>A copy is in your Sent folder.</p></Banner>}
            </section>
        );
    }

    const shape = variant === 'popup' ? `cp-pop is-open${size === 'min' ? ' is-min' : ''}${size === 'max' ? ' is-max' : ''}` : 'compose';

    return (
        <section className={shape} aria-label="New message">
            <div className="cp-bar">
                <h1>{variant === 'popup' ? 'New message' : 'Compose'}</h1>
                {saved && <span className="saved"><svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 4.5 6.2 11.8 2.5 8.1" {...stroke} strokeWidth="2" /></svg>Draft saved</span>}
                {variant === 'popup' && (
                    <span className="win">
                        <button type="button" aria-label="Minimise" onClick={() => setSize(size === 'min' ? 'open' : 'min')}><svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 9.5h9" {...stroke} strokeWidth="1.7" /></svg></button>
                        <button type="button" aria-label="Full screen" onClick={() => setSize(size === 'max' ? 'open' : 'max')}><svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><rect x="2.2" y="2.2" width="9.6" height="9.6" rx="1.4" {...stroke} /></svg></button>
                        <button type="button" aria-label="Close" onClick={() => onClose?.()}><svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.2 3.2l7.6 7.6M10.8 3.2l-7.6 7.6" {...stroke} strokeWidth="1.7" /></svg></button>
                    </span>
                )}
            </div>

            <div className="cp-scroll">
                <div className="cp-field">
                    <label htmlFor={`${id}-to`}>To</label>
                    <RecipientChips id={`${id}-to`} label="To" value={recipients} onChange={setRecipients} placeholder="Who is this for?" />
                    <button type="button" className="cc" aria-expanded={showCc} onClick={() => setShowCc(!showCc)}>Cc</button>
                </div>
                {showCc && (
                    <div className="cp-field">
                        <label htmlFor={`${id}-cc`}>Cc</label>
                        <RecipientChips id={`${id}-cc`} label="Cc" value={cc} onChange={setCc} placeholder="Anyone to copy in?" />
                    </div>
                )}
                <div className="cp-field">
                    <label htmlFor={`${id}-subject`}>Subject</label>
                    <input id={`${id}-subject`} type="text" placeholder="What is it about?" autoComplete="off" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>

                <div className="cp-tools" role="toolbar" aria-label="Formatting">
                    <button type="button" className="tool" aria-label="Bold" onClick={() => format('bold')}><b>B</b></button>
                    <button type="button" className="tool" aria-label="Italic" onClick={() => format('italic')}><i>I</i></button>
                    <button type="button" className="tool" aria-label="Underline" onClick={() => format('underline')}><u>U</u></button>
                    <span className="tool-sep" aria-hidden="true" />
                    <button type="button" className="tool" aria-label="Bulleted list" onClick={() => format('insertUnorderedList')}><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 4h8M5.5 8h8M5.5 12h8" {...stroke} /><circle cx="2.6" cy="4" r="1" fill="currentColor" /><circle cx="2.6" cy="8" r="1" fill="currentColor" /><circle cx="2.6" cy="12" r="1" fill="currentColor" /></svg></button>
                    <button type="button" className="tool" aria-label="Insert link" onClick={() => format('createLink')}><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.6 9.4a2.6 2.6 0 0 0 3.8 0l2-2a2.7 2.7 0 0 0-3.8-3.8l-1 1M9.4 6.6a2.6 2.6 0 0 0-3.8 0l-2 2a2.7 2.7 0 0 0 3.8 3.8l1-1" {...stroke} /></svg></button>
                    <span className="tool-sep" aria-hidden="true" />
                    <label className="tool" aria-label="Attach a file">
                        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 4.5 5.8 9.2a1.8 1.8 0 0 0 2.5 2.5l5-5a3.2 3.2 0 0 0-4.5-4.5l-5 5a4.6 4.6 0 0 0 6.5 6.5L14 10" {...stroke} /></svg>
                        <input type="file" multiple className="sr-only" aria-label="Attach files" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                    </label>
                </div>

                <div className="cp-body" ref={bodyRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Message body">
                    <p><br /></p>
                </div>
                <div className="sig">{mailboxFixture.signature.split('\n').map((line, i) => <span key={line + i}>{line}<br /></span>)}</div>

                {files.length > 0 && (
                    <div className="cp-attach">
                        {files.map((file, index) => (
                            <span className="att" key={`${file.name}-${index}`}>
                                <span className="ic" aria-hidden="true">{(file.name.split('.').pop() ?? 'file').slice(0, 3).toUpperCase()}</span>
                                {file.name} <span className="tiny muted">{file.sizeKb} KB</span>
                                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((_, i) => i !== index))}>&times;</button>
                            </span>
                        ))}
                    </div>
                )}
                {error && <p className="err cp-err" role="alert">{error}</p>}
            </div>

            <div className="cp-foot">
                <Button onClick={send} disabled={sent}>Send</Button>
                <label className="rr" title="Ask the recipient's mail program to confirm they opened this">
                    <input type="checkbox" checked={receipt} onChange={(e) => setReceipt(e.target.checked)} />
                    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.3 8.2c1.9-3 4.1-4.5 6.7-4.5s4.8 1.5 6.7 4.5c-1.9 2.9-4.1 4.4-6.7 4.4S3.2 11.1 1.3 8.2z" {...stroke} /><circle cx="8" cy="8.2" r="1.9" {...stroke} /></svg>
                    <span>Read receipt</span>
                </label>
                <Button variant="quiet" size="sm" className="push-end" onClick={() => { onClose?.(); if (variant === 'page') router.visit(route('mail')); }}>Discard</Button>
            </div>
        </section>
    );
}
