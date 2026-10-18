import { Link } from '@inertiajs/react';
import { useState } from 'react';
import ContactList from '../../Components/mail/ContactList';
import Button from '../../Components/ui/Button';
import Note from '../../Components/ui/Note';
import MailLayout from '../../Layouts/MailLayout';
import { contactFixtures, messageFixtures } from '../../fixtures/mail';
import { formatDate, formatLongTime } from '../../Lib/format';
import { initialsOf } from '../../Lib/mail';
import { route } from '../../Lib/route';

export default function Contacts() {
    const [filter, setFilter] = useState('');
    const [selectedId, setSelectedId] = useState(contactFixtures[0].id);
    const contacts = contactFixtures.filter((contact) => `${contact.name} ${contact.address}`.toLowerCase().includes(filter.toLowerCase()));
    const selected = contactFixtures.find((contact) => contact.id === selectedId) ?? contactFixtures[0];
    const recent = messageFixtures
        .filter((message) => message.from.address === selected.address || message.to.some((to) => to.address === selected.address))
        .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).slice(0, 3);
    const rows = [['Email', selected.address], ['Phone', selected.phone], ['Company', selected.company], ['Added', selected.autoAdded ? `Automatically, from a message on ${formatDate(selected.addedFrom)}` : `Added by you on ${formatDate(selected.addedFrom)}`]].filter(([, value]) => value);

    return (
        <MailLayout page="mail-contacts" title="Contacts" current="contacts" searchRoute="mail.contacts" searchLabel="Search contacts">
            <main className="cts" id="main" aria-label="Contacts">
                <div className="cts-top">
                    <h1>Contacts <span className="mut count">&middot; {contactFixtures.length}</span></h1>
                    <Button variant="line" size="sm" disabled title="Adding contacts is not connected yet">Add</Button>
                </div>
                <label className="sr-only" htmlFor="ct-filter">Filter contacts</label>
                <input id="ct-filter" className="input ct-filter" type="search" placeholder="Filter contacts" value={filter} onChange={(e) => setFilter(e.target.value)} />
                {contacts.length === 0 ? <p className="sm mut ct-none">No contact matches &ldquo;{filter}&rdquo;.</p> : <ContactList contacts={contacts} selectedId={selected.id} onSelect={setSelectedId} />}
            </main>

            <article className="ct-detail" aria-label="Contact detail">
                <div className="ct-head">
                    <span className="big" aria-hidden="true">{initialsOf(selected.name)}</span>
                    <h2>{selected.name}</h2>
                    <p className="org">{[selected.role, selected.company].filter(Boolean).join(' · ')}</p>
                    <div className="btn-row no-grow">
                        <Button size="sm" href={route('mail.compose')}>Send a message</Button>
                        <Button variant="line" size="sm" disabled title="Editing contacts is not connected yet">Edit</Button>
                    </div>
                </div>
                <div className="ct-rows">
                    {rows.map(([key, value]) => <div className="ct-row" key={key}><span className="k">{key}</span><span className="v">{value}</span></div>)}
                </div>
                <div className="ct-more">
                    <h3 className="heading-xs">Recent messages</h3>
                    {recent.length === 0 ? <p className="sm mut mt-s">No messages with this contact yet.</p> : recent.map((message) => (
                        <p className="sm ct-msg" key={message.uid}>
                            <Link href={route('mail', { folder: message.folder, message: message.uid })}><b>{message.subject}</b></Link>
                            <span className="mut">{formatLongTime(message.receivedAt)}</span>
                        </p>
                    ))}
                    <Note title="Contacts fill themselves in" className="mt">
                        <p>Anyone you exchange mail with is added automatically. Your phone can sync this list over CardDAV; the settings are in <Link href={route('mail.settings')}>Settings</Link>.</p>
                    </Note>
                </div>
            </article>
        </MailLayout>
    );
}
