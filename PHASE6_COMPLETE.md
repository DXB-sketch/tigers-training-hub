# Phase 6 Complete

## New files created

- `src/hooks/useUsers.js` — fetches all profiles ordered by role asc, name asc; returns `{ users, loading, error, refetch }`
- `src/pages/PresidentDashboard.jsx` + `PresidentDashboard.css` — president home at `/president`; shows total users + active coaches counts; links to `/president/users` and `/admin`
- `src/pages/UserManagement.jsx` + `UserManagement.css` — user list at `/president/users`; grouped by role; inline invite form; detail panel on right
- `src/components/president/UserDetailPanel.jsx` + `UserDetailPanel.css` — editable account fields (save on blur), password reset, deactivate/reactivate with confirmation

## Modified files and what changed

### `src/pages/Login.jsx`
- Added `supabase` import
- Added state for forgot-password mode (`forgotMode`, `resetEmail`, `resetMsg`, `resetError`)
- Changed redirect logic: president → `/president`, admin → `/admin`, coach → `/coach`
- Login form now conditionally renders forgot-password form (inline, same card surface, no new visual weight)
- `handleResetSubmit` calls `supabase.auth.resetPasswordForEmail(email)`

### `src/pages/Login.css`
- Added `.forgot-link` — 12px, `var(--ink-muted)`, no underline default, underline on hover; styled as a button that renders like a link

### `src/components/layout/TopNav.jsx`
- Badge text now reads `'President'` when `role === 'president'`, otherwise `'Admin'`

### `src/App.jsx`
- Imported `PresidentDashboard` and `UserManagement`
- Added `/president` route (allowedRoles `['president']`)
- Added `/president/users` route (allowedRoles `['president']`)

### `src/components/shared/StatusPill.jsx`
- Added labels: `president → 'President'`, `admin → 'Admin'`, `coach → 'Coach'`

### `src/components/shared/StatusPill.css`
- Added `.status-pill--president` (status-err colours — red)
- Added `.status-pill--admin` (status-warn colours — yellow)
- Added `.status-pill--coach` (status-ok colours — green)

---

## Edge Function contract

**URL:** `https://aotrenxljjsqjsyseyui.supabase.co/functions/v1/manage-user`

**Auth:** POST with `Authorization: Bearer <session.access_token>` from `supabase.auth.getSession()`

**Operations:**
| operation | body fields | effect |
|---|---|---|
| `invite` | `email`, `name`, `role` | creates user and sends invite email |
| `update` | `userId`, any of `name`, `role`, `email`, `phone_number` | updates profile fields |
| `reset_password` | `userId`, `newPassword` | sets new password (min 8 chars enforced client-side) |
| `deactivate` | `userId` | bans the user in Supabase Auth |
| `reactivate` | `userId` | unbans the user |

---

## What Phase 7 needs to know

1. **`useUsers` hook** — `src/hooks/useUsers.js` — returns `{ users, loading, error, refetch }`. `users` is an array of all rows from `profiles` with all columns (`*`). Ordered by role asc, name asc.

2. **UserManagement pattern** — `src/pages/UserManagement.jsx` — same two-column grid as TeamManagement (`1fr 320px`). Left panel has grouped role headings + user rows. Right panel is `UserDetailPanel` keyed by `user.id`. Deactivated state is tracked in a local `Set` (not persisted to database — optimistic only on this session).

3. **ProtectedRoute** — accepts `allowedRoles` (array). All future routes must use array syntax. President is included in `['admin', 'president']` for all existing admin routes.

4. **President can access `/admin`** — all admin routes already permit `['admin', 'president']`. The TopNav admin nav links (Dashboard, Teams, Training Plans) all point to `/admin/*` and work for president users.

5. **Role pill colour mapping:**
   - `president` → `status-err` (red)
   - `admin` → `status-warn` (yellow/amber)
   - `coach` → `status-ok` (green)
