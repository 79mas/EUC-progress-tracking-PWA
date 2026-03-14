# EUC Tracker

A mobile-first Progressive Web App for tracking Electric Unicycle rides and statistics.

Built for riders who want a clean, fast way to log odometer readings and visualize their progress — without ads, subscriptions, or giving their data to anyone.

---

## What it does

- Log rides by entering your odometer reading — distance is calculated automatically
- Track multiple EUCs in a single app
- View your progress over time: today, this week, this month, this year, all time
- Analyze your riding patterns with interactive charts
- Your data lives in **your own Google Drive** — no shared servers, no one else can see it

---

## Getting started

### 1. Open the app
Go to: **[https://79mas.github.io/EUC-progress-tracking-PWA](https://79mas.github.io/EUC-progress-tracking-PWA)**

### 2. Sign in with Google
Tap "Sign in with Google" and choose your Google account.

Your data will be stored in a Google Sheets file in **your personal Google Drive**. The app never sees your email address or any personal information beyond your name (shown only locally, never sent anywhere).

### 3. First-time setup (one time only)
On your first sign-in you will be guided through a short setup:

1. Open the Sheets template (button provided)
2. Click **File → Make a copy** — this saves a personal copy to your Drive
3. In your copy: go to **Extensions → Apps Script**
4. Click **Deploy → New deployment** → choose **Web app** → set access to **Anyone** → click Deploy
5. Copy the Web App URL that appears
6. Return to the app, paste the URL, click Connect

This takes about 5 minutes and only needs to be done once. After that, the app connects to your spreadsheet automatically on every sign-in.

### 4. Install on your phone (optional but recommended)

**iPhone (Safari):**
Tap the Share button → "Add to Home Screen" → Add

**Android (Chrome):**
Tap the three-dot menu → "Add to Home screen" or "Install app"

Once installed, EUC Tracker opens like a native app — no browser bar, full screen.

---

## How to use it

### Adding your EUC
Go to the **Garage** tab → fill in the model name and your current odometer reading → tap "Add to Garage".

If your wheel is new, enter 0. If it already has mileage, enter the current ODM — the app will track distance from that point forward.

### Logging a ride
Go to the **New Ride** tab → select your EUC → set the date and time → enter the current odometer reading → tap "Save Ride".

You do not need to remember how far you rode — just read the number off your wheel. The app calculates the distance automatically.

### Viewing your stats
The **Dashboard** shows your totals and recent activity. Tap **"All models"** in the hero to filter by a specific EUC. Tap the average metric to choose which average you want to see.

The **Analytics** tab has three charts with date and model filters. Pinch to zoom in on any chart, drag to pan.

### Editing or deleting an entry
In the All Rides table on Dashboard, tap any row to open the entry detail. From there you can edit the remarks or delete the entry.

---

## Your data

- Stored in a Google Sheets file in your Google Drive
- You can open, edit, export, or delete it at any time directly in Sheets
- The app only reads and writes to that one file
- Signing out of the app does not delete your data
- If you lose access to your phone, sign in again on any device — your data is still in Drive

---

## Privacy

- Sign-in is handled entirely by Google — the app never receives your password
- Your name is shown locally only
- Your email is never stored, logged, or transmitted anywhere
- No analytics, no tracking, no ads

---

## Feedback and issues

Found a bug or have a suggestion?
Open an issue at: **[github.com/79mas/EUC-progress-tracking-PWA](https://github.com/79mas/EUC-progress-tracking-PWA)**
