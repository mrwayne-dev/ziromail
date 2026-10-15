# Ziroemail — Architecture & Design Spec

Status: draft 1 · Scope: Phase 1 · Sources: `ziroemail/scope/Ziro_Email_Phase_1_Scope.md`, `ziroemail/ui/DESIGN.md`, the Verdict and Build Schedule PDFs, the two research papers, the 60 static screens in `ziroemail/ui/`, and the Laravel skeleton in this repo.

Order of work: **1. UI port** → 2. Backend → 3. Mail infrastructure. This document covers all three so the UI is built against the right seams, but only step 1 is being executed now.

---

## 0. Open conflicts to resolve first

Two source documents disagree. The UI port bakes one of them in, so it needs a decision before pages are written.

| # | Conflict | Scope doc (v1.0) | `DESIGN.md` + built UI | Working assumption |
|---|---|---|---|---|
| 1 | **Pricing model** | Per **seat**: Starter ₦1,500, Business ₦2,500, Premium ₦4,500, 5/10/30 GB per seat | Per **domain**, pooled storage split between mailboxes. Starter ₦1,100→₦1,000 on a yearly term, Business ₦2,500→₦2,300, Premium ₦5,000→₦4,500. 10/30/100 GB pool. Extra storage ₦100/GB/year | **UI model wins** — it is newer, and `DESIGN.md` says the UI "must never contradict" it. Scope doc §3.3, §8, §10 need amending. |
| 2 | **Product name** | "Ziro Email" | "Ziroemail", one word, "not Ziro Email" | **Ziroemail** |
| 3 | **Annual offer** | "Two months free" | "Never write '2 months free'" — state the lower monthly rate | **Lower monthly rate** |
| 4 | **Scope vs UI breadth** | Partner dashboard, WHMCS plugin out of scope | None built — consistent | No change |

Pricing must live in config/DB (the scope doc already requires "changed without a rebuild"), so conflict 1 is cheap to reverse later *if* the UI reads prices from props instead of hard-coding them. Today the static pages hard-code them in HTML and in `data-*` attributes. The port must not carry that over (see §4.5).

---

## 1. System overview

```
                         ┌────────────────────────────────────────────────┐
  Visitors / customers   │          APP HOST  (Laravel 13, PHP 8.3)       │
  (phone browser first)  │                                                │
        │                │  Inertia + React 19   ·   JSON API (/api)      │
        │  HTTPS         │  Sanctum auth · queues · scheduler · webhooks  │
        ▼                │                                                │
 ┌───────────────┐       │  MySQL (system of record)   Redis (cache/queue)│
 │ ziroemail.com │──────▶│                                                │
 └───────────────┘       └───────┬──────────────┬───────────────┬─────────┘
                                 │              │               │
                  Mailcow API    │   Paystack   │  SES (API +   │  S3-compatible
                  (provision,    │   (charge,   │  SNS webhooks │  off-server
                  quotas, DKIM)  │   webhooks)  │  for bounces) │  backups
                                 ▼              ▼               ▼
                       ┌──────────────────┐   ┌──────────────────────────┐
                       │  MAIL HOST (VPS) │   │  Amazon SES (Stockholm)  │
                       │  Mailcow/Docker  │──▶│  all outbound mail       │
                       │  IMAP · SMTP     │   │  2 config sets:          │
                       │  Rspamd · ClamAV │   │  system / customer       │
                       └──────────────────┘   └──────────────────────────┘
                                 ▲
                  IMAP/SMTP/CalDAV/CardDAV from Outlook, Apple Mail, Gmail app
```

Three separate trust zones, with separate credentials (scope §12 "least privilege"):

1. **App host** — Laravel. Knows customers, billing, DNS state. Holds a Mailcow API key scoped to provisioning, never mailbox passwords.
2. **Mail host** — Mailcow only. Never delivers directly to Gmail/Outlook/Yahoo; relays everything via SES.
3. **Backup store** — written by a credential that the mail host cannot read back or delete with.

A fourth, deliberately independent item: the **public status page** must still load when the app host is down. `ui/status.html` is the design; in production it is a static page on a different provider, fed by a small publish job (see §7.3).

### Key design decisions inherited, not reopened

- Own Mailcow server; all outbound through SES; **relay is configuration** (`config/mailrelay.php`), not hard-coded.
- No native apps, no bulk mail, no partner tools, no free tier in Phase 1.
- A domain cannot go live until MX + SPF + DKIM + DMARC all verify (the "go-live gate").
- Every consequential ops action carries a **reason** that is written to the audit trail and to the customer's email.

