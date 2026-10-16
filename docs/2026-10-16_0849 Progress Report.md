# Ziroemail progress report

**Date:** 2026-10-16 08:49 · **Branch:** `main` (local `master`) · **Last code commit:** `7f77f08` (hero); report commit follows it
**Scope of this report:** the public site and system pages (everything before the dashboards).

## 1. Where we are

The public marketing site is built, redesigned and live as a team preview. Every page the
visitor can reach without an account exists, passes the accessibility and layout checks, and
reads its data from fixtures. There is no backend behind it yet by design.

**Remaining before the dashboards:** 15 screens in four groups (sign-in and sign-up, checkout,
phone setup, and the onboarding wizard). They need real routes, and most need a decision on
how much backend to stand up first. See section 4.

### Delivery status
| Item | State |
|---|---|
| Hero redesign (`7f77f08`) | Committed, pushed to GitHub `main`, and deployed. |
| Preview server | Serving the new hero. All 11 pages return 200, unknown URLs return the branded 404, and the exposure probes (`.env`, `.git`, `vendor/`, logs) return 403 or 404. |
| Preview URL | https://ziromail.mgbah.dev (noindex header and `Disallow: /`, so search engines stay out) |
| Server crontab | Untouched (same entries as before). |

## 2. What has been done

### Foundation
- Laravel 13, Inertia v3, React 19, Vite 8. Laravel Boost installed.
- `ziro.css` ported verbatim. Tailwind kept for theme and utilities only, with its reset off.
- Fonts (Inter, IBM Plex Mono) self-hosted through the Vite font plugin.
- Named routes with Ziggy, `Seo` and JSON-LD helpers, a sitemap command that reads routes flagged `->sitemap()`, and branded 404, 500 and 503 pages.
- 21 PHP tests (every public route, error pages with debug off, API errors stay JSON, sitemap).

### Design system (extends `ziro.css`, adds no colours or fonts)
- **Tokens (`tokens.css`):** spacing scale, pill and zero radii, soft shadow, glass and scrim, control heights, motion and stacking values, an edge-to-edge gutter.
- **Components:** Button (pill, split, glass), Card (default, panel), Modal (native dialog), Toast (stack, pause, dismiss), Pill, Field, ChipGroup, Stepper, Callout, PageHero, CtaBlock, DomainSearch, LegalDoc, DomainPoolCard, SetupSteps, PlanPicker (joined panels), Faq (rows), Reveal and the other craft pieces.
- **Layout:** floating-capsule header, light footer, system layout for error states.

### Home page (all sections redesigned to references)
Hero (centred, one-line two-tone headline, domain search bar), "choose us" block with dashboard mockup, setup stepper, annotated storage diagram, joined plan panels, FAQ rows, contained CTA, light footer.

### Inner pages (all redesigned)
| Page | Notes |
|---|---|
| Pricing | Plan panels, pool diagram, extra-storage card, comparison table, FAQ, CTA. Prices come only from `fixtures/plans.js`. |
| Features | Numbered rows, detail card grid, "what we do not offer" note. |
| Switching | Source cards, stepper timeline, photo split, FAQ. |
| Help | Working search and topic chips, browse view, empty state. |
| Contact | Three channels beside a form card. The form is not connected and says so. |
| Status | Live-state hero, 40-day uptime bars, incident timeline. Illustrative data. |
| Legal x4 | Document plus a sticky "on this page" list built from headings. |
| Error states | 404, 500, maintenance, offline. |

### Delivery
- GitHub: `mrwayne-dev/ziromail`. History was cleaned so internal planning documents are not in it (they stay on disk, gitignored).
- Deployed to hosting server 1 (shared, PHP 8.3) as a team preview. Redeploy steps are in the private hosting inventory.

## 3. Quality checks and results

