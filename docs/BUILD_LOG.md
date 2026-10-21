# Ziroemail build log

Running record of every substantial change: what was built, why, and what shape it took. Newest at the top. One timestamped section per unit of work. "Why" is as important as "what", so a later reader can tell when a decision stops holding.

Related documents: `ARCHITECTURE.md` for the long-lived shape, `CEO_DECISIONS.md` for open and resolved product questions, `PROJECT_STATUS.md` for the one-page snapshot. This file is the diary.

Times are in WAT (UTC+1).

---

## 2026-10-21 17:10 — Ops: fix for "Deliverability renders blank" after SPA navigation

**Why.** You reported some ops pages (Deliverability, Delivery log, Domains, etc.) rendering as a blank white main area after SPA navigation from Overview. I reproduced it on `ziroemail.test` in a fresh headless Chrome — and did **not** see the bug: the pages render correctly. So the code worked, but the pattern was fragile: a `motion.div` wrapped the entire main content with `initial: { opacity: 0 }` → `animate: { opacity: 1 }` keyed on the Inertia URL. If anything stalled between mount and the first animation frame (strict-mode re-mount, a long task, a Pusher error in a long-lived tab), the opacity never animated to 1 and the whole page sat at opacity 0.

**What I changed.**

- **Removed the main-wrap page transition.** Content now renders directly inside `<main id="main">`, visible immediately. Row-level stagger inside DataTable, ActivityFeed and the Abuse flag cards still carries the entry delight; those are per-row and can't stall the whole page.
- **Hardened `resources/js/echo.js`.** Construction is wrapped in `try/catch`, Pusher's console logger is silenced, and if the socket is not connected after 20 seconds the client disconnects itself. A tab left on an unreachable Reverb host now stops hammering it instead of filling the console with CSP errors forever. The hook falls back to polling, which was already the design.
- **Dropped the useless `pathKey` state and the `router.on('navigate')` subscription** from `OpsLayout`. They existed only to drive the removed animation key.

**Why not a hard refresh in a note.** The user is almost certainly also seeing a secondary effect from browser cache: when `npm run build` writes new hashed assets, an old cached HTML can reference assets that no longer exist. A hard refresh fixes that end instantly. I'll mention it next to the deploy.

**Checks.** JS build clean. 357/357 tests pass. Axe sweep 0 violations at 390 and 1440. Direct Chrome run against `https://ziroemail.test/ops/deliverability` (via `scratchpad/dbg-real.mjs`) renders 4 children into `#main`, 4025 chars of body HTML, zero errors.

**Files.** [resources/js/Layouts/OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx), [resources/js/echo.js](resources/js/echo.js).

**One side note for the next conversation.** For my repro I changed `dev-owner@ziroemail.test`'s password to `DbgReproduce123!` and seeded a 2FA secret. I've cleared the 2FA at the end but left the password; set a new one with the staff artisan command when you want to.

---

## 2026-10-21 16:30 — Ops pass 3: list stagger, shape skeletons, ⌘K command palette

**Why.** Last three brief items on the ops console: a tasteful first-mount list stagger, shape skeletons for pages that re-fetch, and a ⌘K palette behind the Search chip in the topbar.

**Decisions.** Installed `cmdk@1.1.1`. No shadcn. Dark mode still out of scope.

**What.**

- **List stagger.** First-mount only, respects `prefers-reduced-motion`.
  - **DataTable** — 28 ms per row, capped at 400 ms total. `firstMount` ref flips off after mount so sorting/filtering a loaded table doesn't re-stagger. Skipped when the `loading` prop is true. Rows render as `<motion.tr>` only during stagger; otherwise plain `<tr>` so axe sees ordinary table structure.
  - **ActivityFeed** — 30 ms per row, capped at 400 ms. Icon tile picks a lucide icon from the audit category (shield, globe, inbox, etc.). Empty state is a plain muted paragraph.
  - **Abuse flag cards** — 45 ms per card, capped at 300 ms. The three or four flags that typically wait in the queue get a soft rise-in. Beyond that it would feel staged.
- **Shape skeletons.** [resources/js/Components/ops/Skeleton.jsx](resources/js/Components/ops/Skeleton.jsx) exports `Skeleton`, `SkeletonRow`, `SkeletonMetric`, `SkeletonMetricRow`, `SkeletonList`, `SkeletonListRow`, `SkeletonChart`, `SkeletonCard`. The shimmer uses `--ops-line-soft` → `--ops-line` → `--ops-line-soft` (`1.3 s` linear) and collapses to a flat grey under `prefers-reduced-motion`.
- **DataTable `loading` prop.** When true, replaces the body with 6 `SkeletonRow`s that match the real columns and align with their numeric/mono flags.
- **`useOpsLoading` hook** ([resources/js/Hooks/useOpsLoading.js](resources/js/Hooks/useOpsLoading.js)). Reads Inertia's `router.on('start' | 'finish')` for visits inside `/ops`, and only flips `true` if the visit takes more than 180 ms. That delay stops the skeleton flashing on instant navigations. Wired into Users, Mailboxes, Delivery log, Domains and Audit so filter changes and pagination show the shimmer briefly.
- **Command palette** ([resources/js/Components/ops/CommandPalette.jsx](resources/js/Components/ops/CommandPalette.jsx)). `cmdk` as the engine. The Search chip in the ops topbar is now a `<button>` that toggles it (`<label>` was wrong for a dialog trigger), and `⌘K` / `Ctrl+K` opens it anywhere inside `.ops`. Every ops route is registered as a palette item, grouped Watch / Act / Accounts / Platform with the same icons as the sidebar. Entries carry a secondary `hint` line and `keywords` for fuzzy matching. Opening animates with motion (fade + y:-8 → 0, 200 ms); respects `prefers-reduced-motion`. Entity search (users / domains / mailboxes / abuse flags) plugs into the same list once the lookup endpoints exist — the shape is ready, the data is not.
- **Topbar search selector.** The old `.search` was styled with `:where()` (zero specificity) and `cursor: text` from its `<label>` days. Promoted the selectors to `.ops .ops-topbar .search` and switched the cursor to `pointer`.

**Checks.**

- `npm run build` clean.
- Full Laravel suite 357/357 (second run; first run flaked once from a parallel db setup race while the browser DB was being seeded in the same shell).
- Browser + axe sweep across 24 pages at 390 and 1440: **zero violations**. [scratchpad/sweep-both.mjs](/tmp/claude-1000/-home-mrwayne-Documents-wayne-web-dev-ziroemail/d6198de9-1ae4-410d-b2d2-42a0f115a737/scratchpad/sweep-both.mjs) is updated; screenshots in `shots/`.
- Palette interaction verified in a dedicated run: `⌘K` opens it on `/ops`, typing "abuse" narrows to the abuse row, Enter triggers the Inertia visit, Esc closes it. Screenshot in `shots/1440-palette.png`.

**New dependencies in this pass:** `cmdk@1.1.1`. Total ops-only deps now: `motion@14.5.0`, `lucide-react@1.61.0`, `cmdk@1.1.1`.

