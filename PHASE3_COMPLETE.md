# Phase 3 Complete

## What was built

### Step 1 — New plan creation (PlanLibrary)
- "+ New plan" button toggles an inline form directly below the page header
- Form fields: Team (select from useTeams), Week number (number input 1-52), Session title (text input)
- On submit: inserts to Supabase with status='draft', created_by=user.id; navigates to /admin/plans/:id on success
- On error: shows "Could not create plan. Try again." inline, does not navigate
- Cancel collapses and resets the form
- CSS added to PlanLibrary.css; .secondary-btn style also added there

### Step 2 — Plan metadata editing (PlanBuilder)
- New `.plan-meta-header` bar below the top bar: Session title, Team (select), Week number, Status badge
- Session title and week are inline-edit inputs (blur/Enter to save)
- Team is a select wired to useTeams(); changing it saves immediately
- All save via supabase.from('plans').update(...)
- On save failure: reverts to previous value, shows "Save failed" via SaveIndicator for 3 seconds
- Removed the old "Save draft" and "Publish" toolbar buttons in favour of the status badge toggle

### Step 3 — Drill management (PlanSidebar)
- Add drill: inserts blank drill with drill_order = max+1; immediately selects new drill
- Delete drill: each row has a "×" button that shows inline "Delete? Yes / No" within the row (no window.confirm, no modal)
  - Yes: deletes from Supabase, resequences remaining drills, selects adjacent drill
- Reorder: drag handle (↕) uses HTML5 Drag and Drop API (draggable, onDragStart/Over/Drop)
  - drag-over row shows 2px gold top border
  - On drop: upserts all drill_order values in one call
- The "Plan details" sidebar section was removed; plan metadata editing moved to the new header (Step 2)

### Step 4 — Drill text field editing (PlanBuilder)
- All fields converted from uncontrolled (defaultValue) to controlled (value + onChange)
- selectedDrill state in PlanBuilder is the source of truth; onChange updates it immediately
- onBlur saves to Supabase via saveDrillField(drillId, dbField, value)
- DB field mapping: coachingPoints→coaching_points, pitchCrop→pitch_crop, goalSize→goal_size
- SaveIndicator shows "Saving..." / "Saved" / "Save failed" at 8px uppercase in the de-drill-num row
- Organisation field uses defaultValue + key (uncontrolled) with an onBlur parser to avoid cursor-jump issues during JSON conversion; all other fields are fully controlled

### Step 5 — Publish/draft toggle
- Status badge in plan-meta-header is a clickable button
- Click shows inline confirmation text + Publish/Revert and Cancel buttons
- On confirm: optimistic update to local state, then Supabase update
- On failure: reverts status, shows "Save failed" via SaveIndicator for 3 seconds

### Step 6 — Pitch canvas interactivity
- PitchCanvas accepts `interactive` prop (default false); all event handlers are no-ops when false
- Toolbar buttons set activeTool state; active button shows dark bg + gold text
- Goal size and pitch crop buttons update activeGoalSize/activeCrop state, save to Supabase immediately
- Click-to-place: red/blue player, ball, cone — uses viewBox-scaled coordinates
- Arrow drawing: two-click flow; first click sets arrowStart, second click completes the arrow; a preview line follows the mouse between clicks
- Drag to move: SVG mouse events (mousedown/mousemove/mouseup) on player and element groups
  - Players and cones use a 6px threshold (dragCandidateRef) before drag activates; resolves as click if threshold not crossed
  - Ball uses immediate drag (draggingRef) with no threshold
  - Position updates live in state during drag; saves to Supabase only on mouseup
- Right-click on any player, element, or arrow: removes it, saves pitch state
- Player label editor: clicking a player with no tool active opens a foreignObject overlay with two inputs (label abbreviation max 3 chars, full name); closes and saves on blur or Enter
- Cone rendered as a gold triangle (polygon); ball unchanged; zone ellipse unchanged
- Crop selector: full=480h, half=280h, third/custom=220h (uses VIEW_BOXES map)
- Coach DrillViewer passes no interactive prop so it remains completely read-only

### Step 7 — TopNav coach team name
- AuthContext.fetchProfile now queries coach_assignments joined to teams when role === 'coach'
- teamName added to AuthContext state and exposed in context value
- TopNav coach variant renders "Name · Team name" (omits team if null)

### Step 8 — Week filter (PlanLibrary)
- weekFilter state added; passed to usePlans as weekNumber
- usePlans already supported weekNumber filter (.eq('week_number', weekNumber))
- Week dropdown options derived dynamically from returned plans: [...new Set(plans.map(p => p.weekNumber))].sort(desc)
- Selecting a week re-runs usePlans with the filter

---

## Debug fixes applied after Phase 3 build

