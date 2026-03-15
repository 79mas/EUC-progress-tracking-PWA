# EUC Tracker — Changelog

---

## v1.9.0 — Full Feature Release
*Current release*

### New features
- **Entry detail popup** — tap any row in the All Entries table to open a full detail view
- **Full entry editing** — edit date, time, ODM, and remarks directly in the popup
- **Entry deletion** — delete any entry with confirmation dialog
- **Chain recalculation** — editing or deleting an entry automatically recalculates all later entries for that wheel (km, total km, EUC time, StaVid); updated values are pushed to Sheets
- **Wheel management** — tap any wheel in Garage to edit name, starting ODM, date added, and colour
- **Wheel deletion** — delete a wheel and all its entries with confirmation
- **Colour picker** — 20 colours available when adding or editing a wheel; colour is used consistently across fleet cards, charts, and the entry popup
- **Smart confirmation dialogs** — confirmation is only required when changes affect calculations (ODM or date changes); cosmetic changes (colour, name) save without confirmation; two button variants: "Continue" for recalculation warnings, "Delete" for permanent deletions
- **Dashboard model filter** — tap the Total km area to filter all dashboard stats by a specific wheel; selection is remembered
- **Interactive average picker** — tap the average metric to choose from 11 options across 5 categories (daily, weekly, monthly, per entry, consistency streaks)
- **Analytics zoom and pan** — pinch to zoom and drag to pan on all three charts; ↺ Reset button on each chart
- **Column visibility toggles** — show or hide individual columns in the All Entries table; preference saved per device
- **Sortable table** — tap any column header to sort; tap again to reverse direction
- **Garage reordered** — fleet list shown first, add form below

### Improvements
- **km/d column** — replaces raw km; shows distance divided by days since previous entry (minimum 1 day), with 1 decimal place; sorts correctly
- **Entry vs ride logic** — entries on the same calendar date count as one ride day for consistency metrics
- **Week starts Monday** — this week stats and chart use Monday as the start of the week
- **Wheel colours** — all charts, fleet cards, and popups use the wheel's assigned colour via `mcolor()`
- **Hero label** — shows selected wheel name or "All wheels ▾" with a single tap target
- **Date parsing** — `safeDate()` helper ensures consistent date arithmetic across all browsers
- **Avg all time** — fixed NaN issue caused by inconsistent date string parsing
- Renamed "Model" → "Wheel" throughout the UI
- Renamed "Ride/Rides" → "Entry/Entries" throughout the UI
- Analytics filter label changed from "Models" to "Wheels"
- Removed ghost CSS classes and duplicate event handlers accumulated from earlier iterations

### Bug fixes
- `addEntry` / `editWheel` / `deleteWheel` — actions now match Code.gs handlers correctly
- Hero ID conflict (`d-model-label` vs `d-total-lbl`) resolved — single source of truth
- `addModel` now sends `color` parameter to Sheets
- `editWheel` now correctly passes `originalName` before mutation, preventing wrong row updates
- Confirmation dialog "Delete" button no longer appears on non-destructive save actions

---

## v1.0.0 — Initial Release

### Features
- Google Sign-In — session ends when app is closed; requires sign-in on every open
- Personal Google Sheets database — each user sets up their own Sheets + Apps Script; no shared server
- First-time onboarding — copy Sheets template, deploy Apps Script, paste Web App URL
- Dashboard: total km, this year, this week, this month, last entry card, fleet overview, this week bar chart, all entries table
- New Entry: wheel selector, datetime input, large ODM input with live trip preview, remarks
- Garage: add wheel with name, starting ODM, date added
- Analytics: date range filter, wheel checkboxes, 4 KPI cards, ride dynamics chart, cumulative growth chart, seasonality chart
- PWA — installable on iOS and Android, offline-capable shell
