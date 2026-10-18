# Ziroemail: dashboard, webmail and ops UI map (prototype behaviour to real use case)

Status: planning output, written 18 October 2026, revised the same day to put identity and authentication in scope as a real backend · Precedes `DASHBOARD_BUILD.md` · No page or component was built or edited to produce this document.

This maps every fake behaviour in the 30 prototype screens to what it does in the real product, so the next phase can build the screens on fixtures that already have the shape of the future backend props.

## 0. How to read this

**Sources read:** all 30 HTML files in `docs/design-source/ui/mailadmin`, `mail` and `ops`; the whole business-logic part of `docs/design-source/ui/assets/js/ziro.js` (the kickoff names it `ui/ziro.js`; it lives under `assets/js/`); `ARCHITECTURE.md` §3.1, §4.3 to §4.5, §5.3 to §5.5, §6 and §7; the Phase 1 scope document §5 to §12 and §17; `DESIGN.md` §8; `CEO_DECISIONS.md`; and the components, hooks, libs and fixtures that already exist in `resources/js`.

**Counts:** 11 owner dashboard screens + 5 webmail + 14 ops = 30. The two screens not in the prototype's own index (`onboard-plan`, `admin-storage`) are recorded as live (`MARKETING_BUILD.md` §1 item 8; CEO question Q15 asks for a re-confirmation). `onboard-plan` is already built. `admin-storage` is in this phase.

**Per-screen format.** Each screen has a table of controls (what the prototype fakes, what it maps to in real use, which existing component covers it) and a props contract. Entity shapes used by several screens are defined once in section 5 and referenced by name. Module names are the `ARCHITECTURE.md` §5.4 modules. `[Qn]` points at `CEO_DECISIONS.md` question n. `[A1]` to `[A14]` point at the working assumptions in section 6.

**One part of this map is no longer a deferral.** The authentication screens inherited from the auth and onboarding phase (sign up, sign in, two-factor, recovery, forgot password, verify email, sign out, and session and device management) now map to a real Laravel backend built in this phase. Section 1.10 is their mapping and is this phase's actual implementation; the binding security specification is `DASHBOARD_BUILD.md` §7. Everything else in the three surfaces (domains, billing, mailboxes, webmail content, ops data, organisation roles) is mapped exactly as before and stays on fixtures.

**What the prototype is, in one paragraph.** Pages are plain HTML. `ziro.js` repaints most of the dashboard from a hard-coded `ZIRO_DOMAINS` object (two domains, their mailboxes, records, placement and alerts), remembers the chosen domain in `sessionStorage`, runs price and plan arithmetic in the browser, and fakes DNS checks, add-mailbox validation, add-storage maths and the webmail folder, undo and compose behaviour. Webmail messages, contacts and every ops table row are baked into the markup. Nothing is fetched.

## 1. Cross-cutting maps

These behaviours repeat across many screens. They are mapped once here and referenced from the screens.

### 1.1 The domain scope and the domain switcher

| | |
|---|---|
| Prototype | Header dropdown `data-dom-switch` lists `ZIRO_DOMAINS`. Picking one repaints every `data-dom-*` element on the page and writes `sessionStorage['ziro.activeDomain']`. Every dashboard page except Team, Billing's invoices and Help is scoped to that domain. |
| Real | A domain is a separate tenant unit: its own plan, pool, mailboxes, records (`domains`, `subscriptions`, `mailboxes`, `domain_records`). The switcher chooses which `domain_id` the page's controller loads. The choice is a server-side session value, not browser storage (`ARCHITECTURE.md` §4.3, `DomainSwitcher`). Delegated agencies see the grantor's domains through `delegations`. |
| UI-first stand-in | A module store `Hooks/useCurrentDomain` (same pattern as `usePricingState`) reads `fixtures/organisation.js`. It is the only place that is replaced by an Inertia shared prop later. |
| Component | New `DomainSwitcher` (uses the existing `.dom-switch` and `.dom-menu` rules in `ziro.css`). Menu footer links to `Add a domain` and `Manage all domains`. |
| Fixture | `domains: [{ id, name, planCode, mailboxCount, usedGb, poolGb }]` plus `currentDomainId`. |

### 1.2 The domain-search family: how every "check a domain" connects

The prototype's only domain search bar is the marketing one (`DomainSearch`). Inside the three surfaces there is no search bar of that kind. The closest controls are listed below, with what each really is. The phrase in the kickoff, "map the search domain feature to our use case", is answered by this table: one shape check, one server check, two modes.

| Where | What it is today | Real operation | Same check as marketing and onboarding? |
|---|---|---|---|
| Marketing home hero | `DomainSearch` validates shape, then hands the domain to the wizard (built last phase) | Shape check only (`Lib/domain.checkDomainInput`). No server call. | Source of the shared shape check |
| Onboarding Domain step (built) | "Check this domain" shows a fixture result: available, current provider, imports mail | Domains module `DomainCheck`, mode `claim`: shape, uniqueness across all organisations, MX lookup for provider detection, ownership token issued | Yes, this is the first real server check |
| Dashboard "Add a domain" modal (`admin-domains`) | Text field, plan radios, total, "Pay and add domain" | Same `DomainCheck` mode `claim`, run when the field is submitted, before payment. Then Billing creates the subscription, then Domains opens the records step (reusing `RecordTable`) | Same check and same code path as onboarding. Different entry: the organisation and owner already exist, and payment precedes records (onboarding also pays before records) |
| Dashboard "Re-check now" (`admin-domain`) | Button, no behaviour | Domains `RecheckDomainRecords` job for a domain that is already live, mode `monitor` | Different check. Same resolver, same record comparison, different outcome (below) |
| Ops "Re-check all records" and org "Re-check records now" | Buttons | The same `RecheckDomainRecords` job, run for one domain or queued for all, staff-triggered and audited | Same as the dashboard re-check |
| Ops "Find an account" (`ops`, `ops-orgs`, `ops-mailboxes`) | Search box, rows baked in | Ops module search over organisations, domains, mailbox addresses, business names, invoice numbers. A partial domain matches. A full mailbox address opens its organisation. Not a DNS check at all | No. It is a lookup over our own data |
| Webmail search | Not a domain control | Mailbox content search (§3, `mail-search`) | No |

**How `claim` and `monitor` differ (the go-live gate).** `claim` is the path to the go-live gate: a domain cannot be marked live until ownership TXT, MX, SPF, DKIM and DMARC all verify (`ARCHITECTURE.md` §1 and §5.4, scope §5 and §7). Failing records keep the domain in `verifying`, mailboxes stay inactive, and the UI shows the four states `passing`, `needs_fix`, `waiting`, `missing`. `monitor` runs on a domain that is already `live`. A failure there never switches mail off: it records `broken_since`, raises an owner alert and an ops "records stopped working" row, and writes the audit log. The record shape is identical in both modes, so `DnsRecordRow` and `RecordTable` serve both. The differences are props, not forks: `mode`, `lastCheckedAt`, `brokenSince`, and an `observed` value beside `expected` (section 5.4).

**Gap to resolve in the backend phase:** the onboarding screens built last phase say "four records" and have no ownership TXT row. Scope §7 and the data model (`domains.ownership_token`, `domain_records.type = TXT`) require one. See [A1].

### 1.3 Money, plans, VAT and storage pricing

| Behaviour in the prototype | Real rule | Where the rule lives later |
|---|---|---|
| `ziro.js` computes `net + round(net * 0.075)` for the add-domain total; `STORAGE_COST = 6000` for 10 GB in the plan-change text but `PER_GB = 100` on the storage page | Prices and VAT come from the server as integer minor units. The browser formats only (`Lib/money`, `Lib/order.buildOrder`, already built) | Billing `PricingService`; `plans`, `storage_addons` |
| Plan change: an upgrade takes effect now and is charged pro rata; a downgrade takes effect at the next renewal, never mid-term; assigned quota above the new pool blocks the downgrade; extra storage is released on any change | Business rules, stated in the UI before confirming | Billing proration and plan-change service; Mailboxes pool guard |
| Extra storage: typed GB, held inside the plan ceiling, charged for a full year whenever bought, renews with the plan, attached to the plan, not transferable between domains | Recurring annual add-on | `storage_addons` (`DESIGN.md` §8) |
| "Yearly and monthly cost the same" (`admin-billing`) versus a lower monthly rate on a yearly term (`DESIGN.md` §8, Pricing page built) | Unresolved [Q3] | Placeholder: show the Pricing page's fixture values |
| "VAT included" (`admin`) versus "plus VAT" (`admin-billing`, checkout) | Listed prices exclude VAT; VAT is added | One rule, taken from `fixtures/plans.js.vatRate` [Q4] |

The dashboard never hard-codes a price, a ceiling or a VAT figure. Every figure derives from `fixtures/plans.js` (already built) or a quote object in the page fixture.

### 1.4 Pool and quota rules

| Rule | Source | Used by |
|---|---|---|
| One pool per domain: plan pool plus bought blocks | `DESIGN.md` §8 | dashboard overview, mailboxes, storage, billing |
| Quota floor: a quota cannot go below what the mailbox already uses | `admin-mailboxes` copy; scope "Storage quotas" | mailbox detail |
| Unassigned storage stays in the pool | `admin-mailboxes` | add mailbox, storage |
| Warnings to the user at 80% and 95% (scope) versus 95% (`admin-mailbox`) versus owner emailed at 90% and delivery held 72 hours at 100% (`ops-mailboxes`) | Three different numbers [A9] | alerts, ops mailboxes |
| Over-allocation guard is a convenience, the server re-validates (`ARCHITECTURE.md` §4.3) | Rule | `checkAllocation` in `PoolAllocator.jsx` (already built) |

### 1.5 Roles and permissions

Three organisation roles (`owner`, `admin`, `user`) and delegated agency access, per `admin-team`. Staff roles (`Support`, `Engineer`, `Owner`) are a separate guard per `ops-staff`.

| Capability | Owner | Admin | User | Delegated agency | Ops Support | Ops Engineer | Ops Owner |
|---|---|---|---|---|---|---|---|
| Read own mail | yes | yes | yes | no | no | no | only with customer's written request |
| Create and delete mailboxes, move storage, change DNS | yes | yes | no | as granted | no | no | no |
| Buy storage, change plan, export all mail, withdraw access | yes | no | no | no | no | no | no |
| View a customer's dashboard read-only | no | no | no | no | yes | yes | yes |
| Lock sending, move to backup relay, restore backup | no | no | no | no | no | yes | yes |
| Approve refunds above the threshold, change staff access | no | no | no | no | no | no | yes |

In the UI-first build **authentication is real but authorisation display is not**: the signed-in person and the staff identity come from the real guards, while the organisation role a screen shows is a fixture value, and controls are shown or hidden by a `can(permission)` helper (new `Lib/permissions.js`). A hidden control is never relied on for safety. The server re-checks every request (scope §12); until the Organisations module exists the only server-side checks are "signed in", "verified" and, for `/ops`, "staff with two-factor".

### 1.6 Alerts and health

