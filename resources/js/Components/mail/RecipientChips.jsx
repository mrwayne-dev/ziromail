import { useId, useState } from 'react';
import { contactFixtures } from '../../fixtures/mail';

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
export const isEmail = (value) => EMAIL.test(value);

/*
 * Recipients as chips. Typing an address and pressing Enter, comma, semicolon or
 * leaving the field turns it into a chip; an address that is not an email stays as
 * a flagged chip so it cannot be sent by accident. Contacts are offered as you type.
 */
export default function RecipientChips({ id, label, value, onChange, placeholder }) {
    const listId = useId();
    const [draft, setDraft] = useState('');

    function commit(raw) {
        const text = raw.trim().replace(/[;,]$/, '').trim();
        if (!text) return;
        const known = contactFixtures.find((contact) => contact.address === text.toLowerCase() || contact.name.toLowerCase() === text.toLowerCase());
        const chip = known ? { name: known.name, address: known.address } : { name: text, address: text };
        onChange([...value, chip]);
        setDraft('');
    }

    function onKeyDown(event) {
        if (['Enter', ',', ';'].includes(event.key) && draft.trim()) {
            event.preventDefault();
            commit(draft);
        } else if (event.key === 'Backspace' && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    }

    return (
        <span className="chips">
            {value.map((chip, index) => (
                <span className={`chip-to${isEmail(chip.address) ? '' : ' is-bad'}`} key={`${chip.address}-${index}`}>
                    {chip.name}
                    {!isEmail(chip.address) && <span className="sr-only"> (not a valid address)</span>}
                    <button type="button" aria-label={`Remove ${chip.name}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>&times;</button>
                </span>
            ))}
            <input
                id={id}
                type="text"
                list={listId}
                value={draft}
                placeholder={value.length === 0 ? placeholder : undefined}
                aria-label={label}
                autoComplete="off"
                spellCheck="false"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => commit(draft)}
            />
            <datalist id={listId}>
                {contactFixtures.map((contact) => <option key={contact.id} value={contact.address}>{contact.name}</option>)}
            </datalist>
        </span>
    );
}