These were found and fixed during post-build testing. Phase 4 must not undo or
contradict any of these.

### Fix 1 — ProtectedRoute auth flash causing logout on navigation
**File:** `src/components/layout/ProtectedRoute.jsx`

Simplified to three clear cases only:
```jsx
if (loading) return null
if (!user) return <Navigate to="/login" replace />
if (role && requiredRole && role !== requiredRole) return <Navigate to="/login" replace />
return <>{children}</>
```
The previous version had an `if (user && !role) return null` intermediate check and
a redundant `!loading &&` on the redirect condition. These caused flashes to /login
during normal navigation. The rule is: never redirect while loading is true.

### Fix 2 — AuthContext stale closure in onAuthStateChange
**File:** `src/context/AuthContext.jsx`

Added `useRef` import and `const userRef = useRef(null)` inside `AuthProvider`.
Every `setUser(value)` call is now paired with `userRef.current = value` immediately
after. The `onAuthStateChange` handler checks `!userRef.current` instead of `!user`
to avoid reading the stale closure value (which was always null at registration time).

SIGNED_OUT branch now also clears `userRef.current = null`. TOKEN_REFRESHED handler
was simplified (removed the redundant `&& session` guard — that branch only runs
when session is truthy). The unused `useNavigate` import was removed.

The current `onAuthStateChange` handler shape:
```js
if (event === 'SIGNED_OUT' || !session) {
  setUser(null); userRef.current = null; setRole(null); setTeamName(null); setLoading(false)
} else if (event === 'SIGNED_IN' && !userRef.current) {
  fetchProfile(session.user.id)
} else if (event === 'TOKEN_REFRESHED') {
  setLoading(false)
}
```

### Fix 3 — Creating a new plan redirected to /login
**File:** `src/pages/PlanLibrary.jsx`

The navigate call after a successful plan insert was:
```js
navigate(`/admin/plans/${data.id}/edit`)   // WRONG — no such route
```
There is no `/admin/plans/:id/edit` route in App.jsx. The URL hit the wildcard
`<Route path="*" element={<Navigate to="/login" replace />} />` which sent the user
to login. The plan was created correctly; only the navigation target was wrong.

Fixed to:
```js
navigate(`/admin/plans/${data.id}`)        // matches the /admin/plans/:id route
```

This now matches the PlanList.jsx navigation pattern and the defined App.jsx route.

### Fix 4 — Right-clicking a player opened the label editor and browser context menu
**Files:** `src/pages/PlanBuilder.jsx`, `src/components/drill/PitchCanvas.jsx`

**PlanBuilder.jsx** — added `if (e.button !== 0) return` as the first line of both
`handlePlayerMouseDown` and `handleElementMouseDown`. Right-clicks (button=2) are
now ignored by the drag/threshold system entirely, so a right-click never sets
`dragCandidateRef` and never opens the label editor.

**PitchCanvas.jsx** — added `e.stopPropagation()` to the player `onContextMenu`
handler in `safePlayers.map`. It now calls `e.preventDefault()`,
`e.stopPropagation()`, then `onContextMenu(...)` in that order. This stops the
event from reaching ancestors that might not call preventDefault, which was
allowing the native browser context menu to appear. The cone, ball, and arrow
`onContextMenu` handlers were not changed — they were working correctly.

### Fix 5 — Clicking a drill from a historical plan showed drills from the wrong plan
**Files:** `src/pages/DrillViewer.jsx`, `src/App.jsx`, `src/pages/CoachPlanView.jsx`

**Root cause:** `CoachDrillViewer` always called `useCoachSession(user.id)`, which
returns drills for the current week's session plan only. When a coach opened a
historical plan via "All sessions" and clicked a drill, the drill ID wasn't in the
session's drill list, so `drills.find(...)` returned undefined and fell back to
`drills[0]` — the first drill of the wrong plan.

**DrillViewer.jsx** — added a new `CoachPlanDrillViewer` sub-component that takes
`planId` and `drillId` as props and uses `useDrills(planId)` + `usePlan(planId)`.
Its prev/next navigation stays within the plan (`/coach/plan/:planId/drill/:drillId`)
and its back button returns to `/coach/plan/:planId`. The default DrillViewer export
now reads `{ id, planId, drillId }` from `useParams()` and renders
`CoachPlanDrillViewer` when `planId` and `drillId` are both present.

**App.jsx** — added the route:
```
/coach/plan/:planId/drill/:drillId  →  ProtectedRoute(coach) → DrillViewer
```

**CoachPlanView.jsx** — both navigate calls (overview table row and drill card)
changed from `/coach/drill/${drill.id}` to `/coach/plan/${planId}/drill/${drill.id}`.

