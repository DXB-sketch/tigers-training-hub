# DEBUG-CHANGES1

## ISSUE 1 — Creating a new plan redirects to login

### Part 1 — src/components/layout/ProtectedRoute.jsx

Removed the intermediate `if (user && !role) return null` check that could return
null for the wrong reasons. Changed `if (!loading && !user)` to `if (!user)` (the
`!loading` guard was redundant since `if (loading) return null` already handled
that case). Added `role &&` guard to the role mismatch check so it never redirects
when role hasn't loaded yet. Changed `return children` to `return <>{children}</>`.

Before:
```jsx
if (loading) return null
if (!loading && !user) return <Navigate to="/login" replace />
if (user && !role) return null
if (requiredRole && role !== requiredRole) return <Navigate to="/login" replace />
return children
```

After:
```jsx
if (loading) return null
if (!user) return <Navigate to="/login" replace />
if (role && requiredRole && role !== requiredRole) return <Navigate to="/login" replace />
return <>{children}</>
```

### Part 2 — src/context/AuthContext.jsx

Added `useRef` to the React import. Added `const userRef = useRef(null)` after
the state declarations. Updated every `setUser(...)` call to also write to
`userRef.current` so the ref always mirrors the state value. Changed the
`onAuthStateChange` handler to check `!userRef.current` instead of `!user`
(the `user` variable was a stale closure that always read `null` at registration
time). Also removed the `&& session` guard on `TOKEN_REFRESHED` (redundant since
we are in the `else` branch where session is truthy).

Key changes:
- `import { ..., useRef }` added
- `const userRef = useRef(null)` added
- In `fetchProfile` if-branch: `setUser(profile); userRef.current = profile`
- In `fetchProfile` else-branch: `setUser(null); userRef.current = null`
- In `onAuthStateChange` SIGNED_OUT branch: `setUser(null); userRef.current = null`
- `event === 'SIGNED_IN' && !user` → `event === 'SIGNED_IN' && !userRef.current`

---

## ISSUE 2 — Clicking a plan in coach "All sessions" always opens the same plan

**No code changes were required.** After reviewing both files:

- `CoachDashboard.jsx` — the "All sessions" map already uses `p.id` in
  `navigate(\`/coach/plan/${p.id}\`)`. No hardcoded id or outer-scope variable.
- `CoachPlanView.jsx` — already uses `const { planId } = useParams()` and passes
  it to `usePlan(planId)` and `useDrills(planId)`. Does not call `useCoachSession`.
- `App.jsx` — route is `path="/coach/plan/:planId"` which matches what
  `useParams()` reads. No mismatch.

Both Cause A and Cause B described in the issue do not exist in the current
codebase. The issue is already correctly implemented.

---

## ISSUE 3 — Right-clicking a player opens the browser context menu and label editor

### Part A — src/pages/PlanBuilder.jsx

Added `if (e.button !== 0) return` as the first line of `handlePlayerMouseDown`
and `handleElementMouseDown`. This causes right-clicks (button=2) and middle-clicks
(button=1) to be ignored by both the drag/threshold system (dragCandidateRef) and
the direct drag system (draggingRef), so neither the label editor nor any drag
state is activated on a right-click.

### Part B — src/components/drill/PitchCanvas.jsx

Added `e.stopPropagation()` to the player `onContextMenu` handler (the one in
`safePlayers.map`). The handler now calls `e.preventDefault()`,
`e.stopPropagation()`, then `onContextMenu?.(...)` in that order. This stops the
contextmenu event from bubbling past the player group to any ancestor that might
not call `preventDefault`, which was causing the native browser context menu to
appear. The `onContextMenu` handlers for cones, balls, and arrows were not changed.

---

## Build verification

`npm run build` completes without errors after all changes.