---

## 2. What is already in the repo

| Item | State | Notes |
|---|---|---|
| Laravel 13.17, PHP 8.3.6, Composer 2.9.5 | installed | `laravel/boost` **not** installed — project `CLAUDE.md` asks for it before app changes (see §10) |
| Inertia (laravel 3.5 / react 3.9), React 19, Vite 8, Tailwind 4 | installed | `resources/js/app.jsx` resolves `./Pages/**/*.jsx`; only `Pages/Welcome.jsx` exists |
| Sanctum, Spatie Data, Ziggy, L5-Swagger | installed | no config/usage yet |
| `BaseRepository`, `BaseService`, `BaseController`, `ApiResponse` trait, `BaseRequest` | present | Controller → Service → Repository layering is the house style. `ApiResponse` envelope: `{success, message, data}` / `{success:false, message, errors}` / paginated `meta` |
| `routes/api.php` | `/health` only | |
| Migrations | users, cache, jobs only | `users` has no org/role/2FA columns |
| `.env` | `DB_CONNECTION=mysql`, `QUEUE_CONNECTION=sync` | **`sync` queue must change** — see §6.4 |
| `app/Exceptions/Handler.php` | present | Laravel 13 configures exceptions in `bootstrap/app.php`; verify this file is actually wired or remove it |
| `resources/css/app.css` | `@import 'tailwindcss'` + Instrument Sans | will be replaced/augmented — see §4 |
| `ziroemail/` | **untracked** | design inputs, not app code. Decide whether to commit (§10) |

The skeleton is a thin starting point. There is no domain model yet.

---

## 3. The `ziroemail/` folder — inventory

| Path | Contents | Role in the build |
|---|---|---|
| `scope/Ziro_Email_Phase_1_Scope.md` (+ `.pdf`) | The 19-section Phase 1 build spec; features tagged CORE/OPTIONAL and by stage (FOUNDATION, WEBMAIL, DASHBOARD, BILLING, OPS) | Source of truth for **what** to build. Backend task list derives from §5–§12 |
| `Ziroemail verdict/` | Plain-talk verdict (build own Mailcow, small, prove it) and the 7-schedule Build & Launch plan with 5 gates | Source of truth for **why**, sequencing, gates |
| `Ziroemail research work/` | Two long board-research papers (mail service, email business) | Background. Do not copy into UI (`DESIGN.md` §9 forbids board-paper content on pages) |
| `ziroemail official logo/` | Black, white, icon PNGs | Brand originals. UI already carries processed copies in `ui/assets/img/` |
| `ui/` | The static prototype — **60 files, ~840 KB HTML** + `ziro.css` (82 KB) + `ziro.js` (89 KB) + `DESIGN.md` | The thing being ported (§4) |

### 3.1 UI inventory by surface

| Surface | Directory | Screens | Auth | Maps to scope stage |
|---|---|---|---|---|
| Public site | `ui/*.html` | index, pricing, features, migrate, help, contact, status, legal ×4 | none | Marketing site, KB, legal |
| Account & checkout | `ui/*.html` | signup, login, login-2fa, login-recovery, forgot-password, verify-email, checkout-payment, checkout-transfer | guest → partial | F Billing, §12 Security |
| Device setup | `ui/setup-device.html` | 1 (token-reached, no login) | signed URL | E Phone setup |
| Onboarding wizard | `ui/onboarding/` | onboard-domain, -records, -mailboxes, -assisted, -plan, -done | owner | C Domain onboarding |
| Owner dashboard | `ui/mailadmin/` | admin, -mailboxes, -mailbox, -domains, -domain, -aliases, -team, -billing, -storage, -audit, -help | owner/admin | D Dashboard, F Billing |
| Webmail | `ui/mail/` | mail, -compose, -search, -contacts, -settings | mailbox user | B Webmail |
| Ops console | `ui/ops/` | ops, -deliverability, -queue, -domains, -abuse, -abuse-detail, -orgs, -org, -mailboxes, -refunds, -backups, -staff, -audit, -reports | staff only | G Ops |
| System states | `ui/*.html` | 404, 500, maintenance, offline | none | — |
| Dev-only | `_screens.html`, `sitemap.xml`, `robots.txt` | index of screens (delete before handoff), SEO files | — | — |

Also present but not in the index: `onboard-plan.html`, `admin-storage.html` (confirm they are live screens, not leftovers).

### 3.2 How the prototype is built (the facts that drive the port)

