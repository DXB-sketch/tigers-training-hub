Good, that confirms scope. So this single prompt needs to cover three independent features:

1. **Plain green crop option** (original change 2 request — never sent)
2. **Player label dynamic positioning** (change 3)
3. **Second pitch canvas with text box resizing** (change 4)

These are genuinely unrelated to each other and to custom crop, so bundling them as three separate sections in one prompt is reasonable — none of them touch the same code paths as the custom crop work. Let me write it.

---

```
Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

This prompt covers three independent feature additions. They do not depend on each other and do not touch the custom crop work already completed. Implement all three, then confirm what was changed for each issue number. Do not change any functionality not explicitly mentioned.

---

ISSUE 1 — New pitch crop option: plain green background

Requested: The president requires a new pitch crop option that renders only a solid green rectangle — no pitch lines, no centre circle, no penalty areas, no goals. Nothing on the surface except the green fill. This is a new option alongside the existing crop options (Full, Half, Third, Custom), not a replacement for any of them.

Implementation:

PART A — Add the new crop value
Add "Plain green" (or "Blank" — match whichever label casing convention is already used by the other crop options) as a selectable option in the pitch crop selector UI in PlanBuilder, alongside Full, Half, Third, and Custom. Use a value string consistent with how the other crop types are stored (e.g. "blank").

PART B — Render logic in PitchCanvas
When pitch_crop is the blank value:
- Render only a filled rectangle covering the full SVG viewBox using fill="var(--pitch-green)"
- Do not render any pitch line markings, centre circle, penalty arcs, penalty spots, goal shapes, or corner arcs
- Player dots, arrows, zone elements, and callout annotations must still render normally on top of the green rectangle — blank only suppresses pitch structure, not drill content
- Use the full pitch viewBox dimensions (same as the Full crop option) — there is no cropping involved in this option, only suppression of markings
- <defs> must remain the first child of <svg>

PART C — Save, load, and read-only rendering
The blank crop value saves to and loads from the drills.pitch_crop text column correctly, the same way "full", "half", and "third" already do. It must render correctly in PlanBuilder, DrillViewer, CoachPlanView, and PrintView.

---

ISSUE 2 — Player rename label appears off-screen when player is near the top of the pitch

Observed: When an admin clicks a player dot to rename it, the label/input for renaming appears above the player dot. When the player is positioned close to the top edge of the pitch, this label renders partially or fully outside the visible pitch area and is not usable.

Root cause: The player label/rename input is always positioned with a fixed offset above the player dot, regardless of the player's vertical position in the viewBox. There is no check for whether that position would place the label outside the visible pitch area.

Fix: Locate the code in PitchCanvas.jsx that renders the player rename label/input (this is the foreignObject or positioned element that appears when a player is selected for renaming). Before rendering, calculate whether the label's default above-player position would place it outside the top edge of the pitch viewBox (i.e. player's y-coordinate minus the label's height and offset is less than 0, or less than a small safe margin from the top edge).

If the label would be cut off at the top, render it below the player dot instead, using the equivalent downward offset. If the label fits above the player normally, keep the existing above-player position.

This check must be dynamic per-player, evaluated each time a label is shown, based on that player's current y-coordinate — not a fixed rule for the whole canvas. A player near the bottom of the pitch keeps the existing above-player label position; only players near the top edge flip to below-player.

Do not change the rename label's behaviour, content, or styling — only its vertical positioning logic.

---

ISSUE 3 — Add a second pitch canvas to show drill progressions, with text fields resizing to accommodate it

Requested: Within the drill creator (PlanBuilder), add the ability to insert a second pitch canvas below the first, so admins can show a progression or variation of the drill setup. This should work similarly to the existing "Add drill" button — a clearly visible button beneath the current pitch canvas that adds a second one when clicked.

When a second pitch canvas is present, the text fields below the pitches (Description, Setup, Organisation, Progressions, Coaching points) must shrink slightly so the overall drill editor still fits on the same page without requiring significantly more scrolling. When the second pitch canvas is removed, the text fields return to their original size.

Implementation:

PART A — Data model
Add support for a second pitch canvas per drill. Each drill currently stores a single set of players, arrows, elements, and pitch_crop. Extend this to support an optional second canvas with its own independent players, arrows, elements, and pitch_crop — stored as new jsonb columns or nested within the existing structure, whichever requires the smaller, more surgical schema change. State your approach and the exact column names/structure you use when you report back, since this affects how DrillViewer and PrintView read the data.

If a drill has no second canvas, these fields are null/empty, and the UI shows only one pitch (the current behaviour, completely unchanged).

PART B — "Add pitch" button
Below the existing pitch canvas in PlanBuilder, render an "Add pitch" button when the drill does not yet have a second canvas. Style it consistently with the existing "Add drill" button. Clicking it initialises an empty second canvas (empty players/arrows/elements, pitch_crop defaulting to "full") and renders a second PitchCanvas instance below the first, with its own independent toolbar and crop selector.

When a second canvas exists, render a "Remove pitch" button (or a small delete control) associated with the second canvas, allowing the admin to delete it. Removing it clears the second canvas data for that drill and returns the layout to a single pitch.

The two pitch canvases must be fully independent — separate player placement, separate arrows, separate crop selection. Do not let interactions on one canvas affect the other.

PART C — Text field resizing
When a drill has two pitch canvases, the text content fields below (Description, Setup, Organisation, Progressions, Coaching points) must reduce in size — apply a CSS class or conditional style that decreases textarea/input height, font-size, and/or padding modestly (do not make them so small that text becomes unreadable; this is a space-saving adjustment, not a redesign). When the second canvas is removed, the text fields must return to their original size with no leftover sizing artifacts.

This sizing change applies only within the PlanBuilder editor, not within DrillViewer, CoachPlanView, or PrintView — those are read-only displays of already-written content and are not subject to this constraint. PrintView should render both pitches and their full content at full size; if two pitches plus full text content do not fit on one printed page, allow the content to flow to a second printed page rather than shrinking the read-only output. Do not shrink any read-only text rendering.

PART D — Read-only rendering of two pitches
In DrillViewer, CoachPlanView, and PrintView, when a drill has a second canvas, render both pitches in sequence (first canvas, then second canvas) above the existing text content sections, each as its own read-only PitchCanvas instance with interactive={false}. Add a small label above each ("Setup" and "Progression", or similar — use your judgement for a clear, minimal label) so it's clear to the coach which pitch is which. Keep this label subtle and consistent with the existing typography scale in DESIGN.md (8-9px uppercase eyebrow style).

---

ACCEPTANCE CRITERIA

[ ] "Plain green" appears as a selectable crop option alongside Full, Half, Third, Custom
[ ] Selecting it renders a solid green pitch with no markings, goals, or lines
[ ] Player dots, arrows, and zone elements still render correctly over the plain green surface
[ ] Plain green crop saves, loads, and renders correctly in PlanBuilder, DrillViewer, and PrintView
[ ] Renaming a player near the top of the pitch shows the label below the player instead of above
[ ] Renaming a player anywhere else on the pitch keeps the existing above-player label position
[ ] The flip between above/below is calculated dynamically per player based on position, not hardcoded to a fixed zone
[ ] "Add pitch" button appears below the pitch canvas when a drill has only one pitch
[ ] Clicking "Add pitch" adds a fully independent second pitch canvas with its own toolbar, crop selector, players, and arrows
[ ] "Remove pitch" control appears when a second canvas exists and deletes it cleanly when clicked
[ ] Text fields below the pitches shrink modestly when two canvases are present, in PlanBuilder only
[ ] Text fields return to original size when the second canvas is removed
[ ] DrillViewer, CoachPlanView, and PrintView render both pitches at full size with full-size text content when a drill has two canvases, with no shrinking
[ ] PrintView allows content to flow to a second page if needed rather than shrinking anything
[ ] All existing single-pitch drills are completely unaffected — no schema migration breaks existing data
[ ] <defs> remains the first child of <svg> in every pitch instance
[ ] No hardcoded hex values — all colours use CSS custom property tokens
[ ] npm run build completes without errors

---

WORKING NOTES

- pitch_crop, players, arrows, and elements are the existing per-drill pitch data fields. The second canvas needs its own equivalent set — name them clearly (e.g. players_2, arrows_2, elements_2, pitch_crop_2, or a single second_canvas jsonb column containing all four) and report which approach was used.
- safeParseArray() is the existing helper for safely parsing players/arrows/elements on read — reuse it for the second canvas's equivalent fields rather than writing a new parser.
- Do not change any functionality not mentioned.
- Report back clearly on the data model decision made in Issue 3 Part A, since this affects future work on this feature.
```