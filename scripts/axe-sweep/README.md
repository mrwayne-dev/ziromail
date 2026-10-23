# Axe sweep

Playwright + axe-core 4.10.2 against every dashboard, webmail and ops page the ops redesign (2026-10-21) and the dashboard + webmail design pass (2026-10-23) are both contracted to protect. The script lives here, not in a scratchpad, so it survives between sessions.

## What it does

For each page in [pages.mjs](pages.mjs), at 390 px and 1440 px:

1. Visits the URL under the right auth tier (owner session for dashboard + webmail, staff session with the seeded TOTP for ops).
2. Waits for the main content selector.
3. Runs `@axe-core/playwright` with WCAG 2.1 AA tags.
4. Takes a full-page screenshot.
5. Writes a JSON report + a markdown summary and a screenshot per page per viewport under `runs/<timestamp>/`.

Exits non-zero if any violations or page errors are seen.

## Prerequisites

- A seeded database that matches the IDs in [pages.mjs](pages.mjs) — the project's `BrowserSweepSeeder` provides this. Seed it against the browser debug DB, never against the dev `ziroemail` DB:

  ```sh
  # one-time, from the project root
  php artisan migrate:fresh --database=ziroemail_browser --seed --seeder=BrowserSweepSeeder --force
  ```

- The app running on `SWEEP_BASE_URL` (default `https://ziroemail.test`). Vite in dev mode is fine; a built bundle is also fine.
- Node 20+ (`node --version`).
- Browser installed:

  ```sh
  cd scripts/axe-sweep
  npm install
  npm run install:browsers   # downloads Chromium under ~/.cache/ms-playwright
  ```

## Running

```sh
cd scripts/axe-sweep
npm run sweep
```

Environment variables (all optional; defaults match `BrowserSweepSeeder`):

| Variable | Default |
| --- | --- |
| `SWEEP_BASE_URL` | `https://ziroemail.test` |
| `SWEEP_OWNER_EMAIL` | `owner@sweep.test` |
| `SWEEP_OWNER_PASSWORD` | `BrowserSweep123!` |
| `SWEEP_STAFF_EMAIL` | `ops@sweep.test` |
| `SWEEP_STAFF_PASSWORD` | `BrowserSweep123!` |
| `SWEEP_TOTP_SECRET` | the seeded ops TOTP secret |
| `SWEEP_OUT_DIR` | `runs/<iso-timestamp>` |
| `SWEEP_IGNORE_HTTPS` | `true` (so self-signed `*.test` works) |

## Interpreting the output

- `runs/<id>/report.md` — a human-readable summary, grouped by rule id. Zero violations is the goal.
- `runs/<id>/report.json` — the machine-readable record, including the first few node targets per violation. Diff against the previous run to spot regressions.
- `runs/<id>/shots/<viewport>-<page>.png` — the full-page screenshots. Useful when a violation points at a layout bug and you want visual confirmation before fixing.

## When a sweep fails

The pattern from the ops sweep: fix the finding, not just the symptom. Contrast failures usually mean a text colour that already exists in the palette; the right fix is to use the token, not to pick a new hex. ARIA-sort placement, heading order and link-name failures are all component-level and the fix belongs on the primitive, not the page.

If a page keeps erroring because the seeded id does not resolve (e.g. `/ops/abuse/<id>` 404s), fix the seeder or the `fetchOpsIds` helper in [sweep.mjs](sweep.mjs) — do not paper over it by removing the page from the list.
