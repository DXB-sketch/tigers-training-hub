Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

This is a targeted bug fix. Do not change any functionality not 
explicitly mentioned below.

---

ISSUE 1 — Today's date computed in UTC instead of AEST

Observed: The canteen dashboard shows the wrong date and fails to 
match today's shift because the date comparison uses UTC time, which 
is 10 hours behind AEST (Australia/Brisbane).

Root cause: Any code computing "today" as a date string using 
new Date().toISOString().split('T')[0] or similar will return the 
UTC date, not the Brisbane local date. Queensland does not observe 
daylight saving, so the correct fixed timezone is 
'Australia/Brisbane' (always UTC+10).

The correct way to get today as a YYYY-MM-DD string in AEST is:

  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Australia/Brisbane' 
  })

en-CA locale produces YYYY-MM-DD format natively.

Fix every place in the codebase where a local date string is computed 
for comparison or querying. The files most likely affected are:

src/hooks/useCanteenShifts.js
  - The 'today' date string used in .gte('shift_date', today)
  - The plus-14-days date string used in .lte('shift_date', plus14days)
  - Compute plus14days as:
      const d = new Date()
      d.setDate(d.getDate() + 14)
      const plus14days = d.toLocaleDateString('en-CA', { 
        timeZone: 'Australia/Brisbane' 
      })

src/hooks/useCanteenClock.js
  - The clockIn() function computes minutesEarly by comparing now() 
    to the shift's start_time on today's date. The Date object used 
    to represent the shift start must be constructed using Brisbane 
    local date, not UTC date. 
  - Build the shift start datetime as:
      const todayBrisbane = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Australia/Brisbane'
      })
      const shiftStart = new Date(`${todayBrisbane}T${shift.start_time}`)
  - Same pattern for shiftEnd in clockOut().

src/pages/CanteenDashboard.jsx
  - The todayISO string used to find today's shift with 
    shifts.find(s => s.shift_date === todayISO)
  - Replace with:
      const todayISO = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Australia/Brisbane'
      })

src/pages/AdminCanteenPage.jsx
  - The date string used to group shifts into Upcoming vs Past.
  - Same fix: use toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })

Do not create a shared helper file for this — just apply the one-liner 
directly in each place it is needed.

---

ACCEPTANCE CRITERIA

[ ] Canteen dashboard correctly identifies today's shift using Brisbane time
[ ] Clock In and Clock Out early/late threshold calculations use Brisbane time
[ ] Admin shift grouping (Upcoming vs Past) uses Brisbane date
[ ] The 14-day shift window query uses the correct Brisbane dates
[ ] npm run build completes without errors
[ ] No hardcoded hex values introduced
[ ] No other functionality changed