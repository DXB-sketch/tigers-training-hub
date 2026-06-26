Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

These are targeted bug fixes. Do not change any functionality not explicitly mentioned. Fix each issue below, then confirm what was changed.

---

CONTEXT

The custom crop feature for PitchCanvas is partially implemented but has four remaining problems. Read the current PitchCanvas.jsx implementation carefully before making any changes — identify exactly where the save-on-mouseup call is occurring and where the viewBox update is or is not happening.

---

ISSUE 1 — Crop still saves on drag release instead of waiting for Confirm

Observed: Releasing a crop handle still writes the crop boundary to the database immediately. The Confirm button is either not present or not the thing triggering the save.

Root cause: There is still a database save call (supabase update on the drills table for pitch_crop) being triggered on mouseup or drag end. This must be removed entirely from the drag/release code path.

Fix: Audit every location in PitchCanvas.jsx (and any parent component that handles crop saving) where a Supabase write occurs for pitch_crop. Remove every save call that is triggered by mouseup, drag end, or pointer release. After this fix, dragging a handle must only update local React state — no database write occurs until the Confirm button is explicitly clicked.

Do not add any new save trigger. Only the Confirm button (Issue 3) writes to the database.

---

ISSUE 2 — After confirming, the canvas stays at full pitch size instead of zooming to the cropped region

Observed: After the crop is saved (currently on release), the SVG viewBox remains the full pitch dimensions. The canvas should physically zoom into the selected region so only the cropped area fills the canvas — the same way Half and Third crop options change the viewBox to show only their region.

Root cause: The viewBox is being set to the full pitch during edit mode (correct — so handles are usable) but is never being updated to the cropped region after the crop is confirmed. The confirmed crop boundary values are saved to the database but the rendered viewBox does not update to reflect them.

Fix: The SVG viewBox must be determined as follows:

- When cropEditingActive is true: use the full pitch viewBox dimensions so handles are positioned correctly across the whole pitch.
- When cropEditingActive is false AND pitch_crop is a custom type: use the cropped viewBox — "${cropLeft} ${cropTop} ${cropRight - cropLeft} ${cropBottom - cropTop}" — so the SVG zooms into the selected region.
- When pitch_crop is Full, Half, or Third: use the existing viewBox logic for those crop types, unchanged.

This means on Confirm (Issue 3): set cropEditingActive to false, save to database, and the viewBox will automatically switch to the cropped region because cropEditingActive is now false. No additional viewBox logic is needed beyond this conditional.

In read-only mode (interactive={false}) — DrillViewer, PrintView — when pitch_crop is a custom type, always use the cropped viewBox. cropEditingActive is always false in read-only mode.

---

ISSUE 3 — Confirm and Cancel buttons must be positioned inside the pitch canvas at the bottom, only visible during edit mode, and Confirm must be the sole database write trigger

Observed: The Confirm and Cancel buttons are either absent, not visible, or not functioning as the sole save mechanism.

Fix: Render the Confirm and Cancel buttons as absolutely positioned elements inside the pitch canvas wrapper div (the div that contains the SVG element). Position them at the bottom centre of the canvas:

  position: absolute
  bottom: 12px
  left: 50%
  transform: translateX(-50%)
  display: flex
  gap: 8px
  z-index: 10

The pitch canvas wrapper div must have position: relative so the absolute positioning works correctly.

These buttons must only be rendered in the DOM when cropEditingActive is true. When cropEditingActive is false, do not render them at all.

CONFIRM CROP button:
- Background: var(--ink), text: var(--tigers-gold)
- Font: 10px, weight 700, letter-spacing 0.14em, uppercase, no border-radius
- Min-height: 44px, padding: 0 18px
- On click: (1) write the current in-progress crop boundary values to the database via direct Supabase call on the drills table, updating pitch_crop to the JSON string of the current boundary, (2) set cropEditingActive to false

CANCEL button:
- Background: var(--surface), border: 1.5px solid var(--ink), text: var(--ink)
- Same font/size/spacing as Confirm
- On click: (1) restore boundary state to the savedCropSnapshot taken when edit mode was entered, (2) set cropEditingActive to false, (3) do not write to the database

Both buttons must have pointer-events set normally — they must be clickable even though they sit inside the SVG wrapper.

---

ISSUE 4 — Outside-crop overlay is not visibly darker than the selected area

Observed: The area outside the crop boundary during edit mode does not appear meaningfully darker than the selected area, making it hard to distinguish what will be cropped.

Root cause: Either the four overlay rects are not rendering, the opacity is too low, or the fill is not applying correctly.

Fix: Confirm the four overlay rects are present and rendering in the SVG when cropEditingActive is true. They must use:

  fill="var(--ink)"
  opacity="0.5"
  pointer-events="none"

The four rects cover the strips outside the crop boundary (top strip, bottom strip, left strip, right strip) as described in the previous prompt. They must be rendered after the pitch markings and player elements in SVG document order so they sit visually on top of the pitch content, but before the handle elements so handles remain above the overlay. If the overlay rects are present but invisible, check whether var(--ink) is resolving correctly inside the SVG — if CSS custom properties are not applying inside the SVG element, replace var(--ink) with the literal value #1a1a18 for these four rects only (SVG fill attributes do not always inherit CSS custom properties depending on how the SVG is embedded).

---

ACCEPTANCE CRITERIA

[ ] Dragging a crop handle does not write to the database under any circumstances
[ ] Releasing a handle outside or inside the SVG does not write to the database
[ ] CONFIRM CROP and CANCEL buttons are visible inside the pitch canvas at the bottom centre during edit mode
[ ] Buttons are not present in the DOM when cropEditingActive is false
[ ] Clicking CONFIRM CROP saves the crop boundary to the database and exits edit mode
[ ] After confirming, the SVG viewBox zooms to the cropped region — the canvas shows only the selected area
[ ] Clicking CANCEL reverts to the pre-edit snapshot and exits edit mode without a database write
[ ] After cancelling, the SVG viewBox returns to the pre-edit crop (or full pitch if no prior custom crop existed)
[ ] During edit mode the area outside the crop boundary is visibly darkened with a 0.5 opacity dark overlay
[ ] The overlay updates in real time as handles are dragged
[ ] The cropped viewBox renders correctly in DrillViewer and PrintView (read-only, no handles, no buttons)
[ ] All existing crop options (Full, Half, Third) are completely unchanged
[ ] <defs> remains the first child of <svg>
[ ] npm run build completes without errors

---

WORKING NOTES

- The single most important thing to verify first: find every supabase write for pitch_crop in PitchCanvas.jsx and any parent. Remove all of them except the one inside the Confirm button click handler.
- CSS custom properties (var(--ink) etc.) may not resolve inside SVG fill attributes when the SVG is inline. If the overlay rects are invisible, use #1a1a18 as the fill value for those four rects only — this is a documented SVG/CSS limitation, not a design rule violation.
- The buttons are HTML elements inside a position:relative wrapper div, not SVG elements. They sit on top of the SVG via z-index and absolute positioning.
- Do not change any functionality not mentioned.