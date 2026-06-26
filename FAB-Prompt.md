Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

This is a small, scoped feature for the mobile pitch editor in
PlanBuilder.jsx / PlanBuilder.css. Do not modify PitchCanvas.jsx unless
strictly necessary. Desktop (viewport > 700px) must be pixel-identical to
its current behaviour.

This prompt assumes a previous change already added an `isMobile` flag to
PlanBuilder.jsx (from `window.innerWidth <= 700`, matching the
`.builder-layout` breakpoint) and a pan/zoom viewport to PitchCanvas.jsx.
Verify these exist before proceeding; if `isMobile` is missing, add it the
same way (do not invent a new breakpoint), but do not redo the pan/zoom work
if it's already present.

---

GOAL: On mobile, replace the current `.pitch-toolbar` (and its zone-colour
sub-toolbar) with a single FAB that expands into the same tool categories.

STEP 1 — FAB button
When `isMobile` is true, render a single FAB button instead of
`.pitch-toolbar`, positioned `absolute`, anchored bottom-centre of
`.pitch-editor-wrap` (fixed position relative to that container — not
draggable, not floating). Shows "+" when closed, "×" when open.

STEP 2 — Expanding panel
Tapping the FAB toggles a panel that opens upward from the FAB, containing
the same categories currently in `.pitch-toolbar`: Players (Red/Blue),
Elements (Ball/Cone/Run/Pass/Zone), Goal size, Pitch crop, and the
zone-colour sub-toolbar (shown only when a zone tool is active, same as
desktop). Reuse the existing `.pt-btn` / `.pt-color-btn` styles and the
existing `activeTool` / `activeGoalSize` / `activeCrop` / `activeZoneColor`
state and handlers unchanged — only the layout/visibility changes.

STEP 3 — Auto-close
Selecting any tool from the panel closes the panel so the pitch is visible
for tap-to-place.

Styling: dark background (`var(--ink)`), gold text (`var(--tigers-gold)`),
no border-radius except optionally the FAB button itself being circular —
if you use `border-radius: 50%` on the FAB, that is the only exception,
matching the existing precedent in AccountSettings.css for avatar images.

---

ACCEPTANCE CRITERIA

[ ] At >700px, `.pitch-toolbar` renders exactly as before
[ ] At <=700px, `.pitch-toolbar` is replaced by the FAB
[ ] FAB expands/collapses the panel; panel shows all existing tool buttons
    with their existing handlers unchanged
[ ] Zone-colour sub-toolbar still appears only when a zone tool is active
[ ] Selecting a tool closes the panel
[ ] No hardcoded hex values, no Tailwind, no new border-radius except
    optionally on the FAB itself
[ ] npm run build completes without errors

WORKING NOTES
Do not start on the tap-to-select/move/delete toolbar for placed elements —
that is a separate prompt. Stay scoped to the FAB menu only.