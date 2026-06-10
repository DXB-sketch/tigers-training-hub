# Phase 8 Complete

## What was built

Three independent pieces: a Coaches admin view, an account settings page for all
roles, and soft-delete UI on plan rows.

### New files

#### `src/hooks/useCoachAssignments.js`
Fetches `coach_assignments` joined to `profiles:coach_id` and
`teams:team_id → age_groups:age_group_id`. Flattens each row to
`{ id, is_primary, coach_id, coach_name, coach_email, phone_number, team_id,
team_name, age_group_name, sort_order }` and sorts client-side by `sort_order`,
then `team_name`, then `coach_name`. Returns `{ assignments, loading, error, refetch }`
(same tick-counter refetch pattern as the other hooks).

#### `src/pages/CoachesPage.jsx` + `CoachesPage.css`
Route `/admin/coaches` (admin, president). Two-column grid (1fr / 320px) matching
TeamManagement. Left panel:
- Search input (filters by coach name/email, client-side on already-fetched data).
- Assignments grouped age group → team → coach. Primary coaches get a "Primary" pill.
- An "Unassigned" section at the bottom: all `role = 'coach'` profiles whose id does
  not appear in any assignment, fetched once on mount.
- Clicking a coach row selects it and opens the detail panel.

Right panel renders `CoachDetailPanel`. The page resolves the selected coach object
from either the assignments data or the full coach list (so unassigned coaches can
still be selected and viewed).

#### `src/components/admin/CoachDetailPanel.jsx` + `CoachDetailPanel.css`
Shows name (16px bold), email (12px muted), phone (12px mid, `--` if null), a
"TEAM ASSIGNMENTS" section head, and each assignment as a row (age group label,
team name, Primary/Assistant pill, × remove). Below: an "Assign to team" select
populated from teams not already assigned to this coach. "Edit account →" link only
rendered when `role === 'president'`, navigating to `/president/users?userId={id}`.

Mutations are direct supabase calls and maintain the single-primary invariant:
- **Remove**: deletes the row; if it was primary and others remain on that team,
  promotes the first remaining to primary.
- **Assign**: inserts with `is_primary = false`, or `true` if no other coaches are
  assigned to that team.

Both call the page-level `refetch` after mutating.

#### `src/pages/AccountSettings.jsx` + `AccountSettings.css`
Route `/account` (all three roles). Single column, max-width 540px, centred. Loads
the current profile on mount. Fields:
- **Full name** — saves on blur; reverts to previous value if blurred empty.
- **Email** — read-only display with the "contact your administrator" note.
- **Phone** — optional, saves on blur.
Each shows an inline "Saved" (ok colour) that clears after 2s, or the error message.

Avatar section: circular 72px image (`border-radius: 50%` — the one sanctioned
exception) or initials fallback. "Upload photo" (secondary-btn) triggers a hidden
file input → uploads to the `avatars` bucket at `{user.id}/avatar.{ext}`, gets the
public URL, writes `profiles.avatar_url`, and updates local state. "Remove photo"
(only when an avatar exists) deletes the file(s) and nulls `avatar_url`.

The storage bucket + RLS SQL is a comment block at the top of the file.

### Modified files

- **`src/components/layout/TopNav.jsx` / `.css`** — "Coaches" NavLink added between
  Teams and Training Plans (admin/president branch only). "Account" NavLink added to
  `nav-right` for all roles (both the coach branch and the admin/president branch),
  separated from the role badge by a new `.nav-divider`. New `.nav-account-link` style
  mirrors the nav-link text style with the gold active underline.
- **`src/App.jsx`** — imports + routes for `/admin/coaches` and `/account`.
- **`src/pages/UserManagement.jsx`** — `useSearchParams`; on mount/param change, if a
  `userId` query param is present it is set as the selected user so `UserDetailPanel`
  opens immediately.
- **`src/components/admin/PlanList.jsx` / `.css`** — hover-revealed "Delete" button per
  row that swaps inline to "Delete this plan? Confirm / Cancel". Confirm sets
  `deleted_at = new Date().toISOString()` then calls `onDeleted`. A single
  `confirmingPlanId` state guarantees one row in confirmation at a time. Grid gained a
  4th `auto` column for the delete cell.
- **`src/pages/PlanLibrary.jsx`** — destructures `refetch` from `usePlans` and passes it
  as `onDeleted` to `PlanList`.

## Deviations from spec

1. **Nav links use `NavLink`, not `useLocation()`.** The spec described `useLocation()`
   for the Coaches active state, but every existing nav link uses `NavLink` with the
   `isActive` className callback. Per CLAUDE.md rule 3 (match existing style), I used
   `NavLink` — it produces the identical active behaviour the spec described.
2. **Avatar URL cache-busting.** The storage path is fixed (`avatar.{ext}`) and upload
   uses `upsert: true`, so re-uploads reuse the same URL and the browser would serve a
   stale cached image. I append `?t={timestamp}` to the stored `avatar_url` so the new
   photo displays immediately (acceptance criterion). The query string is stored in the
   column.
3. **Remove photo lists the folder.** After a reload the file extension is unknown, so
   removal lists `{user.id}/` and deletes everything in it rather than reconstructing a
   single path. Robust to any prior extension.
4. **AccountSettings does not refresh AuthContext.** Saving the name updates the DB but
   not the in-memory `user` in AuthContext, so TopNav shows the previous name until the
   next load. Wiring an AuthContext refresh was out of scope.

## Supabase requirements (manual steps)

Avatar upload will not work until the developer does the following in the Supabase
dashboard:

1. **Add `avatar_url` column to `profiles`** (text, nullable). This column does not
   exist yet; the account page reads and writes it.
2. **Create the `avatars` storage bucket and RLS policies** — run the SQL provided as a
   comment block at the top of `src/pages/AccountSettings.jsx`.

`phone_number` already exists on `profiles` (used by UserDetailPanel) — no change needed.

The coach assignment single-primary invariant remains **UI-only** — no DB constraint.
`CoachDetailPanel` maintains it the same way `TeamDetailPanel` does (two sequential
updates / conditional insert).

## What Phase 9 needs to know

1. `useCoachAssignments` is available and returns a flat, pre-sorted assignment array
   with refetch.
2. Coach assignment mutations now live in two components (`TeamDetailPanel` and
   `CoachDetailPanel`). Any new code touching `coach_assignments` must keep the
   single-primary invariant manually.
3. `profiles.avatar_url` is now consumed by the app — ensure it is added.
4. `/account` exists for all roles; if a global profile refresh is wanted (so TopNav
   reflects name changes live), AuthContext would need an exposed `refreshProfile`.
5. Plan soft-delete is now triggerable from the library. All plan queries continue to
   guard with `.is('deleted_at', null)`.
