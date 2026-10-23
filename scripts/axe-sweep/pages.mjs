/*
 * Every page touched by the ops redesign (2026-10-21) and the dashboard + webmail
 * design pass (2026-10-23) that this sweep is contracted to protect. Grouped by
 * auth tier so the runner can skip the sign-in it does not need.
 *
 * `path` is a function because mailbox / domain / abuse-flag ids come from the
 * seeded BrowserSweepSeeder state at run time. `label` is what shows in the
 * report. `main` is a CSS selector the runner waits for before injecting axe,
 * which keeps the sweep from running against a half-loaded SPA frame.
 */

export const DASHBOARD_PAGES = [
    { label: 'Dashboard overview',  path: () => '/dashboard',                                               main: 'main#main' },
    { label: 'Dashboard domains',   path: () => '/dashboard/domains',                                       main: 'main#main' },
    { label: 'Dashboard domain',    path: ({ domainId }) => `/dashboard/domains/${domainId}`,               main: 'main#main' },
    { label: 'Dashboard mailboxes', path: () => '/dashboard/mailboxes',                                     main: 'main#main' },
    { label: 'Dashboard mailbox',   path: ({ mailboxId }) => `/dashboard/mailboxes/${mailboxId}`,           main: 'main#main' },
    { label: 'Dashboard aliases',   path: () => '/dashboard/addresses',                                     main: 'main#main' },
    { label: 'Dashboard billing',   path: () => '/dashboard/billing',                                       main: 'main#main' },
    { label: 'Dashboard storage',   path: () => '/dashboard/billing/storage',                               main: 'main#main' },
    { label: 'Dashboard team',      path: () => '/dashboard/team',                                          main: 'main#main' },
    { label: 'Dashboard audit',     path: () => '/dashboard/activity',                                      main: 'main#main' },
    { label: 'Dashboard help',      path: () => '/dashboard/help',                                          main: 'main#main' },
];

export const WEBMAIL_PAGES = [
    { label: 'Webmail inbox',    path: () => '/mail',           main: 'main#main' },
    { label: 'Webmail compose',  path: () => '/mail/compose',   main: 'main#main' },
    { label: 'Webmail search',   path: () => '/mail/search?q=invoice', main: 'main#main' },
    { label: 'Webmail contacts', path: () => '/mail/contacts',  main: 'main#main' },
    { label: 'Webmail settings', path: () => '/mail/settings',  main: 'main#main' },
];

export const OPS_PAGES = [
    { label: 'Ops overview',       path: () => '/ops',                                               main: 'main#main' },
    { label: 'Ops deliverability', path: () => '/ops/deliverability',                                main: 'main#main' },
    { label: 'Ops delivery log',   path: () => '/ops/delivery-log',                                  main: 'main#main' },
    { label: 'Ops domains',        path: () => '/ops/domains',                                       main: 'main#main' },
    { label: 'Ops abuse queue',    path: () => '/ops/abuse',                                         main: 'main#main' },
    { label: 'Ops abuse detail',   path: ({ abuseFlagId }) => `/ops/abuse/${abuseFlagId}`,           main: 'main#main' },
    { label: 'Ops users',          path: () => '/ops/users',                                         main: 'main#main' },
    { label: 'Ops user detail',    path: ({ ownerUserId }) => `/ops/users/${ownerUserId}`,           main: 'main#main' },
    { label: 'Ops mailboxes',      path: () => '/ops/mailboxes',                                     main: 'main#main' },
    { label: 'Ops spam rules',     path: () => '/ops/spam-rules',                                    main: 'main#main' },
    { label: 'Ops refunds',        path: () => '/ops/refunds',                                       main: 'main#main' },
    { label: 'Ops backups',        path: () => '/ops/backups',                                       main: 'main#main' },
    { label: 'Ops reports',        path: () => '/ops/reports',                                       main: 'main#main' },
    { label: 'Ops staff',          path: () => '/ops/staff',                                         main: 'main#main' },
    { label: 'Ops audit trail',    path: () => '/ops/audit',                                         main: 'main#main' },
];

export const VIEWPORTS = [
    { label: '390',  width: 390,  height: 844 },
    { label: '1440', width: 1440, height: 900 },
];
