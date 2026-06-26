Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

Phase 10 Steps 1 and 2 are complete. The canteen worker UI works fully.
This step builds the admin management page at /admin/canteen.
Do not touch any existing pages, components, or hooks.

---

STEP 10: Create src/hooks/useAdminCanteen.js

This hook is only used by AdminCanteenPage.

Fetches four data slices in parallel using Promise.all on mount.
Exposes a single refetch() that re-runs all four fetches.

10a. shifts
  Query: select * from canteen_shifts order by shift_date desc, start_time asc
  
  createShift({ title, shift_date, start_time, end_time }):
    Insert with created_by: user.id. Returns { error }.
    
  updateShift(id, { title, shift_date, start_time, end_time }):
    Update by id. Returns { error }.
    
  deleteShift(id):
    First check: select count(*) from canteen_clock_events where shift_id = id
    If count > 0: return { error: 'Cannot delete — clock records exist for this shift.' }
    Otherwise: delete from canteen_shifts where id = id. Returns { error }.

10b. pendingApprovals
  Query:
    supabase
      .from('canteen_clock_events')
      .select(`
        *,
        worker:profiles!worker_id(name),
        shift:canteen_shifts!shift_id(title, shift_date, start_time, end_time)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true })

  approveEvent(id): 
    Update canteen_clock_events set approval_status='approved', 
    approved_by=user.id, approved_at=now() where id=id. Returns { error }.
    
  rejectEvent(id):
    Update canteen_clock_events set approval_status='rejected',
    approved_by=user.id, approved_at=now() where id=id. Returns { error }.

10c. clockHistory
  Same join as pendingApprovals but where approval_status != 'pending'.
  Order by shift.shift_date desc. Limit 50.
  No mutations.

10d. wishlist
  Query:
    supabase
      .from('canteen_wishlist')
      .select('*, added_by_profile:profiles!added_by(name)')
      .order('created_at', { ascending: false })

  updateWishStatus(id, status):
    Update canteen_wishlist set status=status, resolved_by=user.id,
    resolved_at=now() where id=id. Returns { error }.
    
  addItem(content):
    Insert { content, added_by: user.id }. Returns { error }.

Returns: {
  shifts, pendingApprovals, clockHistory, wishlist,
  loading, error, refetch,
  createShift, updateShift, deleteShift,
  approveEvent, rejectEvent,
  updateWishStatus, addItem
}

---

STEP 11: Replace src/pages/AdminCanteenPage.jsx with the full UI

Use PageHeader at the top: title "Canteen", subtitle "Manage shifts, 
review approvals, and track clock history."

Four tabs rendered as a tab bar below the page header:
  "Shifts" | "Approvals" | "History" | "Wish List"

Tab bar styling: a row of buttons at 10px uppercase 700 weight with 
letter-spacing 0.14em, using var(--ink-muted) colour for inactive and 
var(--ink) for active. Active tab has a 2px bottom border in 
var(--tigers-gold). Tab bar has a 1px bottom border in var(--rule-light).
No background tint on tab bar. No border-radius anywhere.

Tab state is local React state (not URL params).
Default active tab: 'shifts'.
Show a count badge next to "Approvals" tab if pendingApprovals.length > 0:
  a small inline number in var(--tigers-gold) at 10px bold, 
  e.g. "Approvals 3" — no pill, just the number appended.

SHIFTS TAB:

Inline create form (visible when createMode === true):
  Show above the shifts list. Triggered by "+ New Shift" button in PageHeader.
  Fields: Title (text), Date (date input), Start time (time), End time (time).
  "Save Shift" (primary-btn) | "Cancel" (text link in var(--ink-muted), no button styles).
  On Save: call createShift(), close form, refetch.
  On Cancel: close form, clear fields.

Shifts list as a data table (matching existing admin table patterns from DESIGN.md):
  Columns: Date | Title | Time | Actions
  Date: formatted as "Tue 23 Jun 2026"
  Time: formatShiftTime() — import from useCanteenShifts.js
  Actions: "Edit" | "Delete" — both as 10px uppercase gold text links 
  (no button styles, cursor pointer).

  Group shifts: "Upcoming" (shift_date >= today) shown first, "Past" below.
  Each group has its own section heading using the .section-head pattern.
  Within each group: upcoming sorted asc by date, past sorted desc.

  Edit mode for a row:
    Replace that row's cells with inline inputs for each field.
    "Save" and "Cancel" replace the Actions cell.
    Only one row can be in edit mode at a time.

  Delete confirmation for a row:
    Replace the Actions cell with: "Confirm?" + "Yes, delete" (10px, 
    var(--status-err-text), no button styles) + "Cancel" (10px, var(--ink-muted)).
    If deleteShift returns an error string, show it below the row in 
    11px var(--status-err-text). Auto-clear after 4 seconds.

APPROVALS TAB:

If pendingApprovals.length === 0:
  "No approvals pending." at 13px var(--ink-muted), centred, padding 32px 0.

Otherwise for each pending event:
  A row with a bottom border (1px var(--rule-light)).
  Top line: worker.name (13px bold var(--ink)) + reason badge
    Reason badge logic:
      early_in && late_out → "Early in + Late out" (status-warn)
      early_in only → "Early clock-in" (status-warn)
      late_out only → "Late clock-out" (status-warn)
  Second line: shift.title + formatted date (12px var(--ink-muted))
  Third line (12px var(--ink-faint)):
    If early_in: "Clocked in: [time] · Shift starts: [shift.start_time formatted]"
    If late_out: "Clocked out: [time] · Shift ends: [shift.end_time formatted]"
    Times formatted as "9:04 AM". If both, show on two separate lines.
  Actions row: "Approve" (primary-btn, padding 8px 14px) + "Reject" (secondary-btn, 
  same padding). Inline, gap 8px.
  On Approve: call approveEvent(id), refetch.
  On Reject: call rejectEvent(id), refetch.

HISTORY TAB:

Data table. Columns: Date | Worker | Shift | Clocked In | Clocked Out | Status

Date: shift.shift_date formatted "Tue 23 Jun"
Worker: worker.name
Shift: shift.title
Clocked In: clocked_in_at formatted as "9:04 AM" (or "—" if null)
Clocked Out: clocked_out_at formatted as "1:02 PM" (or "—" if null)
Status pill:
  approval_status 'none' → "On Time" (status-ok)
  approval_status 'approved' → "Approved" (status-ok)
  approval_status 'rejected' → "Rejected" (status-err)

If empty: "No clock history yet." centred in var(--ink-muted).

WISH LIST TAB:

Items list, newest first.
Each row: content text (13px) | added_by_profile.name + relative time (10px var(--ink-faint)) | status pill
Status pill is always tappable on this page (admin view).
Tapping toggles: 'requested' → 'got_it', 'got_it' → 'requested'. Call updateWishStatus.

Add item form at the bottom (admins can add items too):
  Text input (full width) + "Add to Wish List" (primary-btn).
  Disabled if empty. On submit: call addItem(), clear input, refetch.

---

STEP 12: Create src/pages/AdminCanteenPage.css

All styles via CSS custom properties from tokens.css.
No border-radius on containers, buttons, or inputs.
No hardcoded hex values. No inline style objects for layout.
Tab bar, inline edit rows, and approval rows need specific styles.
Match the visual weight and spacing of existing admin pages 
(TeamManagement, UserManagement) for consistency.

---

ACCEPTANCE CRITERIA FOR PHASE 10

[ ] /admin/canteen loads for admin and president, blocked for canteen/coach
[ ] Shifts tab: create form saves new shift and it appears in the list
[ ] Shifts tab: edit saves changes inline
[ ] Shifts tab: delete with no clock records removes the shift
[ ] Shifts tab: delete with existing clock records shows error, does not delete
[ ] Upcoming and Past shift grouping is correct
[ ] Approvals tab shows count badge when pending items exist
[ ] Approvals tab: Approve sets approval_status='approved', row disappears from list
[ ] Approvals tab: Reject sets approval_status='rejected', row disappears from list
[ ] History tab shows completed events with correct status pills
[ ] Wish List tab: status pill toggles correctly and saves to DB
[ ] Wish List tab: add item inserts and refreshes the list
[ ] canteen_wishlist status pill is read-only on CanteenDashboard for canteen role
[ ] npm run build completes without errors
[ ] No hardcoded hex values in any new or modified file

When Phase 10 is complete, write PHASE10_COMPLETE.md covering: all 
new tables and their RLS policies, the 30-minute approval threshold 
logic and where it lives, any deviations from this spec and why, 
and what Phase 11 needs to know.