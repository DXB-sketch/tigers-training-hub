# Bribie Island Tigers FC — Training Hub

## These are the rules you must follow at all times:

When pushing code to github, do nost post the file .gitignore , do not post GitIgnore-Multi Files , do not push any .env files.

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## What this project is
A training plan management app for a community football club.
Admins create and publish structured training sessions.
Coaches view their assigned sessions on mobile at the training ground.
The primary output is a printed or on-screen drill sheet.

## Tech stack
- React 18 + Vite
- React Router v6
- Supabase (@supabase/supabase-js) — auth and database
- Plain CSS with custom properties (tokens.css) — NO Tailwind, NO CSS-in-JS
- NO component libraries (no MUI, shadcn, Radix, etc.)

## Commands
- Start dev server: npm run dev
- Build: npm run build
- Preview build: npm run preview

## Project structure
src/components/layout/     — TopNav, PageHeader, ProtectedRoute
src/components/drill/      — DrillSheet, PitchCanvas, DrillNav, PitchLegend
src/components/admin/      — TeamTable, TeamDetailPanel, PlanList, PlanSidebar
src/components/shared/     — StatusPill, MetaRow
src/pages/                 — One file per route
src/styles/                — tokens.css, base.css, print.css
src/data/mockData.js       — All seed/mock data
src/lib/supabase.js        — Supabase client
src/context/AuthContext.jsx — Auth state and role

## Design rules — non-negotiable
- DESIGN.md contains the design requirements to follow when doing any UI/UX work.
- All colours come from CSS custom properties in tokens.css. No hardcoded hex values in components.
- No border-radius on containers, buttons, or inputs unless explicitly stated.
- No gradient text, no glassmorphism, no neon strokes on player dots.
- No Tailwind classes, no inline style objects for layout.
- Minimum font size: 9px. All uppercase text needs letter-spacing of at least 0.10em.
- Section headings on drill sheets use full-width gold underline (display: block).
- <defs> must always be the first child of any <svg> element.

## Visual references
The /mockups folder contains HTML files that are the authoritative visual 
reference for every screen. Match them as closely as possible.
- 01_drill_sheet.html  →  DrillSheet component + DrillViewer page
- 02_login.html        →  Login page
- 03_coach_dashboard.html  →  CoachDashboard page
- 04_admin_dashboard.html  →  AdminDashboard page
- 05_team_management.html  →  TeamManagement page
- 06_plan_library.html     →  PlanLibrary page
- 07_plan_builder.html     →  PlanBuilder page


## Phase handoff files
After each phase, a PHASE_N_COMPLETE.md file is written to the project root.
Read the most recent one at the start of any new session.

## Current phase
Phase 1 — Foundation scaffold. No Supabase data yet, mock auth only.