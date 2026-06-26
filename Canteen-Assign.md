Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

These are targeted additions to the Phase 10 canteen feature. The 
canteen_shift_assignments table now exists in the database. Do not 
change any functionality not explicitly mentioned below.

---

ISSUE 1 — Canteen workers see all shifts instead of only their assigned ones

Observed: useCanteenShifts.js fetches all shifts in the next 14 days 
regardless of whether the current user is assigned to them.

Root cause: The query does not filter through canteen_shift_assignments.

Fix: In src/hooks/useCanteenShifts.js, update the query to only return 
shifts where an assignment exists for the current user:

  supabase
    .from('canteen_shifts')
    .select(`
      *,
      canteen_shift_assignments!inner(worker_id)
    `)
    .eq('canteen_shift_assignments.worker_id', user.id)
    .gte('shift_date', today)
    .lte('shift_date', plus14days)
    .order('shift_date', { ascending: true })
    .order('start_time', { ascending: true })

The !inner join means only shifts with a matching assignment row for 
this user are returned. No changes to the component — the data shape 
is the same.

---

ISSUE 2 — Admin has no way to assign workers to shifts

Observed: The Shifts tab in AdminCanteenPage shows shifts but has no 
UI to assign canteen workers to them.

Root cause: Assignment management was not built in Phase 10.

Fix part A — Update src/hooks/useAdminCanteen.js:

Add a fifth data slice: canteenWorkers
  Query: select id, name from profiles where role = 'canteen' order by name asc
  This is a one-time fetch on mount, no refetch needed separately 
  (it is included in the main refetch).

Add two mutations:

  assignWorker(shiftId, workerId):
    Insert into canteen_shift_assignments { shift_id: shiftId, worker_id: workerId }
    On conflict (shift already assigned to this worker) do nothing.
    Returns { error }.

  unassignWorker(shiftId, workerId):
    Delete from canteen_shift_assignments 
    where shift_id = shiftId and worker_id = workerId
    Returns { error }.

Update the shifts query to include current assignments:
  Change the shifts fetch from select('*') to:
  select(`
    *,
    canteen_shift_assignments(worker_id, profiles(id, name))
  `)
  This gives each shift an array of assigned workers as 
  shift.canteen_shift_assignments[{ worker_id, profiles: { id, name } }]

Update the hook's return value to include: 
  canteenWorkers, assignWorker, unassignWorker

Fix part B — Update the Shifts tab in src/pages/AdminCanteenPage.jsx:

In each shift row, add an "Assigned" section below the date/title/time 
cells. This sits as a sub-row spanning the full table width 
(or below the row content if not using a table layout).

The assigned section shows:
  - A label "Assigned:" at 9px uppercase var(--ink-faint) 
    with letter-spacing 0.12em
  - Chips for each assigned worker: worker name at 11px var(--ink), 
    with a small "×" remove link in var(--ink-faint) beside each name.
    Chips are inline-flex, separated by 8px gap. No border-radius.
    A thin 1px var(--rule) border around each chip, padding 2px 8px.
  - If no workers assigned: show "No workers assigned" at 11px 
    var(--ink-faint)
  - An "+ Assign" button: 10px uppercase, var(--tigers-gold) colour, 
    no background, no border, cursor pointer. Sits inline after the chips.

Clicking "+ Assign" opens an inline dropdown select populated with 
canteenWorkers from the hook. The select shows only workers who are 
NOT already assigned to this shift. If all canteen workers are already 
assigned, show "All workers assigned" instead of the select.

Selecting a worker from the dropdown immediately calls 
assignWorker(shiftId, workerId) and refetches. The select 
closes after selection.

Clicking "×" on a chip calls unassignWorker(shiftId, workerId) 
and refetches. No confirmation needed — this is low stakes.

The assignment UI is visible in both the normal row view and 
while a row is in edit mode.

---

ACCEPTANCE CRITERIA

[ ] Canteen worker logs in and only sees shifts they are assigned to
[ ] A shift with no assignments is invisible to all canteen workers
[ ] Admin Shifts tab shows current assignees for each shift
[ ] "+ Assign" dropdown only shows workers not already on that shift
[ ] Selecting a worker assigns them and the chip appears immediately
[ ] Clicking × on a chip removes that worker from the shift
[ ] Clock in/out still works correctly (useCanteenClock uses shift_id 
    directly and is unaffected by assignment filtering)
[ ] npm run build completes without errors
[ ] No hardcoded hex values introduced
[ ] Do not change any functionality outside the files listed above