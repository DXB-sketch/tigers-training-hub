Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

This is a small, scoped feature for the mobile pitch editor in
PlanBuilder.jsx / PitchCanvas.jsx. Do not modify any other files. Desktop
(viewport > 700px) must be pixel-identical to its current behaviour —
everything below is gated behind a mobile check.

---

GOAL: On mobile (<= 700px), the pitch SVG should render zoomed in by
default, pannable with one finger, and zoomable with two-finger pinch.

STEP 1 — Mobile flag
In PlanBuilder.jsx, add `isMobile` state from `window.innerWidth <= 700`,
updated on a `resize` listener (matches the existing `.builder-layout`
breakpoint in PlanBuilder.css — do not introduce a second breakpoint value).
Pass `isMobile` as a prop to PitchCanvas.

STEP 2 — Pan/zoom viewport
In PitchCanvas.jsx, when `interactive && isMobile`, wrap the existing
`<svg>` in a viewport `<div>` (`overflow: hidden`) and apply
`transform: translate(Xpx, Ypx) scale(S)` to the `<svg>`, driven by state
`{ scale, translateX, translateY }`.

- Default on mount and whenever `crop` changes: `scale = 1.6`, translate
  centred on the crop's centre point (viewBox width/2, height/2).
- One-finger touchmove pans by the finger's delta, clamped so the scaled
  SVG never reveals empty space outside the viewport.
- Two-finger touchmove: compute distance between touches each frame vs the
  previous frame to get a pinch ratio. Pinch-out decreases `scale` toward
  "fit" (`viewportWidth / viewBoxWidth`, whole crop visible). Pinch-in
  increases `scale`; if `scale` is within 0.05 of "fit" when a pinch-in
  starts, snap directly to `scale = 1.6`, re-centred on the crop centre.
  Clamp `scale` between fit and 1.6.
- Gate all new touch handlers behind `interactive && isMobile` — do not
  touch the existing mouse-based handlers (onSvgMouseDown/Move/Up/Click,
  dragCandidateRef, draggingRef) at all.
- `<defs>` must remain the first child of `<svg>` — the new wrapper goes
  around the `<svg>`, not inside it.
- Existing `svgCoords()` in PlanBuilder.jsx (uses
  `getBoundingClientRect()`) should not need changes — a CSS transform on
  the SVG is reflected in its rendered bounding box. Verify this is still
  true after your changes; if click/tap placement coordinates are off on
  mobile, fix `svgCoords()` rather than removing the transform.

---

ACCEPTANCE CRITERIA

[ ] At >700px, PlanBuilder/PitchCanvas behave exactly as before
[ ] At <=700px, pitch SVG renders at 1.6x default zoom, centred on crop
[ ] One-finger drag pans within bounds, without triggering tool placement
[ ] Two-finger pinch-out zooms toward "fit whole crop"
[ ] Two-finger pinch-in from near-fit snaps back to 1.6x, re-centred
[ ] Tapping to place an element (existing tools) still places it at the
    correct pitch coordinate on mobile
[ ] No hardcoded hex values, no Tailwind, no border-radius introduced
[ ] npm run build completes without errors

WORKING NOTES
Do not start on the FAB menu or selection toolbar — those are separate
prompts. If you find yourself reasoning about them, stop and stay scoped to
pan/zoom only.