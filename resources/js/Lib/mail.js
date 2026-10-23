/*
 * Shared mail helpers. The folder set is the IMAP standard list (no counts
 * until a mail store is connected). Avatars are initials + a stable tint.
 */

export const IMAP_FOLDERS = [
    { id: 'inbox', name: 'Inbox', kind: 'inbox' },
    { id: 'sent', name: 'Sent', kind: 'sent' },
    { id: 'drafts', name: 'Drafts', kind: 'drafts' },
    { id: 'archive', name: 'Archive', kind: 'archive' },
    { id: 'spam', name: 'Spam', kind: 'spam' },
    { id: 'trash', name: 'Trash', kind: 'trash' },
];

// Default folder list with zero counts, so the folder nav renders before any
// mail store is attached. Pages that have message rows can pass their own list
// (same shape) with real totals and unread counts.
export function foldersWithCounts(_messages = []) {
    return IMAP_FOLDERS.map((folder) => ({ ...folder, total: 0, unread: 0 }));
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
