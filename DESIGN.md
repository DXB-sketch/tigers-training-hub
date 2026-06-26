DESIGN.md — Bribie Island Tigers Training Hub
Product context
A training plan management tool for a community football club. Admins create and publish structured training sessions; coaches view their assigned sessions on their phone at the training ground. The primary output is a printed or on-screen drill sheet that a coach holds during a session. Every design decision must serve legibility under real-world conditions: outdoor light, one hand occupied, split attention.
Register: Product (design serves the tool, not the brand)
Scene sentence: A coach in their mid-30s stands on a grass pitch at 6pm, holding a phone or printed A4 sheet, trying to find the setup instructions for the next drill while 14 kids are waiting.

Colour system
One gold accent. Two neutrals. That is the entire palette. Do not add colours without a clear semantic reason.
--tigers-gold:      #c88000   /* Primary accent: headings, key terms, active states, duration */
--tigers-gold-pale: #fdf6e3   /* Tinted background: active row, focus state highlight */
--ink:              #1a1a18   /* Primary text, section borders, buttons */
--ink-mid:          #2a2a26   /* Body text */
--ink-muted:        #666666   /* Subtitles, secondary text */
--ink-faint:        #888888   /* Meta labels in UI, captions */
--rule:             #d8d4cc   /* Dividers, borders between cells */
--rule-light:       #eeebe4   /* Table row dividers, light separators */
--surface:          #fdfcf9   /* Page/card background - off-white, not pure white */
--surface-warm:     #f5f2eb   /* Slight warmth for pitch area background, alternating rows */
--surface-meta:     #f0ede6   /* Week divider backgrounds, filter bars */
--page-bg:          #e0ddd6   /* App background behind white surfaces */
--nav-bg:           #1a1a18   /* Top navigation bar */
--nav-border:       #2e2e2a   /* Nav internal dividers */

/* Semantic status - used only for status pills */
--status-ok-bg:     #e6f0dc
--status-ok-text:   #2a5e10
--status-warn-bg:   #fdf4dc
--status-warn-text: #7a4e00
--status-err-bg:    #fce8e8
--status-err-text:  #8a1c1c

/* Pitch colours - fixed, not theme-variable */
--pitch-green:      #2d5a1b
--pitch-line:       #a8d880
--player-red:       #c01818
--player-blue:      #1a4ba8
Colour strategy: Restrained. Gold at under 10% of any surface. Used for: active nav items, section heading underlines, key terms in drill copy, duration values, exercise numbers, status accents, button text on dark backgrounds.
Never use gold as a fill on large areas. Never use it decoratively.

Typography
Font stack: Arial, Helvetica, sans-serif throughout. System font, universally available, prints reliably. No web fonts required.
Scale
RoleSizeWeightTrackingTransformColourClub name (nav)10px7000.18emuppercase--tigers-goldNav links11px7000.10emuppercase#666 / --surface activeSection label (eyebrow)8–9px7000.14–0.16emuppercase--ink-faint or --tigers-goldPage title20px7000none--inkDrill name18–22px7000none--inkTable/list body12–13px4000none--ink-midMeta values12–13px7000none--inkStatus pills8–9px7000.10emuppercasesemanticFooter / captions9–10px700 (labels) / 400 (captions)0.10–0.12emuppercase (labels)#bbb
Minimum font size: 9px on screen, 10pt on print. Labels below this threshold disappear at arm's length.
Hierarchy rules

Two weights only: 400 (body) and 700 (labels, headings, key terms).
Hierarchy comes from size + weight contrast, not colour alone.
Key tactical terms in drill copy use .kt class: font-weight: 700; color: var(--tigers-gold).
Coaching instructions contrasted with .ktd class: font-weight: 700; color: var(--ink).
All label text is uppercase with letter-spacing. Body text is sentence case, no transform.
Line length: cap at 65–75ch on body text. Drill description columns should not exceed this.


