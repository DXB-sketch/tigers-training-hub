Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

Phase 10 Step 1 is complete. The canteen role routes correctly to 
/canteen, TopNav shows the right links, and a test canteen worker 
account and a test shift for today both exist in the database.

This step builds the full canteen worker UI. The visual reference is 
/mockups/08_canteen_hub.html — match it exactly for layout and 
component patterns. All design rules from DESIGN.md apply.

Do not touch any existing pages, components, or hooks.

---

STEP 5: Create src/hooks/useCanteenShifts.js

Fetches canteen_shifts for the next 14 days (inclusive of today).

Query:
  supabase
    .from('canteen_shifts')
    .select('*')
    .gte('shift_date', today)          // today as ISO date string YYYY-MM-DD
    .lte('shift_date', plus14days)     // today + 14 days as ISO date string
    .order('shift_date', { ascending: true })
    .order('start_time', { ascending: true })

Returns: { shifts, loading, error }

Helper: export a pure function formatShiftTime(start_time, end_time) 
that converts "09:00:00" and "13:00:00" to "9:00 AM – 1:00 PM".
Export it from this file so other components can import it.

---

STEP 6: Create src/hooks/useCanteenClock.js

Accepts shiftId (string or null) as a parameter.
If shiftId is null, returns { clockEvent: null, loading: false, error: null }.

Query when shiftId is provided:
  supabase
    .from('canteen_clock_events')
    .select('*')
    .eq('shift_id', shiftId)
    .eq('worker_id', user.id)
    .maybeSingle()

Returns: { clockEvent, loading, error, refetch }

Exposes two async mutation functions:

clockIn(shift):
  - Computes minutesEarly: difference between now() and the shift's 
    start_time on today's date, in minutes. If now() is before start_time,
    minutesEarly is positive.
  - Sets early_in = (minutesEarly > 30)
  - Sets approval_status = minutesEarly > 30 ? 'pending' : 'none'
  - Inserts into canteen_clock_events:
    { shift_id: shift.id, worker_id: user.id, clocked_in_at: new Date().toISOString(),
      early_in, approval_status }
  - Calls refetch after insert.
  - Returns { error } — null error means success.

clockOut(eventId, shift):
  - Computes minutesLate: difference between now() and the shift's 
    end_time on today's date, in minutes. If now() is after end_time,
    minutesLate is positive.
  - Sets late_out = (minutesLate > 30)
  - If late_out is true AND existing approval_status is already 'pending': 
    keep 'pending'. If late_out is true AND approval_status is 'none': 
    set to 'pending'. Otherwise keep 'none'.
  - Updates canteen_clock_events where id = eventId:
    { clocked_out_at: new Date().toISOString(), late_out, approval_status }
  - Calls refetch after update.
  - Returns { error }.

---

STEP 7: Create src/hooks/useCanteenWishlist.js

Fetches all wishlist items joined to the adder's name:
  supabase
    .from('canteen_wishlist')
    .select('*, added_by_profile:profiles!added_by(name)')
    .order('created_at', { ascending: false })

Returns: { items, loading, error, refetch }

Exposes:
  addItem(content): inserts { content, added_by: user.id }, then refetches.
  Returns { error }.

---

STEP 8: Replace src/pages/CanteenDashboard.jsx with the full UI

The page reads the ?tab= query param via useSearchParams.
Default tab is 'schedule'. Valid values: 'schedule', 'wishlist'.
Changing tabs updates the URL param.

Import and use: useCanteenShifts, useCanteenClock, useCanteenWishlist,
formatShiftTime from useCanteenShifts, and role from AuthContext.

SCHEDULE TAB LAYOUT (match /mockups/08_canteen_hub.html):

