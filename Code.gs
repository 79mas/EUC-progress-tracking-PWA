/**
 * ═══════════════════════════════════════════
 * EUC TRACKER — Google Apps Script (Code.gs)
 * Backend API for Google Sheets integration
 *
 * Sheet 1: "Rides"  — ride log
 * Sheet 2: "Models" — EUC fleet
 * ═══════════════════════════════════════════
 */

// ── CONFIG ──────────────────────────────────
const SPREADSHEET_ID = '';  // ← FILL IN YOUR SHEET ID (from the URL)
const RIDES_SHEET  = 'Rides';
const MODELS_SHEET = 'Models';

// ── CORS HEADERS ────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SHEET HELPERS ───────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === RIDES_SHEET) {
      sheet.appendRow([
        'ID', 'Date', 'Model', 'Input ODM', 'From km',
        'To km', 'Km', 'Total km', 'EUC time', 'StaVid km/d', 'Remarks'
      ]);
      sheet.setFrozenRows(1);
    }
    if (name === MODELS_SHEET) {
      sheet.appendRow(['Name', 'Start ODM', 'Date Added']);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// ── GET HANDLER ──────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || 'get';
    
    if (action === 'get') {
      const rides  = readRides();
      const models = readModels();
      return jsonResponse({ success: true, rides, models });
    }
    
    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── POST HANDLER ─────────────────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'addRide') {
      const result = writeRide(body.ride);
      return jsonResponse({ success: true, result });
    }

    if (action === 'addModel') {
      const result = writeModel(body.model);
      return jsonResponse({ success: true, result });
    }

    if (action === 'bulkSync') {
      // Full sync: overwrite sheet with client data
      const { rides, models } = body;
      clearAndWriteAll(rides, models);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── READ RIDES ───────────────────────────────
function readRides() {
  const sheet = getSheet(RIDES_SHEET);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  return data.slice(1).map(row => ({
    id:        String(row[0]),
    date:      row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : '',
    model:     row[2],
    inputOdm:  Number(row[3]) || 0,
    fromKm:    Number(row[4]) || 0,
    toKm:      Number(row[5]) || 0,
    km:        Number(row[6]) || 0,
    totalKm:   Number(row[7]) || 0,
    eucTime:   Number(row[8]) || 0,
    staVid:    Number(row[9]) || 0,
    remarks:   row[10] || '',
  }));
}

// ── READ MODELS ──────────────────────────────
function readModels() {
  const sheet = getSheet(MODELS_SHEET);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  return data.slice(1).map(row => ({
    name:       row[0],
    startOdm:   Number(row[1]) || 0,
    dateAdded:  row[2] || '',
  }));
}

// ── WRITE RIDE ───────────────────────────────
function writeRide(ride) {
  const sheet = getSheet(RIDES_SHEET);
  
  // Check if ride ID already exists (avoid duplicates on re-sync)
  const data = sheet.getDataRange().getValues();
  const exists = data.some(row => String(row[0]) === String(ride.id));
  if (exists) return 'exists';

  sheet.appendRow([
    ride.id,
    ride.date,
    ride.model,
    ride.inputOdm,
    ride.fromKm,
    ride.toKm,
    ride.km,
    ride.totalKm,
    ride.eucTime,
    ride.staVid,
    ride.remarks || '',
  ]);
  
  return 'written';
}

// ── WRITE MODEL ──────────────────────────────
function writeModel(model) {
  const sheet = getSheet(MODELS_SHEET);
  
  // Check for duplicate
  const data = sheet.getDataRange().getValues();
  const exists = data.some(row => row[0] === model.name);
  if (exists) return 'exists';

  sheet.appendRow([model.name, model.startOdm, model.dateAdded]);
  return 'written';
}

// ── BULK CLEAR & WRITE ───────────────────────
function clearAndWriteAll(rides, models) {
  // Rides
  const ridesSheet = getSheet(RIDES_SHEET);
  ridesSheet.clearContents();
  ridesSheet.appendRow([
    'ID', 'Date', 'Model', 'Input ODM', 'From km',
    'To km', 'Km', 'Total km', 'EUC time', 'StaVid km/d', 'Remarks'
  ]);
  rides.forEach(r => ridesSheet.appendRow([
    r.id, r.date, r.model, r.inputOdm, r.fromKm,
    r.toKm, r.km, r.totalKm, r.eucTime, r.staVid, r.remarks || ''
  ]));

  // Models
  const modelsSheet = getSheet(MODELS_SHEET);
  modelsSheet.clearContents();
  modelsSheet.appendRow(['Name', 'Start ODM', 'Date Added']);
  models.forEach(m => modelsSheet.appendRow([m.name, m.startOdm, m.dateAdded]));
}

// ── FORMAT SHEET ON SETUP ────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Rides sheet formatting
  const rides = getSheet(RIDES_SHEET);
  rides.getRange('A1:K1').setBackground('#0a0a0f').setFontColor('#00e5ff').setFontWeight('bold');
  rides.setColumnWidth(1, 80);   // ID
  rides.setColumnWidth(2, 140);  // Date
  rides.setColumnWidth(3, 160);  // Model
  rides.setColumnWidth(4, 100);  // Input ODM
  rides.setColumnWidth(11, 200); // Remarks
  
  // Models sheet formatting
  const models = getSheet(MODELS_SHEET);
  models.getRange('A1:C1').setBackground('#0a0a0f').setFontColor('#00e5ff').setFontWeight('bold');
  
  Logger.log('Sheets configured successfully!');
}