The dashboard alert stack at the top of the overview is derived, not authored. In the prototype each domain has an `alerts` array typed by hand. In the real product the stack is built from rules: a record in `needs_fix` or `missing` (Domains), a mailbox over 75% (Mailboxes), a subscription past due or in grace (Billing), an anomaly limit or lock (Deliverability), a setup never completed (DeviceSetup), a blocklist or queue problem affecting the domain (Deliverability). The fixture ships the derived result (`alerts[]`), so the build needs no rule engine in this phase.

### 1.7 Activity and audit

| Log | Prototype | Retention in the copy | Real source |
|---|---|---|---|
| Per-domain activity (overview "recent activity") | 3 rows per domain in `ziro.js` | none stated | `audit_log` filtered to the organisation and domain, newest 5 |
| Per-mailbox activity (`admin-mailbox`) | 3 hard-coded rows | none | `audit_log` filtered to the mailbox |
| Owner audit (`admin-audit`) | 7 hard-coded rows, category filter buttons, CSV export | 12 months | `audit_log` for the organisation, categories mailboxes, storage, billing, access, domain |
| Ops audit (`ops-audit`) | 11 rows, person and kind filters | 7 years | `audit_log` across all actors, append-only |
| Delivery log (`ops-queue`) | 6 rows, a trace | 30 days | `delivery_events` from SES and Postfix |

One `ActivityFeed` and one `AuditTable` component cover all of these with different columns.

### 1.8 Setup links, QR codes and WhatsApp

"Resend setup link", "Send a setup link" and "Send on WhatsApp" appear on the overview, mailbox detail and onboarding Done. Real: DeviceSetup creates a `setup_tokens` row (hashed, expiring, single use) and the link goes out by email. For WhatsApp the working assumption [A6] is a `wa.me` click-to-chat link with the setup URL prefilled, opened from the owner's own device, because there is no WhatsApp Business sending account yet [Q20]. SMS (named in scope §9) is not in the prototype and is not built. `QrCode` (built) renders the setup URL.

### 1.9 The prototype-data banner and preview exposure

These three surfaces will be on the public team preview behind real sign in (section 1.10), with fictional organisation data. Registration on the preview is limited to an allow-list of team addresses [A34]. Each layout shows a one-line prototype notice (a `Banner`, switched by a `site.prototype` shared prop so it disappears when the backend lands), every page is `noindex`, and none enters the sitemap. The preview's own `noindex` header and `Disallow: /` already apply [Q22].

### 1.10 Identity and authentication: the real backend mapping (this phase)

Module: **Identity** (`ARCHITECTURE.md` §5.4: sign up, login, email verification, two-factor, sessions and devices, password reset, rate limits), with **Audit** limited to authentication events. Every row's rules, numbers and tests are in `DASHBOARD_BUILD.md` §7 and §10.

