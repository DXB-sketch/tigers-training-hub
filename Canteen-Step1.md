Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

You are starting Phase 10: Canteen Hub. Phase 9 delivered a full 
responsive design pass. Do not touch any existing pages, components, 
hooks, or routes. This step is purely frontend wiring — the database 
tables already exist.

---

STEP 1: Update AuthContext for canteen role

File: src/context/AuthContext.jsx

The login redirect logic currently handles coach, admin, president.
Add one case: if role === 'canteen', redirect to /canteen.
No other changes to AuthContext.

---

STEP 2: Add routes

File: src/App.jsx (or wherever routes are defined)

Add these two routes. Import the two new page components (created in Step 3).

  <Route path="/canteen" element={
    <ProtectedRoute allowedRoles={['canteen']}>
      <CanteenDashboard />
    </ProtectedRoute>
  } />

  <Route path="/admin/canteen" element={
    <ProtectedRoute allowedRoles={['admin','president']}>
      <AdminCanteenPage />
    </ProtectedRoute>
  } />

---

STEP 3: Create skeleton page files

Create src/pages/CanteenDashboard.jsx:
  A minimal functional component that renders:
  <main><p style={{padding:'20px'}}>Canteen Dashboard — coming soon</p></main>

Create src/pages/AdminCanteenPage.jsx:
  A minimal functional component that renders:
  <main><p style={{padding:'20px'}}>Admin Canteen — coming soon</p></main>

These will be replaced in later steps. They only need to exist so 
routing can be verified now.

---

STEP 4: Update TopNav

File: src/components/layout/TopNav.jsx

Make the following additions only. Do not change any existing nav 
behaviour for coach, admin, or president roles beyond what is listed.

4a. When role === 'canteen':
    - Show these nav links: "Schedule" → /canteen  |  "Wish List" → /canteen?tab=wishlist
    - Show role badge text: "Canteen"
    - The hamburger dropdown (mobile, ≤ 540px) must also include these 
      two links in the canteen branch

4b. When role === 'admin' or role === 'president':
    - Add a "Canteen" nav link pointing to /admin/canteen, placed after 
      the existing admin nav links
    - The hamburger dropdown must also include this link in the admin/president branch

---

ACCEPTANCE CRITERIA

[ ] Logging in as a canteen worker redirects to /canteen
[ ] /canteen shows the skeleton page for canteen role
[ ] /canteen is blocked for admin, president, and coach roles
[ ] Admin and president see a "Canteen" link in TopNav pointing to /admin/canteen
[ ] /admin/canteen shows the skeleton page for admin and president roles
[ ] /admin/canteen is blocked for canteen and coach roles
[ ] Canteen worker TopNav shows "Schedule" and "Wish List" links and "Canteen" badge
[ ] Hamburger dropdown includes the new links for both role branches
[ ] npm run build completes without errors
[ ] No hardcoded hex values introduced

Do not write PHASE10_COMPLETE.md yet.
Do not change any functionality not listed in Steps 1 through 4.