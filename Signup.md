Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

These are targeted fixes. Do not change any functionality not 
explicitly mentioned. Fix both issues in the order listed.

---

ISSUE 1 — Invite link lands on login with no password setup prompt

Observed: A newly invited user clicks their invite email link, arrives 
at the login page, and is just shown the standard email/password form 
with no way to set their password. The URL contains a hash fragment 
with type=invite or type=recovery.

Root cause: src/pages/Login.jsx does not check the URL hash on mount 
for Supabase auth tokens. When Supabase redirects after an invite or 
password reset link is clicked, the session tokens arrive in the URL 
fragment (#access_token=...&refresh_token=...&type=invite). 
The app ignores these entirely.

Fix: In src/pages/Login.jsx, add a useEffect that runs once on mount 
and checks for a Supabase session that was set via the URL hash. Use 
supabase.auth.onAuthStateChange to detect the SIGNED_IN event when 
type is 'invite' or 'recovery'. When detected, switch the page into 
a "set your password" mode rather than the standard login form.

The password setup mode should show:
  - Heading: "Set your password" (same page-title style as the login heading)
  - A single password input (type="password", label "New password", 
    min 8 characters)
  - A confirm password input (type="password", label "Confirm password")
  - A "Set Password" primary button
  - On submit: validate that both fields match and are 8+ characters.
    If invalid, show an inline error below the form in 12px 
    var(--status-err-text).
    If valid: call supabase.auth.updateUser({ password: newPassword }).
    On success: the user is already logged in (Supabase set the session 
    when it processed the invite token). Call the existing login 
    redirect logic to send them to the correct route based on their role.
    On error: show the error message inline.

The detection logic:
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Check if we arrived here via an invite or recovery link
      // by checking the URL hash for type=invite or type=recovery
      const hash = window.location.hash
      if (hash.includes('type=invite') || hash.includes('type=recovery')) {
        setMode('set-password')
      }
    }
  })

Clean up the onAuthStateChange subscription on unmount.

Do not change the standard login form behaviour. The mode switch is 
additive — standard login is the default, set-password appears only 
when the invite/recovery hash is detected.

---


ACCEPTANCE CRITERIA

[ ] Clicking an invite email link and arriving at the app switches the 
    login page into "Set your password" mode
[ ] Submitting mismatched passwords shows an inline error
[ ] Submitting a valid password calls supabase.auth.updateUser and 
    redirects the user to the correct route for their role
[ ] Standard login form is unchanged for normal logins
[ ] Invite form in UserManagement includes Canteen as a role option
[ ] npm run build completes without errors
[ ] No hardcoded hex values introduced