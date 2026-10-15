# Ziroemail — Design System

The rules this interface is built on. Read this before adding a page, and keep
the stylesheet as the single source of truth: `assets/css/ziro.css`.

---

## 1. Brand

The palette is **sampled from the official logo files**, not chosen. Three colours,
nothing else.

| Token | Hex | Use |
|---|---|---|
| `--blue` | `#1066C6` | The one accent. Buttons, links, marks, active states, data. |
| `--ink` | `#000000` | Pure brand black, used through the `--ink-*` ramp. |
| `--paper` | `#FFFFFF` | Page. |

Everything else is a neutral derived from those. **There is no green, no secondary
brand colour, no gradient palette.** If something needs emphasis, it is blue or it is
weight — not a new hue.

Status colours (`--ok`, `--warn`, `--bad`) exist only to signal system state. They are
never decorative.

### Logo

Three files in `assets/img/`:

| File | Use |
|---|---|
| `ziroemail-wordmark-white.png` | On any dark surface |
| `ziroemail-wordmark-black.png` | On any light surface |
| `ziroemail-icon.png` | Favicon, app icon, square contexts |

Always `class="logo"` — never an inline `height`. The class caps it by **both** height
and width so it cannot dominate a narrow column. The footer caps it tighter still.

The product is **Ziroemail**, one word. Not "Ziro Email", not "Ziro".

---

## 2. Typography

**Inter** for everything, **IBM Plex Mono** for routes, DNS values and addresses.
Both loaded from Google Fonts with `preconnect` on every page.

Taken from Apple's published scale:

- **Body is 16.5px**, not 16. Paragraph cadence is deliberate.
- **Display sizes run near-solid** — line-height 0.96–1.1 — with negative tracking that
  grows with size (`-.024em` at h4 up to `-.045em` on a hero).
- **2–3 sentences per section.** If a section needs more, it is two sections.
- `text-wrap: balance` on headings, `pretty` on body. Headings with an author `<br>`
  opt out, since balancing fights a deliberate break.

| Element | Size |
|---|---|
| Hero h1 | `clamp(3.2rem, 1.6rem + 7.4vw, 8rem)` |
| h1 | `clamp(2.4rem, 1.5rem + 3.9vw, 4.5rem)` |
| h2 | `clamp(1.8rem, 1.35rem + 2vw, 2.9rem)` |
| Lead | `clamp(1.05rem, 1rem + .4vw, 1.25rem)` |
| Body | 16.5px / 1.6 |

---

## 3. Layout

- Section padding **72 / 104 / 128px** by breakpoint — roughly Apple's 80px rhythm,
  widened for a marketing page.
- Gutters **20 / 36 / 52px**. Content max **1200px**, wide **1380px**, tight **780px**.
- Radii: `--r-xs 8` · `--r-sm 12` · `--r 18` · `--r-lg 26` · `--r-xl 36`.
- **One shadow family.** `--sh-1/2/3` only; nothing invents its own.

Every grid child carries `min-width: 0`. Without it, grid and flex children refuse to
shrink below their content and push the page wider than the viewport.

---

## 4. Imagery

**No invented product UI.** No drawn dashboards, fake inbox screenshots, mock DNS
panels or decorative diagrams standing in for the app. They read as generated and
they lie about a product that does not exist yet.

What is allowed:

1. **Real photography** — Unsplash, hot-linked from `images.unsplash.com`, and
   **always viewed before use**. Subjects match the market: Nigerian businesses,
   real settings.
2. **Typography, colour blocks and whitespace** doing the work.
3. **Real data structures** — a storage-pool bar, an actual table of quotas. These
   are the interface, not a picture of one.

Every `<img>` needs `alt`, explicit `width`/`height`, `loading="lazy"` below the fold,
and `fetchpriority="high"` above it.

---

## 5. Craft

Three devices keep the page from looking generated. Use them sparingly — one or two
per page, never all three in one section.

**Hand-drawn marks** (`.marked`, `.ringed`) — an uneven SVG stroke swept under a word,
drawing itself on load. Requires `pathLength="100"` on the path so the dash maths holds
when the box is stretched, and `vector-effect: non-scaling-stroke` with the width set in
**screen pixels**, not viewBox units.

**Geometric shapes** (`.shape-ring`, `.shape-disc`, `.shape-flap`) — flat, low-opacity
circles and the envelope-flap chevron lifted from the logo mark. Absolutely positioned,
always `aria-hidden`, never a soft gradient blob.

**Motion as craft** — word-rise on hero headlines (`.rise`), the phrase cycler
(`[data-cycle]`), scroll-filled rails (`.rail`), counters (`[data-count-to]`) and the
marquee. All of it respects `prefers-reduced-motion`.

---

## 6. States are first-class

This is the interface layer, not a mockup. Every screen that loads, fails or empties
needs the state designed.

| State | Pattern |
|---|---|
| Loading | `.skel` skeleton matching final content shape — never a bare spinner |
| Empty | `.empty` — says what appears here and offers the action that fills it |
| Error | `.banner-bad` or `.field-err` + `.err`, wired with `aria-invalid` / `aria-describedby` |
| Busy | `[data-busy]` on a button — spinner replaces the label, pointer disabled |
| Disabled | `[disabled]` / `aria-disabled` at 45% opacity |
| Live | `.spinner` + `aria-live="polite"` for anything polling |

Per-record states must be **genuinely different** — see `onboard-records.html`, where
MX is *Passing*, SPF *Needs a fix* with a real merged value to paste, and DKIM/DMARC
*Waiting*. Four identical rows would be decoration.

---

## 7. Accessibility