| Screen or control | Last phase (fixture) | Now maps to | Component |
|---|---|---|---|
| `Auth/Signup` | Client validation, `registeredEmails` error, `simulateLatency` | `POST register`: creates a `users` row with `business_name`, `phone`, `terms_accepted_at` and a hashed password, sends the verification email, redirects to the verify screen. Identical response if the email exists (the owner is emailed instead). Does not sign in. Limits: 5 per hour per IP, 3 per hour per email. The "already registered" inline error is removed | `Signup` wired with the Inertia form helper, `StrengthMeter` (built) |
| `Auth/VerifyEmail` | `?token=fixture-valid`, `fixture-expired`, a 42 s countdown | `GET verify-email/{id}/{hash}` (signed, 24 hours, works without a session) then sign in; `POST verify-email/resend` (1 per minute, 6 per hour). Pending address held in the session. States come from the response, the countdown from a server `resendAvailableAt` (60 s) | `VerifyEmail` wired |
| `Auth/Login` | Any address; `wrong-password` rejects | `POST login` on the `web` guard. One failure message for unknown, wrong and locked. Limits and backoff per `DASHBOARD_BUILD.md` §7.6. Regenerates the session. "Keep me signed in" is a 30-day remember cookie. A user with confirmed two-factor is held at the challenge (pending login in the session, 5 minutes). Unverified goes to the verify screen. Notifies the owner after a success that followed 5 or more failures | `Login` wired, `Banner` |
| `Auth/TwoFactor` | Code `123456` accepted | `POST login/two-factor`: TOTP, window plus or minus one step, replay refused, 5 per minute, destroyed after 10 failures in 15 minutes. Completing it signs in and regenerates the session | `TwoFactor` wired, `CodeInput` (built) |
| `Auth/Recovery` | Code `ABCD-EFGH-JKLM`; "8 of 10 unused" from a fixture | `POST login/recovery`: HMAC compare, single use, marks `used_at`, emails the account, audits. The remaining count comes from the database and is the only thing ever shown | `Recovery` wired |
| `Auth/ForgotPassword` | Always shows success after a delay | `POST forgot-password`: the same message whether the address exists, is unverified or the request was throttled; the email is sent only if the account exists; 3 per hour per email | `ForgotPassword` wired |
| Reset link (new) | none | `GET reset-password/{token}`, `POST reset-password`: hashed single-use token, 30 minutes, one outstanding per account, ends every session, does not sign in, emails the account | `Auth/ResetPassword` (new), `Field`, `StrengthMeter` |
| Sign out (account menu) | A link to `/login` | `POST logout`: invalidates and regenerates the session and the CSRF token, forgets the remember cookie, audits | `AccountMenu` |
| Password re-confirmation (new) | none | `POST confirm-password`, 5 per minute, valid 15 minutes. Gates: change password, two-factor disable and regeneration, sign out everywhere, revoke another session, withdrawing another administrator or agency (a fixture action behind a real gate) | `ConfirmPasswordDialog`, `Auth/ConfirmPassword` (new) |
| Two-factor enrolment (new; the prototype only shows "On, 8 of 10 recovery codes unused") | none | `POST user/two-factor` (confirmed password) returns the secret once and an `otpauth://` URL; the browser draws it with `QrCode` (built); `POST user/two-factor/confirm` with a code activates it and returns the 10 recovery codes once; no route returns either afterwards. `DELETE user/two-factor` needs a confirmation and a code. `POST user/recovery-codes` regenerates | `TwoFactorSetupDialog`, `Auth/TwoFactorSetup` (new), `RecoveryCodesList`, `CodeInput`, `QrCode`, `CopyField` |
| Owner two-factor prompt (new) | none | Persistent `Banner` on the dashboard and an interstitial after first sign in, snoozable 7 days, until enabled. Enforcement is one config flag, default off [A35] | `Banner`, `Modal` |
| Change password (the account's own) | `webmail Settings` "Change" button | `POST user/password`: current password, new password under the §7.4 rules, ends other sessions, emails the account, audits | `SecurityPanel`, `Field`, `StrengthMeter` |
| Session and device list (webmail Settings "Your devices" and "This session", and the new panel on Team and Staff) | A static list with "Sign out" | Real. Read from the `sessions` table (or `staff_sessions`): browser and operating system, truncated IP, last active, current marked. `DELETE user/sessions/{id}`, `POST user/sessions/revoke-others` (also rotates the remember token). No location (needs GeoIP) [A37]. Mail apps over IMAP are not sessions and stay fixture | `DeviceList` (shared), `SecurityPanel` |
| Staff sign in (ops) | none (no screen in the prototype) | `/ops/login` on the `staff` guard: its own cookie, table and idle limit; mandatory two-factor; 3 per minute and a 30-minute lock after 10 failures; accounts created by `staff:create` only [A36] | `Auth/Login`, `Auth/TwoFactor`, `Auth/Recovery` with a `guard` prop |
| Audit of all the above | none | One `audit_log` row per event in `DASHBOARD_BUILD.md` §7.13, written in the same transaction as the change | none (no screen; the owner and ops audit screens stay fixture) |

**What stays fixture despite looking like authentication.** The mailbox password reset and per-mailbox two-factor policy on `admin-mailbox` (they are mailbox credentials, which need Mailcow), the "add an administrator" code flow on `admin-team`, delegation, the ops staff roster, and the setup-device token. The sign-in identity they relate to is real; the organisation they act on is not.

---

## 2. Owner dashboard (11 screens, `mailadmin/`)

Layout for all of them: `DashboardLayout` (dark app header with the domain switcher and account menu, 250 px side navigation, mobile tab bar; all styles already in `ziro.css`: `.app`, `.app-hdr`, `.side`, `.tabbar`). Side navigation groups: Overview, Domains, People, Billing, Account. Routes use the `dashboard.*` names in `DASHBOARD_BUILD.md`.

### 2.1 `admin`: Dashboard (overview)

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Domain heading, greeting, "Add a mailbox", "Switch domain" | `ziroPaintDomain` writes text into `data-dom-*` | Organisations + Domains: current domain and owner name from the shared prop | `DomainSwitcher` (new), `Button` |
| Four stat tiles: mailboxes (4, "no seat limit"), storage used (13.5 of 40 GB), plan and renewal date, domain health (4 of 4) | `data-count-to` counters and `ZIRO_DOMAINS` values | Mailboxes count; `mailboxes.used` summed from Dovecot quota reports; `subscriptions.renews_at`; `domain_records` passing count | `Stat` (built), new `Meter` for the storage bar |
| "What needs your attention" | Alert array per domain, typed by hand | Derived stack, section 1.6 | `Banner` (built) with a link `Button` |
| Quick actions (add mailbox, resend setup link, reset a password, view invoices) | Links; two point at `#` | Add mailbox opens the Add mailbox dialog (2.2). Resend setup link: section 1.8. Reset a password opens the mailbox Security section (2.3). View invoices goes to Billing | `Card`, `Button` |
| "Your mailboxes" short list with usage pills | `ziroPaintMiniRows` builds HTML | Mailboxes module: top rows by last activity, `% full` pill from used/quota, "Not set up" from `setup_completed_at` null | New `MailboxTable` (compact variant), `Pill` |
| "Your plan" card: Business yearly, ₦27,600, "VAT included", renews 4 March 2027, Change plan, Invoices | Static text, `planPrice` in `ziro.js` says ₦30,000 while the page says ₦27,600 | Billing: plan, price excluding VAT, VAT shown separately, `renews_at`. VAT wording follows [Q4] | `Card`, `Price` helpers (built) |
| "Recent activity" with "See the full log" | `ziroPaintActivity` | Audit, section 1.7 | New `ActivityFeed` |

Props contract: `{ org, domain: DomainSummary, stats: { mailboxCount, usedGb, poolGb, assignedGb, planName, renewsAt, recordsPassing, recordsTotal }, alerts: Alert[], mailboxes: MailboxRow[], subscription: SubscriptionSummary, activity: ActivityItem[] }`. Entity shapes: section 5.

### 2.2 `admin-mailboxes`: Mailboxes

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Header actions: Add a mailbox, Add extra storage | Opens `[data-mb-modal]`; storage links to `admin-storage` | Mailboxes create flow; Billing storage purchase | `Button`, `Modal` + `useDisclosure` (built) |
| Pool summary: assigned 26 of 40 GB, actually used 13.5 GB, plan Business expandable to 100 GB, pool bar with a key | `ziroPaintPool` makes segments with inline `flex` | `mailboxes.quota_gb` sum against the pool; used from Dovecot. Segment order follows quota | `PoolBar` (built; `DomainPoolCard` is a marketing illustration with sample data and is not reused here), `Stat` |
| Records warning banner ("Mail from this domain may be refused...") | Shown when `d.warn` is set | Shown when any record is `needs_fix` or `missing` on this domain. Links to Domain settings | `Banner` |
| Mailbox table: quota, last signed in, status, Manage | Rows painted by `ziroPaintRows` | Mailboxes list: name, role label, quota, used, `last_login_at`, status (active, near full, not set up, suspended, locked) | `MailboxTable` (new, shared with ops, section 2.12 and 4.6) |
| "Changing a quota" note | Static copy | States the quota floor rule, section 1.4 | `Note` (built) |
| Add mailbox dialog: address, display name, quota in GB, password choice (send a setup link or set one), live validation | `validate()` checks the regex, duplicate address on this domain and quota against free pool as the admin types | Mailboxes create: server re-validates; creating calls Provisioning (the only code that talks to the `MailServer` interface) idempotently; setup link per section 1.8; "set one myself" forces change at first sign-in | New `AddMailboxDialog` composed from `Modal`, `Field`/`Input`, `OptionGroup`/`OptionCard`, and `checkAllocation` from `PoolAllocator.jsx` for the address and pool checks |

Props: `{ domain, pool: { poolGb, assignedGb, usedGb, ceilingGb, planName }, records: { warn: boolean }, mailboxes: MailboxRow[], can: { create, buyStorage } }`.

### 2.3 `admin-mailbox`: one mailbox (nine sections)

Sections: Overview, Name and picture, Password and security, Storage, Aliases and forwarding, Auto-reply, Filtering and limits, Activity, Suspend or delete. Section navigation is a side list of anchors.

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Overview stats: storage 6.1 of 8 GB, received this month, sent this month with 3 bounced, devices signed in | Static numbers | `sending_stats` rolling windows and `delivery_events` for the mailbox; devices per [A8] | `Stat`, `Meter` |
| Display name and address | Inputs, address read-only after mail was delivered | `mailboxes.display_name` editable; `local_part` fixed once delivered (new mailbox plus alias is the documented route) | `Field`, `Input` |
| Picture upload | Button, no behaviour | Not in scope, not built in the first pass [A31]. Initials avatar only | none |
| Set a new password, generate a strong one, require change at next sign-in | Inputs | **Stays fixture this phase:** this is the mailbox credential, which needs Mailcow through Provisioning. Later: admin-initiated reset that signs the user out of every device and is never shown again. (The signed-in person's own password change is real, section 1.10) | `Field`, `StrengthMeter` (built), `Button` |
| Two-factor sign-in toggle | Checkbox | Stays fixture: a per-mailbox "require two-factor" policy that will force enrolment at the next webmail sign-in. Two-factor itself (enrolment and challenge) is real this phase for the signed-in account (section 1.10). It protects Ziroemail webmail and the dashboard, not IMAP or SMTP [A7] | `Field` toggle row |
| Signed-in devices, Sign out, Sign out everywhere | Static list | Mailbox devices stay fixture this phase. The account's own browser sessions are real (section 1.10): rows in `sessions`, revocable individually; mail apps over IMAP show "last synced" only [A8] | New `DeviceList` |
| Storage quota input with floor marker ("cannot go below 6.1 GB") and the 76% warning | Static | `checkQuota` (new in `Lib/pool.js`, shares logic with `checkAllocation`): minimum is used GB, maximum is current quota plus free pool. Server enforces. Thresholds per [A9] | New `QuotaEditor`, `PoolBar` |
| Aliases list with Remove, "Add an alias" | Static rows | `aliases` table, no storage and no charge. Dialog reuses the Add address dialog (2.6) | `Table`, `Modal` |
| Forwarding: forward to, keep a copy | Inputs | `forwarding_rules`. Forward-without-copy is the risky option, so the copy default is on | `Field` |
| Auto-reply on/off, from/until dates, message | Inputs | Mailcow auto-reply through Provisioning; once per sender per day (copy) | `Field`, date inputs |
| Filtering: spam filtering, reject executable attachments | Toggles | Rspamd and ClamAV policy per mailbox (scope "Inbound filtering", "Attachment scanning") | toggle rows |
| Sending limits: messages per hour (100) and per day (500) | Number inputs | Per-account sending limits are CORE (scope §5). Editable by the owner only within plan caps [A10]. Mirrored in `sending_stats` and enforced by Mailcow ratelimit | `Field` |
| Activity (3 rows) and "See the full log" | Static | `audit_log` scoped to the mailbox | `ActivityFeed` |
| Suspend, Delete | Buttons | Suspend: sign-in and sending stop, mail still arrives. Delete: 30-day hold then permanent removal, quota returns to pool. Both confirm in a dialog stating that | `Modal`, `Button variant="danger"` |

Props: `{ mailbox: MailboxDetail, domain: DomainSummary, pool: PoolSummary, aliases: Alias[], forwarding: { to, keepCopy }, autoReply: { on, from, until, message }, filtering: { spam, rejectExecutables }, limits: { hourly, daily, planDefaults }, devices: Device[], activity: ActivityItem[], can }`.

### 2.4 `admin-domains`: all domains

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Domain list: health text, mailbox count, renewal date, plan and storage, Manage or Fix records, Billing | Two cards from `ZIRO_DOMAINS` | Domains + Subscriptions for the organisation | `Card`, `Pill`, `Meter` |
| "Why each domain needs its own plan" | Static note | Pricing rule (one plan, one domain) | `Note` |
| Add a domain dialog | `[data-add-modal]`, plan radios, `data-add-total` recomputed in JS | Section 1.2, mode `claim`. The domain field uses `checkDomainInput` (built). Plan choice uses `PlanPicker variant="select"` (built). Charged-today line comes from `buildOrder` for display and a server quote later. Submitting means check, then pay, then records (`RecordTable`) | `Modal`, `PlanPicker` (add a `currentCode` prop, not needed here), `OrderSummary` (built) |
| `#add` hash opens the dialog from other pages | `hashchange` listener | Query string or route param opens it (`?add=1`) so it survives Inertia navigation | `useDisclosure` |

Props: `{ domains: DomainRow[], plans: Plan[], quote?: Quote, canAddDomain }`.

### 2.5 `admin-domain`: one domain's records and delivery health

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| "Re-check now" | Button, nothing | Mode `monitor`, section 1.2. Busy state, then the page props refresh | `Button busy` |
| Authentication records (SPF, MX, DKIM, DMARC) with state pill, what is there now, what it should be, Copy | Static HTML that the paint function overwrites (the static HTML says SPF needs a fix, the data object says all four pass) | `domain_records` with `expected` and `observed`, state, `last_checked_at`, `broken_since` | `RecordTable` and `DnsRecordRow` (built) extended with `mode`, `observed`, `lastCheckedAt`, `brokenSince`; `CopyField` is already used inside the row |
| Inbox placement: Gmail, Outlook, Yahoo percentages | `placement` values by hand ("we send test messages to seeded accounts every day") | Deliverability inbox placement, but per domain. The data model has no `domain_id` on `inbox_placement_runs` and ops describes a weekly platform test [A11] | `Stat` with a low-state class |
| Sending reputation: bounce 0.4%, complaints 0.02%, blocklists clear | `reputation` values | `sending_stats` and `delivery_events` aggregated per domain; blocklist status is platform-level, shown as "clear" for the domain | `Stat`, `Pill` |
| "Not confident doing this?" | Link to Contact | Support via WhatsApp or email [Q20] | `Note`, `Button` |

Props: `{ domain: DomainDetail, records: Record[], checkedAt, placement: { gmail, outlook, yahoo, asOf, scope }, reputation: { bounceRate, complaintRate, blocklists }, contactHref }`.

### 2.6 `admin-aliases`: extra addresses

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Table: address, delivers to, type (alias or forwards to 2), Edit | Static rows | `aliases` (one destination) and `forwarding_rules` (several), scope CORE, no billing | `Table` (built; flush variant uses inline styles, see §6 D7), `Pill` |
| "Add an address" and Edit | Buttons, no dialogs in the prototype | Dialog: source local part, destinations (mailbox picker), type derived from count | `Modal`, `Field`, new `AddressDialog` |
| Catch-all off, "Turn on catch-all" | Static note and button | OPTIONAL in scope, off by default with a spam warning. Turning on confirms in a dialog [A16] | `Note`, `Modal` |
| Alias or forwarding? explainer | Static | Copy only | `Note` |

Props: `{ aliases: AliasRow[], mailboxes: { id, address }[], catchAll: { on, destination } }`.

### 2.7 `admin-team`: team and access

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| People list: owner (locked), administrator with Change, delegated agency with Withdraw | Static rows | `organisation_user` roles and `delegations` (agency org, scope, expiry, `revoked_at`). Owner is the sign-up address (the real `users.email`), not a mailbox on the domain, and changes only through support | New `TeamList`, `Pill` |
| Add an administrator: email, six-digit code (valid 10 minutes), confirm, done | `aaStep` moves between three panels; no code is checked | Identity: sends a one-time code to the address; the new administrator is added once the code is entered by them or read back to the owner. Rate limited. Works for an address with no mailbox here | New `AddAdminPanel` using `CodeInput` (built) and `Field` |
| Withdraw delegated access | Button | Fixture this phase (no delegations table), but the action sits behind a real password re-confirmation (section 1.10). Later it sets `delegations.revoked_at`, effective immediately, and is audited (`access.delegation_withdrawn` is defined now). Depends on Q17 | `Modal` confirm |
| "What each role can do" matrix | Static table | Mirrors section 1.5, generated from the same permissions map the `can()` helper uses | `Table` |
| Your sign-in and security (the signed-in person: two-factor, password, sessions) | Not in the prototype | Real: the shared `SecurityPanel`, section 1.10 [A33] | `SecurityPanel` |
| Export all organisation mail (owner only, named in the matrix) | No control anywhere | Scope CORE "Data export". An owner-only export card is added here [A5] | New `ExportCard` |

Props: `{ people: Person[], delegations: Delegation[], roles: RoleMatrix, canManageAccess, canExport }`.

### 2.8 `admin-billing`: plan and storage

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Storage summary: pool 40 GB, assigned 26, used 13.5, "30 GB plan, 10 GB bought, 100 GB ceiling", Add 10 GB | Static | `plans.pool_gb` plus `storage_addons`; ceiling from the plan | `Stat`, `Meter`, `PoolBar` |
| Your plan: ₦29,670 per year, ₦27,600 plus VAT, plan, domain, renews, paid by bank transfer, Change plan, Payment method | Static | `subscriptions`, latest `invoices`, `payments.channel` | `OrderSummary`-style list (built) |
| Change plan panel: three radios, a "takes effect immediately or at date" tag, bullet list of consequences, confirm button text that changes | `describePlanChange` in `ziro.js`: upgrade now and pro rata; downgrade at term end; assigned over new pool blocks it; extra storage released | Billing plan-change service. The text is generated from a server preview (`GET /billing/plan-change-preview`); until then from fixture rules | New `PlanChangePreview` (list + tag) around `PlanPicker variant="select"` (built) with a `currentCode` prop |
| Invoice history with PDF links | Static rows, `#` links | `invoices`, `payments`; PDF generated server-side. In the UI phase the links are disabled with a tooltip, not `#` | `Table`, `Pill` |
| "Yearly and monthly cost the same" note | Static copy | Depends on [Q3]. Shown only if the fixture says so | `Note` |
| VAT invoice in company name | Link to Contact | Business details (registered name, RC number, address) are not collected on any prototype screen [A4] | `Note` |
| Past due, grace period, suspended, cancelled | None in the prototype | Scope §10 lifecycle and dunning. The fixture carries `subscription.status` and the page shows a `Banner` per state [A17] | `Banner` |

Props: `{ subscription: Subscription, plans: Plan[], planChangePreview?: PlanChangePreview, invoices: Invoice[], storage: StorageSummary, paymentMethod, can }`.

### 2.9 `admin-storage`: add storage

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Adding to: domain, plan, pool now, ceiling | Painted from `ZIRO_DOMAINS` | Domains and Billing | `Stat` |
| Track showing "from plan / bought already / adding now" against the ceiling | `data-st-track` inline widths | Pool plus pending add against `ceiling_gb` (null for Premium means no ceiling) | `PoolBar` variant with a ceiling mark |
| How much to add: typed GB, presets 5 / 10 / 20 / Fill the pool, held below the ceiling | `recalc()` clamps to `ceiling - pool`, `PER_GB = 100` | Billing: per-GB price from the plan fixture, VAT added, charged for a full year, renews with the plan [Q2] | New `StorageAdder` |
| What you will pay: price, VAT, charged today, renews on | Computed in JS | Quote from the server; display via `buildOrder` | `OrderSummary` (built) |
| "Before you buy" and "Need more than the ceiling?" | Static | Copy only | `Note` |
| Continue to payment | Demo note | Goes to the checkout transfer or card flow (built) with an order of type `storage` [A3] | `Button` |

Props: `{ domain, pool: PoolSummary, plan: Plan, extraStorage: { perGbMinor, vatRate, currency }, renewsAt, presets: [5, 10, 20], quote? }`.

### 2.10 `admin-audit`: activity log

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Category buttons (Everything, Mailboxes, Storage, Billing, Access, Domain) | Static buttons | `audit_log.category` filter, server-side, query string | `ChipGroup` (built) |
| Rows: when, who or what, detail | Seven static rows | `audit_log` for the organisation. Includes automatic events ("detected automatically") whose actor is the system | `ActivityFeed`, `AuditTable` (new) |
| Export as CSV | Button | Server stream of the filtered set, audited itself | `Button` |
| "What is recorded and for how long" (12 months, never mail contents) | Static | Retention setting, and the privacy rule in the legal pages [A2] | `Note` |

Props: `{ filter, entries: AuditEntry[], nextCursor, retentionMonths }`.

### 2.11 `admin-help`: help

Static contact page. Maps to the Support module and the contact channels [Q20]: WhatsApp number and link, support email with the domain in the subject, hours, what to send, "if mail has stopped" links to Status and `dashboard.domains.show`, who you will speak to, urgent out-of-hours. The prototype's phone number is a placeholder (`0800 000 0000`) and names two people (Chidi Okeke, Yemi Adeleke) that must come from a config, not the page. Components: `Card`, `Note`, `Button`, `Callout`-style numbered list. Props: `{ support: { whatsapp, email, hours, firstReply }, people: [{ name, role }], context: { domain, plan, accountEmail } }`.

---

## 3. Webmail (5 screens, `mail/`)

Layout: `MailLayout`, three panes on desktop (folders, list, reading pane) and one pane at a time on a phone, with a compact top bar (search, account menu) and the compose popup as a corner panel. All styles exist in `ziro.css` (`.msg`, `.reading`, compose, read receipts, undo bar).

**The real use case in one paragraph.** The browser talks to Laravel's Webmail module, not to the mail server. Laravel reads and writes the mailbox through a `MailboxClient` interface (`ARCHITECTURE.md` §5.5). Phase 1 implements it with direct IMAP and a header cache table [Q16; recorded as the working decision in `MARKETING_BUILD.md` §1 item 7]. Search uses Dovecot full-text search. Message HTML is sanitised server-side with an allow-list, remote images are blocked until allowed, links are rewritten, and the body renders in a sandboxed iframe on a separate origin. Sending authenticates to Mailcow SMTP as the mailbox, goes out through the SES relay, and a copy is appended to Sent. Later, webmail sign-in authenticates the mailbox credential and issues a revocable per-device Sanctum token (not this phase: the session is the real `users` cookie session, section 1.10, [A32]). In the UI-first build `fixtures/mail.js` is shaped exactly like the `MailboxClient` responses so swapping it for controller props is a one-line change per page.

### 3.1 `mail`: inbox, reading pane, compose popup, quick reply

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Folder navigation with unread counts: Inbox 12, Sent, Drafts, Archive, Spam 4, Trash, user folders (Invoices, Suppliers, Orders) | `showFolder` hides rows by `data-in`; `refreshCounts` counts DOM rows; the Drafts count is 2 here and 3 on the other four pages | IMAP `LIST` and `STATUS`; counts come from the server, never from rows (a badge must not disagree with the list). User-created folders are CORE (scope §6) | New `FolderNav` |
| Message list: sender, time, subject, preview, attachment flag, unread weight, Opened or Not opened yet on sent mail | Rows baked into HTML | Header cache table keyed by IMAP UID: `{ uid, folder, from, to, subject, preview, receivedAt, flags, hasAttachment }`, paged | New `MessageList`, `Skeleton`, `Empty` |
| Select, select all, bulk bar (archive, delete, spam, mark read) with undo | `syncSelection`, `moveMessages`, `showUndo` (6 s timer) | IMAP `MOVE` and `STORE`. "Mark spam" trains Rspamd and feeds the abuse signal (scope CORE). Undo is an inverse call within a short window | `MessageList` selection state, `Toast` with `action` (built) for Undo, so no separate undo component |
| Keyboard: j, k, e (archive), # (delete), Escape | `keydown` handler | Same, as a hook | New `useMailShortcuts` |
| Reading pane: subject, sender, time, body, "Images were not loaded / Show images", attachments with Save, Reply, Forward | Bodies baked in | `GET message`: sanitised HTML, `remoteImages: 'blocked'`, attachment list with signed download URLs. "Show images" is per-message, with "always for this sender" a later option | New `ReadingPane`; body in `<iframe sandbox srcdoc>` in the UI phase [A15] |
| Quick reply (Send, Open full composer, Cancel) with "Sent, a copy is in your Sent folder" | DOM insert | Composer in compact mode; same send path | `Composer` (new) `variant="inline"` |
| Compose popup: minimise, maximise, close, recipient chips, Cc and Bcc toggles, formatting, attachments, "Draft saved" | `openCompose`, chips, `data-cp-saved` | Autosave debounce to the IMAP Drafts folder with the `\Draft` flag; recoverable after a lost connection (scope CORE) | `Composer` `variant="popup"`, `RecipientChips` (new) |
| "Tell me when it is opened" and the Opened or Not opened state on sent mail | `RR_ICON` states in the DOM | Not in the Phase 1 scope. Real options are a disposition-notification header (reader may ignore) or a tracking image (conflicts with the block-remote-images stance). See [A12] | `Composer` option, `Pill`-style state |
| Storage meter: "6.1 of 8 GB, your share of the 40 GB the domain holds" | Static | Quota and pool figures from Mailboxes | `Meter` |
| Account menu: settings, set up another device, Business dashboard (admins only), sign out | Links, no logic | Identity; the dashboard link appears only if the mailbox user is also an organisation owner or admin | `AccountMenu` (new, shared with the dashboard header) |
| Mobile: list and reading pane alternate | `body.reading` class | Route state: the open message is part of the URL so Back works | `MailLayout` |

Props: `{ mailbox: { address, displayName, quota, orgDomainPoolGb }, folders: Folder[], folder: string, messages: { items: MessageRow[], nextCursor }, selected?: MessageDetail, features: { readReceipts }, limits: { attachmentMb } }`.

### 3.2 `mail-compose`: full-page composer

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| To chips, Cc and Bcc toggles, subject | Static chip, no autocomplete | Autocomplete from contacts (3.4); address validation per chip | `RecipientChips` |
| Bold, italic, underline and four icon buttons | `data-fmt` buttons | Basic rich text with links and inline images (scope CORE). Output is sanitised HTML plus a plain-text alternative. Editor choice [A13] | `Composer` toolbar |
| Signature block in the body | Static | Per-mailbox signature from settings, applied to new mail and replies (scope CORE) | `Composer` |
| Attachments (file input, list with remove) | `data-attach` handlers | Upload to temporary storage, size and type limits from a config value [A13] | `Composer` |
| Save draft, "Draft saved just now", Discard, Send, undo-send window | Demo note | Draft APPEND; discard deletes the draft; send per 3.1; the undo-send hold is a client-side delay set in settings | `Composer` |
| Tell me when it is opened | Checkbox | As in 3.1 | `Composer` |

Props: `{ mailbox, draft?: Draft, replyTo?: MessageDetail, contacts: ContactSuggestion[], signature, limits }`.

### 3.3 `mail-search`: search results

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Result count and query | Static "4 results for invoice" | `GET /mail/search?q=...`, Dovecot FTS across sender, subject, body and attachment names | New `SearchResults` using `MessageList` |
| Scope chips: Everywhere, Inbox, Sent, Has attachment, This year | Static buttons | Query parameters `folder`, `has=attachment`, `since` | `ChipGroup` |
| Operators `from:` and `has:attachment` (explained in a note) | Copy only | A small query parser server-side; the client only sends the string | `Note` |
| Result rows with the folder label | Static | Result rows carry `folder` | `MessageList` row variant |

Props: `{ query, scope, results: MessageRow[], total, nextCursor }`.

### 3.4 `mail-contacts`: contacts

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Alphabet-grouped list (42 contacts), search, Add | Static rows | The data model has no contacts table. Source of truth unresolved between Mailcow's CardDAV (SOGo) and a Laravel `contacts` table [A14] | New `ContactList` |
| Contact detail: name, role and company, email, phone, added automatically from a message, recent messages | Static | Same source, plus a search for recent messages from the address | `Card`, `Table` |
| "Send a message" and "Edit" | Links | Opens `Composer`; edit dialog | `Button`, `Modal` |
| "Contacts fill themselves in" note and CardDAV hint | Copy | Auto-collect on send (and on receive, per setting) | `Note` |

Props: `{ contacts: ContactRow[], selected?: ContactDetail, total }`.

### 3.5 `mail-settings`: settings

| Section | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Name and address: display name, address (set by the domain administrator), reply-to, default send-from when the mailbox has more than one address | Inputs and a preview | `mailboxes.display_name`; reply-to and default sender in a per-mailbox preferences record (not in §5.3, added in the build spec) | `Field` |
| Storage: quota, used, free, 76% warning | Static | Mailboxes quota; thresholds per [A9] | `Stat`, `Note` |
| Signature, include on replies | Textarea, switch | Per-mailbox signature (scope CORE) | `Field`, toggle row |
| Out of office with dates | Inputs | Same Mailcow auto-reply as the dashboard (2.3) | `Field` |
| Your devices, sign out, set up another device | Static list | Real for the signed-in account's browser sessions (section 1.10, [A8]); the setup-device link is unchanged | `DeviceList` (shared with 2.3), `SecurityPanel` |
| Security: password change; two-factor on with "8 of 10 recovery codes unused"; block remote images | Buttons | **Real this phase** for the account: password change, TOTP enrolment, recovery-code count and regeneration (section 1.10). The block-remote-images switch stays a preference fixture [A32] | `SecurityPanel`, `Switch` |
| Manual settings: IMAP, SMTP, CardDAV with Copy | Static values | Public server values from config; username is the full address | `CopyField` (built) |
| Reading and writing preferences (ask before sending without a subject, undo send 10 s, mark read when opened, ask for read receipt, confirm read receipt) | Switches | Preferences record | toggle rows |
| This session, sign out, sign out everywhere | Static | Real: `POST logout`, revoke other sessions behind a password re-confirmation | `Button`, `ConfirmPasswordDialog` |

Props: `{ mailbox: { address, displayName, replyTo, defaultFrom, addresses[] }, quota, signature: { html, onReplies }, autoReply, devices: Device[], security: { passwordChangedAt, twoFactor: { on, recoveryUnused, recoveryTotal }, blockRemoteImages }, manual: { imap, smtp, carddav }, preferences, session }`.

---

## 4. Ops console (14 screens, `ops/`)

Layout: `OpsLayout`, denser than the customer surfaces and visibly different (the rules are in `ziro.css` under "OPS CONSOLE": `table.ops`, `tr.sev-high|med|low`, ops header). Staff only, mandatory two-factor, a separate guard and cookie (`ARCHITECTURE.md` §5.2): real this phase (section 1.10); the data on the screens stays fixture. The shared `ReasonDialog` (a modal that refuses to submit without a written reason, posts it with the action and puts it in the audit trail) backs every action that changes something: lock, unlock, clear a flag, approve or decline a refund, start a restore, view as customer, change staff access.

Operational facts that the prototype uses and that the build must not hard-code into JSX: the four sending IPs, the blocklist names, the thresholds (bounce 2%, complaints 0.10%, queue target 5 minutes, escalation at 45 minutes) and the abuse flag rules. They come from fixtures now and from config later.

### 4.1 `ops`: operations overview

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| "Figures refresh every 60 seconds" | Static | Inertia partial reload on a 60 s poll (`router.reload({ only })`), paused when the tab is hidden | `usePolling` hook (new) |
| Platform figures: organisations 412 (+9), mailboxes 3,106, mail in 24 h, bounce rate, queue age, storage used | Static | Ops counts; `delivery_events` aggregates; Mailcow and Dovecot storage; `sending_stats` | `Stat` |
| "This morning's checks": blocklists, queue, flagged accounts, backup | Four static rows with Open or Review | Four derived states from Deliverability and Backups; each row is a link | `Banner`/`Callout`-style `CheckRow` (new, small) |
| Domains stuck in setup (3 rows, "Call them") | Static table | `domains` where status is `verifying` for more than N days with a paid subscription, sorted by days waiting | `OpsTable` (new, wraps `table.ops`) |
| Find an account | Search box | Section 1.2: a lookup over our data | `Field`, `Button` |
| Support load: unanswered WhatsApp 4, email 8, median first reply, migrations running | Static | No integration exists. WhatsApp and email counts have no data source [A21]; migrations running is real (Migration module) | `Stat` |
| Last two hours feed | Static | Newest `audit_log` and event rows | `ActivityFeed` |

Props: `{ asOf, figures: PlatformFigures, checks: Check[], stuckDomains: StuckDomain[], supportLoad, feed: ActivityItem[] }`.

### 4.2 `ops-deliverability`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Headline figures (bounce, complaints, queue age, placement, DKIM signed, TLS) | Static | SES events via SNS to `POST /webhooks/ses` (bounce, complaint), Postfix queue, Dovecot and Postfix logs | `Stat` with limit text |
| Blocklist grid: 4 sending IPs by 4 lists, polled every 15 minutes | Static `Clear` cells | Scope: all mail leaves through SES, so these four IPs cannot be our direct sending IPs. They must be the Mailcow host IP(s) and any dedicated SES IPs [A22]. Check is a scheduled job; it must be proven able to return `listed` (`ARCHITECTURE.md` §8) | New `BlocklistGrid` |
| Bounce rate, 14 days with a 2% line | Inline SVG | `sending_stats` daily rollup | New `SeriesChart` (apply the `dataviz` skill's palette and axis rules) |
| Domains raising our averages (domain, sent 7 days, bounce, complaints, state, Review) | Static | `sending_stats` grouped by domain, joined to `abuse_flags` state | `OpsTable`, `Pill` |
| Inbox placement: five providers, weekly seed test of 40 addresses | Static bars | `inbox_placement_runs` (weekly platform test here, daily per domain in the dashboard: [A11]) | `Meter` row |
| Authentication coverage: domains with SPF, DKIM, DMARC, DMARC at reject | Static | Counts over `domain_records` | `Stat` |
| "Queue age is over target ... move that domain to the backup relay" | Static callout | A backup relay is not in the architecture [A23] | `Banner` |

Props: `{ headline, blocklists: { ips[], lists[], matrix }, bounceSeries: Point[], limitLine, worstDomains: DomainRate[], placement: Placement, authCoverage, queueAlert? }`.

### 4.3 `ops-queue`: delivery log

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Search (address, subject, message id), state and period filters, Export CSV | Static form | `delivery_events` search, 30-day retention, filters as query parameters | `Field`, `Select` (built), `Button` |
| Table: time, from, to, subject, state (Delivered, Deferred, Bounced, Rejected), attempts | Static | Scope requires accepted, delivered, bounced, complained, delayed and suppressed recorded distinctly. The prototype has four states; the data needs six [A24] | `OpsTable` |
| Message trace: hops with the receiving server's own reply, retry schedule, 72-hour retry window, advice about a 451 | Static narrative | Postfix queue and log plus SES events; one row per hop | New `DeliveryTrace` |

Props: `{ query, filters, summary: { deferred, waitingOnOneDomain }, rows: DeliveryRow[], trace?: Hop[] }`.

### 4.4 `ops-domains`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| "Re-check all records" | Button | Queue a `RecheckDomainRecords` for every live domain (section 1.2), rate-limited, audited | `Button`, `ReasonDialog` not needed (no customer effect) |
| Figures: 412 domains, 387 fully configured, 11 never finished, 51 missing DMARC, 3 records broke, median setup time | Static | Counts over `domains` and `domain_records` | `Stat` |
| Records that stopped working (was verified, now missing, broken since) | Static table | `domain_records.broken_since` on live domains: the `monitor` mode output | `OpsTable`, record-letters strip (new `RecordStrip`) |
| Never finished setup (paid, never flowed, registrar, amount at risk) | Static table, ₦318,750 | Paid subscription with domain never `live`; registrar from the onboarding registrar choice (stored as `domains.registrar`, not in §5.3) | `OpsTable` |
| DMARC shown grey as not required | Copy | A domain counts as complete without DMARC; this is a rule the scope does not state [A25] | `RecordStrip` |

Props: `{ figures, broken: BrokenDomain[], neverFinished: StuckDomain[], atRiskMinor }`.

### 4.5 `ops-abuse`: abuse queue

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Waiting count and the "A lock stops sending, not receiving" banner | Static | Section [Q18]. Text must match the product rule | `Banner` |
| Flagged account cards: sent last hour vs normal, bounce rate, complaints, distinct recipients, subject samples, a written verdict, buttons | Static | `abuse_flags` with `evidence json` computed by the Deliverability anomaly job (volume more than 5 times the account's own 30-day average, bounce above 5% in an hour, complaints above 0.25%, a new sending country, success after more than 50 failures). Subject samples need message metadata the architecture does not capture [A26] | `Card`, `Stat`, `Pill`, severity rail `tr.sev-*` |
| Lock sending now | Button | Provisioning sets Mailcow to deny submission for the mailbox (receiving continues). Ops Engineer or Owner. `ReasonDialog` | `ReasonDialog` (new) |
| Not abuse, clear the flag; Email them about the bounces; Lock and force password reset | Buttons | State change plus audit; owner email from a template; reset forces session revocation and a password change (the staff-side lock action is fixture this phase; the revocation it will call is the real one in section 1.10) | `ReasonDialog`, `Button` |
| Resolved this week | Static table | `abuse_flags` with a resolved state | `OpsTable` |
| What trips a flag | Copy | The thresholds above, from config | `Note` |

Props: `{ waiting, flags: AbuseFlag[], resolved: ResolvedFlag[], rules, can: { lock, clear } }`.

### 4.6 `ops-abuse-detail`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Hourly sending chart, 30-day average vs today | Inline SVG | `sending_stats` hourly | `SeriesChart` |
| Who received them: distinct recipients, ever mailed before, addresses that do not exist, spam reports, recipient domains, distinct bodies | Static | Mix of SES events and Postfix logs. "Distinct message bodies" needs a body hash that nothing records [A26] | `Stat` list |
| Signals that did not fire (location, failed sign-ins, password change, Sent folder intact, forwarding rules) | Static | Dovecot and webmail sign-in events with GeoIP; Sent folder state needs mailbox metadata access by staff (an access-log event) | `Callout`-style list |
| Decide: Lock sending, Keep the limit and email a warning, Lift the limit, reason field | Buttons and textarea | `ReasonDialog`; the reason appears in the audit trail and in the customer email | `ReasonDialog` |
| Account history | Static | `audit_log` and `abuse_flags` for the account | `ActivityFeed` |
| Automatic rate limit at 07:48 | Static | Scope says the anomaly lock is automatic. The prototype applies an automatic rate limit and leaves the lock to a person [A27, Q18] | `Note` |

Props: `{ flag: AbuseFlagDetail, series: Point[], baseline, recipients: RecipientStats, signals: Signal[], history: ActivityItem[], can }`.

### 4.7 `ops-orgs`: organisations

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Search by domain, mailbox, business, invoice number; Search and Clear | Static | Section 1.2 (lookup). Partial domain matching | `Field`, `Button` |
| Filter chips with counts: All, Setup incomplete, Payment overdue, Storage over 85%, Flagged, Renewing in 30 days | Static | Server-side filters with counts | `ChipGroup` |
| Table: business, domain, plan, mailboxes, storage, state, renews; 8 of 412; Previous and Next; Export CSV | Static | Paged `organisations` with joined subscription and health. State is derived (Healthy, Rate limited, Storage 87%, MX missing, Setup incomplete, Never set up, DKIM broken) | `OpsTable`, `Pill`, pagination (new `Pager`) |

Props: `{ query, filter, counts, rows: OrgRow[], page: { current, last, total }, can: { export } }`.

### 4.8 `ops-org`: one organisation

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Account figures: mailboxes, storage, mail in 30 days, bounce rate, paid to date, support contacts | Static | Aggregates; paid to date from `payments` (the prototype's ₦70,950 does not equal its own three invoices) | `Stat` |
| Mailboxes table with quota, used, last sign-in, state | Static | Same as 2.2 for another org | `MailboxTable` |
| Domain and records, registrar, last checked, Re-check records now | Static | `domain_records`; re-check per section 1.2 | `RecordStrip`, `Button` |
| Billing: plan, extra storage, method, renews, outstanding; All invoices; Issue a refund | Static | Billing; refund flow goes to 4.10 | `Card`, `Button` |
| Who to call, business details (registered name, RC number, address, industry, came from) | Static | None of these are collected on any screen [A4]. Fixture only | `Card` |
| View as Adaobi Foods (read only, customer told afterwards, logged with a reason) | Link to the customer dashboard | Impersonation in read-only mode, an `audit_log` entry with the reason, and an after-the-fact customer email. Not named in the scope [A28] | `ReasonDialog`, a read-only `DashboardLayout` flag |
| Recent contact (ticket numbers) | Static | Support module tickets. In-app tickets are CORE in scope, absent from the prototype [A18] | `ActivityFeed` |

Props: `{ org: OrgDetail, mailboxes: MailboxRow[], domain: DomainDetail, billing: BillingSummary, contact, business, tickets, can: { viewAs, refund, recheck } }`.

### 4.9 `ops-mailboxes`: all mailboxes

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Figures: 3,106 total, active in 30 days, over 90% full, never signed in, suspended (4 non-payment, 2 abuse), median size | Static | Aggregates over `mailboxes` | `Stat` |
| Search and chips (Needs attention, Over 90% full, Never signed in, Suspended, All) | Static | Server filters | `Field`, `ChipGroup` |
| Table with Open, Review, History actions | Static | Rows link to `ops.orgs.show`, abuse detail or abuse history | `MailboxTable` (ops variant), `OpsTable` |
| What happens when a mailbox fills up (90% owner emailed, 100% held 72 hours, pool full is a sales conversation) | Copy | Mismatches the scope's 80% and 95% [A9] | `Note` |
| Scope: create, suspend, reset, reassign, inspect quota | Not in the prototype | Mailbox administration from ops is CORE in scope but has no controls here [A19] | none |

Props: `{ figures, query, filter, rows: OpsMailboxRow[], page }`.

### 4.10 `ops-refunds`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Figures: waiting, paid this month, refund rate, commonest reason, median time to pay, within 14 days | Static | `refunds` aggregates | `Stat` |
| Waiting cards: amount, reason, days since payment, mail ever delivered, mailboxes created, requested by, a written recommendation, buttons | Static | `refunds` with `policy_calc json` from the Billing refund policy engine (scope CORE: calculated by published policy). The "mail ever delivered" signal comes from `delivery_events` | `Card`, `Pill` |
| Approve, Decline with a reason, Call before deciding; "needs a second approver, you are the second" | Buttons and text | Two-person approval above the threshold, one below [Q6]; the requester cannot be the second approver; every refund records who asked and who agreed | `ReasonDialog`, `Banner` |
| Start a refund | Button | Opens a dialog that takes a payment and calls the policy engine to compute the amount | `Modal` |
| Paid out this month | Static table | `refunds` paid, with both approvers | `OpsTable` |

Props: `{ figures, waiting: RefundRequest[], paid: RefundPaid[], threshold: { amountMinor, currency }, viewer: { id, role }, policy: { fullRefundDays } }`.

### 4.11 `ops-backups`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Figures: last snapshot, restore tested, retention (30 days daily, then 12 monthly), total stored, offsite copy, failed nights | Static | `backups` (taken, size, `verified_restore_at`); the retention and the second region are decisions [Q11] | `Stat` |
| 30-night strip (green, amber, red) with an explanation of the 8 September failure | Static | Derived from `backups` | New `NightStrip` (uses the same `SeriesChart` primitives) |
| Recent snapshots with "Restore from this" | Buttons | The scope asks only for backup status and a runbook for restore [A29]. The button creates a restore request record and a runbook link; it does not execute | `ReasonDialog` |
| Start a restore; Restores performed table | Static | `restore_requests` (new table) | `Modal`, `OpsTable` |
| "Restoring overwrites" warning | Copy | Runbook text | `Banner` |

Props: `{ figures, nights: Night[], snapshots: Snapshot[], restores: RestoreRequest[], retention, can: { restore } }`.

### 4.12 `ops-staff`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| People: role, permission chips, last sign-in with method (passkey, authenticator app), Change access, Resend invitation | Static | The roster stays fixture. The `staff` guard behind the console is real this phase: separate table, cookie and session store, mandatory two-factor, accounts created by command [A36]. Passkeys are not in the scope [A30] | New `StaffList` |
| Your sign-in and security (the signed-in staff member) | Not in the prototype | Real: the shared `SecurityPanel` for the staff guard (two-factor status, password, sessions); a staff member cannot disable two-factor | `SecurityPanel` |
| Invite somebody | Button | Invitation email, role selection, audit | `Modal`, `Field` |
| What each role can do (Support, Engineer, Owner), two owners minimum | Static | Role map in config, same map the `can()` helper uses; the "two owners minimum" rule is enforced on change | `Table` |
| Reading a customer's mail (owner only, with written request, customer emailed, entry in the customer's own log) | Copy | Access logging (scope §12). The customer-visible log entry is not on any customer screen except `admin-audit` | `Note` |

Props: `{ people: StaffRow[], roles: StaffRoleMatrix, viewerId }`.

### 4.13 `ops-audit`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Search, person filter, kind filter (locks, refunds, mailbox access, restores, staff changes) | Static | `audit_log` filters | `Field`, `Select`, `ChipGroup` |
| Rows grouped by day: time, what, who (a person or System), reason in quotes | Static | Append-only, no update or delete grants, 7-year retention | `AuditTable` (shared) |
| Load older entries | Button | Cursor pagination | `Button` |
| "Why the reason field is compulsory" | Copy | Rule enforced by `ReasonDialog` | `Note` |

Props: `{ filters, groups: { day, entries: AuditEntry[] }[], nextCursor, people: { id, name }[] }`.

### 4.14 `ops-reports`

| Control | Prototype fakes | Real mapping | Component |
|---|---|---|---|
| Headline figures: new customers, left, billed, refunded, uptime, storage sold | Static | Monthly aggregates | `Stat` |
| Customers month by month (bars) | Inline SVG | `organisations` count by month | `SeriesChart` |
| Money: billed, new, renewals, storage add-ons, refunded, outstanding, naira vs dollars | Static | `invoices` and `payments` aggregates | `Table` |
| Who left and why | Static counts | Needs a cancellation reason that no customer screen captures [A20] | `Table` |
| Service, support, "what this month says" | Static, partly editorial | Uptime from the status host; support figures have no data source [A21]; the editorial text is not generated | `Table`, `Note` |
| Download as PDF; earlier reports with PDF links | Buttons | Report generated per month, stored as a file | `Button`, `Table` |

Props: `{ month, headline, customersByMonth: Point[], money, departures, service, support, narrative?, earlier: ReportRow[] }`.

---

## 5. Fixture specification (the contract for the next build phase)

Same rules as `fixtures/plans.js`, `account.js` and `onboarding.js`: money is integer minor units with a currency, timestamps are ISO 8601, nothing is pre-formatted, every shape equals the future Spatie `Data` class so a page swaps its fixture import for `usePage().props` in one line. Pages import small **selector functions** (for example `overviewProps(domainId)`) rather than raw data, so each page reads like an Inertia page.

### 5.1 Files

| File | Holds |
|---|---|
| `fixtures/organisation.js` | The canonical demo organisation, section 5.2: org, owner, domains, mailboxes, subscription, invoices, team, delegations, aliases, audit entries |
| `fixtures/dashboard.js` | Selectors that return each dashboard page's props from `organisation.js` and `plans.js` |
| `fixtures/mail.js` | One mailbox's folders, messages, drafts, contacts, settings, shaped as `MailboxClient` responses (`ARCHITECTURE.md` §5.5) |
| `fixtures/ops.js` | Platform figures, domain health, delivery log, abuse flags, organisations, refunds, backups, staff, audit, reports. Organisation rows for the demo org are derived from `organisation.js`, not retyped |
| `fixtures/scenarios.js` | Named variants for testing states without editing data: `healthy` (default), `spf-drift`, `past-due`, `over-quota`, `pool-full`, `empty-mailbox`, `locked-sending`. Selected by `?scenario=` on the preview and in tests only |

`accountFixture.user.name` changes from `Victory Adaobi` to the demo owner's name (one line, build step 2), and the authentication-only values in `account.js` (accepted codes, registered emails, rejected password, `?token=fixture-*`) are removed because those screens are now real (section 1.10). The signed-in person is the real `auth.user` shared prop (`{ name, email, emailVerified, twoFactorEnabled, recoveryCodesUnused, snoozedUntil }`), not a fixture entity.

### 5.2 The canonical demo organisation

One organisation, used by every surface. These facts must agree everywhere they appear.

| Fact | Value | Where the prototype disagrees |
|---|---|---|
| Organisation | Adaobi Foods Ltd, customer since 2026-03-04 | `admin-billing` lists an invoice dated 4 Mar 2025 |
| Owner (account email, not a mailbox) | the dashboard prototype's owner (a personal address, not reproduced here); sign-in mailbox `victory@adaobifoods.com` | `ops-org` names a different owner (Obiageli Nwosu) with `obi@`; onboarding fixture says Victory Adaobi |
| Domain 1 | `adaobifoods.com`, Business, yearly, renews 2027-03-04, pool 30 GB plan + 10 GB bought = 40 GB, ceiling 100 GB, all four records passing | `ziro.js` says ₦30,000 for the plan; one HTML page says VAT included |
| Mailboxes on domain 1 | victory (owner, 12 GB, used 4.2), sales (shared, 8 GB, used 6.1), ngozi (staff, 4 GB, used 1.8), emeka (staff, 2 GB, used 1.4, never signed in) = 26 assigned, 14 free, 13.5 used | `ops-org` lists obi, sales, accounts, hr; audit says four created at setup though emeka was added 3 days ago |
| Domain 2 | `adaobiexport.ng`, Starter, renews 2027-08-18, pool 10 GB, ceiling 25 GB, DKIM missing | none |
| Invoices | plan 2026-03-04 ₦29,670; storage 10 GB (date to match the audit) ₦1,075 | totals differ between `admin-billing` and `ops-org` |
| Reference time | one `asOf` (2026-09-29T09:30+01:00); every relative time is computed from it by a `Lib/format.js` helper | webmail is dated 4 March 2026, ops 29 September 2026 |

### 5.3 Dashboard entities

```
Money          { minor: int, currency: 'NGN'|'USD' }
Plan           as fixtures/plans.js (code, name, poolGb, ceilingGb|null, price{currency:{monthly,yearly}})
Subscription   { id, domainId, planCode, term:'annual'|'monthly', status:'active'|'past_due'|'grace'|'suspended'|'cancelled',
                 renewsAt, graceEndsAt|null, paidBy:'transfer'|'card'|'ussd'|'usd', extraStorageGb, priceExVat:Money, vat:Money }
DomainSummary  { id, name, planCode, state:'pending'|'verifying'|'live'|'suspended', mailboxCount, assignedGb, usedGb, poolGb,
                 ceilingGb|null, renewsAt, recordsPassing, recordsTotal, healthNote }
DomainDetail   DomainSummary + { registrar|null, records:[DnsRecord], placement, reputation, lastCheckedAt }
PoolSummary    { poolGb, planGb, boughtGb, assignedGb, usedGb, unassignedGb, ceilingGb|null }
MailboxRow     { id, local, address, roleLabel, quotaGb, usedGb, lastLoginAt|null, state:'active'|'near_full'|'not_set_up'|'suspended'|'locked',
                 setupCompletedAt|null }
MailboxDetail  MailboxRow + { displayName, createdAt, requireTwoFactor, requirePasswordChange, sentMonth, receivedMonth, bouncedMonth, deviceCount }
Alert          { id, kind:'bad'|'warn', title, body, cta:{ label, routeName, params } }          // already derived (section 1.6)
ActivityItem   { at, actor:{ type:'user'|'system'|'staff', name }, text, category }
AuditEntry     ActivityItem + { id, subject, detail|null, reason|null }
Invoice        { id, number, issuedAt, description, total:Money, status:'paid'|'open'|'failed'|'refunded', pdfAvailable:false }
Person         { id, name, email, role:'owner'|'admin'|'user', locked:boolean, kind:'person'|'agency', grantedAt|null }
Delegation     { id, granteeName, scope, grantedAt, expiresAt|null, revokedAt|null }
AliasRow       { id, address, destinations:[address], type:'alias'|'forward' }
Device         { id, label, client, place, lastActiveAt, current:boolean, revocable:boolean }
Quote          { lines:[{ label, note?, amount:Money }], subtotal, vat, total, renewsAt }       // display only; server is authoritative
PlanChangePreview { direction:'up'|'down'|'same', effective:'now'|ISO, bullets:[{ text, warn?:true }], blocked:{ assignedGb, newPoolGb }|null }
StorageSummary { poolGb, planGb, boughtGb, assignedGb, usedGb, ceilingGb|null, extra:{ blockGb, price:Money, perGb?:Money, mode:'block'|'perGb' } }
```

### 5.4 DNS record shape (extends the onboarding fixture, matches `GET /domains/{id}/records`)

```
DnsRecord { id, type:'TXT'|'MX'|'SPF'|'DKIM'|'DMARC', title, status:'passing'|'needs_fix'|'waiting'|'missing',
            fields:[{ key, label, value, hint? }],           // what it should be
            observed:[{ key, label, value }]|null,           // what is there now (new)
            message, lastCheckedAt, brokenSince|null,        // brokenSince is new
            conflict?:{ title, found, advice } }
RecordTable props add:  mode:'onboarding'|'monitor', checkedAt, onCheck
```

`mode="monitor"` swaps the header text (no "check every ten seconds"), shows `brokenSince`, never says "waiting for propagation" on a live domain, and offers Re-check now. Rows are otherwise unchanged.

### 5.5 Webmail entities

```
Folder        { id, name, kind:'inbox'|'sent'|'drafts'|'archive'|'spam'|'trash'|'user', unread, total }
MessageRow    { uid, folder, from:{ name, address }, to:[{ name, address }], subject, preview, receivedAt, unread, hasAttachment,
                receipt:{ requested, state:'none'|'not_opened'|'opened', openedAt|null } }
MessageDetail MessageRow + { cc, bodyHtml (already sanitised), remoteImages:'blocked'|'allowed', attachments:[{ id, name, type, sizeKb, downloadUrl }] }
Draft         { uid, to, cc, bcc, subject, bodyHtml, attachments, savedAt }
ContactRow    { id, name, address, company, autoAdded:boolean }
ContactDetail ContactRow + { role, phone, addedFrom, recent:[{ uid, subject, at }] }
MailSettings  { identity:{ displayName, replyTo|null, defaultFrom, addresses[] }, signature:{ html, onReplies }, autoReply, devices[],
                security:{ passwordChangedAt, twoFactor:{ on, recoveryUnused, recoveryTotal }, blockRemoteImages },
                manual:{ imap, smtp, carddav }, preferences:{ askNoSubject, undoSendSeconds, markReadOnOpen, requestReceipts, confirmReceipts } }
```

### 5.6 Ops entities

```
PlatformFigures { organisations, orgsDeltaWeek, mailboxes, mailboxesDeltaWeek, mail24h:{ in, out }, bounceRate, queueAgeMinutes, storage:{ usedTb, provisionedTb } }
Check           { id, kind:'blocklist'|'queue'|'flags'|'backup', state:'ok'|'warn'|'bad', title, body, at, link }
StuckDomain     { domain, organisation, orgId, missing:[type], daysWaiting, registrar, paid:Money }
BrokenDomain    { domain, organisation, orgId, records:[type], brokenSince }
Blocklists      { ips:[string], lists:[string], matrix:{ [ip]: { [list]: 'clear'|'listed'|'unknown' } }, polledEveryMinutes }
DeliveryRow     { id, at, from, to, subject, state:'accepted'|'delivered'|'deferred'|'bounced'|'complained'|'suppressed', attempts }
Hop             { at, label, detail, serverReply|null, outcome:'ok'|'temp_fail'|'perm_fail' }
AbuseFlag       { id, address, orgName, planName, since, state:'rate_limited'|'flagged'|'sign_in_anomaly'|'locked', sentLastHour, baselineHourly, bounceRate,
                  complaintRate, distinctRecipients, severity:'high'|'med'|'low', verdict, subjects:[{ text, count }]|null, signals }
OrgRow          { id, name, domain, planCode, mailboxCount, usedGb, poolGb, state, renewsAt }
OrgDetail       OrgRow + { customerSince, paidToDate:Money, mailIn30d, mailOut30d, bounceRate, contact, business }
OpsMailboxRow   { address, orgName, orgId, usedGb, quotaGb, lastLoginAt|null, state, actionRoute }
RefundRequest   { id, orgName, domain, planName, paid:Money, paidAt, daysSincePayment, reason, mailEverDelivered, mailboxesCreated, requestedBy, requestedAt,
                  policyCalc:{ insideGuarantee, amount:Money }, needsSecondApprover, recommendation }
Snapshot        { id, takenAt, kind:'full'|'monthly', mailboxCount, sizeTb, restoreTest:'passed'|'failed'|'pending' }
StaffRow        { id, name, email, role:'support'|'engineer'|'owner', lastSignInAt|null, method:'passkey'|'authenticator', invited:boolean }
ReportMonth     { month, headline, money, departures, service, support, customersByMonth, narrative? }
```

---

## 6. Flags

### 6.A Working assumptions (each unblocks the build; none is a final decision)

The first column says how urgent confirmation is: **Decide** means confirm before the rest of the backend phase because the answer changes the data model or a promise to customers; **UI-only** means the assumption is cosmetic or reversible in the fixtures.

| ID | Assumption taken so the build is not blocked | Why it is ambiguous | Type |
|---|---|---|---|
| A1 | The records step gets a fifth row, "Ownership" (a TXT record), shown first. `DnsRecordRow` already takes any `type`. Onboarding copy that says "four records" is revisited when the backend lands | Scope §7 requires ownership verification before any mailbox; the built onboarding screens omit it | Decide |
| A2 | Ops screens that show subject lines and message traces are built as designed, labelled "metadata only", and flagged for the privacy and AUP text | The owner audit page promises "never the contents of anybody's mail"; ops shows subject samples and a delivery log with subjects, kept 30 days. Whether subjects count as content is a legal question | Decide [Q21] |
| A3 | The storage purchase and the add-a-domain purchase both go into the checkout screens already built (`Checkout/Payment`, `Checkout/Transfer`) as an order of type `storage` or `domain` | The prototype ends these flows with a demo note | UI-only |
| A4 | Business details (registered name, RC number, address, industry, source) are fixture-only in the dashboard and ops. No form is built | Nothing in sign-up, checkout (the "Details" step has no screen) or the dashboard collects them, yet invoices must carry the registered name and VAT details | Decide |
| A5 | Data export is an owner-only `ExportCard` on Team and access: a button, a confirm dialog and a toast saying the export is queued | Scope §8 makes it CORE; no screen exists. It needs an `exports` table the data model lacks | Decide |
| A6 | "Send on WhatsApp" opens a `wa.me` link with the setup URL prefilled | There is no WhatsApp Business sending account [Q20] | UI-only |
| A7 | Two-factor (TOTP, recovery codes) is real this phase and protects Ziroemail webmail and the dashboard. IMAP and SMTP rely on the password, rate limits and the anomaly lock. App passwords are not built | Mailcow's own two-factor does not apply to IMAP; a phone profile cannot answer a TOTP prompt | Decide |
| A8 | The account's own browser sessions are real and individually revocable (section 1.10). Mail apps appear as "last synced" rows with no per-device sign-out and stay fixture; "sign out everywhere" ends every other session and asks for the password again | IMAP has no per-device session | UI-only |
| A9 | The quota warning thresholds are fixture config: 80% and 95% to the user (scope), 90% owner email and 100% hold for 72 hours (ops copy) | Three sets of numbers | Decide |
| A10 | Owners may edit a mailbox's hourly and daily send limits only inside plan caps; the plan defaults are shown | The prototype lets owners edit freely; the scope sets caps by plan | UI-only |
| A11 | The dashboard shows a per-domain placement figure with its `asOf` and `scope` ("platform seed test" or "this domain"). The fixture says which | Scope has seeded testing "on a schedule"; the dashboard says daily per domain, ops says weekly across the platform; the data model has no domain on a placement run | Decide |
| A12 | Read receipts are built as designed, behind `features.readReceipts` (default on in the fixture) | Not in scope. A header request may be ignored by readers; a tracking image contradicts the block-remote-images stance | Decide |
| A13 | The composer uses `contentEditable` with a small toolbar and no new dependency. Attachment limits come from a fixture value | A real editor library needs approval (project rule: no dependency changes without it) | UI-only |
| A14 | Contacts are a Laravel `contacts` table with auto-collect on send. CardDAV settings stay read-only information | Mailcow's CardDAV (SOGo) could be the source instead; the data model has no contacts table | Decide |
| A15 | Message bodies render in `<iframe sandbox srcdoc>` without `allow-same-origin` in the UI phase | A separate origin cannot exist on the preview host | UI-only |
| A16 | Catch-all is a confirm dialog with the spam warning, off by default | Scope OPTIONAL | UI-only |
| A17 | Subscription states past due, grace, suspended and cancelled get a `Banner` each on the billing page and a derived alert, driven by `scenario` | Scope §10 requires the lifecycle and dunning; no prototype screen shows any state | UI-only |
| A18 | No in-app ticket screens are built. Support stays WhatsApp and email as the prototype shows | Scope makes in-app tickets and ticket time CORE | Decide |
| A19 | Ops gets no create, suspend, reset or reassign controls for mailboxes in this phase | Scope §11 lists them; the prototype has none | Decide |
| A20 | Cancellation reasons exist only as fixture text in the report | No screen captures why a customer leaves | UI-only |
| A21 | Support-load figures (unanswered WhatsApp and email, first-reply time) are labelled "manual" fixture values | No data source exists | UI-only |
| A22 | The blocklist grid lists the Mailcow host IP(s) and any dedicated SES IPs, with the prototype's four addresses as placeholders. A cell can return `listed` | The prototype shows four own sending IPs, but all mail leaves through SES | Decide [Q8, Q9] |
| A23 | "Backup relay" is shown as text only, with no control | Not in the architecture | Decide |
| A24 | The delivery log filter and rows support six states: accepted, delivered, deferred, bounced, complained, suppressed | The prototype shows four | UI-only |
| A25 | A domain counts as set up without DMARC, as the prototype states | Scope §7 and §5 require all records to verify | Decide |
| A26 | Abuse screens show subject samples and a "distinct bodies" figure from the fixture, marked as needing a capture mechanism | Nothing in the data model records subjects or body hashes | Decide |
| A27 | The anomaly job applies an automatic rate limit; a person decides on the lock | Scope calls the lock automatic; ops describes human-decided [Q18] | Decide |
| A28 | "View as customer" opens the dashboard read-only with a staff banner and a reason dialog. "Open a mailbox" is a disabled control with the policy text | Not in scope; it is a customer-trust promise | Decide [Q21] |
| A29 | Restore buttons create a request record and link to the runbook; they do not execute | Scope asks for status and a runbook only | Decide |
| A30 | Passkey is shown as a sign-in method label only | Not in scope | UI-only |
| A31 | Mailbox picture upload is not built; initials avatars only | Not in scope | UI-only |
| A32 | The signed-in session is a `users` row; webmail screens (still showing the fixture mailbox) sit behind it; mailbox-credential sign in waits for Mailcow; `users.password` is the only account password for now | ARCHITECTURE §5.2 has three identity types and webmail should authenticate the mailbox against Mailcow, which is out of scope | Decide |
| A33 | A shared `SecurityPanel` (two-factor, change password, sessions) is shown in webmail Settings, on Team and access, and on ops Staff | The prototype has no account-security screen for the person signed in, only mailbox-level controls | UI-only |
| A34 | Registration on the preview is limited to an allow-list of team addresses | The preview is public; real sign up would fill it with real accounts | UI-only |
| A35 | Two-factor is optional but prompted for owners and admins, mandatory for staff; one config flag enforces it for owners | The instruction for this phase differs from scope §5 and §12, which enforce it for owners and admins | Decide |
| A36 | Staff accounts are created only by `staff:create` and reset only by `staff:reset-password`; no staff invitation or self-service reset | The ops Staff screen shows invitations, but the invitation flow needs the Organisations and Support modules | Decide |
| A37 | Session lists show browser, operating system and a truncated IP; no location | Location needs a GeoIP database, which is out of scope | UI-only |
| A38 | `business_name`, `phone`, `terms_accepted_at` and `terms_version` live on `users` until the Organisations module exists, then move | Signup collects them and there is no organisations table yet | UI-only |
| A39 | Verification and security emails go through one project-owned SMTP sender on the preview, queued, until SES has production access | CEO Q9; the architecture's system-mail configuration set does not exist yet | Decide |
| A40 | No CAPTCHA this phase; responses carry a `captcha_required` flag that is always false | A real UX and third-party trade-off (`DASHBOARD_BUILD.md` §7.8) | Decide |
| A41 | New and changed passwords are checked against the Have I Been Pwned range API, failing open if it is unreachable | Privacy-safe (k-anonymity) but an outbound dependency | UI-only |

### 6.B Screens that depend on a still-open CEO decision

| `CEO_DECISIONS.md` | Screens and controls affected | Placeholder behaviour in the UI-first build |
|---|---|---|
| Q1 per business or per person | 2.1 mailbox stat ("no seat limit"), 2.2 add mailbox (pool quota versus assigning a plan), 2.3 storage section, 2.8, 2.9, 2.4 add domain, 4.7, 4.8, 4.10, 4.14 | Per business with pooled storage, read from `fixtures/plans.js`. A per-seat answer changes mailbox creation and billing, not only labels |
| Q2 extra storage price | 2.8, 2.9, 4.9 copy ("10 GB is ₦1,000 a year") | `StorageAdder` reads `extra.mode`. Default `block`, following the Pricing page and `plans.js` (₦6,000 per 10 GB). `perGb` is a fixture switch |
| Q3 yearly saving | 2.8 note, 2.4 plan prices | Show whatever `plans.js` says; the "same price" sentence appears only if the fixture flag is set |
| Q4 VAT | 2.1, 2.8, 2.9, invoices, refunds | Listed prices exclude VAT, VAT added from `vatRate`; no "VAT included" wording anywhere |
| Q5, Q6 refunds | 4.10, 4.8 | 14-day guarantee and a ₦20,000 threshold in fixture config; a requester cannot be second approver |
| Q7 currency | 2.8, 2.9, 4.14 | Dashboard is naira only; the dollar share appears only in the report fixture |
| Q8, Q9, Q10 | 4.2 blocklists and relay, 4.3, 4.1 | Placeholders per A22, A23; no provider names on screen |
| Q11 backups | 4.11 | Retention and offsite copy from fixture, labelled placeholder |
| Q12 status host | 2.11 and 2.5 status links | Link to the existing `/status` route |
| Q14 second administrator | 4.12 | Fixture has two owners, as the prototype's "two owners minimum" rule requires |
| Q15 two extra screens | 2.9 | Built as live, per the recorded decision |
| Q16 webmail approach | 3.1 to 3.5 | `fixtures/mail.js` is shaped as `MailboxClient` responses, so either implementation can sit behind it |
| Q17 agency access | 2.7 delegated rows, withdraw, the role matrix | Built per scope (CORE) behind `features.delegation`; removing it deletes rows and one role, not a layout |
| Q18 anomaly lock | 4.5, 4.6 | Prototype behaviour plus A27; the lock banner text is a fixture string |
| Q19 domain search handoff | 2.4 add a domain, section 1.2 | Same `claim` check, no results screen |
| Q20 contact channels | 2.11, 1.8, 4.1 support load | Config values and `wa.me` links |
| Q21 legal | A2, A28, retention copy (12 months, 7 years, 30 days) | Copy kept as the prototype has it, listed for legal review |
| Q22 preview privacy | 1.9, 1.10 | Banner, `noindex`, no sitemap entry; registration limited to a team allow-list [A34]; every surface behind real sign in |
| Q9 SES access | 1.10 (verification, reset and security emails) | A project-owned SMTP sender on the preview [A39] |
| Q13 test environment, Q14 second administrator | 1.10 staff sign in, 4.12 | Staff created by command only [A36]; two staff owners in the fixture roster |
| Q21 legal (also) | 1.10 | The session list and `audit_log` store IP address and user agent; the retention and the privacy wording need the same review as A2 |

### 6.C Prototype versus the Phase 1 scope

| # | Mismatch | Handling |
|---|---|---|
| M1 | Owner data export (CORE) has no screen | A5 |
| M2 | In-app support tickets and ticket-time recording (CORE) have no screen; `admin-help` says "no ticket numbers" | A18 |
| M3 | Ownership TXT verification (CORE) is absent from the onboarding records step | A1 |
| M4 | Scope prices per seat and says "assign a plan" on mailbox creation; prototype prices per domain with "no seat limit" | Q1 |
| M5 | Overview "outstanding balance" (dashboard) and "MRR, signups today, open tickets, failed payments" (ops) are missing | Add `outstanding` to the overview props; ops overview keeps the prototype's figures and adds the four scope figures as a `Stat` row in fixtures only |
| M6 | Yearly offer: "two months free" (scope), lower monthly rate (design notes), "no discount" (billing page) | Q3 |
| M7 | Automatic anomaly lock (scope) versus automatic rate limit and human lock (ops) | A27 |
| M8 | Scoped suspension at three levels (sending, mailbox, organisation) versus a sending lock only | A19; the dialog offers the three levels as disabled options |
| M9 | Ops mailbox administration (create, suspend, reset, reassign) has no controls | A19 |
| M10 | Delivery log needs six states, prototype shows four | A24 |
| M11 | Quota warnings at 80% and 95% (scope), 95% (mailbox page), 90% and 100% (ops) | A9 |
| M12 | Backups are status only in scope; the prototype has restore buttons | A29 |
| M13 | Staff view-as and mailbox access, passkeys: not in scope | A28, A30 |
| M14 | Read receipts, per-mailbox picture, editable send limits, undo send, keyboard shortcuts, auto-collected contacts, CardDAV host: not listed in scope. Undo send and shortcuts are client behaviour and harmless | A12, A31, A10, A14 |
| M15 | Resend setup link by SMS (scope) is absent | Not built; email and WhatsApp only |
| M16 | Subscription lifecycle, dunning and renewal reminders have no dashboard states | A17 |
| M17 | Inbox placement cadence: scope "on a schedule", dashboard daily per domain, ops weekly platform | A11 |
| M18 | OPTIONAL scope items not in the prototype (filter rules, offline read, light and dark mode): not built | None needed |
| M19 | Four own sending IPs and a backup relay conflict with "everything through SES" | A22, A23 |
| M20 | Scope §5 and §12 enforce two-factor on every owner and admin account; this phase makes it optional and prompted | A35, one config flag |
| M21 | Scope §12 lists "token authentication: expiring, per-device, revocable"; this phase uses the cookie session and issues no tokens (the per-device webmail tokens in `ARCHITECTURE.md` §5.5 arrive with the webmail API) | A32 |
| M22 | Scope §6 "remembered device" for webmail login is covered by the 30-day remember cookie; mailbox-credential sign in is not built | A32 |
| M23 | The built Signup page shows "already registered" and the Login page distinguishes states; the no-enumeration rule removes both | `DASHBOARD_BUILD.md` §7.7 |

### 6.D Prototype inconsistencies the fixtures must not copy

| # | Inconsistency | Fix in the fixtures |
|---|---|---|
| D1 | `ziro.js` `planPrice` ₦30,000 for Business; page text ₦27,600 | Prices come from `plans.js` only |
| D2 | `STORAGE_COST = 6000` per 10 GB in the plan-change text; `PER_GB = 100` on the storage page | One `extra` object, per Q2 |
| D3 | "VAT included" on the overview; "plus VAT" on billing and checkout | One VAT rule |
| D4 | `admin-domain` static HTML shows SPF broken; the data object paints all four passing; the audit log says SPF broke yesterday | Default scenario is healthy; `spf-drift` scenario shows the broken-since state |
| D5 | Drafts count is 2 on one page, 3 on four others | Counts derive from the data |
| D6 | Mailbox sets, owner names and staff names differ between dashboard, webmail and ops | Section 5.2; fictional staff and customer names only, so no real person's name is used |
| D7 | `Table`'s flush variant sets inline styles, against the no-inline-style rule; ops needs `table.ops` | New `OpsTable`; move the `Table` styles into CSS when it is next touched |
| D8 | Dates are absolute and mixed (4 March 2026 and 29 September 2026) | One `asOf` and relative offsets |
| D9 | Starter appears at ₦16,125 a year in ops (the old per-seat ₦15,000 plus VAT) and ₦12,000 in the dashboard | Starter ₦12,000 plus VAT, from `plans.js` |
| D10 | Ops shows 40 GB pools on Business organisations that never set up, and "paid to date ₦70,950" against three invoices that add to ₦60,415 | Pool and totals derive from the subscription and invoice rows |
| D11 | The signed-in webmail mailbox is `sales@` with the display name of a person | `sales@` with the name its dashboard page shows |

### 6.E What is not ambiguous

Everything not listed above maps one to one: the layouts, navigation, record states, pool arithmetic and over-allocation guard, plan-change rules, quota floor, role matrix, the audit and activity feeds, folder and message handling, the abuse thresholds, and the refund queue mechanics. These can be built from the tables in sections 2 to 4 without further input.
