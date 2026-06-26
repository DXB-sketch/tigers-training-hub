This is a Type B (debug/fix) prompt. I have everything I need from the project context files — I know exactly what's happening with the print ordering bug. Let me diagnose and write the prompt.

**Diagnosis:** The print ordering bug is a data fetch issue. When `PrintView` (or `DrillViewer` in print mode) renders drills for printing, it's likely fetching drills from the database ordered by their database insertion order (`id` or `created_at`) rather than by the `drill_order` column that gets updated when the user reorders drills in the PlanBuilder. The visual reorder in the builder updates `drill_order` in the DB and re-sorts in the UI, but the print query ignores this sort column.

Here's the Claude Code CLI prompt:

---

```
Read CLAUDE.md and PHASE9_COMPLETE.md before doing anything else.

These are targeted bug fixes. Do not change any functionality not explicitly mentioned. Fix the issue below, then confirm what was changed.

---

ISSUE 1 — Print view ignores drill_order, prints drills in insertion order

Observed: When drills are reordered in the PlanBuilder, the new order is reflected correctly in the plan builder UI and in the coach drill viewer. However, when printing (via PrintView at /admin/plans/:id/print), the drills appear in their original creation order, not the reordered sequence. This means the n/N exercise number printed on each drill sheet is wrong — drill 3 might print as "Exercise 1 of 6" because it was the first drill inserted into the database.

Root cause: The query or data fetch used by PrintView is not ordering results by the drill_order column. Drills fetched without an explicit ORDER BY drill_order will return in database insertion order (by id or created_at), which does not reflect user reordering. The PlanBuilder reorder saves updated drill_order values to each drill row, but the print fetch does not sort by this column.

Fix: Locate the Supabase query that fetches drills for PrintView. This will be either:
- A direct query inside PrintView or a hook called only by PrintView
- The shared useDrills hook that is also used by PlanBuilder and DrillViewer

Check whether the query that supplies drill data to PrintView includes `.order('drill_order', { ascending: true })`. If it does not, add it. If the shared useDrills hook already has this order clause and PrintView uses a different fetch path, add the same order clause to that path.

After fixing, verify that the drill_order sort is applied before the drills are mapped to page output — if the component sorts client-side after fetching (e.g. with Array.sort), confirm that sort is also present in the PrintView data pipeline.

Do not change the sort order used by PlanBuilder or DrillViewer — only ensure PrintView uses the same drill_order sort that the rest of the app uses.

---

ACCEPTANCE CRITERIA

[ ] Reordering drills in PlanBuilder and then opening PrintView shows drills in the new order
[ ] The n/N exercise number on each printed drill matches the visual order shown in the plan builder
[ ] PlanBuilder drill list order is unchanged
[ ] DrillViewer drill navigation order is unchanged
[ ] npm run build completes without errors

---

WORKING NOTES

- PrintView is at /admin/plans/:id/print (src/pages/PrintView.jsx or similar)
- drill_order is the column name in the drills table that stores the user-defined sequence
- transformDrill() in useDrills.js handles snake_case to camelCase conversion — the sort must be applied before or within the Supabase query, not after transformation
- Do not change any functionality not mentioned
```