- **No build step, no framework.** Plain HTML pages, one shared stylesheet, one shared script. Pages link each other by relative `.html` paths.
- **Design system = `ziro.css`**, hand-written, tokenised (`--blue #1066C6`, `--ink`, `--paper`, radii, one shadow family, 16.5px body, Inter + IBM Plex Mono). Class-based (`.hdr`, `.app`, `.side`, `.tabbar`, `.stat`, `.pill`, `.banner-bad`, `table.ops` …). **It is not Tailwind.**
- **Behaviour = `ziro.js`**, one 89 KB IIFE driven by ~300 `data-*` hooks. It mixes three things that must be separated in the port:
  1. *Generic UI* — header scrim, mobile nav sheet, reveal-on-scroll, counters, marquee, word-cycler, copy buttons, busy buttons.
  2. *Business logic faked in the browser* — plan/term/currency price math, pool allocator & over-allocation guard, seat totals, DNS record "verification", compose chips, undo toasts, domain switcher state.
  3. *Demo data* — hard-coded mail, contacts, domains, and records baked into HTML.
- **Per-page inline `<script>`** (17 pages) and **per-page inline `<style>`** exist on top of the shared files.
- **State** only in `sessionStorage` (selected domain), wrapped in try/catch.
- **SEO** is baked into `<head>`: canonical, OG, Twitter, JSON-LD, `sitemap.xml`, `robots.txt` that disallows `/ops/`, `/mailadmin/`, `/mail/`, `/onboarding/`, checkout and setup.
- **Progressive enhancement rule:** content is visible by default; reveal animation is opt-in via a class JS adds. Must survive the port (§4.4).
- **Accessibility rules** are explicit in `DESIGN.md` §7: skip link, focus ring, `aria-label` on icon buttons, `scroll-margin-top`, `tabular-nums`.

---

## 4. Frontend architecture (step 1 — the UI port)

### 4.1 Approach: port the design system as-is, componentise around it

**Recommendation: keep `ziro.css` verbatim as the styling layer and rebuild each page as an Inertia React page using the same class names. Do not re-express the design in Tailwind utilities.**

Why:
- The CSS is the "single source of truth" per `DESIGN.md`, 82 KB of finished, reviewed work, including hard-won details (`min-width:0` on grid children, balanced headings, hand-drawn SVG strokes with `non-scaling-stroke`, reduced-motion handling). A utility-class rewrite re-opens every one of those for no gain.
- The scaffold already pulls in Tailwind 4. It can stay installed for new utility needs, but it must not fight the system: **import order is `ziro.css` first as the base; Tailwind preflight is disabled** (use `@import "tailwindcss/theme"` + `utilities` layers only, skipping `preflight`), otherwise Tailwind's reset will silently alter `ziro.css`'s own reset and headings.
- Fonts: the scaffold's `bunny('Instrument Sans')` Vite font plugin is removed; Inter + IBM Plex Mono load as the design specifies (self-host via the same plugin rather than Google Fonts to remove a third-party runtime dependency and a privacy-policy subprocessor).

The alternative (Tailwind-native rewrite) is rejected: more work, higher regression risk, and the product has a strong visual identity that is already encoded.

### 4.2 Target layout

```
resources/
  css/
    ziro.css                  ← copied from ui/assets/css/ziro.css, then split (see below)
    app.css                   ← @import ziro.css; optional tailwind theme/utilities
  js/
    app.jsx                   ← createInertiaApp, layout resolver, progress bar
    ssr.jsx                   ← (optional, public pages only — see §4.6)
    Layouts/
      PublicLayout.jsx        ← .hdr + mobile nav sheet + footer       (index, pricing, …)
      AuthLayout.jsx          ← centred card, logo, no nav             (login, signup, 2FA, …)
      OnboardingLayout.jsx    ← stepper (.steps) + exit link
      DashboardLayout.jsx     ← .app / .app-hdr / .side / .tabbar      (mailadmin/*)
      MailLayout.jsx          ← .mail-shell / .mail-top / panes        (mail/*)
      OpsLayout.jsx           ← black header + INTERNAL tag + dark side (ops/*)
      SystemLayout.jsx        ← 404/500/maintenance/offline
    Components/
      ui/                     ← design-system primitives, 1:1 with ziro.css classes
        Button, Pill, Card, Banner, Field, Select, Meter, Stat, Steps,
        Table (+OpsTable), Empty, Skeleton, Spinner, Tick, CopyRow, Logo
      craft/                  ← Marked, Ringed, Shape, Rise, Cycler, Counter,
                                Marquee, Rail, Reveal   (DESIGN.md §5)
      domain/                 ← product-specific composites (see §4.3)
    Hooks/
      useReveal, useCopy, useBusy, useDisclosure, usePolling, useCurrency,
      useReducedMotion
    Lib/
      money.js                ← format NGN/USD (en-NG), proration display only
      format.js               ← bytes, relative time
    Pages/
      Public/   Index, Pricing, Features, Migrate, Help, Contact, Status,
                Legal/{Terms,Privacy,Aup,Refunds}
      Auth/     Signup, Login, TwoFactor, Recovery, ForgotPassword, VerifyEmail
      Checkout/ Payment, Transfer
      Setup/    Device
      Onboarding/ Domain, Records, Mailboxes, Assisted, Plan, Done
      Dashboard/  Index, Mailboxes, Mailbox, Domains, Domain, Aliases, Team,
                  Billing, Storage, Audit, Help
      Mail/     Inbox, Compose, Search, Contacts, Settings
      Ops/      Index, Deliverability, Queue, Domains, Abuse, AbuseDetail,
                Orgs, Org, Mailboxes, Refunds, Backups, Staff, Audit, Reports
      Errors/   NotFound, ServerError, Maintenance, Offline
public/
  images/                     ← logo PNGs (+ favicon, apple-touch-icon, og image)
  robots.txt  sitemap.xml     ← from ui/ (sitemap becomes generated, §4.7)
```

