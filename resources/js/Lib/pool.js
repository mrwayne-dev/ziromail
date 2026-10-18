/*
 * Storage-pool arithmetic for display. One pool per domain: the plan's pool plus
 * any storage bought, divided between mailbox quotas. The server re-validates
 * every change; these functions only let the screen say so before it is submitted.
 */
const round = (gb) => Math.round(gb * 10) / 10;

export function poolSummary(domain, mailboxes) {
    const assignedGb = round(mailboxes.reduce((sum, mailbox) => sum + mailbox.quotaGb, 0));
    const usedGb = round(mailboxes.reduce((sum, mailbox) => sum + mailbox.usedGb, 0));

    return {
        poolGb: domain.poolGb,
        planGb: domain.planGb,
        boughtGb: domain.boughtGb,
        ceilingGb: domain.ceilingGb,
        assignedGb,
        usedGb,
        unassignedGb: round(domain.poolGb - assignedGb),
    };
}

// A mailbox's quota cannot drop below what it already holds, or grow past the unassigned pool.
export function quotaBounds(mailbox, pool) {
    return { min: Math.ceil(mailbox.usedGb * 10) / 10, max: round(mailbox.quotaGb + Math.max(pool.unassignedGb, 0)) };
}

export function checkQuota(mailbox, requestedGb, pool) {
    const { min, max } = quotaBounds(mailbox, pool);
    if (!(requestedGb >= 0)) return { ok: false, message: 'Enter a number of GB.' };
    if (requestedGb < min) return { ok: false, message: `This mailbox already uses ${min} GB, so its quota cannot go lower.` };
    if (requestedGb > max) return { ok: false, message: `Only ${max} GB is available to this mailbox. Free some from another mailbox or add storage.` };
    return { ok: true, message: null };
}

// Whether adding a mailbox of `quotaGb` still fits in what is unassigned.
export function fitsInPool(quotaGb, pool) {
    return quotaGb <= pool.unassignedGb;
}