The original `/coach/drill/:id` route and `CoachDrillViewer` (session-based, using
`useCoachSession`) are unchanged. Drills opened from CoachDashboard still use that
path and work correctly.

---

## Current route table (complete)

| Path | Component | Guard |
|---|---|---|
| /login | Login | — |
| /coach | CoachDashboard | coach |
| /coach/drill/:id | DrillViewer → CoachDrillViewer | coach |
| /coach/plan/:planId | CoachPlanView | coach |
| /coach/plan/:planId/drill/:drillId | DrillViewer → CoachPlanDrillViewer | coach |
| /admin | AdminDashboard | admin |
| /admin/teams | TeamManagement | admin |
| /admin/plans | PlanLibrary | admin |
| /admin/plans/:id | PlanBuilder | admin |
| /admin/plans/:id/preview | DrillViewer → AdminDrillViewer | admin |
| / | → /login | — |
| * | → /login | — |

---

## Deviations from spec

1. **Organisation field is uncontrolled (defaultValue + key)** — the spec says controlled, but using value + onChange on a JSON-parsing textarea causes cursor-jump on every keystroke because we'd need to store raw text separately from the parsed object. Used defaultValue + key={drillId} so the textarea resets when drill changes, and parse only on blur. Behaviour is identical to the spec from the user's perspective.

2. **Plan details sidebar section removed** — the spec adds a plan header above the builder layout (Step 2) that shows title/team/week. Keeping these fields in both the sidebar and the header would be redundant and potentially confusing (which one saves?). Removed the sidebar's read-only "Plan details" section. The sidebar now shows only the drill list.

3. **"Save draft" / "Publish" top bar buttons removed** — replaced entirely by the inline status badge in the plan-meta-header. The top bar retains only "← Plans" and "Preview" which are navigation, not save actions.

4. **Cone rendered as a triangle** — the spec says 'cone' type goes into elements array but doesn't define a visual. Used a gold triangle (polygon) matching football training imagery and DESIGN.md's gold colour.

5. **New plan navigates to /admin/plans/:id (not /edit)** — the Phase 3 spec said "navigates to /admin/plans/:id/edit" but no such route exists. The correct target is /admin/plans/:id which renders PlanBuilder. Do not add an /edit suffix variant.

---

## Supabase patterns used

- `supabase.from('drills').insert({...}).select('*').single()` — insert and retrieve new row in one call
- `supabase.from('drills').upsert([{id, drill_order},...])` — batch reorder
- `supabase.from('drills').update({ players: JSON.stringify(...) })` — pitch state saves stringify the arrays to JSON strings (DB columns are text or jsonb)
- All direct supabase calls in the component, not in hooks, per spec

---

## Phase 4 needs to know

1. **Organisation textarea is uncontrolled** — if Phase 4 adds real-time collaboration or external updates to drill fields, the org field will not reflect external changes until the user navigates away and back. A future fix would store raw orgText in a separate state variable.

2. **Arrows store path `d` strings** — e.g. `M360 110 L540 200`. If Phase 4 needs to manipulate arrow endpoints (e.g. snap to player), the data model will need separate x1/y1/x2/y2 fields rather than an opaque path string.

3. **No zone-rect or zone-circle tools wired** — the spec listed these in the toolbar activeTool values but Phase 3 only implemented ball, cone, red-player, blue-player, move-arrow, pass-arrow. Zone drawing (click-drag to define area) is a Phase 4 candidate.

4. **mockData.js is still in place** — unused by any page but kept per spec.

5. **No label editor close button** — the foreignObject label editor closes on blur of the name input or Enter key. A close button was not added to keep it minimal per spec.

6. **Pitch state saves arrays as JSON strings** — `players: JSON.stringify(players)`. If the DB columns are `jsonb`, Supabase may auto-parse them on read (returning arrays, not strings). The current useDrills hook handles both: `d.players ?? []` (already parsed by Supabase) or parses if string. Phase 4 should verify the DB column type and remove the stringify if columns are jsonb.

7. **DrillViewer has three sub-components** — `CoachDrillViewer` (session plan, useCoachSession), `CoachPlanDrillViewer` (historical plan, usePlan+useDrills), and `AdminDrillViewer` (admin preview, usePlan+useDrills). The default export picks the right one based on useParams(). Do not collapse these or change the detection logic without reading the route table above.

8. **ProtectedRoute must not redirect while loading** — the `if (loading) return null` check must always be the first line. Any future changes to ProtectedRoute must preserve this. Never add logic between the loading check and the component render that could cause a redirect during a loading state.

9. **userRef must stay in sync with setUser** — in AuthContext, every `setUser(value)` call must be immediately followed by `userRef.current = value`. If new code paths call setUser, they must also update userRef.current or the onAuthStateChange guard will break and trigger redundant fetchProfile calls.