`ziro.css` is 82 KB in one file. Split by concern **after** it renders identically, not before: `tokens`, `base`, `components`, `craft/motion`, `public`, `app-shell`, `ops`. Per-page `<style>` blocks (and the screens-index styles) get folded into the right partial or into a component-scoped stylesheet; none should survive as inline `<style>` in JSX.

### 4.3 Product-specific components (extracted from repeated markup)

Identified from the page set; each replaces copy-pasted HTML and is where the faked logic goes:

| Component | Used on | Takes (props) |
|---|---|---|
| `PlanPicker`, `TermSwitch`, `CurrencySwitch` | pricing, onboard-plan, billing | `plans[]`, `term`, `currency`, `rates` — **prices come from the server** |
| `StoragePool` / `PoolAllocator` | onboard-mailboxes, admin-mailboxes, admin-mailbox | `poolGb`, `allocations[]`, `ceilingGb` — over-allocation guard is UX only; server re-validates |
| `DnsRecordRow` / `RecordTable` | onboard-records, admin-domain, ops-domains | `record{type,name,value,state,message,fix}` — states: `passing / needs_fix / waiting / missing` |
| `DomainSwitcher` | dashboard header | `domains[]`, `current` (server-side, not sessionStorage) |
| `MessageList`, `ReadingPane`, `FolderNav`, `Composer`, `RecipientChips` | webmail | message payloads from the mail API (§5.5) |
| `QrCode` | setup-device, onboard-done | `url` — render via a small QR lib, never an image from a third-party service |
| `Meter`, `StatTile`, `MetricTile` (ops) | everywhere | |
| `ReasonDialog` | every ops action | requires non-empty `reason`; posts it with the action |
| `SevRail` | ops tables | `severity` → `tr.sev-*` |
| `AuditTable`, `EmptyState`, `BusyButton` | dashboard, ops | |

### 4.4 Behaviour migration: where each `ziro.js` concern goes

| `ziro.js` concern | Port to | Notes |
|---|---|---|
| header scrim, nav toggle, mobile sheet height (`--mnav-h`) | `PublicLayout` + `useEffect` | |
| reveal-on-scroll (`[data-reveal]`, `[data-stagger]`) | `<Reveal>` / `useReveal` | **Keep the safety net**: content visible by default; opt-in class added by JS; 2.5 s fallback. Must also be correct under Inertia navigation (observers re-created per page) |
| counters, marquee, cycler, rail, word-rise, hand-drawn marks | `craft/*` components | honour `prefers-reduced-motion` |
| copy buttons, busy buttons, undo toast | `useCopy`, `BusyButton`, `useUndo` | |
| plan / term / currency price math | `Lib/pricing` *display only* + server-supplied quote | **Server is authoritative** for any amount that gets charged (§5.3). Client math is a preview |
| pool allocator, quota floor marker | `PoolAllocator` | same rule enforced server-side |
| DNS "verification" simulation | `usePolling` against `GET /domains/{id}/records` | the demo's fake transitions become real polling |
| compose chips, attach, autosave | `Composer` | autosave posts drafts to the API (§5.5) |
| sessionStorage domain choice | server session / Inertia shared prop | |
| hard-coded demo data in markup | **fixture module** `resources/js/fixtures/*` for the UI-only phase | lets step 1 run with no backend, then each fixture is swapped for a controller prop |

