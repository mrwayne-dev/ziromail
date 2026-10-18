/*
 * Which controls an organisation role is shown. This only hides what a role
 * cannot use; the server re-checks every request, so a hidden control is never
 * the protection. The role is a fixture value until the Organisations module exists.
 */
const GRANTS = {
    owner: ['mailboxes.manage', 'domains.manage', 'storage.buy', 'plan.change', 'mail.export', 'team.manage', 'audit.view'],
    admin: ['mailboxes.manage', 'domains.manage', 'team.view', 'audit.view'],
    user: [],
};

export function can(role, permission) {
    return (GRANTS[role] ?? []).includes(permission);
}

// The "what each role can do" table on Team & access. Mirrors GRANTS above.
export const ROLE_MATRIX = [
    { label: "Read their own mail", owner: true, admin: true, user: true },
    { label: 'Create and delete mailboxes', owner: true, admin: true, user: false },
    { label: 'Move storage between mailboxes', owner: true, admin: true, user: false },
    { label: 'Change DNS records', owner: true, admin: true, user: false },
    { label: 'Buy storage or change the plan', owner: true, admin: false, user: false },
    { label: 'Export all organisation mail', owner: true, admin: false, user: false },
    { label: "Withdraw someone else's access", owner: true, admin: false, user: false },
];