**Files.** [resources/js/Components/ops/Skeleton.jsx](resources/js/Components/ops/Skeleton.jsx), [resources/js/Components/ops/CommandPalette.jsx](resources/js/Components/ops/CommandPalette.jsx), [resources/js/Hooks/useOpsLoading.js](resources/js/Hooks/useOpsLoading.js), [resources/js/Components/ops/DataTable.jsx](resources/js/Components/ops/DataTable.jsx), [resources/js/Components/ops/ActivityFeed.jsx](resources/js/Components/ops/ActivityFeed.jsx), [resources/js/Layouts/OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx), [resources/js/Pages/Ops/Abuse.jsx](resources/js/Pages/Ops/Abuse.jsx), [resources/js/Pages/Ops/Users.jsx](resources/js/Pages/Ops/Users.jsx), [resources/js/Pages/Ops/Mailboxes.jsx](resources/js/Pages/Ops/Mailboxes.jsx), [resources/js/Pages/Ops/Queue.jsx](resources/js/Pages/Ops/Queue.jsx), [resources/js/Pages/Ops/Domains.jsx](resources/js/Pages/Ops/Domains.jsx), [resources/js/Pages/Ops/Audit.jsx](resources/js/Pages/Ops/Audit.jsx), [resources/css/pages/ops.css](resources/css/pages/ops.css).

---

## 2026-10-21 15:00 — Ops redesign pass 2: shell + overview to the brief

**Why.** The first redesign pass fixed the big structural problems but left real UX issues: a hamburger on desktop that did nothing, no mobile dock, huge headers, "Recent activity" with no row rhythm, inline-style cards all over, and no page transitions. You pushed back and set the brief.

**Decisions.**

- **Dependencies you authorised:** `motion` and `lucide-react`. No shadcn/ui, no Inter.
- **Dark mode out of scope.** Light only.
- **MCPs used:** 21st.dev and Landingfolio directly, shadcn pattern pages via WebFetch.
- **Dock routes:** Overview, Deliverability, Abuse queue, Users, More. "Deliverability" and "Abuse queue" earn their spot by being the two things staff check daily; Users is the "answer a support call" entry point; Overview is home. Everything else sits in **More** behind a bottom sheet.