### 4.5 Rules for the port (so the UI phase does not create backend debt)

1. **No prices, plan names, limits or ceilings in JSX.** They come from a shared Inertia prop `plans` / `currency` (initially served from a config file, later DB). This is the cheapest way to keep conflict #1 reversible.
2. **Money as integer minor units** (kobo / cents) in props; formatting only in `Lib/money.js`.
3. **One Inertia page = one controller action.** Each page gets a typed props contract (documented with a JSDoc typedef beside the page, mirrored by a Spatie `Data` class on the backend later).
4. **Routes named like the screens** and referenced with Ziggy `route()` — no hard-coded `.html` or `/path` strings.
5. **Fixtures mirror real props.** Shape fixtures exactly as the future `Data` classes so swapping is a one-line change.
6. Every list/table has loading (`Skeleton`), empty (`Empty`), and error (`Banner`) states as `DESIGN.md` §6 requires. The static prototype already designs these; do not drop them in the port.
7. Keep per-record state variants **genuinely different** (`DESIGN.md` §6) — the DNS fixture must contain passing / needs-fix / waiting, not four identical rows.

### 4.6 Rendering strategy

- Authenticated surfaces (`/mailadmin`, `/mail`, `/ops`, `/onboarding`): client-rendered Inertia. No SEO value; `robots.txt` already disallows them.
- Public marketing + legal + help + pricing: SEO matters (the prototype carries canonical/OG/JSON-LD on each). Options: Inertia SSR (`ssr.jsx` + a Node process on the app host), or per-page `<Head>` tags only and accept client rendering. **Recommend: `<Head>` now, SSR later** — SSR adds an always-on Node process to operate for a one-person team. Revisit when organic search is a real channel.
- Webmail is the performance-critical surface (poor connections, phones). It gets its own code-split chunk, and later the offline-read service worker (OPTIONAL in scope).

### 4.7 SEO & static files

