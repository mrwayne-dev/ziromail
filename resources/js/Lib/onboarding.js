// Mailbox rows hold their quota as the text typed, so "1." and "" are legal mid-edit.
export const quotaOf = (row) => Math.max(0, parseFloat(row.quota) || 0);

export const rowsFromFixture = (items) => items.map((item) => ({ id: item.id, local: item.local, quota: String(item.quotaGb), owner: item.owner }));

// Mailboxes travel between wizard steps as "local:quota,local:quota" until there is a server to hold them.
export function encodeMailboxes(rows) {
    return rows.map((row) => `${row.local}:${quotaOf(row)}`).join(',');
}

export function decodeMailboxes(text) {
    if (!text) return null;
    const rows = text
        .split(',')
        .map((part) => part.split(':'))
        .filter(([local, quota]) => local && Number.isFinite(Number(quota)))
        .map(([local, quota], i) => ({ id: `m${i + 1}`, local, quota: String(Number(quota)), owner: i === 0 }));
    return rows.length > 0 ? rows : null;
}
