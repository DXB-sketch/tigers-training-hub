Read CLAUDE.md and PHASE10_COMPLETE.md before doing anything else.

This is a CSS and layout-only change. Do not modify any data fetching, routing logic,
auth behaviour, Supabase queries, hooks, or component business logic. Every existing
route and feature must continue to work exactly as before — only the visual shell on
mobile (≤ 540px) changes.

---

GOAL: Replace the hamburger top-nav on mobile with a bottom tab bar and a redesigned
mobile header, making the app feel like a native coaching app rather than a desktop
website shrunk to phone size.

---

STEP 1 — Create a BottomNav component

Create src/components/layout/BottomNav.jsx and src/components/layout/BottomNav.css.

The component reads { role } from useAuth(). It renders nothing above 540px (hide via
CSS, not conditional rendering — the CSS media query handles it).

Coach bottom nav (role === 'coach') — 4 tabs:

  Tab 1  icon: house/home SVG    label: Home       links to: /coach
  Tab 2  icon: clipboard-list    label: Sessions   links to: /coach  (same route, scrolls to "All sessions" section)
  Tab 3  icon: list-details      label: Drills     links to: /coach/drill/:firstDrillId  (or /coach if no session)
  Tab 4  icon: user-circle       label: Account    links to: /account

NOTE: Tabs 1 and 2 both link to /coach. That is intentional — Sessions scrolls the
existing page. Do not build a new route. Use useLocation() to determine active state:
tab 1 is active when pathname === '/coach', tab 2 is never marked active (the scroll
anchor is enough), tab 3 is active when pathname starts with '/coach/drill', tab 4 is
active when pathname === '/account'.

Admin bottom nav (role === 'admin' or 'president') — 4 tabs:

  Tab 1  icon: layout-dashboard  label: Dashboard  links to: /admin
  Tab 2  icon: users             label: Teams      links to: /admin/teams
  Tab 3  icon: notebook          label: Plans      links to: /admin/plans
  Tab 4  icon: dots (•••)        label: More       opens an overlay sheet (see Step 3)

Active state: tab is active when pathname === the tab's route (exact match for tab 1,
startsWith for tab 3 /admin/plans).

Canteen workers (role === 'canteen') — render nothing. They keep the existing TopNav.

Use React Router NavLink for each tab so active detection is reliable.

Icons: use inline SVG, not an icon library. Each icon is a simple 24×24 viewBox SVG
path. Keep paths short — these are outline icons at 22px rendered size.

  Home:          M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z (house)
  Sessions:      M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4 (clipboard-check)
  Drills:        M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01 (list)
  Dashboard:     M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z (grid)
  Teams:         M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 (users)
  Plans:         M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z (book)
  More:          M12 5h.01M12 12h.01M12 19h.01 (three dots vertical — use circle cx=12 cy=5 r=1.5, repeat at cy=12, cy=19)
  Account:       M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 (user)

All SVG icons: stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"
stroke-linejoin="round". No filled icons.

BottomNav.css rules:

  .bottom-nav
    display: none            ← hidden on desktop
    position: fixed
    bottom: 0
    left: 0
    right: 0
    height: 60px
    background: var(--surface)
    border-top: 1px solid var(--rule)
    display: flex
    align-items: stretch
    justify-content: space-around
    z-index: 100
    padding-bottom: env(safe-area-inset-bottom)   ← iPhone home-bar spacing

  @media (max-width: 540px)
    .bottom-nav  →  display: flex

  .bottom-nav-item
    flex: 1
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    gap: 3px
    text-decoration: none
    color: var(--ink-faint)
    cursor: pointer
    background: none
    border: none
    padding: 6px 0

  .bottom-nav-item.active
    color: var(--tigers-gold)

  .bottom-nav-icon
    width: 22px
    height: 22px

  .bottom-nav-label
    font-size: 9px
    font-weight: 700
    letter-spacing: 0.10em
    text-transform: uppercase
    line-height: 1

  No border-radius anywhere. No gradients. No box-shadow. No background on active items.
  Active state is colour only (var(--tigers-gold) on icon and label).

---

STEP 2 — Add BottomNav to the app shell and pad the page body

In src/App.jsx, import BottomNav and render it once, inside the BrowserRouter but
outside the Routes switch — it appears on every authenticated page automatically.

  <BrowserRouter>
    <AuthProvider>
      <Routes>…</Routes>
      <BottomNav />
    </AuthProvider>
  </BrowserRouter>

In src/styles/base.css, add a mobile-only rule so page content is not hidden behind
the fixed nav bar:

  @media (max-width: 540px) {
    main {
      padding-bottom: calc(60px + env(safe-area-inset-bottom));
    }
  }