- `<Head>` component wraps title/description/canonical/OG/Twitter; a `JsonLd` helper replaces the 15 hand-pasted blocks.
- `sitemap.xml` generated from a route list (public routes only), not hand-maintained.
- `robots.txt` carried over; fix the paths to the real routes (the prototype's `.html` paths are placeholders).
- Prototype hot-links Unsplash photos. **Decision needed:** keep hot-linking (fast, but a runtime third-party dependency and a privacy-policy item) or download and self-host with licence notes. Recommend self-hosting.

### 4.8 UI-phase deliverable & verification

Definition of done for step 1:

- All 60 screens exist as Inertia pages behind real routes, fed by fixtures, no backend logic.
- Side-by-side visual diff against the static prototype at 390 / 768 / 1280 px passes for every screen (screenshot comparison, not eyeballing).
- No inline `<style>`, no `.html` links, no `data-*` hooks left that nothing reads.
- `npm run build` succeeds; Lighthouse accessibility ≥ the prototype's.
- Reduced-motion and JS-disabled pass: content readable, nothing hidden.

---

## 5. Backend architecture (step 2)

### 5.1 Layering (existing house style)

```
Route → FormRequest (extends BaseRequest) → Controller (extends BaseController)
      → Service (extends BaseService) → Repository (extends BaseRepository) → Eloquent Model
      → Spatie Data (outbound shape)         External calls via Integrations/ adapters
```

- Web (Inertia) controllers return `Inertia::render(...)`; `/api/v1` controllers return the `ApiResponse` envelope. They share Services.
- Integrations are interfaces with swappable drivers so tests never touch Mailcow, Paystack or SES:
  `MailServer` (Mailcow), `PaymentGateway` (Paystack), `MailRelay` (SES — config-driven, per scope §4), `DnsResolver`, `BlocklistChecker`, `BackupStore`.

### 5.2 Tenancy & authorisation

The scope calls tenant isolation "the defect that ends the company". Design for it structurally, not by remembering a `where`:

- **`organisation_id` on every tenant table**, enforced by a global scope on a `BelongsToOrganisation` trait. Controllers cannot opt out by accident; cross-tenant access requires an explicit `withoutOrganisationScope()` that is only allowed in the ops guard and is logged.
- **Three identity types**, kept separate rather than stuffed into `users`:
  - `users` — humans who sign in to the dashboard/ops (owner, admin, staff).
  - `mailboxes` — the mail accounts; webmail login authenticates against these.
  - `staff` — Ziroemail employees (ops). Separate guard, separate session cookie, mandatory 2FA.
- **Roles per organisation** via `organisation_user` pivot: `owner`, `admin`, `user`; **delegated access** as a separate `delegations` table (agency org → client org, scoped, expiring, revocable by the owner).
- Policies for every model; authorisation re-checked server-side on every request.

### 5.3 Data model (first cut)

```
organisations        id, name, owner_user_id, status, country, vat_no, created_at
users                id, name, email, password, two_factor_*, last_login_at
organisation_user    organisation_id, user_id, role
delegations          id, grantor_org_id, grantee_org_id, scope, expires_at, revoked_at

domains              id, organisation_id, name, verified_at, ownership_token, status
                     (pending → verifying → live → suspended), mailcow_state
domain_records       id, domain_id, type(MX/SPF/DKIM/DMARC/TXT), name, expected, observed,
                     state(passing/needs_fix/waiting/missing), last_checked_at, message
subscriptions        id, organisation_id, domain_id, plan_id, term, status
                     (active/past_due/suspended/cancelled), renews_at, grace_ends_at
plans                id, code, name, pool_gb, ceiling_gb, price_monthly_minor,
                     price_yearly_monthly_minor, currency prices, active
storage_addons       id, subscription_id, gb, price_minor, renews_at     (recurring annual)
mailboxes            id, domain_id, local_part, user_id?, quota_gb, status, last_login_at,
                     mailcow_id, setup_completed_at
aliases              id, domain_id, source, destination[], is_catch_all
forwarding_rules     id, domain_id, source, destinations[]
setup_tokens         id, mailbox_id, token_hash, expires_at, used_at

invoices             id, organisation_id, number, currency, subtotal, vat_minor, total, status
payments             id, invoice_id, provider, reference, channel(transfer/ussd/card/usd),
                     status, raw
virtual_accounts     id, organisation_id, provider_ref, bank, number
refunds              id, payment_id, amount, policy_calc json, status, approved_by[], reason
webhook_events       id, provider, event_id (unique), payload, processed_at   ← idempotency

sending_stats        mailbox_id, window_start, sent, bounced, complained       (rolling windows)
suppressions         id, address, reason, source, created_at
abuse_flags          id, mailbox_id, kind, severity, evidence json, state, locked_at, locked_by, reason
delivery_events      id, message_ref, mailbox_id, event(accepted/delivered/bounced/…), at
inbox_placement_runs id, provider, result, at
blocklist_checks     id, ip, list, listed, at
backups              id, taken_at, size, verified_restore_at

tickets / ticket_minutes     per organisation
audit_log            id, actor_type, actor_id, organisation_id?, action, subject, reason,
                     before/after json, ip, at   — append-only (no update/delete grants)
```

Money is stored as integer minor units with an explicit currency column. Prices live in `plans` (+ a currency table), edited without a deploy. Pricing rules from `DESIGN.md` §8 (one domain per plan, pooled storage, ₦100/GB/yr renewing add-on, yearly-term rate) become `PricingService` unit tests before any UI is wired to it.

### 5.4 Modules and the scope stages they cover

| Module | Responsibility | Scope stage |
|---|---|---|
| `Identity` | signup, login, email verification, 2FA (TOTP + recovery codes), sessions/devices, password reset, rate limits | §12, B |
| `Organisations` | org, members, roles, delegated access | D |
| `Domains` | ownership TXT, provider detection (MX lookup), record generation, DNS polling, go-live gate, scheduled re-checks | C |
| `Mailboxes` | create/suspend/delete, quota allocation inside the pool, aliases, forwarding, catch-all | D |
| `Provisioning` | the only code that talks to the `MailServer` interface; idempotent jobs with retries; reconciles Mailcow ↔ DB drift | A, D |
| `Billing` | plans, quotes, subscriptions, proration, invoices, VAT 7.5%, dunning, refund engine, price-review | F |
| `Payments` | Paystack: virtual accounts, USSD, card, USD; signature-verified webhooks, idempotent | F |
| `Deliverability` | SES event ingestion (SNS), suppression, thresholds, anomaly lock, sending caps, placement tests, blocklist checks | A, G |
| `DeviceSetup` | signed `.mobileconfig`, Android values, autodiscover/autoconfig endpoints, QR, setup-link resend | E |
| `Webmail` | mail API over IMAP/SMTP (§5.5) | B |
| `Migration` | IMAP import jobs with progress | C |
| `Ops` | org search, abuse queue, scoped suspension, refunds approval (two-person above ₦20,000), staff, reports | G |
| `Audit` | write-once log; every module calls it | §8, G |
| `Support` | tickets, time recording, WhatsApp/email links | G |
| `Status` | publishes component status to the independent status host | A |

### 5.5 Webmail API — the one genuinely hard backend piece

The React webmail needs a JSON API; Mailcow gives IMAP/SMTP/SOGo, not a REST mail API. Options:

1. **Laravel talks IMAP directly** (e.g. `webklex/php-imap`) from request handlers. Simple to start; PHP-FPM holding IMAP connections is slow and brittle at scale; search over IMAP is weak.
2. **Dedicated mail-gateway service** (small process holding pooled IMAP/SMTP connections, caching headers) behind Laravel's auth. Better performance, more to operate.
3. **Embed Roundcube/SOGo** — rejected: defeats the product (competitors' dated webmail is the thing Ziroemail wins against).

**Recommendation: start with (1) behind a `MailboxClient` interface, with a header cache table, and design the interface so (2) can replace it.** Measure before building the gateway; the scope's "search fast enough to be used habitually" requirement is the trigger. Use Dovecot's FTS (Mailcow ships it) for body search.

Safe HTML rendering is server-side: sanitise (allow-list), block remote images until allowed, rewrite links; never render raw message HTML in the app origin (render in a sandboxed iframe on a separate origin).

Webmail login authenticates the *mailbox* credential and issues a per-device Sanctum token (revocable, expiring), not a shared user session.

### 5.6 Cross-cutting

- **Queues:** Redis + Horizon (or `database` as a stopgap). Named queues: `provisioning`, `webhooks`, `dns`, `mail-events`, `default`. Each job idempotent.
- **Scheduler** (entries committed in `deployment/crontab.txt`, §8): DNS re-checks, blocklist checks, rolling-window rollups, renewal reminders, dunning steps, quota warnings (80 % / 95 %), backup verification, status publish, placement tests.
- **Webhooks** (`/webhooks/paystack`, `/webhooks/ses`): verify signature first, write to `webhook_events` (unique on event id), return 200, process async.
- **Rate limiting** on login, reset, verification, 2FA, webhook endpoints.
- **API docs:** L5-Swagger annotations on `/api/v1` controllers.
- **Testing:** PHPUnit; every integration has a fake driver; tenant-isolation tests run against every tenant model (a generated test that fails if a model lacks the scope).

---

## 6. Mail & infrastructure architecture (step 3)

### 6.1 Mail path

```
Inbound : Internet → Mailcow Postfix → Rspamd/ClamAV → Dovecot (per-mailbox quota)
Outbound: client/webmail → Mailcow SMTP submission (auth + per-account caps)
          → Postfix relayhost (SES SMTP, config set chosen per sender domain)
          → Amazon SES → recipient
Events  : SES → SNS → POST /webhooks/ses → suppression + stats + abuse rules
```

- Separate SES **configuration sets**: `ziro-system` (receipts, resets, our own notifications) and `ziro-customer`. A customer incident can never share reputation with our receipts.
- Hourly/daily caps per plan enforced in Mailcow (ratelimit) *and* mirrored in `sending_stats` for the anomaly detector.
- **Anomaly lock** is a scheduled job comparing a mailbox's current hour against its own rolling baseline; locking sets Mailcow to deny submission (**sending stops, receiving continues** — the UI copy depends on this being true).
- Per-customer DNS: Laravel generates SPF, DKIM (public key fetched from Mailcow), DMARC; Mailcow signs; SES identity per domain where required.
- Autodiscover/autoconfig served from the app host on `autoconfig.` / `autodiscover.` subdomains.

### 6.2 Environments

| Env | App | Mail | Notes |
|---|---|---|---|
| local | Laravel + Vite, SQLite/MySQL | fake `MailServer` driver | Step 1 and most of step 2 need nothing else |
| staging | separate host | second Mailcow or a mocked one | SES sandbox; Paystack test keys |
| production | app host | dedicated Mailcow VPS | pre-flight blocklist check on IP; SES production access applied for **now** (sandbox release is not instant) |

### 6.3 Backups & recovery

Daily encrypted off-server backups under a credential the mail host cannot read; application DB backed up separately. A restore drill is a **Gate 3 exit criterion** — "backup exists" is not accepted evidence. `ops-backups` shows last backup *and* last verified restore, fed by the `backups` table.

### 6.4 Config changes required before real work

- `QUEUE_CONNECTION=sync` → `redis` or `database` (`sync` runs provisioning inline in the request).
- `SESSION_DRIVER`/`CACHE_DRIVER` → redis in production.
- `.env.example` still has Pusher/Memcached placeholders and `BROADCAST_DRIVER`; replace with the real set (Mailcow API URL/key, SES region + config sets, Paystack keys, backup bucket).
- Region: SES Stockholm per the scope; confirm the data-residency note for the subprocessor register.

---

## 7. Security & compliance mapping

| Requirement (scope §12) | Where it lands |
|---|---|
| Hashed passwords, 2FA, token auth, rate limiting | `Identity` module; Sanctum per-device tokens; `RateLimiter` definitions |
| Server-side authorisation, tenant isolation | Policies + global scope + generated isolation test (§5.2) |
| Webhook signatures, payment tokenisation | Paystack signature check; no card data ever hits Laravel |
| Safe HTML rendering | Sanitiser + sandboxed iframe (§5.5) |
| Least privilege, access logging | Separate credentials per zone; `audit_log` incl. staff access to customer data |
| Secrets off the client | Only `VITE_*` public values in the bundle; verified in CI by grepping the build |
| Legal pack | UI already ships terms/privacy/AUP/refunds pages — content must be real, reviewed text before launch, not placeholder |

### 7.3 Status page

Hosted outside the stack. A scheduled job publishes component states to the external host; the in-app `Status` page reads the same JSON. Needs a separate provider, so it is an infrastructure decision, not a code one.

---

## 8. Deployment & operations (from the project's own rules)

- **Crontab:** append, never replace (`crontab -l > ct; cat new >> ct; crontab ct; crontab -l` and confirm untouched entries remain). Entries are kept in `deployment/crontab.txt` in the repo with an install comment. Required: `* * * * * php artisan schedule:run` plus the queue worker supervisor (Supervisor/systemd preferred over cron for the worker).
- **"Queued" is not "done":** after every deploy verify `jobs` drained, `failed_jobs` = 0, worker log moved, and for mail that SES accepted it. Ops console should expose queue age and failed-job count (already designed in `ops-queue`/`ops`).
- **Checks must be able to fail:** every monitor is tested against a known-bad case when added (a blocklist check that cannot return "listed" reads exactly like "clean").
- Second administrator + runbooks are Gate 3 items, not post-launch.

---

## 9. Phased delivery plan

| Step | Work | Exit check |
|---|---|---|
| **0** | Resolve §0 conflicts; install Boost; commit baseline | Decisions recorded in this doc |
| **1a** | Foundation: copy assets, base CSS, `app.jsx`/layouts/primitives, `Head`+SEO, Ziggy route map, fixtures | One public page pixel-matches the prototype |
| **1b** | Public site + system pages (14 screens) | Visual diff pass |
| **1c** | Auth, checkout, device setup, onboarding (≈19) | Visual diff pass; flows click through on fixtures |
| **1d** | Owner dashboard (11) | Visual diff pass |
| **1e** | Webmail (5) — mobile first | Visual diff pass on a real phone |
| **1f** | Ops console (14) | Visual diff pass |
| **2a** | Identity, orgs, tenancy, audit | Isolation tests green |
| **2b** | Domains + DNS + Provisioning against fake then real Mailcow | Go-live gate enforced |
| **2c** | Billing + Paystack | Test-mode end-to-end; webhook idempotency tests |
| **2d** | Deliverability, abuse, ops | Anomaly lock fires in staging |
| **2e** | Webmail API, device setup, migration | Gmail/Outlook/Yahoo placement tests |
| **3** | Infra hardening, backups + restore drill, status page, runbooks | Gate 3 |

Steps 1b–1f can proceed in parallel after 1a because every page depends only on layouts and primitives.

---

## 10. Decisions needed from you

1. **Pricing model** — per-domain pooled (UI, `DESIGN.md`) or per-seat (scope doc)? Assumed per-domain.
2. **Install Laravel Boost?** Project `CLAUDE.md` says to run `composer require laravel/boost --dev && php artisan boost:install` before application changes. It rewrites `AGENTS.md`/`CLAUDE.md`. I have not run it; say so and I will do it first.
3. **Commit `ziroemail/`?** It's untracked and contains ~840 KB of HTML, PDFs and logos. Keep it in the repo as design reference (recommended: move to `docs/design-source/`), or leave it out of git?
4. **Styling approach** — port `ziro.css` verbatim (recommended) vs. Tailwind rewrite.
5. **Photography** — self-host the Unsplash images (recommended) vs. hot-link.
6. **SSR for public pages** — defer (recommended) vs. now.
7. **Webmail backend** — direct IMAP behind an interface (recommended) vs. a gateway service from day one.
8. Confirm `onboard-plan.html` and `admin-storage.html` are live screens (they are not in `_screens.html`).
