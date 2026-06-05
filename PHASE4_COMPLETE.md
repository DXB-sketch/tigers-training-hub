# Phase 4 Complete

## What was built in each step

### Step 4A — Print View

- New route `/admin/plans/:id/print` (admin-only, `ProtectedRoute`)
- `src/pages/PrintView.jsx` renders all drills in the plan sequentially as `DrillSheet`
  components with no TopNav, no sidebar, no toolbar, no DrillNav
- A fixed "Print" button in the top-right calls `window.print()`
- `src/styles/print.css` replaced with a complete print stylesheet:
  - Hides `.top-nav`, `.builder-top-bar`, `.plan-meta-header`, `.plan-sidebar`,
    `.pitch-toolbar`, `.print-actions`, `.drill-nav`, `.pitch-legend`
  - `@page { size: A4 portrait; margin: 12mm 14mm }`
  - `break-after: page` on `.drill-page` (the DrillSheet outer div)
  - `max-height: 220px` on `.pitch-svg-wrap` for print overflow control
- `DrillSheet` gained a `showNav` prop (default `true`); `PrintView` passes `showNav={false}`
  so the DrillNav is not rendered (not just hidden in print)
- `PlanBuilder` top bar gained a "Print" button that opens the route in a new tab
- CSS class names in `print.css` match the actual codebase (not the spec's draft names):
  `drill-page` not `drill-sheet`, `pitch-svg-wrap` not `pitch-canvas-wrapper`, `sh` not
  `section-head`, `builder-top-bar` not `plan-top-bar`, `pitch-toolbar` not `drill-toolbar`

### Step 4B — PDF Export

- Installed `jspdf` and `html2canvas` (the only permitted PDF/export libraries)
- `src/lib/exportPdf.js` exports `exportSessionPdf(planTitle, containerElement)`:
  - Captures the container at `scale: 2` for retina quality
  - Slices the canvas into A4-sized pages (page height × 2 canvas pixels per slice)
  - Each slice is added as a separate PDF page
  - Saves as `[plan-title]-session.pdf` (lowercase, spaces replaced with hyphens)
- `PrintView` has a "Download PDF" button next to "Print" with:
  - Disabled + "Generating..." text while export is in progress
  - "Export failed. Try again." error message for 4 seconds on failure
  - Both buttons hidden in print media via `.print-actions { display: none !important }`
- `PrintView.css` contains the `.print-btn`, `.print-btn--primary`, `.print-error` and
  `.print-actions` styles; no hex values in component CSS

### Step 4C — Plan Assignment + Admin Plan Viewing

- **Step 1**: Plan reassignment in PlanBuilder was already complete from Phase 3.
  `handleTeamChange` immediately calls `savePlanField('team_id', val)` on every change.
  No code change required; documented as confirmed.

- **New route**: `/admin/teams/:teamId/plans` (admin-only) → `TeamPlanView`
- `src/pages/TeamPlanView.jsx`:
  - Uses `useTeam(teamId)` for team name, `usePlans({ teamId, status: 'published' })` for plans
  - Each plan row is expandable (click toggles `expandedPlanId` state)
  - Expanded rows show a `PlanDrillList` subcomponent that calls `useDrills(planId)`
  - Each drill row navigates to `/admin/plans/:planId/preview`
  - Empty state: "No published sessions for this team." at 13px `var(--ink-muted)`, centred
- `src/components/admin/TeamDetailPanel.jsx` gained a "View published sessions →" link
  using `<Link to={...}>` (react-router-dom); styled as `var(--tigers-gold)` 12px text,
  no underline on default, underline on hover. CSS added to `TeamDetailPanel.css`.

### Step 4D — Zone Drawing Tools

- Two new toolbar buttons in PlanBuilder: **Zone ○** (`zone-circle`) and **Zone □** (`zone-rect`)
- A color picker row appears below the toolbar when either zone tool is active:
  three 20×20px swatches (Gold / Red / Blue) with an active `var(--ink)` border
- **Click-drag interaction** for zone drawing (not single-click):
  - `handleSvgMouseDown`: if zone tool is active and no existing element was hit
    (checked via `dragCandidateRef` / `draggingRef`), starts `zoneDrawing` state
  - `handleSvgMouseMove`: when `zoneDrawing.active`, updates `currentX/Y` and triggers
    preview re-render; returns early to prevent existing drag logic from interfering
  - `handleSvgMouseUp`: if drag distance ≥ 10px, creates the zone element with the
    current `activeZoneColor` and saves to Supabase; clears `zoneDrawing` state
- **Zone data model** stored in the existing `elements` jsonb column alongside cones/balls:
  - `zone-circle`: `{ id, type, cx, cy, r, color }`
  - `zone-rect`: `{ id, type, x, y, width, height, color }`
- **PitchCanvas rendering**: zones are rendered before other elements (background layer)
  via a new `ZoneShape` component with dashed strokes and transparent hit-area siblings
  for reliable right-click targeting; right-click deletes via the existing `onContextMenu`
  pattern
- **Zone drawing preview**: a dashed gold preview shape tracks the mouse during drag
- Zones render read-only in the coach DrillViewer, PrintView, and PDF output
  (`interactive={false}` suppresses pointer events and the context-menu handler)

---

## Deviations from spec

1. **print.css class names differ from spec** — The spec listed `drill-sheet`, `pitch-canvas-wrapper`,
   `section-head`, `plan-top-bar`, and `drill-toolbar` as selectors. The actual class names in
   the codebase are `drill-page`, `pitch-svg-wrap`, `sh`, `builder-top-bar`, and `pitch-toolbar`.
   Used the actual codebase names; the spec names would have had no effect.

2. **PrintView.jsx: buttons are grouped in `.print-actions` div** — The spec described a single
   `.print-btn` selector for both buttons. Wrapping both in `.print-actions` makes hiding in
   print media cleaner and allows the error message to sit inline.

3. **PDF: canvas-slice approach uses `pageHeight * SCALE` not literal `1123px`** — The spec said
   "slice the canvas into vertical chunks of 1123px height." With `scale: 2`, a chunk of 1123 raw
   canvas pixels would be only half an A4 page. Slices of `1123 × 2 = 2246` canvas pixels
   correctly maps one A4 page of content. The end result (one A4 page per slice) matches the spec intent.

4. **Zone colour picker row is part of `.pitch-area` not a standalone HTML row** — The spec said
   "directly below the tool button row." Implemented as a second flex row inside `.pitch-area`,
   conditionally rendered when a zone tool is active. Visually identical to spec intent.

5. **Zone drawing preview always uses gold** — The spec says "dashed gold stroke" for the preview.
   The active zone color is only applied to the placed zone, not the preview, as specified.

---

## Supabase-specific decisions

- Zones are stored in the existing `elements` jsonb column. No migration required. The
  `safeParseArray` in `useDrills` already handles jsonb auto-parsing vs string parsing for
  all element types, including zones.
- `exportSessionPdf` captures via `html2canvas`, which does not make Supabase requests. No
  auth headers are needed during export.
- `usePlans({ teamId, status: 'published' })` relies on the existing `filters.status` branch in
  `usePlans.js`, already wired in Phase 3.

---

## Known limitations and tradeoffs

1. **PDF quality for SVG pitch canvas** — `html2canvas` rasterises the SVG at the captured
   element size × `scale: 2`. Pitch lines and text will be sharp on standard screens but may
   appear slightly soft on very high-DPI outputs. Using `scale: 3` would improve this but
   increases export time significantly.

2. **PDF page boundaries may split drill content mid-section** — Pages are split by fixed A4
   height slices without awareness of drill boundaries. A future improvement would capture
   each `DrillSheet` individually and add as separate pages.

3. **Zone drawing does not snap to other elements** — Zones are placed freely in viewBox
   coordinates without grid snap or player-snap. This is intentional per spec scope.

4. **Zone color cannot be changed after placement** — There is no color-edit UI for placed
   zones. Right-click to delete and redraw is the only way to change color.

5. **TeamPlanView drills all link to the same preview URL** — All drills in the expanded list
   link to `/admin/plans/:planId/preview` which opens the first drill. There is no deep-link
   to a specific drill by index in the admin preview route.

---

## What Phase 5 needs to know

1. **Zone elements now co-exist in the `elements` array with cones and balls.** Any Phase 5
   feature that iterates `elements` must handle `zone-circle` and `zone-rect` types
   (in addition to `ball`, `cone`, and the legacy `zone` ellipse type).

2. **PitchCanvas now accepts `zoneDrawing` prop** for live preview. Phase 5 should not
   rename or repurpose this prop without also updating `PlanBuilder.jsx`.

3. **PrintView has a `containerRef`** wrapping all `DrillSheet` components. Phase 5 PDF
   improvements (e.g. per-drill page breaks) should work with this ref structure.

4. **`DrillSheet` has a `showNav` prop** (default `true`). Any new context that renders
   `DrillSheet` without navigation should pass `showNav={false}`.

5. **Route table additions from Phase 4:**

   | Path | Component | Guard |
   |---|---|---|
   | /admin/plans/:id/print | PrintView | admin |
   | /admin/teams/:teamId/plans | TeamPlanView | admin |

6. **`exportSessionPdf` in `src/lib/exportPdf.js`** is a standalone async function with no
   side-effects beyond the browser's download API. It can be called from any component that
   has a DOM ref to a container element.

7. **CSS custom properties do NOT reliably resolve in `@media print` in some browsers** —
   `print.css` uses hex values for this reason (the single permitted exception per CLAUDE.md).
   Phase 5 print-related CSS should follow the same pattern.

8. **`usePlans` memoisation note**: `usePlans` re-runs when `filters.teamId`, `filters.weekNumber`,
   or `filters.status` change. If Phase 5 adds more filter options, they must be added to
   the `useEffect` dependency array in `usePlans.js`.
