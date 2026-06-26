Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

This is a routing simplification for the president role. Do not change any 
functionality not explicitly mentioned below, and do not touch coach or 
admin routes/pages.

---

GOAL

Replace the PresidentDashboard page with the UserManagement page. When a 
president visits /president, they should see exactly what currently 
renders at /president/users. The separate /president/users route is 
removed and the standalone PresidentDashboard component is deleted. The 
"President" nav link in TopNav already points at /president — no change 
needed there.

---

STEP 1 — Update routing

In the route definitions (wherever <Route path="/president" .../> and 
<Route path="/president/users" .../> are declared):
- Change the /president route's element from PresidentDashboard to 
  UserManagement, keeping allowedRoles={['president']}.
- Remove the /president/users route entirely.

STEP 2 — Remove the PresidentDashboard component

- Delete the PresidentDashboard component file and its CSS file.
- Search the codebase for any remaining imports of PresidentDashboard and 
  remove them.
- Search the codebase for any <Link to="/president/users">, 
  navigate('/president/users'), or hardcoded "/president/users" strings 
  and update them to "/president". Check UserManagement.jsx, 
  UserDetailPanel.jsx, and any back-links or breadcrumbs.

STEP 3 — Verify

- Confirm TopNav.jsx's "President" link still points to /president (just 
  verify, do not change unless it's wrong).
- Confirm ProtectedRoute's allowedRoles handling works correctly for the 
  single consolidated /president route.

---

ACCEPTANCE CRITERIA

[ ] Visiting /president as a president shows the same content that 
    previously rendered at /president/users
[ ] /president/users no longer exists as a defined route
[ ] PresidentDashboard.jsx and its CSS file are deleted
[ ] No remaining imports or references to PresidentDashboard anywhere
[ ] No remaining links or navigate() calls pointing to /president/users
[ ] Coach and admin routes/pages are unaffected
[ ] npm run build completes without errors
[ ] No hardcoded hex values introduced in any modified file

---

WORKING NOTES

- Do not add a pending invites section, cancel invite, or resend invite 
  functionality. That was considered and explicitly deferred — scope is 
  routing/page consolidation only.
- Do not modify UserManagement.jsx's internal logic or layout, only how 
  it is reached.
- If anything else (e.g. a stats card or "Manage users" link elsewhere) 
  references the old dashboard, remove that reference since the dashboard 
  no longer exists.

When done, summarize what was changed and confirm nothing else was touched.