Layout system
Spacing
Do not use uniform padding everywhere. Vary for rhythm.
--space-xs:   4px
--space-sm:   8px
--space-md:   12–14px   /* internal section padding */
--space-lg:   16–20px   /* between major sections */
--space-xl:   24–28px   /* page horizontal margins */
Page horizontal margins: 28px on desktop, 20px on mobile.
Grid

Admin desktop: Left sidebar (260px) + main content (1fr). Nav items in a top bar.
Plan builder: Left sidebar (260px) + main editor (1fr). Editor has its own internal two-column layout for text fields.
Drill sheet (output): Two-column content below the pitch: grid-template-columns: 1fr 1fr; gap: 0 36px.
Mobile (< 540px): All two-column layouts collapse to single column. Sidebars become bottom drawers or separate routes.

Border system

Heavy rule 2.5px solid #1a1a18: only below the page/section header. Creates the document-feel authority line.
Standard rule 1px solid #d8d4cc: between rows, between sidebar sections.
Light rule 1px solid #eeebe4: table row separators.
Active underline 1.5px solid #c88000: section heading underlines on drill sheets. Full-width (display: block), not inline.
Never use coloured side-stripe accents (border-left > 1px with colour). Banned.

No cards
Do not wrap content sections in bordered cards. Structure comes from typography hierarchy and horizontal rules. The drill sheet is a document, not a UI.
Exceptions where a card-like treatment is acceptable:

Status pills (small inline badges).
The plan builder sidebar (dark background panel is a panel, not a card).
Callout annotations on pitch diagrams.


