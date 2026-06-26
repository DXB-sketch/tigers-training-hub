Read CLAUDE.md and PHASE11_COMPLETE.md before doing anything else.

These are targeted bug fixes. Do not change any functionality not
explicitly mentioned. Fix each issue in the order listed. After all
fixes, confirm what was changed for each issue number.

---

ISSUE 1 — Pitch canvas still overflows viewport on mobile

Observed: On mobile (≤ 540px), the pitch diagram still extends beyond the right
edge of the screen and forces horizontal page scrolling. A previous fix reduced
the .pitch-block padding to 0 on mobile, but the overflow continues. The pitch
must fit within the viewport with a small visible margin on both sides. No
horizontal scrolling of the page should occur anywhere in the app on mobile.

Root cause: The overflow is not coming from .pitch-block padding — that was already
fixed. The root cause is that html and body have no overflow-x: hidden constraint.
Any element anywhere in the page that exceeds the viewport width (including the SVG
canvas, its wrapper, or any ancestor flex/grid container) will silently expand the
page body and enable horizontal scrolling. The SVG has width="100%" on the element
itself, but "100%" resolves relative to its containing block — if any ancestor has
been pushed wider than the viewport (even by 1px from a border or implicit min-width),
the SVG follows. The only reliable fix at this stage is to add overflow-x: hidden to
both html and body so the viewport itself becomes the hard limit.

Fix: In src/styles/base.css, add the following rule. Add it near the top of the file,
after any existing html/body reset rules:

  html, body {
    overflow-x: hidden;
    max-width: 100%;
  }

Also check whether .drill-page has width: 100% set. If it does not, add it:

  In src/components/drill/DrillSheet.css, in the existing .drill-page rule, ensure
  these properties are present:
    width: 100%;
    box-sizing: border-box;

These two properties together ensure .drill-page never intrinsically exceeds its
parent's width, even if no explicit max-width clamp is in force.

Do not change PitchCanvas.jsx. Do not change any padding values that were set in the
previous fix. Do not add overflow: hidden to .pitch-svg-wrap (it already has it).

---

ISSUE 2 — Bottom nav appears on the login page on mobile

Observed: On mobile (≤ 540px), the bottom navigation bar (BottomNav component added
in Phase 11) is visible on the /login page, before a user has authenticated. It
should not appear on the login page or during the auth loading state — only for
authenticated users.

Root cause: BottomNav's guard condition does not correctly exclude the unauthenticated
and loading states. The component uses useAuth() to read { user, role, loading }.
Either the guard is checking only role (which is null when loading is true AND when
logged out — so the guard should work for logged-out but may race during loading), or
the guard is missing entirely, or it checks role but role has a brief truthy value
during a re-render cycle before the session check resolves. The most reliable fix is
to guard on BOTH user AND loading — return null if either loading is true or user
is null.

Fix: In src/components/layout/BottomNav.jsx, locate the guard at the top of the
component (after the useAuth() and useLocation() hook calls). Replace whatever guard
is currently there with this exact pattern:

  const { user, role, loading } = useAuth()

  if (loading || !user) return null

This must come before any JSX is returned, and before any conditional rendering of
coach vs admin tabs. The loading check prevents a flash of the nav bar during the
initial auth resolution on page load. The !user check prevents it showing on /login
when the user is confirmed to be logged out.

Do not change the tab structure, icons, active state logic, or MoreSheet behaviour.
This is a one-line guard change only.

---

ACCEPTANCE CRITERIA

[ ] On a 375px wide viewport, no horizontal scrolling occurs on any page including
    /coach, /coach/drill/:id, /admin, /admin/plans, and /admin/teams
[ ] The pitch diagram fits within the screen on all drill sheet pages with visible
    margin on both sides
[ ] On desktop (> 540px), layout is visually identical to before — no change in
    pitch size, padding, or overflow behaviour
[ ] The bottom nav does not appear on /login on mobile
[ ] The bottom nav does not flash briefly on page load before disappearing on /login
[ ] The bottom nav continues to appear correctly on /coach, /admin, /admin/teams,
    /admin/plans, and /account for authenticated users
[ ] npm run build completes without errors

---

WORKING NOTES

- overflow-x: hidden on html and body is safe for this app. No page uses intentional
  horizontal scroll (the PitchCanvas pan behaviour is within a fixed-height wrapper,
  not a page-level scroll). This is a global guard, not a component-level fix.

- The loading || !user guard in BottomNav must use short-circuit OR (||) not AND (&&).
  If it were !user && !loading, it would show the nav while loading is true for
  logged-out users (wrong). The correct logic is: hide the nav if EITHER condition
  is true.

- Do not touch ProtectedRoute.jsx — it already handles auth correctly. This fix is
  only in BottomNav.jsx and base.css / DrillSheet.css.

- Do not remove the body.drill-mode .bottom-nav { display: none } rule from
  BottomNav.css — that is still needed for the drill sheet focus mode.
