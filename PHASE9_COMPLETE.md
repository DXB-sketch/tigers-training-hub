# Phase 9 Complete

## What was built

A full responsive design pass. Every screen now adapts to 375px viewport width with no horizontal scrolling. No functionality was changed — only CSS breakpoints and the minimal JSX needed for hamburger state and mobile panel switching were added.

## Changes by step

### Step 1 — Viewport meta tag
Added `maximum-scale=1.0` to the existing viewport meta in `index.html`.

### Step 2 — Responsive TopNav (≤ 540px)
`TopNav.jsx` and `TopNav.css`. Added a `hamburgerOpen` boolean state, a `navRef` on the nav element, and a `mousedown` outside-click listener (cleans up on unmount). At ≤ 540px, the nav-links and nav-right sections get `display: none` via the `nav-right--desktop` class; the hamburger button shows. The dropdown is conditionally rendered in JSX (only in the DOM when open) and given `display: flex` via CSS inside the `≤ 540px` media query. The dropdown contains all nav links as stacked rows, the Account link, and the role badge. Applied to both coach and admin/president branches.

### Step 3 — Responsive DrillViewer
CSS-only changes to `DrillSheet.css`, `DrillNav.css`, `PitchLegend.css`. At ≤ 540px:
- `drill-page-header` and `drill-title-block` reduce horizontal padding to 16px
- `pitch-block` horizontal padding removed (0) so the SVG wrapper fills the available width
- `content-cols` already collapsed to 1fr (existed before); redundant rule extended for padding
- `page-footer` hidden
- DrillNav `.nav-btn` gets `min-height: 44px; min-width: 44px; padding: 10px 18px`
- PitchLegend items allow wrap (already flex-wrap: wrap); font-size confirmed at 10px

### Step 4 — Responsive CoachDashboard
`CoachDashboard.css`. At ≤ 540px: session-header, overview-block, drills-label, and drill-cards get 16px horizontal padding; `.drill-card` min-height 44px; long titles get `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`; the 4th overview-table column (Notes) is hidden.

### Step 5 — Responsive admin list+detail pages
Applied identical pattern to `TeamManagement`, `CoachesPage`, and `UserManagement`.

**JSX changes (each page):**
- Added `has-selection` class to the layout div when selectedId (or createMode for TeamManagement) is non-null
- Wrapped the detail panel component in a `tm-detail-col` / `coaches-detail-col` / `um-detail-col` div
- Added a `mobile-back-btn` button that renders conditionally (when selection exists) and is hidden at > 700px via CSS

**CSS changes (each page's CSS file):**
- At ≤ 700px: detail column hidden by default; `has-selection` hides list panel and shows detail column
- `.mobile-back-btn` hidden at > 700px, styled as 11px uppercase gold at mobile
- List rows get `position: relative; padding-right: 36px; min-height: 44px` and a `::after` chevron (›)

Did not modify `TeamDetailPanel.jsx`, `CoachDetailPanel.jsx`, or `UserDetailPanel.jsx`.

### Step 6 — Responsive PlanLibrary
`PlanLibrary.css`: at ≤ 540px filter bar stacks vertically, each select/search full width, filter divider hidden.
`PageHeader.css`: at ≤ 540px, `.page-head` flexes to column so the primary action button takes full width — applied globally (consistent pattern across all pages).
`PlanList.jsx`: added a `.pi-mobile-sub` element inside `.pi-body` showing `teamName · Wk weekNumber`.
`PlanList.css`: at ≤ 540px, grid changes to `1fr auto auto`, `.pi-week` and `.pi-team` and `.pi-meta` and `.pi-action` hidden, `.pi-mobile-sub` shown. `@media (hover: none)` rule makes the delete button always visible on touch devices.

### Step 7 — Responsive AdminDashboard
`AdminDashboard.css`: extended the existing breakpoint and added a ≤ 540px block reducing padding. `TeamTable.css`: at ≤ 600px, cell padding reduced to 9px 12px to prevent overflow (`.hide-mobile` was already wired in the component). The "This week's plan" column was already hidden via `hide-mobile` class on both `<th>` and `<td>`.

### Step 8 — Responsive PlanBuilder (minimum viable)
`PlanBuilder.css`: at ≤ 700px, the three-zone `builder-layout` grid stacks to a single column; `.plan-sidebar` gets `max-height: 200px; overflow-y: auto` and its border-right removed; `.drill-fields` collapses to `grid-template-columns: 1fr`; toolbar buttons get `min-height: 36px`.

## Pages that needed the most work

1. **TopNav** — required the most JSX change (new state, ref, event listener, conditional dropdown render) and touched the most visual elements.
2. **TeamManagement** — most complex page to make responsive: three-zone layout (age groups + teams + detail panel), deep create-form branch, and the `has-selection` class needed to cover both `selectedId` and `createMode`.
3. **PlanLibrary / PlanList** — required a JSX change (mobile sub-line element) plus careful CSS for the four-column row collapsing to two.

## Deviations from spec

1. **PageHeader primary button made full-width globally** (not just PlanLibrary). The spec called it out for PlanLibrary but making it consistent across all pages is a better pattern and avoids page-specific class hacks.
2. **Hamburger dropdown is conditionally rendered (not always-in-DOM with display:none)**. The spec's comment says "display: none at > 540px" which could imply always-in-DOM. I used conditional render instead because it avoids having stale dropdown state at desktop, and the CSS approach (display:flex inside the media query) still works correctly when it is rendered.
3. **"Back" button is styled as a full-width borderless button** with a bottom rule line rather than a bare inline link. This is cleaner touch target and visually consistent with the nav dropdown items.

## What Phase 10 needs to know

1. `mobile-back-btn` is a CSS class defined separately in `TeamManagement.css`, `CoachesPage.css`, and `UserManagement.css` with identical styles. If more pages need it, consider extracting to a shared file.
2. The `has-selection` + `tm-detail-col` / `coaches-detail-col` / `um-detail-col` pattern is now the standard for list+detail pages at mobile. Follow it for any new admin pages.
3. `PageHeader.css` now has a ≤ 540px breakpoint that stacks the header and makes the action button full-width — any new primary action buttons added to page headers will automatically be full-width at mobile.
4. The TopNav hamburger dropdown renders all nav links. If new nav links are added to the desktop nav, they must also be added to the dropdown section in `TopNav.jsx`.
5. `PlanList` now renders a `.pi-mobile-sub` element that is hidden at desktop. If the plan data shape changes (e.g., `teamName` or `weekNumber` removed), update both the JSX and the CSS.
