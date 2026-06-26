Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

This prompt covers three accessibility fixes from a Vercel audit and one 
styling enhancement. Treat them as four independent issues — do not let 
work on one issue bleed into files unrelated to it. Do not change any 
functionality not explicitly described below.

---

ISSUE 1 — Zooming and scaling must not be disabled

Observed: Vercel's accessibility audit flags that zooming/scaling is 
disabled (WCAG 1.4.4 / 1.4.10).

Root cause: Phase 9 added `maximum-scale=1.0` to the viewport meta tag in 
index.html, which blocks pinch-zoom across the entire app.

Fix: Remove `maximum-scale=1.0` (and `user-scalable=no` if present) from 
the viewport meta tag in index.html, restoring normal pinch-zoom and text 
resize behaviour. If this was originally added to stop double-tap-zoom 
from interfering with dragging on PitchCanvas, do not reintroduce a 
global restriction to solve that — instead, if needed, scope 
`touch-action: manipulation` (or `none`, only on the SVG drag elements) 
to PitchCanvas's interactive elements specifically. Only do this if you 
find evidence the original restriction was protecting PitchCanvas drag 
behaviour; otherwise just remove it and move on.

---

ISSUE 2 — Elements must meet minimum colour contrast ratio thresholds

Observed: Vercel's accessibility audit flags insufficient colour contrast 
somewhere in the app.

Investigate: Compute the actual contrast ratio for every text/background 
colour combination currently rendered (check the real component CSS, not 
just DESIGN.md — implementations may have drifted from the spec). Apply 
WCAG AA: 4.5:1 for text smaller than 24px regular / 18.66px (14pt) bold, 
3:1 for text at or above that size, 3:1 for non-text UI elements like 
input borders and icon-only buttons.

Likely culprits, based on the documented tokens (verify against actual 
rendered CSS, don't assume these are still accurate):
- Footer captions and data-table header text, documented at `#bbb` on 
  `--surface` (#fdfcf9) — roughly 1.8:1, fails badly. Note `#bbb` isn't 
  a defined token in tokens.css, so this may be a hardcoded value 
  sitting outside the token system already in violation of CLAUDE.md.
- Inactive nav links, documented at `#666` on `--nav-bg` (#1a1a18) — 
  roughly 2.9:1, fails.
- `--ink-faint` (#888888) used for captions/meta labels on `--surface` — 
  roughly 3.85:1 at small sizes, fails AA even though it reads as an 
  intentional "faint" colour.
- `--tigers-gold` (#c88000) used for small text on white surfaces (the 
  8-9px section-label eyebrow, `.kt` key-term styling) — roughly 3.1:1, 
  fails AA for small text. Gold passes fine at large/bold sizes and on 
  dark backgrounds (nav, buttons).

Fix approach:
- Do not change `--tigers-gold`, `--player-red`, `--player-blue`, or 
  `--pitch-green` — these are brand/functional colours. Where small gold 
  text on a light surface fails, switch that specific usage to `--ink` 
  or `--ink-mid` rather than altering the gold token. Reserve gold for 
  headings, large numbers, and dark-background contexts where it already 
  passes.
- For failing greys (`#bbb`, `#666` hardcoded, or `--ink-faint` at small 
  sizes), darken/lighten only as much as needed to clear the threshold, 
  staying in the same hue family. If a genuinely new shade is needed, 
  add it as a named custom property in tokens.css rather than hardcoding 
  a hex value in a component file.
- Re-check every fixed combination against the same thresholds after 
  changing it.

---

ISSUE 3 — Document should have one main landmark

Observed: Vercel's accessibility audit flags that the document does not 
have exactly one `<main>` landmark.

Root cause: the routed page content is not wrapped in a `<main>` element.

Fix: Wrap the routed page content (the `<Routes>` / route outlet area) in 
a single `<main>` element, in the layout component that already renders 
TopNav alongside the page content. TopNav's `<nav>` element must stay a 
sibling outside `<main>`, not nested inside it. Check there isn't already 
a stray `<main>` tag elsewhere (a page component, another layout 
wrapper) that would create more than one landmark — if found, remove the 
duplicate and keep only the single top-level one.

---

ISSUE 4 — Colour-coded backgrounds for roles and plan status

Currently, role pills (UserManagement) and plan status pills (PlanLibrary 
and anywhere else status is shown) use a pale tinted background only on 
the small pill chip itself (`--status-ok-bg`, `--status-warn-bg`, 
`--status-err-bg` paired with their `-text` colours). The surrounding row 
or card stays white.

Change: extend that same pale background to fill the entire clickable 
area of the element the pill belongs to (the full table row, list item, 
or card), not just the pill. Use the existing solid `--status-ok-bg` / 
`--status-warn-bg` / `--status-err-bg` tokens directly — do not introduce 
`rgba()` or `opacity`, DESIGN.md already bans that for print safety, and 
these tokens are already pale enough to use as a full background.

Scope:
- Apply first to UserManagement's user rows (tinted by role: president = 
  err, admin = warn, coach = ok, matching the existing pill mapping from 
  Phase 6) and PlanLibrary's plan rows (tinted by status: published = 
  ok, draft = warn).
- Audit the rest of the app for any other clickable element that shows a 
  role or status pill (e.g. CoachesPage, TeamManagement, AdminDashboard's 
  TeamTable) and apply the same pattern there if you find one. List 
  everywhere you applied it in your summary.
- Do NOT apply any of this inside DrillSheet, PrintView, or any 
  component used for the printed/exported drill sheet output. That 
  output must render exactly as it does today — these new background 
  colours are for on-screen admin/management views only.
- Where a row already has a hover state (e.g. data-table's 
  `background: #f7f5ef` on hover), don't let hover replace the status 
  tint with a flat neutral colour — adjust hover so the colour-coding 
  stays visible (e.g. a slightly darker version of the same status 
  tint), rather than overwriting it.

---

ACCEPTANCE CRITERIA

[ ] Pinch-zoom and browser text resize work normally throughout the app
[ ] No text/background or UI-component colour combination falls below 
    WCAG AA contrast thresholds
[ ] `--tigers-gold` and pitch colour token values are unchanged
[ ] Every page renders exactly one `<main>` landmark, with `<nav>` 
    outside it
[ ] User rows in UserManagement and plan rows in PlanLibrary show a 
    full-row pale background matching their role/status colour
[ ] Any other role/status-coded clickable element found during the audit 
    gets the same treatment, and is listed in your summary
[ ] DrillSheet, PrintView, and printed/exported output are visually 
    unchanged
[ ] No `rgba()` or `opacity` used for the new backgrounds
[ ] No hardcoded hex values introduced in any modified component — new 
    colours go into tokens.css as named custom properties
[ ] No border-radius introduced on any new container
[ ] npm run build completes without errors

---

WORKING NOTES

- These are four separate, independently testable changes. Report back 
  per-issue: what you changed, and for Issue 4, the full list of 
  elements you extended the pattern to.
- If a contrast failure can't be fixed without changing a brand-critical 
  token (gold, pitch colours), stop and report it instead of changing 
  that token.