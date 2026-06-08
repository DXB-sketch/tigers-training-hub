# Phase 7 Complete

## What was built

### New files
- `src/hooks/useAgeGroups.js` — fetches all `age_groups` rows ordered by `sort_order asc`; returns `{ ageGroups, loading, error, refetch }`. Refetch is driven by a tick counter so the caller can trigger re-fetch without unmounting.

### Modified files

#### `src/hooks/useTeams.js`
- Added `tick` state and `refetch` export (same counter pattern as `useAgeGroups`).
- Added `age_group_id` to the `transformTeam` output — required for grouping teams by age group in the left panel.

#### `src/hooks/useTeam.js`
- Added `tick` state and `refetch` export.
- Added `age_group_id` to the returned `team` object — required for the age group select in `TeamDetailPanel`.
- Fixed the `if (!teamId)` early-return branch to also clear `team`, `coach`, and `currentPlan` state (previously only set `loading: false`).

#### `src/pages/TeamManagement.jsx` (full rewrite)
- **Age group management section** above the team list: lists all age groups with drag handle (HTML5 drag API), inline edit on click (blur saves), × delete button (visible on hover), inline delete confirmation, inline error if teams are assigned.
- `+ Add age group` inserts with `sort_order = max + 1` and immediately sets `editingAgId` to put the new row into edit mode.
- Drag reorder: `onDrop` rebuilds the ordered array and batch upserts `{ id, sort_order }` pairs with `onConflict: 'id'`.
- `<hr className="team-rule" />` separates age groups from the team list.
- **Grouped team list**: one collapsible section per age group (default all expanded), driven by a `collapsedGroups` Set. Teams with no matching age group fall into an "Uncategorised" group.
- **Create team form**: clicking `+ Add team` in the PageHeader replaces the right panel with an inline form (team name + age group select). On submit, inserts into `teams` and selects the new row.
- `handleTeamSaved` calls both `teamsRefetch()` and `teamRefetch()` so the list and detail panel stay in sync after mutations.
- `handleTeamDeleted` calls `teamsRefetch()` and clears `selectedId`.

#### `src/pages/TeamManagement.css`
- Added styles for `.ag-section`, `.ag-row`, `.ag-drag-handle`, `.ag-name`, `.ag-name-input`, `.ag-delete-btn`, `.ag-confirm`, `.ag-add-btn`, `.ag-error`, `.team-rule`, `.team-group-header`, `.tgh-*`.

#### `src/components/admin/TeamDetailPanel.jsx` (full rewrite)
- **Inline team rename**: team name in the header is click-to-edit; saves on blur or Enter via direct `supabase.from('teams').update`.
- **Age group reassign**: `<select>` populated from `allAgeGroups` prop; onChange saves immediately.
- **Coach assignment section** (replaces the old `coach` prop display):
  - Fetches `coach_assignments` joined with `profiles` on `team.id` change via a `useEffect`.
  - Fetches all `profiles` where `role = 'coach'` in the same effect.
  - Displays each assigned coach with name, email, Primary pill / Make primary button, and remove (×).
  - "Assign coach" select shows only unassigned coaches; Add button inserts into `coach_assignments`.
  - Make primary: two sequential updates (all to false, then this one to true).
  - Remove: deletes the row; if removed was primary and others remain, promotes first remaining to primary.
- **Delete team**: button at the bottom triggers inline confirm. Guard queries `plans` with `.is('deleted_at', null)`. If no active plans: deletes `coach_assignments` rows then the team row; calls `onDeleted()`.
- Props changed: removed `coach`; added `allAgeGroups`, `onSaved`, `onDeleted`.

#### `src/components/admin/TeamDetailPanel.css`
- Added styles for `.dp-team-name--editable`, `.dp-team-name-input`, `.dp-select`, `.dp-inline-input`, `.dp-coach-row`, `.dp-coach-info`, `.dp-coach-name`, `.dp-coach-email`, `.dp-coach-actions`, `.dp-primary-pill`, `.dp-make-primary-btn`, `.dp-remove-btn`, `.dp-assign-coach-row`, `.dp-select--inline`, `.dp-confirm-btn`, `.dp-section--danger`, `.dp-delete-team-btn`, `.dp-delete-confirm-msg`, `.dp-delete-actions`, `.dp-assign-btn--danger`, `.dp-error`.

---

## Deviations from spec

**`useTeam` early-return fix**: the original hook set only `loading: false` when `teamId` is null; it did not clear `team`/`coach`/`currentPlan`. This meant stale detail data persisted briefly when deselecting a team. Fixed as a direct consequence of the teamId clearing logic needed for create mode.

**`dp-edit-btn` "Edit team" button removed**: the spec replaces it with inline rename on the team name itself. The CSS class is retained because `TeamManagement.jsx`'s create form uses it for the Cancel button.

**No `useTeam` call for coach data in detail panel**: the spec says to use direct supabase calls inside `TeamDetailPanel` for coach assignments. The `useTeam` hook still internally joins `coach_assignments` and returns a `coach` object, but the detail panel no longer receives or uses it — it manages its own assignment state. The hook return value is unchanged; the parent simply does not destructure `coach`.

---

## Supabase-specific decisions

- **`upsert` for reorder**: uses `{ onConflict: 'id' }` and only sends `{ id, sort_order }` per row — does not re-insert full rows.
- **Delete guard**: uses `.is('deleted_at', null)` (not `.eq('deleted_at', null)`) per the known Supabase gotcha for nullable columns documented in the project.
- **Coach assignment fetch**: `profiles` join in the `coach_assignments` select uses the foreign key `coach_id → profiles.id` which Supabase resolves automatically.

---

## What Phase 8 needs to know

1. **`useTeams`** now returns `refetch` and includes `age_group_id` on each team object.
2. **`useTeam`** now returns `refetch` and includes `age_group_id` on the team object.
3. **`useAgeGroups`** is a new hook at `src/hooks/useAgeGroups.js`.
4. **`TeamDetailPanel`** props changed: `coach` prop removed; `allAgeGroups`, `onSaved`, `onDeleted` added. Coach assignments are managed entirely inside the component via local state.
5. **Coach assignment primary enforcement is UI-only** — no database constraint. Any future feature touching `coach_assignments` must maintain the single-primary invariant manually.
6. The `plans.deleted_at` soft-delete guard pattern (`.is('deleted_at', null)`) is now established in two places: the existing soft-delete in plan management and the team delete guard here.
