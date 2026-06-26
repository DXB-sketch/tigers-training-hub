Read CLAUDE.md and PHASE10_COMPLETE.md before doing anything else.

These are targeted bug fixes. Do not change any functionality not
explicitly mentioned. Fix each issue in the order listed. After all
fixes, confirm what was changed for each issue number.

---

ISSUE 1 — Pitch canvas overflows viewport width on mobile

Observed: On mobile (≤ 540px), the pitch diagram extends beyond the right edge of
the screen, forcing horizontal scrolling to see the full pitch. A previous attempt
to fix this added scroll/pan behaviour inside the canvas, but the canvas itself is
still too wide — the pitch container is wider than the viewport. There should be a
small margin between the pitch edge and the screen edge. No horizontal scrolling of
the page should occur.

Root cause: Two compounding problems:

1. `.pitch-block` in DrillSheet.css has `padding: 16px 28px 0` — the 28px left/right
   padding is applied on mobile the same as desktop. On a 375px screen this leaves
   only 319px for the pitch. But the containing `.drill-page` has no explicit
   `width: 100%` constraint and no `overflow: hidden`, so its children can push it
   wider than the viewport.

2. The `.drill-page` element and its ancestors have no `max-width: 100vw` or
   `overflow-x: hidden` guard. When the SVG inside `.pitch-svg-wrap` renders at its
   natural width (which respects `width="100%"` relative to its container), the
   container itself is not constrained to the viewport — so `width: 100%` resolves
   to a value wider than the screen if any ancestor has been pushed out.

Fix: Make two changes in src/components/drill/DrillSheet.css only. Do not touch
PitchCanvas.jsx, PlanBuilder.css, or any other file.

Change 1 — Add a mobile override for .pitch-block to remove horizontal padding
so the pitch sits flush (with a small margin) against the viewport edges:

  @media (max-width: 540px) {
    .pitch-block {
      padding-left: 12px;
      padding-right: 12px;
    }
  }

This gives 12px breathing room on each side — visible margin between pitch and screen
edge — without the excessive 28px desktop padding that was forcing overflow.

Change 2 — Add overflow-x: hidden to .drill-page so that if anything inside ever
exceeds the container width, it clips rather than stretching the page:

  In the existing .drill-page rule, add:
    overflow-x: hidden;

This is a one-line addition to the existing rule, not a new media query block.

Also check whether .pitch-block-dual (the two-canvas layout for drills with a
progression pitch) has the same problem. If so, apply the same 12px mobile padding
override to it. The dual layout should not force horizontal scroll either.

Do not change the desktop padding (28px). Do not change PitchCanvas.jsx. Do not
add any new scroll containers. Do not add overflow: hidden to .pitch-svg-wrap —
it already has it and constraining the parent is the correct fix.

---

ACCEPTANCE CRITERIA

[ ] On a 375px wide viewport, the pitch diagram fits entirely within the screen with
    visible margin on both left and right sides — no horizontal scrolling required
[ ] On desktop (> 540px), the pitch padding and layout are visually identical to before
[ ] The dual-pitch layout (progression pitch) also fits within the screen on mobile
    without horizontal scroll
[ ] PlanBuilder pitch editor is unaffected — it has its own .pitch-editor-wrap in
    PlanBuilder.css and must not be touched
[ ] npm run build completes without errors

---

WORKING NOTES

- The fix is CSS-only. No JavaScript changes, no component changes.
- DrillSheet.css is at src/components/drill/DrillSheet.css.
- The `.drill-page` max-width is 760px — this is correct and must stay. The
  overflow-x: hidden addition is purely a safety guard.
- The 12px mobile padding value matches the existing mobile spacing used elsewhere in
  the app (CoachDashboard uses 16px padding on mobile; 12px for the pitch gives a
  slightly tighter but consistent feel that makes the pitch feel full-width and
  intentional rather than cramped).
- Do not use vw units for the pitch width. Do not set an explicit width or height on
  .pitch-svg-wrap. The SVG already has width="100%" on the element — constraining
  the wrapper via padding is the right approach.
- The prior attempt to add pan/scroll inside the canvas (touchStateRef pan behaviour
  in PitchCanvas.jsx for interactive mode) is for the admin plan builder only
  (interactive={true}). The coach drill viewer always uses interactive={false} — that
  code path does not apply here. Do not remove or change the pan/pinch code.
