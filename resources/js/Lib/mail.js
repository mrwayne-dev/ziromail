import { folderDefs, messageFixtures } from '../fixtures/mail';

// Folder badges come from the messages, never typed in, so a badge cannot disagree with its list.
export function foldersWithCounts(messages = messageFixtures) {
    return folderDefs.map((folder) => {
        const inFolder = messages.filter((message) => message.folder === folder.id);
        return { ...folder, total: inFolder.length, unread: inFolder.filter((message) => message.unread).length };
    });
}

export function initialsOf(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

// A stable avatar tint per sender: '', 'g', 'b' or 'a' (the classes ziro.css defines).
export function tintOf(address) {
    const tints = ['', 'g', 'b', 'a'];
    let sum = 0;
    for (const char of address) sum += char.charCodeAt(0);
    return tints[sum % tints.length];
}

export function messageById(messages, uid) {
    return messages.find((message) => message.uid === uid) ?? null;
}

const MATCH = (message, term) => [message.subject, message.preview, message.from.name, message.from.address, ...message.body.map((block) => block.text)].join(' ').toLowerCase().includes(term);

// "from:chidi" and "has:attachment" narrow the search; everything else is a word to find.
export function searchMessages(messages, query, scope = 'everywhere') {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const from = terms.find((term) => term.startsWith('from:'))?.slice(5);
    const hasAttachment = terms.includes('has:attachment');
    const words = terms.filter((term) => !term.startsWith('from:') && term !== 'has:attachment');

    return messages.filter((message) => {
        if (message.folder === 'trash' || message.folder === 'spam') return false;
        if (scope === 'inbox' && message.folder !== 'inbox') return false;
        if (scope === 'sent' && message.folder !== 'sent') return false;
        if (scope === 'attachment' && !message.hasAttachment) return false;
        if (scope === 'year' && new Date(message.receivedAt).getFullYear() !== 2026) return false;
        if (from && !`${message.from.name} ${message.from.address}`.toLowerCase().includes(from)) return false;
        if (hasAttachment && !message.hasAttachment) return false;
        return words.every((word) => MATCH(message, word));
    });
}
