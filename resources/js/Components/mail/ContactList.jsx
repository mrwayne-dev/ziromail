import { initialsOf, tintOf } from '../../Lib/mail';

/* Contacts grouped under their first letter. */
export default function ContactList({ contacts, selectedId, onSelect }) {
    const groups = [...contacts].sort((a, b) => a.name.localeCompare(b.name)).reduce((acc, contact) => {
        const letter = contact.name[0].toUpperCase();
        (acc[letter] ??= []).push(contact);
        return acc;
    }, {});

    return Object.entries(groups).map(([letter, items]) => (
        <div key={letter}>
            <p className="alpha">{letter}</p>
            {items.map((contact) => (
                <button type="button" key={contact.id} className={`ct${selectedId === contact.id ? ' is-active' : ''}`} aria-current={selectedId === contact.id ? 'true' : undefined} onClick={() => onSelect(contact.id)}>
                    <span className={`ct-av ${tintOf(contact.address)}`.trim()} aria-hidden="true">{initialsOf(contact.name)}</span>
                    <span className="ct-main"><b>{contact.name}</b><span>{contact.address}</span></span>
                </button>
            ))}
        </div>
    ));
}
