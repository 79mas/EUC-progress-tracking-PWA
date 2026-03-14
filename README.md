# EUC Tracker — Setup & Deployment Guide

## What You're Getting

A full **Progressive Web App (PWA)** with:
- 📱 Mobile-first UI with bottom navigation
- 🔄 Google Sheets as cloud database
- 📊 Interactive charts (Chart.js)
- ⚡ Works offline (cached via Service Worker)
- 🏠 Installable on iPhone/Android

---

## Step 1 — Set Up Google Sheets

### 1.1 Create the Spreadsheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it `EUC Tracker`
3. Copy the Spreadsheet **ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```

### 1.2 Add the Apps Script
1. In your spreadsheet, click **Extensions → Apps Script**
2. Delete all existing code in the editor
3. Paste the entire contents of `Code.gs` (from this project)
4. On line 11, fill in your Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SHEET_ID_HERE';
   ```
5. Click **Save** (Ctrl+S)

### 1.3 Run Initial Setup
1. In the Apps Script editor, select the function `setupSheets` from the dropdown
2. Click **▶ Run**
3. Approve the permissions when prompted (this lets the script read/write your sheet)

### 1.4 Deploy as Web App
1. Click **Deploy → New Deployment**
2. Click the ⚙️ gear icon next to "Type" and select **Web App**
3. Configure:
   - **Description**: EUC Tracker API v1
   - **Execute as**: Me
   - **Who has access**: Anyone *(required for the PWA to connect)*
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
   ⚠️ Save this URL — you'll need it in Step 3!

---

## Step 2 — Host the PWA

Choose **one** of these free hosting options:

### Option A: GitHub Pages (Recommended)
1. Create a free account at [github.com](https://github.com)
2. Create a **new repository** (e.g. `euc-tracker`)
3. Upload all files from this project folder
4. Go to **Settings → Pages**
5. Under "Source", select **Deploy from branch → main → / (root)**
6. Your app will be live at: `https://YOUR-USERNAME.github.io/euc-tracker`

### Option B: Vercel
1. Create a free account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`
3. In the project folder, run: `vercel --prod`
4. Your app will be live at a `.vercel.app` URL

### Option C: Netlify (drag & drop)
1. Go to [netlify.com](https://netlify.com) and create a free account
2. Drag the entire project folder onto the Netlify dashboard
3. Done! You get a `.netlify.app` URL instantly

---

## Step 3 — Connect the App to Google Sheets

1. Open your hosted app in **Chrome or Safari on your phone**
2. On the Dashboard tab, **hold down the 🔄 sync button** for ~1 second
3. A dialog will appear asking for your API URL
4. Paste your Google Apps Script Web App URL from Step 1.4
5. Tap **Save & Connect**
6. The app will sync immediately ✓

---

## Step 4 — Install on Your Phone

### iPhone (Safari)
1. Open the app URL in **Safari** (not Chrome)
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add** — the app icon appears on your home screen

### Android (Chrome)
1. Open the app URL in **Chrome**
2. Tap the **three-dot menu** (⋮)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **Install**

---

## How the Data Flows

```
[Your Phone App]
      ↓  POST (new ride / new model)
[Google Apps Script Web App URL]
      ↓  Reads/writes
[Google Sheets Spreadsheet]
      ↑  GET (sync all data)
[Your Phone App]
```

**Data is also stored locally** (`localStorage`) so the app works offline.
When you're back online, tap 🔄 to sync.

---

## Spreadsheet Structure

| Sheet | Columns |
|-------|---------|
| **Rides** | ID, Date, Model, Input ODM, From km, To km, Km, Total km, EUC time, StaVid km/d, Remarks |
| **Models** | Name, Start ODM, Date Added |

---

## Updating the App

If you need to redeploy the Apps Script after changes:
1. Go back to Extensions → Apps Script
2. Click **Deploy → Manage Deployments**
3. Click the ✏️ edit icon
4. Change the version to "New version"
5. Click **Deploy**

The Web App URL stays the same — no changes needed in the PWA.

---

## File Structure
```
euc-tracker/
├── index.html          ← Main PWA shell
├── css/
│   └── style.css       ← All styles
├── js/
│   └── app.js          ← All app logic + charts
├── sw.js               ← Service Worker (offline support)
├── manifest.json       ← PWA manifest
├── icons/
│   ├── icon-192.png    ← App icon
│   └── icon-512.png    ← App icon (large)
└── Code.gs             ← Google Apps Script (backend)
```

---

## Troubleshooting

**"Sync failed"** → Check that:
- Your API URL is correct (no trailing space)
- The Apps Script is deployed with "Anyone" access
- You clicked "Deploy" after any script changes (not just Save)

**Charts not showing** → Ensure you have at least 2–3 rides logged

**App not installing** → Must be served over HTTPS (all hosting options above use HTTPS)

**"Script function not found"** → In Apps Script, make sure `doGet` and `doPost` exist and the file is saved
