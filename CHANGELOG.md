# EUC Tracker — Changelog

---

## v1.9.1 — Offline Queue & Background Sync

### New
- **Offline queue** — new entries saved while offline are queued in `localStorage`
- **Background sync** — when connection is restored, queued entries are automatically flushed to Sheets before the next sync
- **Offline indicator** — amber banner at the top of the screen when the device has no connection
- **Queue badge** — sync button shows a count of pending queued entries
- **Graceful blocking** — edit and delete are blocked offline with a clear message; only new entries can be created without a connection
- **Sync flushes queue first** — manual sync always processes the offline queue before fetching fresh data
- **Service Worker updated** — stale-while-revalidate caching strategy; all JS libraries cached on install

---

## v1.9.0 — Full Feature Release

### New features
- **Entry detail popup** — tap any row in the All Entries table to open a full detail view
- **Full entry editing** — edit date, time, ODM, and remarks directly in the popup
- **Entry deletion** — delete any entry with confirmation
- **Chain recalculation** — editing or deleting an entry automatically recalculates all later entries for that wheel; updated values pushed to Sheets
- **Wheel management** — tap any wheel in Garage to edit name, starting ODM, date added, and colour
- **Wheel deletion** — delete a wheel and all its entries with confirmation
- **Colour picker** — 20 colours when adding or editing a wheel; colour used consistently across fleet cards, charts, and popups
- **Smart confirmation dialogs** — confirmation only when changes affect calculations; cosmetic changes save without confirmation; "Continue" for recalculation warnings, "Delete" for permanent deletions
- **Dashboard model filter** — tap the Total km area to filter all dashboard stats by a specific wheel; selection remembered
- **Interactive average picker** — 11 options across 5 categories: daily, weekly, monthly, per entry, consistency
- **Analytics zoom and pan** — pinch to zoom, drag to pan on all three charts; ↺ Reset button on each
- **Column visibility toggles** — show or hide individual columns in All Entries table; preference saved
- **Sortable table** — tap any column header to sort ascending or descending
- **Garage reordered** — fleet list shown first, add form below

### Improvements
- **km/d column** — replaces raw km; distance divided by days since previous entry (min 1 day), 1 decimal place, sorts correctly
- **Week starts Monday**
- **Wheel colours** — all charts, fleet cards, and popups use the wheel's assigned colour
- **Hero label** — shows selected wheel name or "All wheels ▾"; entire Total km area is tappable
- **safeDate()** — consistent date arithmetic across all browsers; fixes avg all time showing —
- Renamed "Model" → "Wheel" throughout the UI
- Renamed "Ride/Rides" → "Entry/Entries" throughout the UI
- Analytics filter label changed from "Models" to "Wheels"
- Removed ghost CSS classes and duplicate event handlers

### Bug fixes
- `addEntry` / `editWheel` / `deleteWheel` actions match Code.gs handlers
- Hero ID conflict (`d-model-label` vs `d-total-lbl`) resolved
- `addModel` now sends `color` parameter
- `editWheel` passes `originalName` before mutation
- Confirmation dialog shows "Continue" on save actions, not "Delete"

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