Do not add this padding on desktop. Do not add it to the TopNav or any other element.

---

STEP 3 — "More" overlay sheet for admin

Create src/components/layout/MoreSheet.jsx and src/components/layout/MoreSheet.css.

MoreSheet is a bottom sheet that slides up when the More tab is tapped. It is
controlled by a boolean prop: isOpen, and a callback: onClose.

It contains a plain vertical list of links — no icons, no cards. Just text rows:

  If role === 'president':  President  →  /president
  Always:                   Coaches    →  /admin/coaches
  Always:                   Canteen    →  /admin/canteen
  Always:                   Account    →  /account
  Always:                   Sign out   →  calls logout() from useAuth()

Each row is a full-width tap target (min 48px height). Tapping any row navigates and
closes the sheet. "Sign out" calls logout() and closes the sheet.

MoreSheet renders only inside BottomNav when role is admin or president. It is not
rendered for coaches or canteen workers.

CSS:
  .more-sheet-overlay
    position: fixed; inset: 0; background: rgba(26,26,24,0.5); z-index: 200
    display: none when closed, block when open

  .more-sheet
    position: fixed; bottom: 0; left: 0; right: 0
    background: var(--surface)
    border-top: 2px solid var(--ink)
    padding-bottom: calc(60px + env(safe-area-inset-bottom))
    z-index: 201

  .more-sheet-item
    display: block
    padding: 14px 24px
    font-size: 13px
    font-weight: 700
    color: var(--ink)
    letter-spacing: 0.08em
    text-transform: uppercase
    border-bottom: 1px solid var(--rule)
    text-decoration: none
    background: none
    border-left: none; border-right: none; border-top: none
    width: 100%
    text-align: left
    cursor: pointer
    font-family: Arial, Helvetica, sans-serif

  .more-sheet-item--signout
    color: var(--ink-muted)

No animation, no border-radius, no gradient. The sheet just appears/disappears.

---

STEP 4 — Mobile header: dark strip with gold club name and avatar initial

This replaces the hamburger behaviour on mobile. The TopNav already has the hamburger
hidden/shown via CSS media query. The goal is to change the mobile TopNav appearance
so it shows a simpler dark strip.

In src/components/layout/TopNav.css, add a mobile override block at the end:

  @media (max-width: 540px) {

    .top-nav {
      height: 48px;
      padding: 0 16px;
    }

    /* Show the club name on mobile (it was display:none if hidden) */
    .nav-club {
      display: block;
      font-size: 11px;
    }

    /* Hide everything except the club name */
    .nav-links,
    .nav-right--desktop,
    .nav-hamburger,
    .nav-dropdown {
      display: none !important;
    }

    /* On the drill sheet pages (DrillViewer), TopNav is replaced by an
       in-page back bar — hide TopNav entirely on those pages.
       DrillViewer adds class "drill-mode" to <body> via useEffect.
       See Step 5. */
    body.drill-mode .top-nav {
      display: none;
    }

  }

The result on mobile: a clean dark bar showing only "BRIBIE TIGERS" in gold on the
left. No hamburger, no links. The bottom nav handles all navigation.

On desktop (> 540px): TopNav is completely unchanged. The hamburger and dropdown keep
working as they do today.

Do not remove any existing TopNav JSX. Only add CSS overrides.

---

STEP 5 — Drill sheet focus mode (hide both navs, show minimal top bar)

When a coach is viewing a drill sheet (/coach/drill/:id or /coach/plan/:planId/drill/:id),
neither the top nav nor the bottom nav should appear. The existing back button and
Prev/Next row inside DrillSheet handle all navigation.

In DrillViewer.jsx, add a useEffect that adds the class "drill-mode" to document.body
on mount and removes it on unmount:

  useEffect(() => {
    document.body.classList.add('drill-mode')
    return () => document.body.classList.remove('drill-mode')
  }, [])

In BottomNav.css, add:

  body.drill-mode .bottom-nav {
    display: none !important;
  }

Combined with the TopNav CSS from Step 4, this means drill pages show no persistent
nav chrome at all on mobile. The DrillSheet's existing prev/next row and back link
are the only navigation. This is intentional — focus mode on pitch.

---

STEP 6 — Coach dashboard header: dark hero strip on mobile

The CoachDashboard page currently has a .session-header block (white background,
date + session title + team). On mobile, replace its visual treatment with a dark
hero strip that matches the mockup.

