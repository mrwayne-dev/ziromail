import { Link } from '@inertiajs/react';
import { useState } from 'react';
import Note from '../../Components/ui/Note';
import useQuery from '../../Hooks/useQuery';
import MailLayout from '../../Layouts/MailLayout';
import { messageFixtures } from '../../fixtures/mail';
import { formatLongTime } from '../../Lib/format';
import { initialsOf, searchMessages, tintOf } from '../../Lib/mail';
import { route } from '../../Lib/route';

const SCOPES = [['everywhere', 'Everywhere'], ['inbox', 'Inbox'], ['sent', 'Sent'], ['attachment', 'Has attachment'], ['year', 'This year']];
const FOLDER = Object.fromEntries([['inbox', 'Inbox'], ['sent', 'Sent'], ['drafts', 'Drafts'], ['archive', 'Archive'], ['invoices', 'Invoices'], ['suppliers', 'Suppliers'], ['orders', 'Orders']]);

// Wraps each searched word in <mark>. The text is split, never injected as markup.
function Highlight({ text, words }) {
    if (words.length === 0) return text;
    const pattern = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
    return text.split(pattern).map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part));
}

export default function Search() {
    const query = useQuery();
    const q = query.get('q') ?? '';
    const [scope, setScope] = useState('everywhere');
    const results = q.trim() ? searchMessages(messageFixtures, q, scope) : [];
    const words = q.toLowerCase().split(/\s+/).filter((term) => term && !term.includes(':'));

    return (
        <MailLayout page="mail-search" title={q ? `Search: ${q}` : 'Search'} current="search" searchValue={q} searchLabel="Search mail">
            <main className="results" id="main" aria-label="Search results">
                <div className="res-top">
                    <h1>{q.trim() ? <>{results.length} {results.length === 1 ? 'result' : 'results'} for <span className="q">&ldquo;{q}&rdquo;</span></> : 'Search your mail'}</h1>
                    <div className="scopes" role="group" aria-label="Narrow the search">
                        {SCOPES.map(([key, label]) => <button key={key} type="button" className="scope" aria-pressed={scope === key} onClick={() => setScope(key)}>{label}</button>)}
                    </div>
                </div>

                {q.trim() && results.length === 0 && (
                    <div className="mail-empty"><h2>Nothing found</h2><p>Try fewer words, or search everywhere.</p></div>
                )}

                {results.map((message) => {
                    const person = message.folder === 'sent' ? { name: 'You', address: message.from.address } : message.from;
                    return (
                        <Link className="res" key={message.uid} href={route('mail', { folder: message.folder, message: message.uid })}>
                            <span className={`res-av ${tintOf(person.address)}`.trim()} aria-hidden="true">{initialsOf(person.name)}</span>
                            <span className="res-main">
                                <span className="res-line"><span className="res-from">{person.name}</span><span className="res-when">{formatLongTime(message.receivedAt)}</span></span>
                                <span className="res-subj"><Highlight text={message.subject} words={words} /></span>
                                <span className="res-prev"><Highlight text={message.preview} words={words} /></span>
                                <span className="res-where">{FOLDER[message.folder]}{message.hasAttachment ? ' · has attachment' : ''}</span>
                            </span>
                        </Link>
                    );
                })}

                <div className="res-note">
                    <Note title="Searching more than the subject line">
                        <p>We look through sender, subject, message body and attachment names. Try <span className="mono">from:chidi</span> or <span className="mono">has:attachment</span> to narrow it further.</p>
                    </Note>
                </div>
            </main>
        </MailLayout>
    );
}