Component patterns
Top navigation bar
Dark (#1a1a18) with gold club name, uppercase nav links, admin role badge. Height: 52px. Active link: white text with gold bottom border (2px solid #c88000, margin-bottom: -1px to bleed into border-bottom). No hover backgrounds. No gradients.
html<nav class="top-nav">
  <span class="nav-club">Bribie Tigers</span>
  <div class="nav-links">
    <a class="nav-link active">Dashboard</a>
    <a class="nav-link">Teams</a>
    <a class="nav-link">Training Plans</a>
  </div>
  <div class="nav-right">
    <span class="nav-role">Admin</span>
  </div>
</nav>
Page header
White surface (--surface), heavy bottom border. Title + subtitle left, action button right. No background tints.
html<div class="page-head">
  <div>
    <h1 class="page-title">Teams</h1>
    <p class="page-sub">Manage coaches and plan assignments</p>
  </div>
  <button class="primary-btn">+ Add team</button>
</div>
Primary button
Black background, gold text, uppercase, no border-radius.
css.primary-btn {
  background: var(--ink);
  color: var(--tigers-gold);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 10px 18px;
  border: none;
  cursor: pointer;
}
Secondary button / outline
White background, black border, black text, uppercase.
css.secondary-btn {
  background: var(--surface);
  color: var(--ink);
  border: 1.5px solid var(--ink);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 10px 18px;
  cursor: pointer;
}
Status pills
No border-radius. Flat, compact, uppercase. Three states only:
css.status-published  { background: #e6f0dc; color: #2a5e10; }
.status-draft      { background: #fdf4dc; color: #7a4e00; }
.status-error      { background: #fce8e8; color: #8a1c1c; }
/* All: font-size: 8–9px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; padding: 3px 9px; */
Data tables
No zebra striping. Rows separated by 1px solid #eeebe4. Header row separated by 1px solid #d8d4cc. Header text: 8px uppercase, #bbb. Body: 12–13px, --ink-mid. Hover: background: #f7f5ef. No border around the table. No outer border-radius.
css.data-table th { font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #bbb; padding: 10px 24px 8px; border-bottom: 1px solid #d8d4cc; }
.data-table td { font-size: 12px; padding: 11px 24px; border-bottom: 1px solid #eeebe4; }
.data-table tr:hover td { background: #f7f5ef; }
Drill sheet section headings
Full-width gold underline, not inline. Uppercase, 9px, black text.
css.section-head {
  display: block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink);
  border-bottom: 1.5px solid var(--tigers-gold);
  padding-bottom: 4px;
  margin-bottom: 10px;
  width: 100%;
}
Drill navigation (swipe indicator)
Screen-only, hidden on print. Prev/Next text links in gold. Dots indicator showing current drill. No animation, no frills.
html<div class="drill-nav">
  <a class="nav-btn">← Prev</a>
  <div class="nav-dots">
    <span class="dot"></span>
    <span class="dot active"></span>
    <span class="dot"></span>
  </div>
  <a class="nav-btn">Next →</a>
</div>

Pitch diagram system
Core principles

The pitch is always the cropped zone relevant to the drill, never a full pitch by default. The admin chooses the crop: half, third, custom rectangle.
Clean green surface. White pitch markings at 40–50% opacity. Goals are solid white with a filled rectangle representing the net area.
No gradients, no 3D perspective, no decorative effects.
<defs> with arrowhead markers must always be the first child of <svg>.
All player labels below dots use fill="#e8e0cc" — a warm near-white that is legible on the green surface without being an additional colour.

Player dots
Two teams. Flat filled circles, no stroke or a 0px stroke (the earlier stroke caused "neon" appearance). Position abbreviation inside the dot in white 700-weight text.
Red team:  fill="#c01818"  (dark, printable red)
Blue team: fill="#1a4ba8"  (dark, printable navy)
Do not tint, do not add glow. Do not use the same colour as the gold accent for any player element.
Arrow types
Movement (player run):  gold #f0a500, 2px, stroke-dasharray="7,4", open arrowhead (aMove marker)
Pass option:            navy #4477cc, 1.6px, stroke-dasharray="4,3", open arrowhead (aPass marker)
Zone outline:           gold #f0a500, 1.2px, stroke-dasharray="6,4", no arrowhead, 40% opacity fill
Callout annotations
White background (fill="#fff"), 1px #ccc border, rx="2". Text at 8–9px. Position outside the main playing area (left or right margin of the SVG). Do not use rgba fills — use solid white for print safety.
Goal sizes (width in SVG units at standard viewBox 720px)
Mini goal:   width 60    (U5–U7, accuracy drills)
Small goal:  width 96    (first metal goal)
Medium goal: width 128   (U10–U14)
Full goal:   width 192   (U16+, FIFA standard)
Legend
Always show a legend below the pitch SVG as HTML, not inside the SVG. Four items max: red team, blue team, player run, pass option. 10px text, --ink-faint colour.
Print safety
Add print-color-adjust: exact; -webkit-print-color-adjust: exact to .pitch-svg-wrap.

Drill sheet layout (the primary output document)
This is the most important surface in the app. It is designed to be printed on A4 and viewed on a phone.
Structure (top to bottom)

Page header — club name (uppercase, 10px), session info (team, week, day), exercise number (large gold, top right). Heavy bottom rule.
Meta row — four fields: Coach, Duration (gold), Format, Intensity. Separated by vertical rules. Light background (--surface-warm) or no background. Border-bottom only.
Drill title block — category eyebrow (9px gold uppercase), drill name (22px bold), subtitle description (12px muted). Padding below before pitch.
Pitch SVG — cropped to relevant zone. Border 1px solid #aaa. print-color-adjust: exact.
Pitch legend — inline HTML below the SVG. Not inside SVG.
Two-column content grid — grid-template-columns: 1fr 1fr; gap: 0 36px. Left column, top to bottom: Description, Setup. Right column, top to bottom: Organisation, Progressions, Coaching points. This order reflects what a coach needs in sequence: understand the drill, set it up, know the progressions, then the coaching cues.
Drill navigation — screen only (@media print { display: none }). Prev/dots/Next.
Page footer — club name left, page reference right. 9px uppercase, #bbb.

Content section order rationale
The coach reads in order of need during a session:

Description — what is happening in this drill
Setup — how to physically arrange players and equipment
Organisation — quick-reference specs (area, goals, balls, rest)
Progressions — how the drill changes as the session evolves
Coaching points — what to look for and say once it is running

Do not reorder these. Do not add sections between them without good reason.

Screens inventory
ScreenRouteWhoPurposeLogin/loginAllEmail/password, role-based redirectCoach dashboard/coachCoachSession overview for today + drill listDrill sheet (coach view)/coach/drill/:idCoachRead-only drill sheet, swipe navigationAdmin dashboard/adminAdminAll teams status at a glanceTeam management/admin/teamsAdminAssign coaches, view contacts, assign plansPlan library/admin/plansAdminAll plans, filterable, create newPlan builder/admin/plans/:id/editAdminBuild session: add drills, edit pitch, write contentPlan preview/admin/plans/:id/previewAdminSee the plan as the coach will see it

Responsive behaviour
Desktop (> 700px)

Admin pages: top nav + two-column layout (sidebar + main).
Plan builder: three-zone layout (dark sidebar / pitch editor / text fields).
Drill sheet: two-column content grid below pitch.

Mobile (≤ 540px)

All two-column content grids collapse to single column.
Admin sidebars become separate routes or slide-up panels.
Drill sheet: pitch full-width, content single column in section order: Description → Setup → Organisation → Progressions → Coaching points.
Nav collapses to a minimal top bar with back arrow and drill number only.
Team management table hides non-essential columns; tap row to open detail.


Print stylesheet
Every page that can be printed must include:
css@media print {
  @page {
    margin: 12mm;
    size: A4 portrait;
  }
  body {
    background: #fff;
    padding: 0;
  }
  .top-nav,
  .drill-nav,
  .pitch-toolbar,
  .plan-sidebar,
  .filter-bar {
    display: none;
  }
  .pitch-svg-wrap {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .content-cols,
  .drill-fields {
    grid-template-columns: 1fr 1fr;
  }
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
}

Anti-patterns (banned)
These will appear in AI-generated code and must be removed on sight:

Rounded corners on everything. border-radius only on status pills (where it is intentional). No rounded-lg, no rounded-full on buttons or containers.
Side-stripe accents. border-left: 4px solid gold on list items or cards. Replace with typography hierarchy.
Glassmorphism / backdrop-filter. Never.
Gradient text or gradient backgrounds. Never.
Hero metric cards. Big number + small label + supporting stats in a bg-gradient card. Not this app.
Identical card grids. Every section heading in its own identical bordered card. Use document layout instead.
Neon or glowing effects. Player dot strokes that create a glow (stroke="#e05050" on a red fill). Use solid fills, no stroke, or a 1px matching-colour border if separation is needed.
Dark athletic / tech dashboard aesthetics. The admin screens are light (--surface). Only the nav bar is dark. Not the whole app.
Inter/Roboto/Space Grotesk. Arial only.
Em dashes in UI copy. Use comma, colon, or period instead.
Cards nested inside cards. Never.
Backgrounds on meta strips that use rgba. Use solid colours only for print safety.


File structure (for Claude Code)
src/
  components/
    layout/
      TopNav.jsx
      PageHeader.jsx
    drill/
      DrillSheet.jsx        # The primary output component
      PitchCanvas.jsx       # SVG pitch editor and viewer
      DrillNav.jsx          # Swipe prev/next indicator
      DrillFields.jsx       # The text content fields
      PitchLegend.jsx       # HTML legend below pitch
    admin/
      TeamTable.jsx
      TeamDetailPanel.jsx
      PlanList.jsx
      PlanBuilder.jsx
      PlanSidebar.jsx
    shared/
      StatusPill.jsx
      SectionHead.jsx
      MetaRow.jsx
  pages/
    Login.jsx
    CoachDashboard.jsx
    DrillViewer.jsx
    AdminDashboard.jsx
    TeamManagement.jsx
    PlanLibrary.jsx
    PlanBuilder.jsx
  styles/
    tokens.css              # CSS custom properties (all the above variables)
    base.css                # Reset + body + typography base
    print.css               # @media print rules
  data/
    mockData.js             # Seed data for all teams, coaches, plans, drills