In src/pages/CoachDashboard.css, add at the end:

  @media (max-width: 540px) {

    .session-header {
      background: var(--nav-bg);
      padding: 14px 16px 16px;
    }

    .session-date {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--tigers-gold);
      margin-bottom: 3px;
    }

    .session-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--surface);
      margin-bottom: 0;
    }

    .session-team {
      font-size: 11px;
      color: var(--ink-faint);
      margin-top: 4px;
    }

  }

Do not change the desktop styles. Do not change the JSX structure.

---

STEP 7 — Admin dashboard header: dark hero strip on mobile

In src/pages/AdminDashboard.css, add at the end:

  @media (max-width: 540px) {

    .page-head {
      background: var(--nav-bg);
      border-bottom: none;
      padding: 14px 16px 16px;
    }

    .page-title {
      color: var(--surface);
    }

    .page-sub {
      color: var(--ink-faint);
    }

    /* Stack the stats row 2×2 in the dark header */
    .stats-row {
      background: var(--nav-bg);
      padding: 0 16px 14px;
      border-bottom: 1px solid var(--nav-border);
    }

    .stat-cell {
      background: #2a2a26;
      padding: 8px 10px;
    }

    .stat-label {
      color: var(--ink-faint);
    }

    .stat-num {
      color: var(--surface);
      font-size: 18px;
    }

    .stat-sub {
      color: #666;
    }

  }

Do not change desktop styles. Do not change the JSX.

---

STEP 8 — Verify nothing is broken

After all steps are complete, check:

1. On mobile (resize browser to 375px width):
   - /coach shows dark header + drill list + bottom nav (Home tab active)
   - /coach/drill/:id shows no bottom nav and no top nav
   - /admin shows dark header + stats + bottom nav (Dashboard tab active)
   - /admin/teams shows bottom nav (Teams tab active)
   - /admin/plans shows bottom nav (Plans tab active)
   - Tapping More tab opens the MoreSheet
   - Tapping any MoreSheet link navigates and closes the sheet
   - /account shows bottom nav (Account tab active for coach, nothing active for admin — that is fine)
   - /login has no bottom nav (BottomNav renders nothing when role is null/loading)
   - /president still works and shows in MoreSheet for president role

2. On desktop (> 540px):
   - TopNav is completely unchanged
   - No bottom nav appears
   - No extra padding-bottom on main
   - Hamburger menu still works
   - All existing layouts are identical to before

---

ACCEPTANCE CRITERIA

[ ] BottomNav renders only on ≤ 540px
[ ] Coach nav: 4 tabs, correct routes, active state via colour only
[ ] Admin nav: 4 tabs, More opens MoreSheet, MoreSheet links navigate and close
[ ] Drill sheet pages: body.drill-mode hides both top nav and bottom nav on mobile
[ ] CoachDashboard mobile: .session-header has dark background (var(--nav-bg))
[ ] AdminDashboard mobile: .page-head and .stats-row have dark background
[ ] Desktop: TopNav is visually identical to before this change
[ ] Desktop: No bottom nav visible anywhere
[ ] No border-radius on BottomNav, MoreSheet, or any new element
[ ] No hardcoded hex values in any new CSS — only var(--token-name) references
[ ] No new external libraries or fonts introduced
[ ] No changes to routing, auth, hooks, or any data logic
[ ] npm run build completes without errors

---

WORKING NOTES

- BottomNav must handle the unauthenticated state gracefully. When role is null or
  undefined (e.g. on the login page or while auth is loading), BottomNav renders null.

- env(safe-area-inset-bottom) handles the iPhone home indicator. If the browser does
  not support it, the expression evaluates to 0 — safe to use everywhere.

- The "Sessions" tab on coach nav links to /coach but is never marked active. This
  is intentional — it acts as a scroll shortcut to the "All sessions" section already
  on the CoachDashboard page. No new route needed.

- MoreSheet is mobile-only and lives inside BottomNav's JSX. It does not need its
  own route. It is not shown on desktop.

- The existing hamburger dropdown (nav-dropdown) still exists in the DOM on mobile
  but is hidden via the CSS rule in Step 4. Do not remove it — it would break desktop
  if removed incorrectly.

- Do not add "padding-bottom" to any element other than main. The BottomNav is fixed
  so it floats over content; only main needs the offset.

- DrillViewer.jsx has two viewer functions (CoachDrillViewer, CoachPlanDrillViewer,
  AdminDrillViewer). Add the useEffect to the top-level DrillViewer export function
  that wraps all three — not to each inner function individually.

When done, write PHASE11_COMPLETE.md at the project root. Include:
- What was built (exact files created or modified)
- Any deviations from this spec and why
- How to test the mobile nav on desktop (resize to 375px or use DevTools device mode)
- What Phase 12 needs to know
