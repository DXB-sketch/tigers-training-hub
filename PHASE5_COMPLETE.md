# Phase 5 Complete

## Database schema changes (made directly in Supabase dashboard)

1. `profiles.role` check constraint now allows `'admin'`, `'coach'`, and `'president'`
2. New table `age_groups`: `id` (uuid pk), `name` (text), `sort_order` (integer), `created_at` (timestamptz)
3. `teams.age_group` (text) replaced with `teams.age_group_id` (uuid FK → `age_groups.id`)
4. `plans.deleted_at` (timestamptz, nullable) added — used for soft-deletion
5. All RLS policies on `teams`, `plans`, `drills`, `coach_assignments` now include `'president'` wherever `'admin'` was listed
6. `age_groups` has RLS enabled: select for all authenticated, insert/update/delete for admin or president

---

## Frontend changes

### `src/hooks/usePlans.js`
Added `.is('deleted_at', null)` to the query chain immediately after `.select()`, before `.order()` calls. Applies unconditionally to every plans query in the hook, regardless of other filters. Soft-deleted plans are never returned anywhere in the app.

### `src/hooks/useTeams.js`
- Added `age_groups(name)` to the embedded select string
- Removed `ageGroup: t.age_group` from the `transformTeam` return object
- Added `age_group_name: t.age_groups?.name ?? ''` in its place

### `src/hooks/useTeam.js`
- Added `age_groups(name)` to the embedded select string
- Removed `ageGroup: data.age_group` from the `setTeam` call
- Added `age_group_name: data.age_groups?.name ?? ''` in its place

### `src/components/admin/TeamDetailPanel.jsx`
- Changed `{team.ageGroup}` to `{team.age_group_name}` (line in the "Age group" field row)

### `src/components/layout/ProtectedRoute.jsx`
- Renamed prop from `requiredRole` (string) to `allowedRoles` (array)
- Changed guard from `role !== requiredRole` to `!allowedRoles.includes(role)`
- President users now pass the admin route guard without any special-case logic

### `src/App.jsx`
- All `requiredRole="admin"` replaced with `allowedRoles={['admin', 'president']}`
- All `requiredRole="coach"` replaced with `allowedRoles={['coach']}`

---

## Deviations from spec

None. All five changes implemented exactly as specified.

---

## What Phase 6 needs to know

1. **`president` role** is valid in the database (`profiles.role` check constraint) and is handled in `AuthContext` (stored as-is) and `ProtectedRoute` (included in all admin `allowedRoles` arrays). President users currently land at `/admin`. Phase 6 will add president-specific routing.

2. **`age_groups` table** exists and is joined in both `useTeams` and `useTeam`. The returned team object shape now includes `age_group_name` (string, the `name` column from `age_groups`). The old `ageGroup` property no longer exists on team objects.

3. **`plans.deleted_at`** exists and is filtered in `usePlans` via `.is('deleted_at', null)`. Any future soft-delete UI only needs to set this column; filtered plans will disappear from all views automatically.

4. **Team object shape** returned by hooks:
   - `useTeams` → `{ id, name, age_group_name, trainingDay, trainingTime, playerCount, coachId, coachName, coachEmail, currentPlanId, currentPlanTitle, currentPlanStatus, currentPlanWeek }`
   - `useTeam` → `team` state has `{ id, name, age_group_name, trainingDay, trainingTime, playerCount }`