| Check | Result |
|---|---|
| PHP tests | 21 pass, 189 assertions. |
| Contrast (computed, every text node, 15 routes, 1440 and 390 px) | No failures after muted text moved to `--tx-2`. |
| Layout (overflow, one h1 per page, console errors) | Clean on all 15 routes at both widths. |
| Lighthouse accessibility | 95 on the home page. The remaining deductions were heading order, which predates the redesign. |
| Hard-coded colour audit (the verification you asked for) | Only `#fff` (equals `--paper`, which `ziro.css` itself writes the same way) and one `#000` inside a fade mask. No other hex, no font-family outside the two token fonts. |
| Em dashes | Removed from visible copy and page titles on every page. |
| Reduced motion and keyboard | Verified for the modal, toast, chips, FAQ rows, domain search and mobile menu. |

**Not done from the original verification list:** the side-by-side comparison of each reference
image against the build, and a line-by-line diff of the original homepage copy. Copy changes were
made deliberately and are listed in section 5.

## 4. What remains

### A. Pages before the dashboards (15 screens)
Prototype sources are in `docs/design-source/ui/`.

| Group | Screens | Depends on |
|---|---|---|
| **Sign-in and sign-up (6)** | signup, login, two-factor, recovery code, forgot password, verify email | Auth backend (Sanctum, 2FA, rate limits) for real behaviour. UI can ship first on fixtures. |
| **Checkout (2)** | payment method, bank transfer | The pricing-model decision, Paystack (virtual accounts, USSD, card, webhook verification). |
| **Phone setup (1)** | device picker, iOS profile, Android values, QR | Signed setup tokens and a mailbox to configure. |
| **Onboarding wizard (6)** | enter domain, ownership and DNS records (live verify), plan, mailboxes (pool allocator), assisted setup, done | DNS lookups, a mail-server API, and the plan and pool rules. |

Routes `/login`, `/signup`, `/setup` and `/mail` already exist as named placeholders that answer 404,
so header and footer links resolve. Each phase replaces its own placeholder.

### B. Dashboards (after the above)
- Owner dashboard: 11 screens. Webmail: 5. Operations console: 14.
- Needs the data model, tenancy and the mail-server integration from `docs/ARCHITECTURE.md`.

## 5. Decisions still open
1. **Pricing model.** Per domain (what the site shows) or per seat (original scope). It must be settled before checkout and before `plans` becomes a table.
2. **Extra-storage price.** The pricing page sells 10 GB for ₦6,000 a year; the design notes say ₦100 per GB a year. The fixture follows the page.
3. **Domain search.** There is no lookup. When sign-up exists, should a valid domain go straight into onboarding, or show a result first?
4. **Contact form and WhatsApp button.** Not connected. Needs an endpoint and the real WhatsApp link.
5. **Help articles.** Guide links point to `#` until the articles are written.
6. **Legal text.** Punctuation was changed (em dashes) but no wording. It still needs real review before launch.
7. **Home page copy added during redesign:** the "Business email" badge, the support line under "choose us", the FAQ lead, and the dashboard-mockup alt text. The mockup shows sample data (Adaobi Foods).
8. **Preview privacy.** Currently noindex only. A shared password can be added.

## 6. Known issues and tidy-ups
- `PublicLayout` still carries a dark header, dark footer and a bare status header that no page uses now. Keep for the account pages or delete.
- A local-only component gallery lives at `/_preview/components` (also `/_preview/404`, `/500`, `/maintenance`).
- Pint reports three older files outside this work (`BaseRequest`, `Handler`, `ApiResponse`).
- Photo credits in `public/images/photos/LICENSE.md` are still `TODO`.
- `app/Exceptions/Handler.php` is unused in Laravel 13 and can go.
- After each deploy, the two preview files (`public/.htaccess`, `public/robots.txt`) must be re-applied, because the repo versions overwrite them. At launch they come off for good.

## 7. Suggested next steps
1. Build the auth screens, checkout, phone setup and onboarding wizard UI-first on fixtures, using placeholders for plan and price data, following the same component approach as the marketing pages.
2. Decide the pricing and data model after those screens exist (item 1 above); only `fixtures/plans.js` should need to change.
3. Write the backend scope for auth, domains and DNS verification before wiring any of it.
