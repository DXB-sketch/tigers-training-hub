Got everything I need. Here's the prompt:

---

```
Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

This is a targeted feature addition. Do not change any functionality not explicitly mentioned. Implement the change below, then confirm what was changed.

---

ISSUE 1 — Custom pitch crop option with drag handles

Requested: Add a "Custom" crop option to the pitch crop selector in PlanBuilder. When selected, the admin can drag handles on the edges and corners of the pitch canvas to crop the visible area. The crop clips the rendered pitch — anything outside the dragged boundary is not visible, exactly as the existing half and third crop options hide portions of the full pitch.

Root cause: N/A — this is a new feature.

---

PART A — Add "Custom" to the crop selector

Add "Custom" as a selectable option in the pitch crop selector UI in PlanBuilder, alongside the existing Full, Half, and Third options. Match the capitalisation and label style of the existing options.

---

PART B — Data shape for custom crop

The custom crop boundary must be stored in the drills.pitch_crop column as a JSON string encoding the four crop boundaries in viewBox units:

  '{"type":"custom","top":0,"left":0,"right":720,"bottom":405}'

Where 720 and 405 are the full viewBox width and height (use whatever the actual viewBox dimensions are in PitchCanvas — do not hardcode if they are already defined as constants).

The top/left values represent the inset from the top-left origin. The right/bottom values represent the distance from the origin (not the inset from the right/bottom edge).

When pitch_crop is a JSON string with type "custom", PitchCanvas must parse it and use the four boundary values to clip the rendered pitch. When pitch_crop is "full", "half", or "third", the existing rendering logic must be completely unchanged.

On initial selection of "Custom" from the dropdown, initialise the crop boundaries to the full viewBox dimensions (no crop applied yet) and save immediately, so the canvas switches to custom mode with handles visible.

---

PART C — Render the crop clip in PitchCanvas

When pitch_crop is a custom crop object:

1. Add a <clipPath> element inside <defs> (which must remain the first child of <svg>) with id="custom-crop-clip". The clipPath contains a <rect> defined by the four boundary values parsed from pitch_crop.

2. Wrap the entire pitch rendering group (green background rect, all pitch lines, goals, markings) in a <g clipPathUrl="url(#custom-crop-clip)">. Player dots, arrows, zone elements, and callout annotations must NOT be inside this clip group — they render on top of the clipped pitch without being clipped themselves.

3. The SVG viewBox itself does not change — it always remains the full pitch dimensions. Only the clipPath controls what pitch area is visible.

---

PART D — Drag handles (interactive mode only)

Drag handles are only rendered when interactive={true} (i.e. in PlanBuilder). They must not appear in DrillViewer, PrintView, or any read-only canvas.

Render 8 handles total:
- 4 edge handles: top-centre, bottom-centre, left-centre, right-centre
- 4 corner handles: top-left, top-right, bottom-left, bottom-right

Handle appearance: filled rectangles, 10×10 viewBox units, fill="var(--surface)", stroke="var(--ink)", stroke-width="1". No border-radius. Position them on the crop boundary edges, centred on each edge midpoint or corner.

Drag behaviour using SVG mouse events (mousedown/mousemove/mouseup on the SVG root — the same pattern already used for player dragging in PitchCanvas):

- Edge handles: dragging top or bottom handle moves only the top or bottom boundary. Dragging left or right handle moves only the left or right boundary.
- Corner handles: dragging a corner moves both adjacent boundaries simultaneously (e.g. top-left corner moves top AND left boundaries together).
- Minimum crop size: do not allow any boundary to cross its opposite — top cannot exceed bottom, left cannot exceed right. Enforce a minimum of 40 viewBox units between opposite boundaries.
- On mouseup, save the updated pitch_crop JSON string to the database using the same direct supabase call pattern already used in PitchCanvas for player and arrow saves. Do not route this through a hook.

Transparent hit-area overlays must be used for handles — render a transparent rect of at least 24×24 viewBox units centred on each handle position in addition to the visible 10×10 rect, with pointer-events="all". This ensures reliable pointer events in a responsive SVG.

---

PART E — Read-only rendering

In DrillViewer, CoachPlanView, and PrintView (anywhere interactive={false}), when pitch_crop is a custom crop object, apply the clipPath clip exactly as described in Part C. The drag handles must not render. The clipped pitch must look identical to how a half or third crop looks — only the selected area is visible.

---

ACCEPTANCE CRITERIA

[ ] "Custom" appears in the pitch crop selector alongside Full, Half, and Third
[ ] Selecting "Custom" switches the canvas to custom mode with handles visible on all 4 edges and 4 corners
[ ] Dragging an edge handle crops only that side
[ ] Dragging a corner handle crops both adjacent sides simultaneously
[ ] Crop boundaries cannot cross — minimum 40 viewBox units between opposite boundaries
[ ] On drag release the crop saves automatically to the database
[ ] Reloading the page restores the saved custom crop correctly
[ ] The clipped pitch renders correctly in DrillViewer and PrintView with no handles visible
[ ] Player dots, arrows, and zone elements are not clipped — they render over the full SVG area
[ ] <defs> remains the first child of <svg>
[ ] All existing crop options (Full, Half, Third) are completely unchanged
[ ] No hardcoded hex values — all colours use CSS custom property tokens
[ ] npm run build completes without errors

---

WORKING NOTES

- SVG drag must use mousedown/mousemove/mouseup on the SVG root, not the HTML5 drag API. The HTML5 drag API is reserved for sidebar drill reordering only.
- Transparent hit-area overlays are mandatory — visible handle shapes are too small in DOM pixels for reliable pointer events in a responsive SVG.
- The clipPath must live inside <defs>, which must be the first child of <svg>. Do not place <defs> anywhere else.
- pitch_crop is a text column in the drills table. JSON.stringify before saving, JSON.parse on read. Use a try/catch when parsing — if the value is not valid JSON, treat it as a string crop type ("full", "half", "third") and fall through to the existing logic.
- Do not change any functionality not mentioned.
```