import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Composer from '../../Components/mail/Composer';
import MessageList from '../../Components/mail/MessageList';
import ReadingPane from '../../Components/mail/ReadingPane';
import Button from '../../Components/ui/Button';
import Pill from '../../Components/ui/Pill';
import { useToast } from '../../Components/ui/Toast';
import useDisclosure from '../../Hooks/useDisclosure';
import useMailShortcuts from '../../Hooks/useMailShortcuts';
import useQuery from '../../Hooks/useQuery';
import MailLayout from '../../Layouts/MailLayout';
import { folderDefs, messageFixtures, settingsFixture } from '../../fixtures/mail';
import { foldersWithCounts, messageById } from '../../Lib/mail';
import { route } from '../../Lib/route';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
const DESTINATION = { archive: 'archive', trash: 'trash', spam: 'spam' };
const LABEL = { archive: 'archived', trash: 'moved to Trash', spam: 'reported as spam' };

export default function Inbox() {
    const query = useQuery();
    const folder = folderDefs.some((def) => def.id === query.get('folder')) ? query.get('folder') : 'inbox';
    const openUid = query.get('message');
    const { toast, dismiss } = useToast();
    const compose = useDisclosure();
    const [messages, setMessages] = useState(messageFixtures);
    const [picked, setPicked] = useState(new Set());

    const folders = useMemo(() => foldersWithCounts(messages), [messages]);
    const list = useMemo(() => messages.filter((message) => message.folder === folder).sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)), [messages, folder]);
    const current = folderDefs.find((def) => def.id === folder);
    const open = openUid ? messageById(list, openUid) : null;
    const unread = list.filter((message) => message.unread).length;

    const go = useCallback((params) => {
        router.get(route('mail'), params, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

    // On a phone the open message covers the list: ziro.css keys that off a class on <body>.
    useEffect(() => {
        document.body.classList.toggle('reading', Boolean(open));
        return () => document.body.classList.remove('reading');
    }, [open]);

    function openMessage(uid) {
        if (settingsFixture.preferences.markReadOnOpen) {
            setMessages((all) => all.map((message) => (message.uid === uid ? { ...message, unread: false } : message)));
        }
        go({ folder, message: uid });
    }

    function move(uids, action) {
        const before = messages;
        const target = DESTINATION[action];
        setMessages((all) => all.map((message) => (uids.includes(message.uid) ? { ...message, folder: target } : message)));
        setPicked(new Set());
        if (uids.includes(openUid)) go({ folder });
        const id = toast({
            title: `${uids.length === 1 ? 'Message' : `${uids.length} messages`} ${LABEL[action]}`,
            duration: 6000,
            action: <Button variant="quiet" size="sm" onClick={() => { setMessages(before); dismiss(id); }}>Undo</Button>,
        });
    }

    function step(direction) {
        const index = list.findIndex((message) => message.uid === openUid);
        const next = list[Math.min(Math.max(index + direction, 0), list.length - 1)];
        if (next) openMessage(next.uid);
    }

    useMailShortcuts({
        next: () => step(1),
        previous: () => step(-1),
        archive: () => open && move([open.uid], 'archive'),
        trash: () => open && move([open.uid], 'trash'),
        close: () => open && go({ folder }),
    });

    const togglePick = (uid) => setPicked((set) => { const next = new Set(set); if (next.has(uid)) next.delete(uid); else next.add(uid); return next; });
    const allPicked = list.length > 0 && picked.size === list.length;

    return (
        <MailLayout page="mail" title={current.name} current={folder} folders={folders} onCompose={compose.open}>
            <main className="list" id="main" aria-label="Message list">
                <div className="list-head">
                    <label className="sel-all" title="Select all">
                        <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(list.map((message) => message.uid)))} />
                        <span className="sr-only">Select all messages</span>
                    </label>
                    <h1>{current.name}</h1>
                    {unread > 0 && <Pill>{unread} unread</Pill>}
                    <label className="folder-pick">
                        <span className="sr-only">Change folder</span>
                        <select className="select" value={folder} onChange={(e) => go({ folder: e.target.value })}>
                            {folders.map((def) => <option key={def.id} value={def.id}>{def.name}{def.unread ? ` (${def.unread})` : ''}</option>)}
                        </select>
                    </label>
                </div>

                {picked.size > 0 && (
                    <div className="sel-bar">
                        <span className="n"><b>{picked.size}</b> selected</span>
                        <div className="acts">
                            <button type="button" className="icon-btn" aria-label="Archive selected" onClick={() => move([...picked], 'archive')}><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="3" rx="1" {...stroke} /><path d="M3 5.5v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7M6.5 8.5h3" {...stroke} /></svg></button>
                            <button type="button" className="icon-btn" aria-label="Delete selected" onClick={() => move([...picked], 'trash')}><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M6 4V2.5h4V4M4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4" {...stroke} /></svg></button>
                            <button type="button" className="icon-btn" aria-label="Report selected as spam" onClick={() => move([...picked], 'spam')}><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 15 14H1z" {...stroke} /><path d="M8 6v3.2" {...stroke} /></svg></button>
                            <Button variant="line" size="sm" onClick={() => { setMessages((all) => all.map((message) => (picked.has(message.uid) ? { ...message, unread: false } : message))); setPicked(new Set()); }}>Mark read</Button>
                        </div>
                    </div>
                )}

                {list.length === 0 ? (
                    <div className="mail-empty">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="m3 6.5 9 6.5 9-6.5" stroke="currentColor" strokeWidth="1.4" /></svg>
                        <h2>Nothing in {current.name.toLowerCase()}</h2>
                        <p>When you move messages here they will show up in this list.</p>
                    </div>
                ) : (
                    <MessageList messages={list} folder={folder} activeUid={openUid} picked={picked} onOpen={openMessage} onPick={togglePick} />
                )}
            </main>

            <ReadingPane key={open?.uid ?? 'none'} message={open} blockImages onClose={() => go({ folder })} onAct={(action) => move([open.uid], action)} />

            {compose.isOpen && (
                <Composer
                    variant="popup"
                    onClose={compose.close}
                    onSent={(message) => setMessages((all) => [{ uid: `s_${Date.now()}`, folder: 'sent', from: { name: 'Adaobi Foods Sales', address: 'sales@adaobifoods.com' }, to: message.to, subject: message.subject, preview: message.body[0] ?? '', receivedAt: '2026-09-29T09:31:00+01:00', unread: false, hasAttachment: message.attachments.length > 0, receipt: { requested: message.receipt, state: message.receipt ? 'not_opened' : 'none', openedAt: null }, cc: message.cc, remoteImages: 'blocked', hasRemoteImages: false, body: message.body.map((text) => ({ type: 'p', text })), attachments: [] }, ...all])}
                />
            )}
            <button type="button" className="fab" aria-label="Compose a message" onClick={() => router.visit(route('mail.compose'))}>
                <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" {...stroke} strokeWidth="2" /></svg>
            </button>
        </MailLayout>
    );
}