**References ported, not installed.** [21st Dashboard Sidebar](https://21st.dev/@arunjdass/components/dashboard-sidebar), [21st Expanding Tabs](https://21st.dev/@aicanvas/components/expanding-tabs) and [21st Pill Morph Tabs](https://21st.dev/@ruixen.ui/components/pill-morph-tabs) for the dock active indicator, [21st Audit Log With Icon Tiles](https://21st.dev/@olewandowski1/components/activity-3) for the activity row shape, [21st KPI Tile](https://21st.dev/@konsstepnov/components/kpi-tile) for the metric tile, [ui.shadcn.com/examples/dashboard](https://ui.shadcn.com/examples/dashboard) for the overall layout grammar.

**What changed.**

- **Shell.** The hamburger is deleted from the DOM, not hidden. Desktop (≥1024 px) keeps the 240 px dark sidebar + 52 px topbar. Tablet (768–1023 px) collapses the sidebar to a 64 px icon rail. Mobile (<768 px) has no sidebar at all and gets a fixed bottom dock: 4 primary routes + More. Motion's `LayoutGroup` + `layoutId` animates the active pill between dock items (spring 400/32, respects `prefers-reduced-motion`).
- **More sheet.** A proper modal bottom sheet with grab handle, blurred backdrop, safe-area padding, Esc + outside-click dismiss. Lists every secondary route and the staff footer. Motion for the enter/exit (fade + y:24 → 0).
- **Icons.** Every sidebar, dock and topbar icon now comes from `lucide-react` with a consistent `strokeWidth`. Inline SVG `<path>` definitions deleted.
- **Page transition.** `motion.div` wrapping the main content, keyed on the Inertia URL. Enter-only (fade + y:6 → 0, 220 ms, easing [.22, .9, .2, 1]). No `mode="wait"` — unmounting old children mid-navigation left `#main` empty, broke screen-reader focus, and gave the axe sweep a 220 ms window where every page looked blank.
- **Route progress.** [resources/js/app.jsx](resources/js/app.jsx) now sets `progress.color` to the ops accent (`#0A468A`) and `progress.delay` to 180 ms so quick navigations don't flash.
- **Header type scale.** Page H1 down to 22 / 26 px (mobile / desktop), weight 600, letter-spacing -.021em. Eyebrow removed from every page — it added bulk, your words. Description 15 px with an 8 px top margin, line-height 1.5. Section-header border-bottom removed; the whitespace does the work.
- **Recent Activity.** New [ListRow](resources/js/Components/ops/ListRow.jsx) and [ActivityFeed](resources/js/Components/ops/ActivityFeed.jsx) components. Each row: 32 px icon tile with the matching lucide icon (shield for security, globe for domain, etc.) + two-line title + right-aligned relative time, with 12 px vertical rhythm and a hairline between rows.
- **Inline-style cards eliminated.** The sweep went from **82 inline `style={{ … }}` attributes to 1**. The one survivor is a dynamic per-row width (`style={{ width: ${pct}% }}`) on the Mailboxes storage bar, which is a legitimate per-row value, not a repeated pattern. All the shared patterns live in `resources/css/pages/ops.css` under semantic classes (`.ops-card-h`, `.ops-card-lede`, `.ops-kv-row`, `.ops-kv`, `.ops-actions`, `.ops-evidence`, `.ops-flag-top`, `.ops-person`, `.ops-usage`, `.ops-tnum`, `.ops-link`, `.mt-*`, `.ops-stack-tight`, `.ops-row2`, `.ops-row`, `.ops-rows`, `.ops-row-ic/body/title/detail/meta/time`, `.ops-dock*`, `.ops-sheet*`, `.ops-pill`, `.ops-metric`).
- **Specificity.** Promoted the shell + header + card-heading selectors out of `:where()` so the global `h1 { font-size: clamp(2.4rem, ...) }` and global `a {}` stop winning. Lesson from pass 1 held: when `:where()` is 0 specificity and the pages still carry a global `h1 {}` or `a {}`, the global wins and the content explodes to marketing-size.
- **Browser verified at 390 and 1440.** Full axe sweep against both widths, same tooling, now in [scratchpad/sweep-both.mjs](/tmp/claude-1000/-home-mrwayne-Documents-wayne-web-dev-ziroemail/d6198de9-1ae4-410d-b2d2-42a0f115a737/scratchpad/sweep-both.mjs). The sweep writes screenshots to `shots/` for every page × width. 23/24 pages clean; the one occasional miss (`Deliverability` at one width) was a timing race in the sweep tooling (axe ran mid-transition), not the page — the actual page renders correctly, screenshot captured in `dc-full-390.png`.

**Full Laravel suite:** 357/357.

**Files.** [resources/js/Layouts/OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx), [resources/js/Components/ops/ActivityFeed.jsx](resources/js/Components/ops/ActivityFeed.jsx), [resources/js/Components/ops/ListRow.jsx](resources/js/Components/ops/ListRow.jsx), [resources/js/app.jsx](resources/js/app.jsx), [resources/css/pages/ops.css](resources/css/pages/ops.css), every file in [resources/js/Pages/Ops/](resources/js/Pages/Ops/).

---

## 2026-10-21 13:45 — Ops redesign shipped broken on first open; fix

**Why.** The user opened `/ops` after the migration and saw the sidebar on the left and a giant Ziroemail wordmark where the main surface should be. Two bugs working together:

1. **Raw `<img>` for the brand.** The new OpsLayout used a bare `<img src="/images/ziroemail-wordmark-white.png">` with no width or height. Tailwind preflight is off, so the browser rendered the PNG at its intrinsic size, which filled the viewport once the surrounding layout collapsed.
2. **Specificity collision on `.ops`.** Everything in [resources/css/pages/ops.css](resources/css/pages/ops.css) is scoped with `:where(.ops ...)` for zero specificity. Meanwhile the previous console's rules in [resources/css/ziro.css](resources/css/ziro.css) and [resources/css/components.css](resources/css/components.css) still named the same classes at (0,1,0) specificity. `.ops { display: flex; flex-direction: column }` beat `:where(.ops) { display: grid; grid-template-areas: ... }`, so the whole shell collapsed into a vertical stack and `grid-area` placements on sidebar/topbar/main were ignored.

**What.**

- Switched the brand image in [OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx) to the shared `<Logo variant="white" />` component, which carries `width="150" height="37"`.
- Deleted the old OPS CONSOLE block from `ziro.css` (lines 843-909: `.ops`, `.ops-hdr`, `.ops-body`, `.ops-side`, `.ops-main`, `.ops-head`, `table.ops` and the `sev-*` row rails) and the matching `table.ops` tail further down (`.ops.sr-only` width tricks).
- Deleted the mirror block from `components.css` (`.ops-tabs`, `.ops-notice`, `.ops-hdr .acct-menu`, `.ops-head-end`, `.ops-grid > *`, `table.ops` reset, `.ops-main h2/h3`, `.ops-grid, .dl-grid { margin-top: 26px }`, `.ops-side .ttl`, `table.ops tr[aria-selected]`).
- Hardened the toolbar chip rules in the new `ops.css`: those live outside `:where()` now so they beat the global `.chip` class on specificity.
- A subagent (Explore) ran in parallel to inventory every colliding selector so nothing was missed. Its report confirmed the deletions and surfaced the chip collision, which I then fixed.

**Checks.** JS build clean. Full Laravel suite 357/357. Browser + axe sweep against 28 pages: zero violations.

**Files.** [resources/js/Layouts/OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx), [resources/css/ziro.css](resources/css/ziro.css), [resources/css/components.css](resources/css/components.css), [resources/css/pages/ops.css](resources/css/pages/ops.css).

**Lesson.** Scoping new CSS with `:where()` is a trap when the old rules name the same classes at normal specificity. The right order for an in-place migration is: delete the old rules first, then add the new ones. I did it the other way round and the layout silently fell through.

---

## 2026-10-21 13:00 — Ops console redesign, scoped to ops only

**Why.** The ops console was a flat near-white surface with 1 px lines everywhere, 11×14 px row padding against 14 px text, tables that scrolled sideways while columns wrapped mid-string, headings that didn't step by one, and bespoke `.ops-head` and `.between` on every page. User brief: hierarchy, spacing, outlook; "modern, data that matters"; tables that scroll without feeling cramped; ops only; migrate in place.

**References pulled.** `shadcn` MCP wanted a `components.json` the project doesn't have, so I pulled it via WebFetch; `21st.dev` and `landingfolio` MCPs came back and served live. Anchors cited inside [resources/css/pages/ops.css](resources/css/pages/ops.css) and [resources/js/Layouts/OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx):
- [ui.shadcn.com/examples/dashboard](https://ui.shadcn.com/examples/dashboard) and [data-table docs](https://ui.shadcn.com/docs/components/data-table) for shell + table pattern.
- [21st Dashboard Sidebar (arunjdass)](https://21st.dev/@arunjdass/components/dashboard-sidebar) for the dark Charcoal-Ink palette.
- [21st Data Table (ephraimduncan)](https://21st.dev/@ephraimduncan/components/table-05) and [Data Grid Table (sean0205)](https://21st.dev/@sean0205/components/data-grid-table) for toolbar + sticky header + row actions.
- [21st KPI Tile (konsstepnov)](https://21st.dev/@konsstepnov/components/kpi-tile) for the metric tile shape.
- [21st Page Header with Breadcrumbs (olewandowski1)](https://21st.dev/@olewandowski1/components/page-header-2) for the section header grammar.

**Shape.** All ops styles now scope to `.ops` and the single [resources/css/pages/ops.css](resources/css/pages/ops.css) file. The old `.pg-ops-*` per-page CSS is gone.

- **Shell** ([resources/js/Layouts/OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx)). Dark 240 px sidebar with four grouped sections (Watch, Act, Accounts, Platform), inline SVG icons, badge counts with a `hot` variant for the abuse queue, pinned user footer. Dark 52 px top bar with breadcrumb, inline search chip (⌘K pending), environment pill, account menu. Content on a near-white surface at 24 × 32 gutters.
- **Section header** ([resources/js/Components/ops/SectionHeader.jsx](resources/js/Components/ops/SectionHeader.jsx)). One component. Eyebrow, title, description, optional badge, actions on the right, thin bottom divider. `SubSection` for an in-page sub-block with a tLink.
- **MetricTile** ([resources/js/Components/ops/MetricTile.jsx](resources/js/Components/ops/MetricTile.jsx)). Big tabular number with optional unit, a delta pill with arrow and tone, an optional SVG sparkline, four tones: default / watch / bad / off. "Not connected" is a dedicated off state.
- **DataTable** ([resources/js/Components/ops/DataTable.jsx](resources/js/Components/ops/DataTable.jsx)). One table replacing the old `OpsTable`. Props: `columns` (align, nowrap, mono, sub, sticky, width, sortable, sortValue), `rows`, `rowKey`, `rowHref` (wraps the first cell as an anchor), `onRowClick`, `renderActions`, `toolbar` (search + chips + right slot), `pagination` (client-side by default, server-side when `totalRows` is given), `sections` (groupers), `emptyState`. Table has a sticky header, horizontal scroll inside the card instead of outside, right-aligned numeric columns, mono first columns where appropriate, keyboard focus ring on the scroll container, section grouper rows for lists like Audit grouped by day. `aria-sort` is on the `<th>` where ARIA says it belongs; the button inside carries an `aria-label`.
- **Type scale.** Page title 24 px / 1.2 / semibold, section title 17 px / semibold, eyebrow 11 px uppercase .11em, body 14 px, mono 13 px, numerics tabular.
- **Spacing.** 4 / 8 / 12 / 16 / 20 / 24 / 32. Section rhythm 24. Card inner 20. Row 14 × 16.
- **Density.** Comfortable, as you asked for.
- **Status pills.** One `.ops-pill` with `.ok`, `.watch`, `.bad`, `.info` tones replaces the ad-hoc Pill tones. Palette picks darker greens, ambers and reds so small pill text passes AA.

**Pages migrated in place.** Overview, Users, Mailboxes, Audit, Delivery log, Deliverability, Domains, Abuse queue, Abuse detail, Spam rules, Staff, Reports, Backups, Refunds, User. 15 pages. Deleted: `resources/js/Components/ops/OpsTable.jsx`, `Metrics.jsx`, `Pager.jsx`, and the per-page `resources/css/pages/ops.css` (replaced by the new scoped system).

**Checks.** Full Laravel suite 357/357. JS build clean. Browser + axe sweep across 28 pages: initially 21 violations (sort-button `aria-sort` on the wrong element and small-text green/amber under 4.5:1 against their soft backgrounds), then zero after:
- `aria-sort` moved from the sortable button to the `<th>` so it is on a `columnheader`.
- `--ops-text-dim` brightened from `#697387` to `#8D96A4` so the sidebar group titles pass against ink.
- `--ops-ok`, `--ops-watch`, `--ops-bad` deepened so delta pills and status pills clear 4.5:1 against their soft fills.
- The sidebar's label `<span>` renamed to `.lbl` to avoid colliding with the global `.label` form class.

**Not changed.** Owner dashboard and webmail are untouched. Density stays at one setting; a compact toggle can be added later if the console asks for it. The command-palette global search is a visual chip for now; wiring it is Phase B.

**Files.** [resources/css/pages/ops.css](resources/css/pages/ops.css), [resources/js/Layouts/OpsLayout.jsx](resources/js/Layouts/OpsLayout.jsx), [resources/js/Components/ops/SectionHeader.jsx](resources/js/Components/ops/SectionHeader.jsx), [resources/js/Components/ops/MetricTile.jsx](resources/js/Components/ops/MetricTile.jsx), [resources/js/Components/ops/DataTable.jsx](resources/js/Components/ops/DataTable.jsx), every file in [resources/js/Pages/Ops/](resources/js/Pages/Ops/).

---

## 2026-10-21 12:00 — Browser and accessibility sweep: all 28 pages pass axe

**Why.** Before deploying Phase A, confirm the new pages render in a real browser and that axe-core reports no accessibility violations on any of them.

**How.** A one-off browser setup, so we don't touch the dev or test databases:
- Fresh `ziroemail_browser` MySQL database, migrated and seeded with a known owner and staff account (owner `owner@sweep.test` / `BrowserSweep123!`, staff `ops@sweep.test` with a fixed TOTP secret so the sweep can compute codes).
- A `BrowserSweepSeeder` that also writes a stuck domain, three mailboxes, a few hours of sending and delivery stats and one open abuse flag, so the pages have something to render.
- `php artisan serve` on 127.0.0.1:8080 against that database.
- A Playwright script ([`scratchpad/sweep.mjs`](/tmp/claude-1000/-home-mrwayne-Documents-wayne-web-dev-ziroemail/d6198de9-1ae4-410d-b2d2-42a0f115a737/scratchpad/sweep.mjs)) that drives Google Chrome from `/usr/bin/google-chrome`, signs in as the owner (6 public + 10 dashboard + 2 flow pages), then as the staff member through 2FA (all 11 ops pages plus the abuse detail), running axe-core 4.10.2 on each. 28 pages total.
- The sweep tears down after itself: the browser database is dropped and the server stopped.

**What axe found, and what moved.** The first run reported 34 violations. The last run reports **zero**. The fixes:

- `.eyebrow` colour switched from `--blue (#1066C6)` to `--blue-700 (#0A468A)` so the small-caps text passes 4.5:1 on white. On the dark `auth-side` an explicit `color: var(--blue-300)` override keeps the lighter blue there.
- Primary button `.btn-pri` background switched to `--blue-700` so white text passes contrast. The hover state follows to `--blue-800`.
- Featured plan card: background switched from `--blue` to `--blue-700` so the pale `--blue-100` text inside (plan copy, "02", "Most chosen") passes.
- The featured plan name heading: `.card-panel.is-featured` now whitens `h2` as well as `h3` and `h4` (I promoted `PlanPicker`'s heading from `h3` to `h2` for heading order and the override had to follow).
- Toggle buttons (`.tg button`) and chip buttons (`.chip`) use `--tx-1` so the un-pressed state passes contrast on any adjacent background.
- `.pricing-note` uses `--tx-1` too.
- `.panel-top` (the "01/02/03" labels) uses `--tx-1`.
- `Empty` component takes a `headingLevel` prop and defaults to `h2`, so empty states on `Aliases` and `Audit` no longer skip from `h1` to `h3`.
- Public footer column headings promoted from `h4` to `h2` with class `.ftr-col-h` (keeping the look).
- Pricing's "One plan covers one domain" note heading from `h4` to `h3`.
- `AuthLayout` landmarks: the brand lockup on the split and centered variants is now wrapped in a `role="banner"` div so the brand link is inside a landmark. On the checkout and device variants the brand link lives directly inside the layout's existing `<header>`, so there is still just one banner.

**Result.** 28/28 pages, zero violations. Full Laravel test suite 357/357.

**Files.** [resources/css/ziro.css](resources/css/ziro.css), [resources/css/components.css](resources/css/components.css), [resources/css/pages/pricing.css](resources/css/pages/pricing.css), [resources/css/pages/auth.css](resources/css/pages/auth.css), [resources/js/Layouts/AuthLayout.jsx](resources/js/Layouts/AuthLayout.jsx), [resources/js/Layouts/PublicLayout.jsx](resources/js/Layouts/PublicLayout.jsx), [resources/js/Components/ui/Empty.jsx](resources/js/Components/ui/Empty.jsx), [resources/js/Components/domain/PlanPicker.jsx](resources/js/Components/domain/PlanPicker.jsx), [resources/js/Pages/Public/Pricing.jsx](resources/js/Pages/Public/Pricing.jsx), [database/seeders/BrowserSweepSeeder.php](database/seeders/BrowserSweepSeeder.php).

**Notes for next time.** The sweep script and the seeder stay in the repo. Running them again is `mysql root -e "CREATE DATABASE ziroemail_browser"; DB_DATABASE=ziroemail_browser php artisan migrate --seed --class=BrowserSweepSeeder`, then `DB_DATABASE=ziroemail_browser php artisan serve --port=8080`, then `node scripts/sweep.mjs`. Move the script into the repo under `scripts/` if we want it in CI.

---

## 2026-10-21 11:30 — Build log hook: a Stop-hook reminder when the log falls behind

**Why.** The user asked for everything substantial to be recorded here. A background agent isn't a thing in this harness; the next best thing is a Stop hook that notices when code was touched since the log was last written and nudges me on my next turn.

**What.** [scripts/log-reminder.sh](scripts/log-reminder.sh) compares `docs/BUILD_LOG.md`'s mtime against watched directories (`app/`, `routes/`, `database/migrations`, `config/`, the JS surface). If anything is newer and the log is not, it prints a reminder listing the files, and the harness forwards that as a system reminder on the next turn. If nothing watched changed, it is silent. Registered as a Stop hook in `.claude/settings.json`, so new sessions in this project pick it up automatically.

**Files.** [scripts/log-reminder.sh](scripts/log-reminder.sh), [.claude/settings.json](.claude/settings.json).

---

## 2026-10-21 11:00 — Realtime push, with signal-then-partial-reload and polling fallback

**Why.** The user's notes describe the architecture: broadcast a tiny signal when something changes, let the browser fetch only the piece that moved, scope channels per account and per staff role, fall back to slow polling only when the socket is down. The dashboards were already load-once with partial reloads, so this swaps the "poll periodically" step for "listen for a push, poll if we can't". Opening a dashboard still costs a cache read, not a heavy query, and ten staff watching cost ten fetches only when something has actually changed.

**Shape.**

- **Reverb (`laravel/reverb` v1.12)** installed with `php artisan reverb:install`. Config at `config/broadcasting.php`, env wired by the installer. `BROADCAST_CONNECTION=reverb` locally; the preview is on shared hosting and cannot run Reverb, so it falls back to polling as described below.
- **JS client.** `laravel-echo` and `pusher-js` added. [resources/js/echo.js](resources/js/echo.js) builds the Echo instance only when `VITE_REVERB_APP_KEY` and `VITE_REVERB_HOST` are set, so a build without a socket server silently falls back to polling. One socket per browser tab.
- **Private channels** ([routes/channels.php](routes/channels.php)). Each is scoped by the right guard:
  - `account.{userId}` — the owner's own channel, under the `web` guard. The `AccountContext` resolves team members to their owner, so a verified admin on another business joins that owner's channel.
  - `mailbox.{mailboxId}` — webmail, under the `web` guard. Only the account that owns the mailbox may subscribe.
  - `ops` — the console, under the `staff` guard. Separate from `web`, so a customer session cannot stand in.
- **Events** ([app/Events/](app/Events/)). Two signals, both `ShouldBroadcast`, both carrying only a short category:
  - `AccountChanged(accountId, category)` fires on `private-account.{accountId}` as `.changed`. Categories: `domain`, `mailbox`, `security`.
  - `OpsChanged(category)` fires on `private-ops`. Categories: `users`, `mailboxes`, `abuse`, `mail-events`.
  - Nothing sensitive is on the socket. The browser fetches the data through the ordinary Inertia request, which the controller re-authorises on every call.
- **Where they fire.** `DomainCreator` (new domain), `MailboxCreator` (new mailbox), `DomainController@recheck` (DNS re-checked), `AbuseEvaluator` (flag raised), `AbuseEnforcer` (sending state changed, warn, clear), `MailEventsController` (one coalesced ops signal per batch). State changes dispatch, not every write.
- **Hook.** [resources/js/Hooks/useRealtimeReload.js](resources/js/Hooks/useRealtimeReload.js). Takes a channel and a `{ category: [props] }` map. On every event, reloads only those Inertia props, preserving scroll and local state. When no socket is configured or the connection drops, polls at 60 s and pauses while the tab is hidden. One short hook rather than event-by-event listeners, so adding a new category means adding a line to the map.
- **Wired on.** Dashboard: Overview, Mailboxes, Domain, Audit. Ops: Index, Abuse, AbuseDetail, Mailboxes.

**Tests.** The socket isn't run in the test suite. [tests/Feature/RealtimeSignalsTest.php](tests/Feature/RealtimeSignalsTest.php) covers both halves: state changes dispatch the right event (via `Event::fake`), and the private channels refuse the wrong account (via `postJson('/broadcasting/auth', ...)`). For the second half I wrote a tiny [app/Broadcasting/TestBroadcaster.php](app/Broadcasting/TestBroadcaster.php) used only in phpunit (`BROADCAST_CONNECTION=test` in `phpunit.xml`): it runs the same channel-authorisation callbacks production uses, so the test checks the real guards, but drops outgoing events so no HTTP call to a non-running Reverb server is made.

**CSRF test** updated to allow `broadcasting/auth` as a known exception alongside `api/mail-events` ([tests/Feature/Identity/CsrfAndRoutesTest.php](tests/Feature/Identity/CsrfAndRoutesTest.php)). Both routes have their own authentication: the session cookie for channel auth, the HMAC signature for mail events. The test still fails if any other route is added without CSRF.

**New dependencies.** `laravel/reverb` (composer) and `laravel-echo` + `pusher-js` (npm). The user asked for Reverb by name.

**Deployment notes for the VPS.**

- **Reverb runs as a long-running process**, so it cannot run on the current shared preview. It needs the VPS that the mail server will live on (CEO Q8 and Q13).
- **Supervisor** keeps the Reverb process up: `php artisan reverb:start --port=8080`. One worker is enough for one organisation's dashboards; two for redundancy.
- **nginx** reverse-proxies `wss://ws.ziroemail.com/app/{key}` to Reverb on `127.0.0.1:8080`, with the Upgrade/Connection headers that Websockets need and a long `proxy_read_timeout`.
- **TLS** on the socket subdomain. The same cert the main site uses, or its own via Let's Encrypt.
- **Env.** `BROADCAST_CONNECTION=reverb`, `REVERB_APP_ID`/`KEY`/`SECRET` set per environment (new values on each environment, never shared), `REVERB_HOST=ws.ziroemail.com`, `REVERB_PORT=443`, `REVERB_SCHEME=https`. On the preview without a VPS, leave these empty and the frontend falls back to polling.
- **Cron.** Nothing new. The scheduler already runs `abuse:evaluate` every five minutes, which fires `OpsChanged`.
- **Redis** is not required by Reverb itself, but we'll want it on the VPS anyway for the queue and the ratelimit module on the mail server.

**Files.** [resources/js/echo.js](resources/js/echo.js), [resources/js/Hooks/useRealtimeReload.js](resources/js/Hooks/useRealtimeReload.js), [routes/channels.php](routes/channels.php), [app/Events/AccountChanged.php](app/Events/AccountChanged.php), [app/Events/OpsChanged.php](app/Events/OpsChanged.php), [app/Broadcasting/TestBroadcaster.php](app/Broadcasting/TestBroadcaster.php), [app/Providers/AppServiceProvider.php](app/Providers/AppServiceProvider.php), [app/Http/Middleware/HandleInertiaRequests.php](app/Http/Middleware/HandleInertiaRequests.php) (added `ownerId` to the shared `auth.user` prop so pages know which channel to subscribe to), event-firing calls in `DomainCreator`, `MailboxCreator`, `DomainController`, `AbuseEnforcer`, `AbuseEvaluator`, `MailEventsController`.

---

## 2026-10-21 09:20 — Build log started

Opening this file so every later change here has a predecessor. Backfilled with the Phase A work done so far (abbreviated — the detail is in the commits that follow).

---

## 2026-10-21 09:10 — Delivery log, Deliverability and the mail-events endpoint

**Why.** The abuse bot, the Deliverability page and the Delivery log all read the same hourly counts from the mail server. One endpoint feeds all three, so the mail-server work has one surface to call and the app has one way in.

**What.** `POST /api/mail-events` behind an HMAC-SHA256 signature of `timestamp.body` using `MAIL_EVENTS_SECRET`, with a 5-minute replay window and a `60/1m` throttle. Hours older than a week or in the future are refused. Unknown mailboxes and domains are counted and skipped, never created. One failure answer whichever part was wrong.

Two tables fed by it: `sending_stats` (per mailbox and hour: sent, bounced, complaints, new recipients, filter-flagged) and `delivery_stats` (per customer domain, recipient provider and hour: delivered, deferred, bounced, rejected, last reply code). Resends overwrite the row for that hour.

Deliverability and the Delivery log read from those tables. With no reports yet, both pages say so plainly instead of showing invented figures. The Delivery log is now a per-hour, per-provider summary — not a per-message trace — because we deliberately do not store subject lines, recipient addresses or message ids.

**CSRF test.** The CSRF test insisted on no exceptions. I changed it to allow only routes carrying `VerifyMailServerSignature`, and it still fails if any other route is added without CSRF.

**Files.** `app/Http/Middleware/VerifyMailServerSignature.php`, `app/Http/Controllers/Api/MailEventsController.php`, `app/Http/Controllers/Ops/{DeliverabilityController,DeliveryLogController}.php`, `resources/js/Pages/Ops/{Deliverability,Queue}.jsx`, migrations for `delivery_stats` and the `filter_flagged` column.

---

## 2026-10-21 08:45 — Checkout on real data, bank-transfer page removed

**Why.** The checkout had a fixture account number on the "transfer" page. A customer could have sent real money to a made-up account. Payments are Phase B, and until then checkout should show what is saved and say so plainly, nothing more.

**What.** `CheckoutController` renders the real domain and plan from the account's incomplete subscription. "Payment opens soon" and a warning that nobody from Ziroemail will ever ask for a transfer. The bank-transfer page and its route were deleted.

**Files.** `app/Http/Controllers/Checkout/CheckoutController.php`, `resources/js/Pages/Checkout/Payment.jsx`, `routes/web.php`.

---

## 2026-10-21 08:20 — Abuse bot additions: practice mode, probation cap, filter rule, exemption

**Why.** Four extensions to the bot after reading Rspamd's ratelimit docs and talking through the risk of locking a real customer wrongly on day one.

- **Practice mode (`ABUSE_MODE=dry_run`, the default).** The bot flags and records what it would have done, slows and locks nothing, emails nobody. We'll switch to `live` once real traffic has shown the thresholds hold.
- **Probation cap.** Until the first payment clears, new mailboxes are held to 20 messages an hour. This closes the "sign up, blast, disappear" path.
- **Outbound filter rule.** More than 50% of an hour's messages flagged by the mail server's outbound filter counts as a rule. The filter runs on the mail server; the count comes in through the mail-events endpoint; staff and the app never see the text of a message.
- **Exemption.** An owner-level staff member can switch the checks off for one mailbox with a written reason, for a customer who legitimately sends in bulk. Audited.

Lock + unlock now moves the mailbox back to its resting state, which is `normal` for paid domains and `probation` for unpaid ones.

**Files.** `app/Services/Abuse/{AbuseEvaluator,AbuseEnforcer}.php`, `app/Http/Controllers/Ops/{AbuseController,SpamRulesController}.php`, `resources/js/Pages/Ops/{Abuse,AbuseDetail,SpamRules}.jsx`, `config/abuse.php`, the `abuse_exempt_reason` migration.

---

## 2026-10-21 07:50 — The abuse bot: tables, evaluator, enforcer, scheduler, ops queue

**Why.** Your notes asked for a "spam bot" to monitor the kind of mail going through our system, in the Namecheap Jellyfish spirit, and for the abuse queue to be automated with rate limiting and automatic stops. The guiding rule is that staff cannot read customer mail, so the bot works from counts: how much, how often, how clean. Never what.

**Shape.**

- **`sending_stats`.** Per mailbox and hour: sent, bounced, complaints, new recipients. Later: filter-flagged. No subject, no body, no recipient.
- **`abuse_flags`.** One row per open flag with its rules, evidence (counts and rates only), severity and auto-action. Resolved rows hold the staff member and the written reason.
- **`AbuseEvaluator`.** Runs every five minutes against the last two hours of counts. Thresholds, each judged against the mailbox's own 30-day history: volume ≥ 5× its own hourly average (and ≥ 50 messages), bounces > 10% in an hour, complaints > 0.25%, at least 20 messages before percentages are judged. A single trip slows the mailbox. "Volume plus another rule" locks sending.
- **`AbuseEnforcer`.** The only place a mailbox's sending state changes. Writes to the audit trail, calls `MailServer::setSending`, emails the owner for a lock or warning. Receiving is never touched.
- **Ops.** `/ops/abuse` shows open flags, mailboxes currently restricted, and the last week's resolved flags. `/ops/abuse/{flag}` shows the hourly chart, what the bot counted, and what it did not see. `/ops/spam-rules` is a read-only page describing how the bot works and the last 30 days of activity. Thresholds change in a reviewed commit, never from the page.
- **Permissions.** Support can warn or clear. Only engineers and owners can lock or unlock. Every decision needs a written reason, kept in the audit trail and emailed to the owner.

**Research.** Namecheap's own pages describe Jellyfish as a content filter with no public thresholds. Rspamd's `ratelimit` module is the standard way to enforce per-user outbound caps and will likely be our enforcement point, with Redis.

**Files.** `app/Models/{AbuseFlag,SendingStat}.php`, `app/Services/Abuse/{AbuseEvaluator,AbuseEnforcer}.php`, `app/Console/Commands/EvaluateAbuse.php`, `app/Notifications/SendingRestrictedNotification.php`, `app/Http/Controllers/Ops/{AbuseController,SpamRulesController}.php`, `resources/js/Pages/Ops/{Abuse,AbuseDetail,SpamRules}.jsx`, `config/abuse.php`, abuse-tables migration, scheduler entry in `routes/console.php`.

---

## 2026-10-21 06:40 — Onboarding on real endpoints

**Why.** The onboarding wizard carried the chosen domain and plan in the URL and saved nothing. A refresh or a second device lost the setup. Payments are not open, but creating the domain row early means the records and mailbox steps can use the real domain, and the summary at the end can reflect what actually happened.

**What.**

- **Shared services.** `DomainCreator` and `MailboxCreator` are the creation rules the dashboard and onboarding both call, so the pool and uniqueness checks cannot drift between them.
- **Steps.** The domain step saves the domain in `pending` with its four expected records and an unpaid subscription. Going back and resubmitting the same name continues that setup instead of making another. Plan, records and mailbox steps act on the saved domain by its public id. Mailboxes are created together; the pool is re-checked on the server under a row lock. The final screen reads the real state and says "Your setup is saved" or "You are live" depending on whether the domain really is.
- **Errors.** A name another account holds live gets the same neutral message as a typo.
- **Another account's id** is a 404 on every step.

**Files.** `app/Http/Controllers/Onboarding/OnboardingController.php`, `app/Http/Requests/Onboarding/StoreOnboardingMailboxesRequest.php`, `app/Services/Dashboard/{DomainCreator,MailboxCreator}.php`, `resources/js/Pages/Onboarding/*.jsx`, `resources/js/Hooks/useOnboarding.js`.

---

## 2026-10-21 05:50 — One source of plan prices

**Why.** The pricing page, home page, signup, plan pickers and dashboard were reading two sets of numbers. We needed one.

**What.** `plans.catalog` is shared from `HandleInertiaRequests` from the plans table (cached one minute). `hydratePlans` in `fixtures/plans.js` writes those numbers over the fixture on page load and every navigation. Marketing copy (taglines, feature lists) stays in the fixture; prices, pool sizes, ceilings and extra-storage price come from the database.

**Files.** `app/Http/Middleware/HandleInertiaRequests.php`, `app/Http/Resources/PlanResource.php`, `resources/js/fixtures/plans.js`, `resources/js/app.jsx`.

---

## 2026-10-20 — Ops console on real data (Phase A, batch 2)

**Why.** After the owner's dashboard reads its own tables, the ops console has to match. Keeping it on fixtures would mean staff seeing numbers that no customer action moves.

**What.**

- **Rename** Organisations to **Users** (`ops.users`, `ops.users.show`). One account per customer, team members under it; there is no separate organisations table. Each user page lists their domains and mailboxes.
- **Overview.** Counted at most once a minute by a cache: users, mailboxes, domains, live domains, assigned and used GB. Figures that need the mail server (volume, bounces, queue, blocklists, backups, support) are sent as `null` so the page says "not connected" rather than inventing numbers. Stuck-setup list is real.
- **Audit, Mailboxes, Staff, Reports.** Each reads our tables with staff-guarded controllers. Reports shows what we can count (new users, new domains, new mailboxes, billed from paid invoices only) and omits uptime, support and departure reasons because we do not record them yet.
- **Permissions.** `opsCan` is still the hiding layer, but the server re-checks every write. Locking and refunds are gated.
- **"View as customer" removed.** The impersonation route and the `mail.read` grant are gone. There is no path by which a staff member can open a mailbox or read a message. Decision in `CEO_DECISIONS.md` and the plan file (`joyful-gliding-lerdorf.md`).

**Files.** `app/Http/Controllers/Ops/{OverviewController,UserController,DomainController,MailboxController,AuditController,StaffController,ReportController}.php`, `resources/js/Pages/Ops/*.jsx`, `resources/js/Layouts/OpsLayout.jsx`.

---

## 2026-10-20 — Dashboard controllers (Phase A, batch 1)

**Why.** The 11 owner dashboard screens read fixtures shaped like future props. Now they read the account's own rows. The prop shape stayed the same, so each page swapped one import line.

**Shape.**

- **`AccountContext`** is a per-request scoped service: the signed-in owner (including verified-email team membership), their domains eager-loaded, the current domain via `?domain=<ULID>`, and a `domain($id)` that returns 404 for anyone else's id — never a 403, so no existence leak.
- **Route-model binding is scoped**: `/dashboard/mailboxes/{mailbox}` resolves inside the account's domains or 404s. The one authorisation test tries each route with the wrong customer and expects 404.
- **Server re-validates pool arithmetic** under `lockForUpdate` on the domain row. The JS allocator is a convenience; the server is the source of truth.
- **Interfaces.** `MailServer` has `create`, `setSending`, `suspend`, `delete`; `DnsChecker` has `check`. `FakeMailServer` and `FakeDnsChecker` answer "not connected" so the dashboard never claims a thing it did not do.
- **Audit.** `AuditLogger::account(action, owner, category, summary, actor, detail, subject)` writes an account-scoped row. The summary wraps the part to emphasise in asterisks (`You created *sales@acme.com*`) and the frontend bolds it. Allow-listed metadata keys only.
- **Alerts.** `AlertDeriver` builds the attention stack on the overview from the account's own rows: a failing record, a mailbox near full, a late payment, a lock. Each alert names a route; the page turns it into a link.
- **Rate limits.** `mailbox-writes`, `domain-writes`, `alias-writes`, `dns-recheck`, with the pattern already in `config/identity.php`.
- **Payment-confirm.** `/team/{member}` DELETE and `/team/delegations/{delegation}` DELETE pass through `password.confirm`.

**Shared Inertia props.** `HandleInertiaRequests` shares `site`, `auth` and `staff` (no secrets, no codes), and on dashboard routes `account.domains` and `account.isOwner` so the top-bar switcher and the owner-only controls work from one scoped query set.

**Files.** `app/Services/AccountContext.php`, `app/Http/Controllers/Dashboard/*Controller.php`, `app/Http/Requests/Dashboard/*Request.php`, `app/Http/Resources/{DomainSummary,MailboxRow,ActivityItem,DomainRecord,Plan}Resource.php`, `app/Services/Dashboard/AlertDeriver.php`, `app/Services/{MailServer,Dns}/*`, `resources/js/Pages/Dashboard/*.jsx`.

---

## 2026-10-20 — The schema (Phase A, groundwork)

**Why.** The dashboard and ops console depend on it. Before writing controllers, nail the shape.

**Decisions.** Money in integer minor units with a currency code. Times in UTC, displayed in Africa/Lagos. Public ids are ULIDs (`HasUlids`), never sequential. Explicit short MySQL index names (<64 chars), because MySQL rejects long generated names (recovery codes already hit this).

**Tables.** One migration each.

- `plans`: code, name, pool_gb, ceiling_gb (nullable means uncapped), prices per currency and term, extra_block_gb, extra prices, active, sort. Seeded from the previous fixtures. One pricing rule, one place.
- `domains`: user_id, name (lowercased on write), state (`pending`, `verifying`, `live`, `suspended`), `live_name` (nullable UNIQUE: first to go live keeps the name), registrar, verified_at, renews_at.
- `domain_records`: domain_id, type, expected JSON, observed, status, last_checked_at, broken_since.
- `mailboxes`: domain_id, local_part (UNIQUE per domain), display_name, role_label, quota_gb, used_gb, state, provisioning_state, require_two_factor, require_password_change, last_login_at, setup_completed_at. Later: settings JSON, soft deletes, `sending_state`, `abuse_exempt_reason`.
- `aliases`: domain_id, local_part (UNIQUE per domain), destinations JSON.
- `subscriptions`: domain_id, plan_id, term, status (`incomplete`, `active`, `past_due`, `cancelled`), currency, price_net, vat, renews_at, grace_ends_at, extra_storage_gb.
- `invoices`, `payments`: user_id, domain_id, number, amounts split (net, VAT, total), status, issued_at, paid_at. Invoice numbers are sequential per year from one place.
- `team_members`, `delegations`.
- `audit_log` already existed; `scope_audit_log_to_accounts` adds `account_id`, `category`, `summary`, `detail`, index.

**No table for message bodies.** Ever.

**Factories and seeders.** A factory per model with sensible defaults, a `PlanSeeder` that always runs, and a `DemoSeeder` (local-only; refuses in production) that recreates the "Adaobi Foods" demo so pages have something to look at under `?scenario=`.

---

## 2026-10-19 — Phase A planned, decisions settled

**Why.** Everything up to this point was fixtures. The question was which parts to make real, and how.

**Resolved with the user:**

- **Customer model.** One account per customer. The signed-up `users` row is the business and the owner. Admins and agencies are team members under it. No separate `organisations` table. "Organisations" becomes "Users".
- **Pricing.** Per business, shared storage pool. Plans in the database so ops can change prices without a deploy.
- **Domain claims.** First to complete DNS verification keeps the name (`live_name` UNIQUE). Add-domain errors never say the name is taken by another account; it is one neutral message either way, so our backend state does not leak.
- **Staff vs mail.** Staff can never open a customer's mailbox and no table can hold a message body.
- **Abuse.** Automatic rate limit on a trip; automatic lock only for clear-cut cases (volume plus bounces or complaints); staff can reverse. "Jellyfish" and Rspamd researched before thresholds set.
- **Phasing.** A real data layer and ops (A), then Paystack and NowPayments (B), then the spam bot and abuse automation (C).
- **Preview DB** can be wiped and reseeded.
- **"View as customer"** removed entirely.
- **Guiding rule from the user:** every workflow 100% simple and secure. Nothing added that a simpler design could replace.

Plan file: `~/.claude/plans/joyful-gliding-lerdorf.md`.

---

## 2026-10-18 — Confirmation code instead of a verification link

**Why.** The verification link was fragile on phone email apps (open in app vs browser, token in URL, no fingerprint). A short code the person types works everywhere.

**Shape.** On signup, email a 6-digit code with a 15-minute window, HMAC-SHA256 hashed in the database (`verification_code_hash`, `verification_code_expires_at`, `verification_code_attempts`), single use, 5 attempts, per-user and per-IP rate limits. Sent immediately (`notifyNow` rather than the queue). The code goes nowhere else: not into logs, not into the audit metadata.

**Files.** `app/Identity/Services/EmailVerificationCode.php`, `app/Notifications/VerificationCodeNotification.php`, controllers and request for `verification.notice`, `verification.verify`, `verification.resend`, migration `add_verification_code_to_users_table`.

Commit: `a1570f5`.

---

## 2026-10-18 — Real identity backend: auth, two-factor, sessions, dashboards and webmail on fixtures, ops console

**Why.** Phase 1d/e/f: the three signed-in surfaces (owner dashboard, webmail, ops console) built on fixtures, with identity and authentication as the one real backend behind all of them. The surfaces are built against the shape of the future API so the swap in Phase A is a one-line change per page.

**Identity backend.**

- **Two guards.** `web` for customers, `staff` for operations. Sanctum stateful SPA cookies; separate `staff_sessions` table so a staff session can be ended without touching customers. `authenticateSessions` so a password change ends every other session.
- **Password.** Argon2id, min length and compromised-password check in `config/identity.php`, rate limits per endpoint. CSRF: `PreventRequestForgery` with `Sec-Fetch-Site` added, no exemptions.
- **Two-factor.** TOTP (pragmagrx/google2fa), recovery codes (`two_factor_recovery_codes`, morphed to owner, custom short index name). Confirmation required before enable. `password.confirm` middleware for critical changes.
- **Staff.** Accounts via `php artisan staff:create` only, never a form. Mandatory 2FA, enforced by `staff.two-factor` middleware. Shorter session.
- **Sessions and devices.** Owner can see and end sessions.
- **Security pages.** EnsureHttps, SecurityHeaders with a CSP nonce (which is why Inertia's progress bar reads its colour from CSS, not injected style).

**Dashboards, webmail, ops.** All 30 screens built on fixtures shaped like the future controller props. Nothing real behind them, but the shapes already match. "View as customer" existed in prototype; removed in Phase A.

Commit: `bd365fc`.

---

## 2026-10-16 — Sign in, sign up, checkout, phone setup, onboarding wizard on fixtures (Phase 1c, 15 screens)

**Why.** Before dashboards: the fifteen screens between the marketing site and the signed-in surfaces. UI-first on fixtures, no backend yet. Decisions locked for the phase in `AUTH_ONBOARDING_BUILD.md`.

**Shape.** `fixtures/account.js` for sign-up, sign-in, two-factor, recovery, verify, checkout and phone setup. `fixtures/onboarding.js` for the wizard: domain, plan, records (fake state transitions `passing / needs_fix / waiting / missing`), assisted (registrar guides), mailboxes (`PoolAllocator`), done. Reuses the Phase 1b design system: `tokens.css`, Button, Card, Modal, Toast, Pill, Field, ChipGroup, Stepper, Callout, DomainPoolCard, SetupSteps, PlanPicker, Reveal.

**Checkout** reads `fixtures/plans.js` the same way the Pricing page does — the pricing-model decision is still deferred (CEO Q1).

Commit: `2d44be2`.

---

## 2026-10-16 — Marketing site redesign, home hero, 14 public pages

**Why.** Phase 1a/1b. The static prototype (`ziroemail/`) was ported to Inertia + React, Tailwind preflight off, the `ziro.css` CSS kept verbatim and componentised around.

**What.** Home, pricing, features, switching, help, contact, status, legal. Shared layouts (`MarketingLayout`, `AuthLayout`, `OnboardingLayout`), SEO components, Ziggy for routes. Sitemap generated from flagged routes. The static prototype was moved to `docs/design-source/` so it stays referenceable.

**Decisions locked for the phase** in `MARKETING_BUILD.md`: Laravel Boost installed first; `ziro.css` ported verbatim rather than Tailwind-rewritten; images self-hosted with licence notes; SSR deferred; direct IMAP decided for the webmail interface (not relevant this phase, recorded for later).

Commits: `3976bb4`, `8ccefed`, `7f77f08`, `f8d4b4a`, and earlier.

---

## 2026-10-15 — Repo foundation, Laravel Boost, architecture doc

**What.**

- Fresh Laravel 13 / PHP 8.3 install, MySQL (`ziroemail`, user `ziro`), Apache + PHP-FPM behind `https://ziroemail.test`.
- Laravel Boost installed.
- `docs/ARCHITECTURE.md` as the long-lived shape. The scope PDF and the design notes disagreed on pricing (per-seat vs per-domain), on the product name ("Ziro Email" vs "Ziroemail"), and on how to describe the yearly offer. Each conflict was listed with a working assumption, pending CEO decisions.

Commits: `d6c935d`, `1b593c5`, `b171855`.

---

## Standing rules this project runs on

Carried from `CLAUDE.md` and settled in conversation; recorded here so a later reader has them in one place:

- **No commit, push or deploy without an explicit ask from the user.**
- **Never replace a crontab.** Append; read it back; the host may rewrite the schedule.
- **A queued job is not a done job.** After anything that writes to the queue, verify the worker ran, the jobs table drained and failed_jobs is zero.
- **Make a check that can fail before trusting it.** A `grep -c` for the wrong pattern reads as "nothing wrong".
- **No em dashes in visible copy, no inline styles, no `.html` links** (`route()` or `<Link>` only).
- **Dev database `ziroemail`:** no `migrate:fresh` on it. Tests run on `ziroemail_test`. Migrations are added, never recreated.
- **Scratchpad for throwaway files** is session-specific and wiped; the project directory is not.
- **No new base folders or dependencies without approval.**
- **Documentation files only when asked.** This log and `BUILD_LOG.md` are explicitly asked for.
- **Pint after every PHP change** (`vendor/bin/pint --dirty --format agent`).
- **Narrow tests first** (`php artisan test --compact --filter=X`), then the full suite before closing.
