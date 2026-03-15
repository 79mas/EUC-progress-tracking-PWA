# EUC Tracker

A mobile-first Progressive Web App for tracking Electric Unicycle rides and statistics.

Log your odometer readings, track multiple wheels, and visualise your progress over time — without ads, subscriptions, or sharing your data with anyone.

---

## What it does

- Log entries by entering your odometer reading — distance is calculated automatically
- Track multiple wheels in a single app
- View your progress: this week, this month, this year, all time
- Filter the dashboard by a specific wheel
- Choose which average metric to display (daily, weekly, monthly, per entry, streak)
- Analyse riding patterns with three interactive charts
- Edit or delete any entry, with automatic recalculation of all affected data
- Manage your wheel fleet: add, edit, colour-code, or remove wheels
- Your data lives in **your own Google Drive** — no shared servers, no one else can access it

---

## Getting started

### 1. Open the app

**[https://79mas.github.io/EUC-progress-tracking-PWA](https://79mas.github.io/EUC-progress-tracking-PWA)**

### 2. Sign in with Google

Choose your Google account. Your data will be stored in a Google Sheets file in your personal Google Drive.

### 3. First-time setup (once only)

You will be guided through five steps:

1. Open the Sheets template using the button provided
2. Click **File → Make a copy** — this saves a personal copy to your Drive
3. In your copy: go to **Extensions → Apps Script**
4. Click **Deploy → New deployment**, select **Web app**, set access to **Anyone**, click Deploy
5. Copy the Web App URL that appears
6. Return to the app, paste the URL, and click Connect

This takes about five minutes and only needs to be done once.

### 4. Install on your phone (recommended)

**iPhone — Safari only:**
Share button → Add to Home Screen → Add

**Android — Chrome:**
Three-dot menu → Add to Home screen or Install app

---

## How to use it

### Logging an entry
Go to **New Entry** → select your wheel → set the date and time → enter the current odometer reading → Save Entry.

You do not need to calculate the distance. Just read the number off your wheel.

### Editing or deleting an entry
In the All Entries table on Dashboard, tap any row to open the detail popup. You can edit date, time, ODM, and remarks. If your change affects later entries, all dependent calculations are updated automatically in both the app and Sheets.

Deleting an entry also recalculates all later entries for that wheel.

### Managing your fleet
Go to **Garage**. Tap any wheel in the fleet list to edit its name, starting ODM, date added, or colour. Changes that affect calculations require confirmation. Colour changes and renames save immediately.

### Dashboard filter
Tap **Total km · All wheels** in the hero area to filter all dashboard stats by a specific wheel.

### Average metric
Tap the average box in the hero to choose which metric to display. Options include:
- km/day (all time, this year, this month)
- km/week or km/month
- km/entry
- Active days percentage
- Longest riding streak

### Analytics
Use the date range and wheel filters to narrow your data. All three charts respond to filters. Pinch to zoom, drag to pan. Tap ↺ to reset a chart to its default view.

---

## Your data

- Stored in a Google Sheets file in your Google Drive
- You can open, edit, export, or delete it at any time directly in Sheets
- Signing out of the app does not delete your data
- Signing in again on any device restores your data automatically

---

## Privacy

- Sign-in is handled entirely by Google — the app never receives your password
- Your name is shown locally only and is never sent anywhere
- Your email address is never stored, logged, or transmitted
- No analytics, no tracking, no ads

---

## Feedback and issues

[github.com/79mas/EUC-progress-tracking-PWA](https://github.com/79mas/EUC-progress-tracking-PWA)
