Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

These are targeted fixes only. Do not change any functionality not 
explicitly mentioned below.

---

ISSUE 1 — Canteen role missing from invite form

Observed: The invite user form on /president/users does not include 
'canteen' as a selectable role. Submitting an invite with role 
'canteen' is impossible from the UI.

Root cause: The role options array in the invite form inside 
UserManagement.jsx (or wherever the invite inline form lives) is 
hardcoded and does not include 'canteen'.

Fix: In the invite form role selector, add 'canteen' to the options 
array. The full list should be: admin, coach, canteen, president.
Display labels should be capitalised: Admin, Coach, Canteen, President.

---

ISSUE 2 — Canteen role missing from user edit panel

Observed: When editing an existing user's role in UserDetailPanel, 
'canteen' does not appear as an option.

Root cause: Same hardcoded role array in UserDetailPanel.jsx.

Fix: Add 'canteen' to the role options array in UserDetailPanel.jsx.
Same full list: admin, coach, canteen, president.

---

ISSUE 3 — manage-user Edge Function rejects canteen role

Observed: Even if the UI sent 'canteen' as the role, the Edge Function 
would reject it because it validates the role value server-side.

Root cause: The role validation inside 
supabase/functions/manage-user/index.ts has a hardcoded allowed-roles 
array that does not include 'canteen'.

Fix: Find the role validation check in the Edge Function (likely a 
line checking role against an array like ['admin','coach','president']). 
Add 'canteen' to that array.

After editing the file, redeploy the Edge Function by running:
  npx supabase functions deploy manage-user

---

ACCEPTANCE CRITERIA

[ ] /president/users invite form shows Canteen as a role option
[ ] Submitting an invite with role canteen calls the Edge Function without a validation error
[ ] UserDetailPanel role selector includes Canteen
[ ] manage-user Edge Function is redeployed with the updated role list
[ ] No other functionality changed
[ ] npm run build completes without errors