Today block (var(--surface-warm) background, border-bottom 1px var(--rule)):
  - Find today's shift: shifts.find(s => s.shift_date === todayISO)
    where todayISO is today formatted as YYYY-MM-DD.
  - If no shift today:
      Show "No shift scheduled today." at 13px var(--ink-muted), centred.
      Clock In button rendered but disabled (opacity: 0.5, cursor: not-allowed,
      pointer-events: none).

  - If shift exists today:
      Eyebrow: "Today's Shift · [formatted date e.g. Sun 21 Jun]"
      Shift time: formatShiftTime(shift.start_time, shift.end_time) at 20px bold
      Shift title at 12px var(--ink-muted)

      Status pill logic:
        No clock event → "Not Clocked In" (status-warn pill)
        clocked_in_at set, no clocked_out_at → "Clocked In" (status-ok pill)
        both set, approval_status 'none' → "Complete" (status-ok pill)
        approval_status 'pending' → "Pending Approval" (status-warn pill)
        approval_status 'approved' → "Approved" (status-ok pill)
        approval_status 'rejected' → "Rejected" (status-err pill)

      Clock button:
        Show "Clock In" when no clock event exists.
        Show "Clock Out" when clocked_in_at exists but clocked_out_at does not.
        Show nothing (no button) once both times are recorded.

        Disabled states (opacity 0.5, cursor not-allowed, pointer-events none):
          "Clock In" disabled if: no shift today, OR clock event already has clocked_in_at
          "Clock Out" disabled if: no clocked_in_at on the current event

      Live elapsed timer: when clock event has clocked_in_at but no clocked_out_at,
        show elapsed time as "H:MM:SS" updated every second via setInterval.
        Clear the interval on unmount and when clocked_out_at is set.
        Show as: "Clocked in at 9:04 AM · 1:23:45 on shift" at 11px var(--ink-faint).

      Pending approval note: if approval_status === 'pending', show below the button:
        "Your hours are outside the standard shift window and need admin approval."
        at 12px var(--ink-muted).

Upcoming shifts section:
  Shifts from tomorrow onwards (shift_date > todayISO).
  Section heading: "Upcoming Shifts" using the .section-head pattern from DESIGN.md.
  One row per shift. Each row:
    Left: date ("Tue 23 Jun"), shift title (12px var(--ink-mid))
    Right: time range (12px bold), days-until ("in 2 days" / "tomorrow" / "today")
  Rows separated by 1px var(--rule-light).
  Below list: "Shifts published up to two weeks ahead." at 10px var(--ink-faint).

WISH LIST TAB LAYOUT (match /mockups/08_canteen_hub.html):

Section heading + note paragraph.

Items list: newest first.
Each item row:
  Content text at 13px var(--ink-mid)
  Below: added_by_profile.name + relative time at 10px var(--ink-faint)
  Status pill on the right:
    'requested' → status-warn, "Requested"
    'got_it' → status-ok, "Got It"

Status pill is tappable (cursor: pointer) ONLY if role === 'admin' or 
role === 'president'. For role === 'canteen', pill has cursor: default 
and no click handler.

Add item form (canteen workers and admins can both add items):
  Text input (full width), max 140 chars.
  "Add to Wish List" primary button below.
  Disabled if input is empty.
  On submit: call addItem(content), clear input, the refetch in the hook 
  updates the list.

---

STEP 9: Create src/pages/CanteenDashboard.css

All styles via CSS custom properties from tokens.css.
No border-radius on containers, buttons, or inputs.
No hardcoded hex values.
Minimum font size 9px. All uppercase labels: letter-spacing 0.10em minimum.
Match the layout from /mockups/08_canteen_hub.html as closely as possible.

---

ACCEPTANCE CRITERIA

[ ] Canteen worker logs in and lands on /canteen showing schedule tab
[ ] todayISO comparison correctly identifies today's shift
[ ] No shift today: today block shows "No shift scheduled today", clock button disabled
[ ] With a shift today: shift title and time render correctly
[ ] Clock In creates a canteen_clock_events row, status pill updates to "Clocked In"
[ ] Clocking in 31+ minutes before shift start sets early_in=true, approval_status='pending'
[ ] Clocking in within 30 minutes of start: approval_status='none'
[ ] Clock Out button appears after clock in
[ ] Clock Out sets clocked_out_at, status pill updates to "Complete" or "Pending Approval"
[ ] Clocking out 31+ minutes after shift end sets late_out=true, approval_status='pending'
[ ] Pending approval note appears when approval_status='pending'
[ ] Live elapsed timer ticks while clocked in, stops after clock out
[ ] Wish List tab loads items from canteen_wishlist
[ ] Adding an item inserts it and refreshes the list
[ ] Status pill is not tappable for canteen role
[ ] npm run build completes without errors
[ ] No hardcoded hex values in new files

Do not write PHASE10_COMPLETE.md yet.
Do not change any functionality outside the files listed in Steps 5 through 9.