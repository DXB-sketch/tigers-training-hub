Read CLAUDE.md and PHASE8_COMPLETE.md before doing anything else.

This is a small, scoped feature for the mobile pitch editor in
PitchCanvas.jsx and PlanBuilder.jsx. Do not modify PlanBuilder.css beyond
what's needed for this toolbar's layout. Desktop (viewport > 700px) must be
pixel-identical to its current behaviour.

This prompt assumes previous changes already added an `isMobile` flag, a
pan/zoom viewport, and a FAB element menu replacing `.pitch-toolbar` on
mobile. Verify these exist before proceeding; do not redo that work.

---

GOAL: On mobile, when no tool is active, tapping a placed player, cone,
ball, arrow, or zone selects it and shows a toolbar with Move (drag handle),
Edit label (players only), and Delete. No resize.

STEP 1 — Selection state
In PlanBuilder.jsx, when `isMobile && activeTool === null`, tapping a
placed element sets `selectedElement = { id, type, arrayField }`.
PitchCanvas.jsx renders a visual selection indicator (thin gold outline)
around the selected shape. Tapping empty pitch space or the same element
again clears `selectedElement`.

STEP 2 — Toolbar
Render a fixed toolbar at the bottom of `.pitch-editor-wrap` (replacing the
FAB while a selection is active) with three actions:

- **Move**: recreate the 4-direction arrow icon (plus-shaped arrangement of
  four arrowheads pointing up/down/left/right from a centre point) as inline
  SVG. Press-and-hold arms drag mode for the selected element; subsequent
  touchmove updates that element's position fields (`cx`/`cy` for
  players/cones/balls; the relevant fields for arrows/zones) using the same
  update pattern as the existing desktop drag in PlanBuilder.jsx
  (`setSelectedDrill`/`setDrills`). Release ends drag mode and calls
  `savePitchState`, exactly as the existing desktop drag-end does.
- **Edit label**: only shown when the selected element is a player. Opens
  the existing `LabelEditor` in PitchCanvas.jsx for that player.
- **Delete**: calls the existing `handleContextMenu` logic in
  PlanBuilder.jsx (currently wired to desktop right-click) for the selected
  element's id/arrayField, then clears `selectedElement`.

Do not implement resize handles anywhere.

---

ACCEPTANCE CRITERIA

[ ] At >700px, behaviour is unchanged (right-click delete, mouse drag,
    label editor all still work)
[ ] At <=700px with no tool active, tapping a placed element selects it and
    shows the move/edit-label/delete toolbar
[ ] Edit label opens the existing LabelEditor
[ ] Delete removes the element via existing handleContextMenu logic
[ ] Move drags the element via touch and saves on release via
    savePitchState
[ ] Tapping empty space or the same element again deselects
[ ] No resize handles exist anywhere
[ ] No hardcoded hex values, no Tailwind, no border-radius introduced
[ ] npm run build completes without errors

WORKING NOTES
After this step, write a brief summary of any deviations from this spec and
why, covering all three mobile pitch-editor prompts together, so it can be
folded into the project's phase history.