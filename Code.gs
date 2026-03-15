/**
 * EUC TRACKER — Google Apps Script
 * Each user has their own copy of this spreadsheet.
 * Deploy as Web App: Execute as Me, Access: Anyone
 *
 * GET ?action=get
 * GET ?action=addRide&id=&date=&model=&inputOdm=&fromKm=&toKm=&km=&totalKm=&eucTime=&staVid=&remarks=
 * GET ?action=addModel&name=&startOdm=&dateAdded=
 */

function doGet(e) {
  try {
    const p = e.parameter;
    const action = (p.action || 'get').trim();

    if (action === 'get') {
      return out({ success:true, rides:getRides(), models:getModels() });
    }
    if (action === 'addEntry') {
      if (!p.id) return out({ success:false, error:'Missing: id' });
      return out({ success:true, result: saveRide({
        id: p.id, date: p.date||'', model: p.model||'',
        inputOdm: +p.inputOdm||0, fromKm: +p.fromKm||0, toKm: +p.toKm||0,
        km: +p.km||0, totalKm: +p.totalKm||0, eucTime: +p.eucTime||0,
        staVid: +p.staVid||0, remarks: p.remarks||'',
      })});
    }
    if (action === 'addModel') {
      if (!p.name) return out({ success:false, error:'Missing: name' });
      return out({ success:true, result: saveModel({
        name: p.name, startOdm: +p.startOdm||0, dateAdded: p.dateAdded||'', color: p.color||'',
      })});
    }
    if (action === 'editEntry') {
      if (!p.id) return out({ success:false, error:'Missing: id' });
      return out({ success:true, result: updateEntry(p) });
    }
    if (action === 'deleteEntry') {
      if (!p.id) return out({ success:false, error:'Missing: id' });
      return out({ success:true, result: deleteEntry(p.id) });
    }
    if (action === 'editWheel') {
      if (!p.name) return out({ success:false, error:'Missing: name' });
      return out({ success:true, result: updateWheel(p) });
    }
    if (action === 'deleteWheel') {
      if (!p.name) return out({ success:false, error:'Missing: name' });
      return out({ success:true, result: deleteWheel(p.name) });
    }
    return out({ success:false, error:'Unknown action: '+action });
  } catch(e) {
    return out({ success:false, error:e.message });
  }
}

function out(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,headers.length)
      .setBackground('#0a0a0f').setFontColor('#00e5ff').setFontWeight('bold');
  }
  return sh;
}

function getRides() {
  const sh = sheet('Rides',['ID','Date','Model','Input ODM','From km','To km','Km','Total km','EUC time','StaVid km/d','Remarks']);
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).filter(r=>r[0]).map(r => ({
    id: String(r[0]),
    date: r[1] ? Utilities.formatDate(new Date(r[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : '',
    model: String(r[2]||''), inputOdm:+r[3]||0, fromKm:+r[4]||0, toKm:+r[5]||0,
    km:+r[6]||0, totalKm:+r[7]||0, eucTime:+r[8]||0, staVid:+r[9]||0, remarks:String(r[10]||''),
  }));
}

function getModels() {
  const sh = sheet('Models',['Name','Start ODM','Date Added','Color']);
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).filter(r=>r[0]).map(r => ({
    name:String(r[0]), startOdm:+r[1]||0, dateAdded:String(r[2]||''), color:String(r[3]||''),
  }));
}

function saveRide(ride) {
  const sh = sheet('Rides',['ID','Date','Model','Input ODM','From km','To km','Km','Total km','EUC time','StaVid km/d','Remarks']);
  if (sh.getDataRange().getValues().some(r=>String(r[0])===String(ride.id))) return 'exists';
  sh.appendRow([ride.id,ride.date,ride.model,ride.inputOdm,ride.fromKm,ride.toKm,
    ride.km,ride.totalKm,ride.eucTime,ride.staVid,ride.remarks]);
  return 'written';
}

function saveModel(m) {
  const sh = sheet('Models',['Name','Start ODM','Date Added']);
  if (sh.getDataRange().getValues().some(r=>r[0]===m.name)) return 'exists';
  sh.appendRow([m.name, m.startOdm||0, m.dateAdded||'']);
  return 'written';
}

function updateEntry(p) {
  const sh = sheet('Rides',['ID','Date','Model','Input ODM','From km','To km','Km','Total km','EUC time','StaVid km/d','Remarks']);
  const data = sh.getDataRange().getValues();
  for (let i=1; i<data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      sh.getRange(i+1, 2).setValue(p.date     || data[i][1]);
      sh.getRange(i+1, 4).setValue(+p.inputOdm|| data[i][3]);
      sh.getRange(i+1, 5).setValue(+p.fromKm  || data[i][4]);
      sh.getRange(i+1, 6).setValue(+p.toKm    || data[i][5]);
      sh.getRange(i+1, 7).setValue(+p.km      || data[i][6]);
      sh.getRange(i+1, 8).setValue(+p.totalKm || data[i][7]);
      sh.getRange(i+1, 9).setValue(+p.eucTime || data[i][8]);
      sh.getRange(i+1,10).setValue(+p.staVid  || data[i][9]);
      sh.getRange(i+1,11).setValue(p.remarks  !== undefined ? p.remarks : data[i][10]);
      return 'updated';
    }
  }
  return 'not found';
}

function deleteEntry(id) {
  const sh = sheet('Rides',['ID','Date','Model','Input ODM','From km','To km','Km','Total km','EUC time','StaVid km/d','Remarks']);
  const data = sh.getDataRange().getValues();
  for (let i=1; i<data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sh.deleteRow(i+1);
      return 'deleted';
    }
  }
  return 'not found';
}

function updateWheel(p) {
  const sh = sheet('Models',['Name','Start ODM','Date Added','Color']);
  const data = sh.getDataRange().getValues();
  const oldName = p.oldName || p.name;
  for (let i=1; i<data.length; i++) {
    if (String(data[i][0]) === String(oldName)) {
      sh.getRange(i+1,1).setValue(p.name);
      sh.getRange(i+1,2).setValue(+p.startOdm||data[i][1]);
      sh.getRange(i+1,3).setValue(p.dateAdded||data[i][2]);
      sh.getRange(i+1,4).setValue(p.color||data[i][3]);
      return 'updated';
    }
  }
  return 'not found';
}

function deleteWheel(name) {
  const sh = sheet('Models',['Name','Start ODM','Date Added','Color']);
  const data = sh.getDataRange().getValues();
  for (let i=1; i<data.length; i++) {
    if (String(data[i][0]) === String(name)) {
      sh.deleteRow(i+1);
      return 'deleted';
    }
  }
  return 'not found';
}

function setup() {
  getRides(); getModels();
  Logger.log('EUC Tracker ready!');
}

