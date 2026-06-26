Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

These are targeted bug fixes. Do not change any functionality not explicitly mentioned. Fix each issue in the order listed. After all fixes, confirm what was changed for each issue number.

---

ISSUE 1 — Crop handles remain visible after drag is released

Observed: After dragging a handle to define a custom crop area, the white corner and edge squares remain permanently visible on the pitch canvas. They should disappear once the crop is saved on drag release.

Root cause: The handles are rendered whenever pitch_crop is a custom type, with no state tracking whether the admin is actively editing the crop. There is no "editing mode" toggle — handles are always on when custom crop is selected.

Fix: Add a boolean state variable to PitchCanvas (or the parent PlanBuilder component that controls PitchCanvas) — e.g. cropEditingActive — that defaults to false.

Handles must only render when cropEditingActive is true. On mouseup (drag release), after saving the updated crop boundaries to the database, set cropEditingActive to false. This hides all handles immediately after the crop is confirmed.

Add an "Edit crop" button to the PlanBuilder pitch toolbar. This button must only appear when the current pitch_crop value is a custom crop type (i.e. pitch_crop is a JSON string with type "custom"). It must not appear when the crop is Full, Half, or Third. Clicking "Edit crop" sets cropEditingActive to true, making the handles visible again so the admin can adjust the crop.

When the admin switches away from Custom crop to any other crop type, cropEditingActive must reset to false.

Style the "Edit crop" button consistently with the existing toolbar buttons — uppercase, 10px, var(--ink) background, var(--tigers-gold) text, no border-radius. Do not hardcode hex values.

---

ISSUE 2 — Custom crop clips pitch markings only, does not actually crop the canvas

Observed: When the admin drags the handles to define a crop area (visible as a dashed gold rectangle in the screenshot), the pitch lines and goals outside the rectangle are hidden — but the green canvas itself remains the full pitch size. The crop boundary should physically zoom the SVG into the selected region, so the canvas shows only the cropped area at full size, exactly as the Half and Third crop options do.

Root cause: The current implementation uses a SVG <clipPath> to hide content outside the crop boundary, while keeping the SVG viewBox at the full pitch dimensions. This is the wrong approach. Half and Third crops work by changing the SVG viewBox attribute to a sub-region of the pitch coordinate space — the SVG then zooms and fills the canvas with only that region. Custom crop must use the same mechanism: change the viewBox, not a clipPath.

Fix: Remove the <clipPath> / clipPathUrl approach for custom crop entirely.

Instead, when pitch_crop is a custom type, set the SVG viewBox attribute to:
  "${left} ${top} ${right - left} ${bottom - top}"

Where left, top, right, bottom are the four boundary values stored in the custom crop JSON. This is the same pattern that Half crop uses to set the viewBox to the left half of the pitch coordinate space, and Third crop uses to set the viewBox to the attacking third.

The SVG element must still use preserveAspectRatio="xMidYMid meet" (or whichever value the existing crops use — do not change this attribute from its current value).

Because the viewBox now defines what is visible, no clipPath is needed. Remove any custom-crop-clip clipPath and any clipPathUrl references introduced in the previous implementation.

The drag handles must be rendered in the full pitch coordinate space (not the cropped viewBox space) so they are positioned correctly during edit mode. When cropEditingActive is true, temporarily switch the viewBox back to the full pitch dimensions so the admin can see the entire pitch and drag the handles freely. When cropEditingActive becomes false (on drag release / save), switch the viewBox to the cropped region.

Player dots, arrows, and zone elements must render correctly in both editing mode (full viewBox) and display mode (cropped viewBox) — their coordinates are stored in full-pitch viewBox units and will naturally appear in the correct position under both viewBox settings.

---

ACCEPTANCE CRITERIA

[ ] After dragging a handle and releasing, all handles disappear immediately
[ ] The "Edit crop" button appears in the pitch toolbar only when Custom crop is the active crop type
[ ] Clicking "Edit crop" makes all handles reappear on the full pitch canvas
[ ] "Edit crop" button is not visible when crop is Full, Half, or Third
[ ] When Custom crop is active and not in edit mode, the SVG viewBox is set to the cropped region — the canvas shows only the selected area at full canvas size, with no green space outside it
[ ] The cropped view looks visually consistent with how Half and Third crops render — only the selected portion fills the canvas
[ ] During edit mode (handles visible), the full pitch is shown so the admin can reposition handles
[ ] Player dots, arrows, and zone elements render correctly in both edit mode and display mode
[ ] The cropped viewBox persists correctly in DrillViewer and PrintView (read-only, no handles)
[ ] No clipPath or clipPathUrl remains in the custom crop implementation
[ ] <defs> remains the first child of <svg>
[ ] No hardcoded hex values — all colours use CSS custom property tokens
[ ] npm run build completes without errors

---

WORKING NOTES

- The SVG viewBox approach is the correct one — it is how the existing Half and Third crops already work. Match that pattern exactly rather than inventing a new clipping mechanism.
- During cropEditingActive, the full-pitch viewBox must be temporarily restored so handles are usable. When cropEditingActive becomes false, restore the cropped viewBox.
- Handles are only rendered when interactive={true} AND cropEditingActive is true. They must never appear in DrillViewer, CoachPlanView, or PrintView.
- The "Edit crop" toolbar button must follow the same conditional rendering pattern as other toolbar controls in PlanBuilder — only visible to admins in the builder, never in read-only views.
- Do not change any functionality not mentioned.