Non-negotiable, checked with the `web-design-guidelines` skill before shipping:

- Skip link on every page; visible focus ring on brand blue
- Icon-only buttons carry `aria-label`; decorative SVG carries `aria-hidden="true"`
- `color-scheme`, `theme-color`, `touch-action: manipulation`, tap-highlight set
- `scroll-margin-top` on headings so anchors clear the sticky header
- `tabular-nums` on any figure in a column
- Native `<select>` gets explicit `background-color` **and** `color`
- Progressive enhancement: **content is visible by default.** The reveal animation is
  opt-in via a class the JS adds, so a failed script can never hide the page.

---

## 8. Commercial model

Pricing is **per domain**, not per mailbox — see `ziroemail-pricing-model` for the full
rules. Three facts the UI must never contradict:

1. A plan buys **one domain** a pooled storage quota. Two domains can never share one.
2. The admin **splits the pool** between mailboxes however they like, cPanel style.
   Mailbox count is not a billing lever.
3. **Extra storage is priced per gigabyte** at the same rate on every plan — **₦100 a GB a year**. The customer types how much they want; the plan's ceiling is shown beside
   the field and enforced as they type. Starter caps at 25 GB, Business at 100 GB,
   Premium has no ceiling.

   Extra storage is a **recurring annual charge that renews with the plan**, on the
   plan's own renewal date. Storage bought late in a term still costs the full year and
   is charged again at the next renewal. Never imply it is bought once and kept.

**A longer term lowers the monthly rate.** A year or more is charged at the lower of the
two rates; shorter terms pay the standard monthly rate:

| Plan | Monthly | A year or longer | Year total |
|---|---|---|---|
| Starter | ₦1,100 / $1.50 | ₦1,000 / $1 a month | ₦12,000 / $12 |
| Business | ₦2,500 / $3.50 | ₦2,300 / $2.50 a month | ₦27,600 / $30 |
| Premium | ₦5,000 / $7 | ₦4,500 / $5 a month | ₦54,000 / $60 |

Storage: Starter 10 GB (to 25 GB), Business 30 GB (to 100 GB), Premium 100 GB (no ceiling).

State the saving as the lower monthly rate, not as free months. Write "₦1,000 a month on
a yearly term", never "2 months free".

---

## 9. Voice

Plain, specific, second person. No enterprise filler.

- Say what a thing does, not how transformative it is.
- Give the reason for a constraint — "we hold your mailboxes until every record passes,
  because that is the difference between reaching an inbox and not."
- Admit what is missing and why. The no-free-trial answer explains the abuse problem
  rather than pretending it is an oversight.
- Never put internal research on the page. Customers do not want our board papers.
- Curly quotes and apostrophes. `…` not `...`.

---

## 10. The operations console

`/ops/` is the internal surface — the four of us, not customers. It deliberately
looks different from everything else so nobody confuses the two:

- **Black header** with a red `INTERNAL` tag, against the customer surfaces' white.
- **Dark sidebar**, always visible from 1100px, grouped by what you came to do:
  Watch, Act, Accounts, Platform.
- **Denser than the customer UI.** 14px body against 17px, 11px table rows against
  15px. These screens are read in bulk by people who use them every day, not
  scanned once by a stranger.
- **Numbers over prose.** A metric tile is label, figure, comparison — three lines,
  no sentence. Prose appears only where a decision needs context.

### Rules particular to this surface

**Evidence before action.** Any screen that can lock an account, refund money or
restore a backup shows what it knows first, and puts the button after it. The
abuse queue shows sending volume, bounce rate, complaint rate, recipient history
and sample subject lines — then offers the lock. A page that leads with the
button invites a reflex.

**Show what did not fire.** `ops-abuse-detail.html` lists the signals that stayed
clean — no failed sign-ins, no new forwarding rules, Sent folder intact — because
those are what distinguish a customer breaking the rules from an account that has
been taken over. The two need opposite responses.

**Every consequential action carries a reason field**, and the reason appears in
the audit trail and in the customer's email. An entry reading "account locked"
is useless six months later.

**State what an action actually does.** "A lock stops sending, not receiving" is
on the abuse queue as a banner, not buried in a tooltip, because the person
clicking needs to know that mail keeps arriving and nothing is deleted.

**Severity as a left rail.** `tr.sev-high`, `.sev-med`, `.sev-low` paint a 3px
bar inside the first cell. It is readable at a glance down a long table without
colouring whole rows, which would fight the text.

### The table rule

Ops tables use `table.ops`. Headers are `white-space: nowrap`, which makes the
header row narrower than the body and leaves a bare strip at the right. One column
per table carries `class="wide"` on both its `<th>` and its `<td>`s to absorb the
slack — normally the descriptive one (Subject, Reason, What for). Without it the
header band stops short and the table looks broken.

Where the last column holds buttons, its header is `<span class="sr-only">Action</span>`.
That gives the cell no intrinsic width, so `table.ops th:last-child:has(.sr-only)`
sets `width: 1%` and the body cells right-align.

## 11. Files

```
ui/
  assets/css/ziro.css     the system — tokens, components, states, motion
  assets/js/ziro.js       nav, currency, cycler, counters, rails, copy, reveal
  assets/img/             the three logo files
  ops/                    staff console — 16 screens, robots-disallowed
  DESIGN.md               this file
  _screens.html           internal index — delete before handoff
```

No build step. Every page opens from the file system.

**Before adding a page:** copy the header, footer and `<head>` from `pricing.html`,
then check every class you use exists in the stylesheet. A class that resolves to
nothing renders as nothing, and it is invisible until someone looks at the page.
