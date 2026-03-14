/* ═══════════════════════════════════════════
   EUC TRACKER — app.js
   Full app logic: data, UI, charts, API sync
═══════════════════════════════════════════ */

'use strict';

// ────────────────────────────────────────────────────────
// 1. STATE
// ────────────────────────────────────────────────────────
const state = {
  apiUrl: localStorage.getItem('euc_api_url') || '',
  rides:  JSON.parse(localStorage.getItem('euc_rides') || '[]'),
  models: JSON.parse(localStorage.getItem('euc_models') || '[]'),
  lastModel: localStorage.getItem('euc_last_model') || '',
  activeTab: 'dashboard',
  charts: {},
};

// Palette for multi-EUC charts
const MODEL_COLORS = [
  '#00e5ff','#ffb800','#00ff87','#ff4d6d',
  '#a855f7','#f97316','#3b82f6','#84cc16',
];

// ────────────────────────────────────────────────────────
// 2. UTILS
// ────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function persist() {
  localStorage.setItem('euc_rides',  JSON.stringify(state.rides));
  localStorage.setItem('euc_models', JSON.stringify(state.models));
}

function fmt(n, dec = 1) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toFixed(dec).replace(/\.0$/, '');
}

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function nowLocalISO() {
  const now = new Date();
  const off = now.getTimezoneOffset();
  const local = new Date(now.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function showToast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 2800);
}

function modelColor(model) {
  const idx = state.models.findIndex(m => m.name === model);
  return MODEL_COLORS[idx % MODEL_COLORS.length] || '#00e5ff';
}

// ────────────────────────────────────────────────────────
// 3. API — Google Apps Script
// ────────────────────────────────────────────────────────
async function apiGet() {
  if (!state.apiUrl) return null;
  const res = await fetch(`${state.apiUrl}?action=get`);
  return res.json();
}

async function apiPost(payload) {
  if (!state.apiUrl) return null;
  const res = await fetch(state.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function syncFromSheets() {
  if (!state.apiUrl) return;
  const btn = $('#btn-sync');
  btn.classList.add('spinning');
  try {
    const data = await apiGet();
    if (data && data.rides) {
      state.rides  = data.rides;
      state.models = data.models || state.models;
      persist();
      renderAll();
      showToast('Synced from Google Sheets ✓', 'success');
    }
  } catch (e) {
    showToast('Sync failed — check API URL', 'error');
  } finally {
    btn.classList.remove('spinning');
  }
}

// ────────────────────────────────────────────────────────
// 4. COMPUTED HELPERS
// ────────────────────────────────────────────────────────
function ridesForModel(model) {
  return state.rides
    .filter(r => r.model === model)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function lastOdmForModel(model) {
  const rs = ridesForModel(model);
  if (!rs.length) {
    const m = state.models.find(m => m.name === model);
    return m ? (m.startOdm || 0) : 0;
  }
  return rs[rs.length - 1].inputOdm;
}

function calcRideFields(ride) {
  // Immutable: compute derived fields from raw data
  const modelRides = state.rides
    .filter(r => r.model === ride.model && r.date < ride.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const fromKm = modelRides.length
    ? modelRides[modelRides.length - 1].inputOdm
    : (state.models.find(m => m.name === ride.model)?.startOdm || 0);
  
  const toKm   = ride.inputOdm;
  const km     = Math.max(0, toKm - fromKm);
  
  const allModelRides = [...modelRides, ride].sort((a,b)=>a.date.localeCompare(b.date));
  const totalKm = toKm - (state.models.find(m=>m.name===ride.model)?.startOdm||0);
  
  const firstDate = state.models.find(m=>m.name===ride.model)?.dateAdded || allModelRides[0].date.slice(0,10);
  const eucTime   = Math.max(1, Math.round((new Date(ride.date.slice(0,10)) - new Date(firstDate)) / 86400000));
  const staVid    = totalKm / eucTime;

  return { fromKm, toKm, km, totalKm, eucTime, staVid };
}

// ────────────────────────────────────────────────────────
// 5. NAVIGATION
// ────────────────────────────────────────────────────────
function setTab(tab) {
  state.activeTab = tab;
  $$('.tab-section').forEach(s => s.classList.remove('active'));
  $$('.nav-item').forEach(b => b.classList.remove('active'));
  $(`#tab-${tab}`).classList.add('active');
  $$(`.nav-item[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
  
  if (tab === 'entry') renderEntryForm();
  if (tab === 'analytics') renderAnalytics();
  if (tab === 'garage') renderGarage();
  if (tab === 'dashboard') renderDashboard();
}

$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

// ────────────────────────────────────────────────────────
// 6. DASHBOARD
// ────────────────────────────────────────────────────────
function renderDashboard() {
  const today    = todayStr();
  const weekStart = startOfWeek();
  
  // Totals across all models
  const allKm = state.rides.reduce((s, r) => s + (r.km || 0), 0);
  $('#dash-total-km').textContent = fmt(allKm, 0);
  
  const todayRides = state.rides.filter(r => r.date.startsWith(today));
  const todayKm = todayRides.reduce((s,r) => s+(r.km||0), 0);
  $('#dash-today-km').textContent = fmt(todayKm, 0) + ' km';
  
  const weekRides = state.rides.filter(r => r.date.slice(0,10) >= weekStart);
  const weekKm = weekRides.reduce((s,r) => s+(r.km||0), 0);
  $('#dash-week-km').textContent = fmt(weekKm, 0) + ' km';
  
  // Global avg km/day
  if (state.rides.length) {
    const dates = state.rides.map(r => r.date.slice(0,10)).sort();
    const days = Math.max(1, Math.round((new Date(dates[dates.length-1]) - new Date(dates[0])) / 86400000) + 1);
    $('#dash-avg-km').textContent = fmt(allKm / days, 1);
  } else {
    $('#dash-avg-km').textContent = '—';
  }
  
  // Last ride
  const sorted = [...state.rides].sort((a,b) => b.date.localeCompare(a.date));
  const lastRide = sorted[0];
  const lrEl = $('#dash-last-ride');
  if (lastRide) {
    lrEl.innerHTML = `
      <div class="last-ride-card">
        <div class="last-ride-model" style="color:${modelColor(lastRide.model)}">${lastRide.model}</div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <div class="last-ride-km">${fmt(lastRide.km, 1)}<small> km</small></div>
        </div>
        <div class="last-ride-date">${fmtDate(lastRide.date)} · ${lastRide.date.slice(11,16)}</div>
        ${lastRide.remarks ? `<div style="font-size:13px;color:var(--text-2);margin-top:4px">${lastRide.remarks}</div>` : ''}
        <div class="last-ride-row" style="margin-top:8px;border-top:1px solid var(--border-soft);padding-top:8px">
          <span>ODM</span><strong>${fmt(lastRide.inputOdm, 1)} km</strong>
        </div>
        <div class="last-ride-row">
          <span>Model total</span><strong>${fmt(lastRide.totalKm, 0)} km</strong>
        </div>
      </div>`;
  } else {
    lrEl.innerHTML = `<p class="card__empty">No rides yet. Add your first entry!</p>`;
  }
  
  // Fleet cards
  const fleet = $('#dash-fleet');
  if (state.models.length) {
    fleet.innerHTML = state.models.map(m => {
      const rs = ridesForModel(m.name);
      const total = rs.length ? rs[rs.length-1].totalKm : 0;
      const days  = rs.length ? rs[rs.length-1].eucTime  : 0;
      const avg   = days ? (total/days).toFixed(1) : '—';
      return `<div class="fleet-card">
        <div class="fleet-card__name">${m.name}</div>
        <div class="fleet-card__km">${fmt(total,0)} km</div>
        <div class="fleet-card__sub">${avg} km/day avg</div>
      </div>`;
    }).join('');
  } else {
    fleet.innerHTML = `<p class="card__empty" style="grid-column:1/-1">No EUCs yet — add one in the Garage tab.</p>`;
  }
  
  // Week mini chart
  renderWeekChart();
}

function renderWeekChart() {
  const labels = [], data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString('en-GB', {weekday:'short'}));
    const km = state.rides
      .filter(r => r.date.startsWith(ds))
      .reduce((s, r) => s + (r.km || 0), 0);
    data.push(km);
  }

  const ctx = $('#dash-week-chart');
  if (state.charts.week) state.charts.week.destroy();
  state.charts.week = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(0,229,255,0.25)',
        borderColor: '#00e5ff',
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(0,229,255,0.45)',
      }]
    },
    options: chartDefaults({ showLegend: false, yLabel: 'km' }),
  });
}

// ────────────────────────────────────────────────────────
// 7. NEW ENTRY FORM
// ────────────────────────────────────────────────────────
function renderEntryForm() {
  // Model chips
  const sel = $('#model-selector');
  if (!state.models.length) {
    sel.innerHTML = `<span class="model-chip model-chip--empty">No EUCs — add one in Garage first</span>`;
    $('#odm-hint').textContent = '';
    $('#model-hint').textContent = '';
    return;
  }
  
  let activeModel = state.lastModel && state.models.find(m => m.name === state.lastModel)
    ? state.lastModel : state.models[0].name;
  
  function buildChips() {
    sel.innerHTML = state.models.map(m =>
      `<button class="model-chip${m.name === activeModel ? ' active' : ''}" data-model="${m.name}">${m.name}</button>`
    ).join('');
    sel.querySelectorAll('.model-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeModel = btn.dataset.model;
        state.lastModel = activeModel;
        localStorage.setItem('euc_last_model', activeModel);
        buildChips();
        updateOdmHint();
        updatePreview();
      });
    });
  }
  buildChips();
  
  // Default datetime
  $('#entry-datetime').value = nowLocalISO();
  
  // ODM hint + preview
  function updateOdmHint() {
    const lastOdm = lastOdmForModel(activeModel);
    $('#odm-hint').textContent = `Last ODM for ${activeModel}: ${fmt(lastOdm, 1)} km`;
  }
  
  function updatePreview() {
    const odm = parseFloat($('#entry-odm').value);
    const lastOdm = lastOdmForModel(activeModel);
    const preview = $('#entry-preview');
    if (odm && odm > lastOdm) {
      const trip = odm - lastOdm;
      const modelObj = state.models.find(m => m.name === activeModel);
      const startOdm = modelObj?.startOdm || 0;
      const allModelRides = ridesForModel(activeModel);
      const baseOdm = allModelRides.length ? allModelRides[0].fromKm : startOdm;
      const total = odm - startOdm;
      $('#prev-trip').textContent = `+${fmt(trip, 1)} km`;
      $('#prev-total').textContent = `${fmt(total, 0)} km`;
      preview.style.display = 'flex';
    } else {
      preview.style.display = 'none';
    }
  }
  
  updateOdmHint();
  
  $('#entry-odm').oninput = updatePreview;

  // Submit
  const btn = $('#btn-submit');
  btn.onclick = async () => {
    const model   = activeModel;
    const dateVal = $('#entry-datetime').value;
    const odmVal  = parseFloat($('#entry-odm').value);
    const remarks = $('#entry-remarks').value.trim();
    
    if (!model)   return showToast('Select a model', 'error');
    if (!dateVal) return showToast('Set a date/time', 'error');
    if (!odmVal || isNaN(odmVal)) return showToast('Enter odometer reading', 'error');
    
    const lastOdm = lastOdmForModel(model);
    if (odmVal < lastOdm) {
      return showToast(`ODM must be ≥ ${fmt(lastOdm, 1)} km`, 'error');
    }
    
    // Build ride record
    const fromKm = lastOdm;
    const toKm   = odmVal;
    const km     = Math.max(0, toKm - fromKm);
    const modelObj  = state.models.find(m => m.name === model);
    const startOdm  = modelObj?.startOdm || 0;
    const totalKm   = toKm - startOdm;
    const firstDate = modelObj?.dateAdded || dateVal.slice(0,10);
    const eucTime   = Math.max(1, Math.round((new Date(dateVal.slice(0,10)) - new Date(firstDate)) / 86400000) + 1);
    const staVid    = totalKm / eucTime;
    
    const ride = {
      id: Date.now().toString(),
      date: dateVal,
      model,
      inputOdm: odmVal,
      fromKm, toKm, km, totalKm, eucTime, staVid,
      remarks,
    };
    
    state.rides.push(ride);
    persist();
    
    // Show feedback immediately
    showToast(`Ride saved: ${fmt(km, 1)} km ✓`, 'success');
    
    // Reset form
    $('#entry-odm').value = '';
    $('#entry-remarks').value = '';
    $('#entry-datetime').value = nowLocalISO();
    $('#entry-preview').style.display = 'none';
    updateOdmHint();
    
    // Push to Sheets if connected
    if (state.apiUrl) {
      try {
        btn.classList.add('loading');
        await apiPost({ action: 'addRide', ride });
      } catch(e) {
        showToast('Saved locally (Sheets sync failed)', 'error');
      } finally {
        btn.classList.remove('loading');
      }
    }
  };
}

// ────────────────────────────────────────────────────────
// 8. GARAGE
// ────────────────────────────────────────────────────────
function renderGarage() {
  // Default date
  $('#garage-date').value = todayStr();
  
  const list = $('#garage-list');
  if (!state.models.length) {
    list.innerHTML = `<div class="card"><p class="card__empty">No EUCs yet — add your first wheel above!</p></div>`;
    return;
  }
  list.innerHTML = state.models.map((m, i) => {
    const rs     = ridesForModel(m.name);
    const total  = rs.length ? rs[rs.length-1].totalKm : 0;
    const rides  = rs.length;
    const color  = MODEL_COLORS[i % MODEL_COLORS.length];
    return `<div class="garage-item">
      <div class="garage-item__dot" style="background:${color};box-shadow:0 0 8px ${color}44"></div>
      <div class="garage-item__info">
        <div class="garage-item__name">${m.name}</div>
        <div class="garage-item__meta">Added ${fmtDate(m.dateAdded)} · ${rides} rides · start: ${fmt(m.startOdm,1)} km</div>
      </div>
      <div class="garage-item__km">${fmt(total,0)} km</div>
    </div>`;
  }).join('');
}

$('#btn-add-euc').addEventListener('click', async () => {
  const name    = $('#garage-name').value.trim();
  const startOdm = parseFloat($('#garage-odm').value) || 0;
  const dateAdded = $('#garage-date').value || todayStr();
  
  if (!name) return showToast('Enter a model name', 'error');
  if (state.models.find(m => m.name === name)) return showToast('Model already exists', 'error');
  
  const model = { name, startOdm, dateAdded };
  state.models.push(model);
  persist();
  
  showToast(`${name} added to garage ✓`, 'success');
  $('#garage-name').value = '';
  $('#garage-odm').value  = '';
  renderGarage();
  
  if (state.apiUrl) {
    try { await apiPost({ action: 'addModel', model }); } catch(e) {}
  }
});

// ────────────────────────────────────────────────────────
// 9. ANALYTICS
// ────────────────────────────────────────────────────────
let filterState = {
  from: '',
  to:   '',
  models: [],
};

function renderAnalytics() {
  // Build model checkboxes
  const mc = $('#filter-models');
  if (!state.models.length) {
    mc.innerHTML = `<span style="font-size:13px;color:var(--text-3)">No EUCs yet</span>`;
  } else {
    if (!filterState.models.length) filterState.models = state.models.map(m => m.name);
    mc.innerHTML = state.models.map(m => `
      <label class="model-check-label ${filterState.models.includes(m.name) ? 'checked' : ''}" data-model="${m.name}">
        <input type="checkbox" ${filterState.models.includes(m.name) ? 'checked' : ''} />
        ${m.name}
      </label>`).join('');
    mc.querySelectorAll('.model-check-label').forEach(lbl => {
      lbl.addEventListener('click', () => {
        const model = lbl.dataset.model;
        if (filterState.models.includes(model)) {
          if (filterState.models.length === 1) return; // keep at least 1
          filterState.models = filterState.models.filter(m => m !== model);
        } else {
          filterState.models.push(model);
        }
        lbl.classList.toggle('checked', filterState.models.includes(model));
        applyFilters();
      });
    });
  }
  
  // Date filters
  $('#filter-from').addEventListener('change', e => { filterState.from = e.target.value; applyFilters(); });
  $('#filter-to').addEventListener('change', e => { filterState.to = e.target.value; applyFilters(); });
  
  applyFilters();
}

function applyFilters() {
  let rides = state.rides;
  
  if (filterState.from) rides = rides.filter(r => r.date.slice(0,10) >= filterState.from);
  if (filterState.to)   rides = rides.filter(r => r.date.slice(0,10) <= filterState.to);
  if (filterState.models.length) rides = rides.filter(r => filterState.models.includes(r.model));
  
  rides = rides.sort((a,b) => a.date.localeCompare(b.date));
  
  // Update summary
  const from = filterState.from ? fmtDate(filterState.from) : 'All time';
  const to   = filterState.to   ? fmtDate(filterState.to)   : 'now';
  const mStr = filterState.models.length === state.models.length ? 'All models'
    : filterState.models.join(', ');
  $('#filter-summary-text').textContent = `${from} → ${to} · ${mStr}`;
  
  // KPIs
  const total = rides.reduce((s,r) => s+(r.km||0), 0);
  const best  = rides.length ? Math.max(...rides.map(r=>r.km||0)) : 0;
  const avg   = rides.length ? total / rides.length : 0;
  $('#a-total').textContent = fmt(total, 0);
  $('#a-rides').textContent = rides.length;
  $('#a-avg').textContent   = fmt(avg, 1);
  $('#a-best').textContent  = fmt(best, 1);
  
  // Draw charts
  drawDynamicsChart(rides);
  drawCumulativeChart(rides, filterState.models);
  drawSeasonChart(rides, filterState.models);
}

$('#btn-reset-filters').addEventListener('click', () => {
  filterState = { from: '', to: '', models: state.models.map(m => m.name) };
  $('#filter-from').value = '';
  $('#filter-to').value   = '';
  renderAnalytics();
});

// ─── Chart: Ride Dynamics ───────────────────────────────
function drawDynamicsChart(rides) {
  const ctx = $('#chart-dynamics');
  if (state.charts.dynamics) state.charts.dynamics.destroy();
  
  const modelSet = [...new Set(rides.map(r => r.model))];
  
  const datasets = modelSet.map(model => {
    const rs = rides.filter(r => r.model === model);
    return {
      label: model,
      data: rs.map(r => ({ x: r.date.slice(0,10), y: r.km || 0 })),
      borderColor: modelColor(model),
      backgroundColor: modelColor(model) + '22',
      pointBackgroundColor: modelColor(model),
      pointRadius: 4, pointHoverRadius: 6,
      tension: 0.3, fill: false,
      borderWidth: 2,
    };
  });
  
  state.charts.dynamics = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      ...chartDefaults({ yLabel: 'km/ride' }),
      scales: {
        x: { type: 'time', time: { unit: 'day', tooltipFormat: 'DD MMM' },
          ...scaleDefaults() },
        y: { ...scaleDefaults(), title: { display: false } },
      },
    },
  });
}

// ─── Chart: Cumulative Growth ──────────────────────────
function drawCumulativeChart(rides, models) {
  const ctx = $('#chart-cumulative');
  if (state.charts.cumulative) state.charts.cumulative.destroy();
  
  // Gather all dates
  const allDates = [...new Set(rides.map(r => r.date.slice(0,10)))].sort();
  if (!allDates.length) { if (state.charts.cumulative) state.charts.cumulative.destroy(); return; }
  
  const datasets = [];
  const combinedByDate = {};
  
  models.forEach(model => {
    const modelRides = rides.filter(r => r.model === model).sort((a,b)=>a.date.localeCompare(b.date));
    if (!modelRides.length) return;
    
    const modelObj = state.models.find(m => m.name === model);
    const startOdm = modelObj?.startOdm || 0;
    
    // Build cumulative data per date
    let cumData = [];
    let lastKm = 0;
    allDates.forEach(date => {
      const dayRides = modelRides.filter(r => r.date.startsWith(date));
      dayRides.forEach(r => { lastKm = r.totalKm; });
      cumData.push({ x: date, y: lastKm });
      combinedByDate[date] = (combinedByDate[date] || 0) + lastKm;
    });
    
    datasets.push({
      label: model,
      data: cumData,
      borderColor: modelColor(model),
      backgroundColor: 'transparent',
      pointRadius: 2, tension: 0.4,
      borderWidth: 2,
    });
  });
  
  // Combined line (only if > 1 model)
  if (models.length > 1) {
    datasets.push({
      label: 'Combined',
      data: allDates.map(d => ({ x: d, y: combinedByDate[d] || 0 })),
      borderColor: '#ffffff',
      backgroundColor: 'transparent',
      borderWidth: 2, borderDash: [6, 3],
      pointRadius: 0, tension: 0.4,
    });
  }
  
  state.charts.cumulative = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      ...chartDefaults({ yLabel: 'Total km' }),
      scales: {
        x: { type: 'time', time: { unit: 'month' }, ...scaleDefaults() },
        y: { ...scaleDefaults() },
      },
    },
  });
}

// ─── Chart: Seasonality ────────────────────────────────
function drawSeasonChart(rides, models) {
  const ctx = $('#chart-season');
  if (state.charts.season) state.charts.season.destroy();
  
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  const datasets = models.map(model => {
    const rs = rides.filter(r => r.model === model);
    const data = months.map((_, mi) =>
      rs.filter(r => parseInt(r.date.slice(5,7))-1 === mi)
        .reduce((s,r) => s+(r.km||0), 0)
    );
    return {
      label: model,
      data,
      backgroundColor: modelColor(model) + 'bb',
      borderColor: modelColor(model),
      borderWidth: 1, borderRadius: 3,
    };
  });
  
  state.charts.season = new Chart(ctx, {
    type: 'bar',
    data: { labels: months, datasets },
    options: {
      ...chartDefaults({ yLabel: 'km' }),
      scales: {
        x: scaleDefaults(),
        y: scaleDefaults(),
        ...( models.length > 1 ? { stacked: true } : {} ),
      },
      plugins: {
        ...chartDefaults().plugins,
        ...(models.length > 1 ? { tooltip: { mode: 'index', intersect: false } } : {}),
      },
    },
  });
}

// ────────────────────────────────────────────────────────
// 10. CHART DEFAULTS
// ────────────────────────────────────────────────────────
function chartDefaults({ showLegend = true, yLabel = '' } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      legend: {
        display: showLegend,
        labels: {
          color: '#8888aa', font: { family: 'JetBrains Mono', size: 11 },
          boxWidth: 12, padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#18181f',
        borderColor: 'rgba(0,229,255,0.2)',
        borderWidth: 1,
        titleColor: '#00e5ff',
        bodyColor: '#f0f0f8',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y, 1)} km`,
        },
      },
    },
  };
}

function scaleDefaults() {
  return {
    grid: { color: 'rgba(255,255,255,0.04)' },
    ticks: {
      color: '#44445a',
      font: { family: 'JetBrains Mono', size: 10 },
    },
    border: { color: 'rgba(255,255,255,0.06)' },
  };
}

// ────────────────────────────────────────────────────────
// 11. SETTINGS MODAL (API URL)
// ────────────────────────────────────────────────────────
// Tap the sync button long-press to open settings
let holdTimer;
$('#btn-sync').addEventListener('mousedown',  () => { holdTimer = setTimeout(openSettings, 800); });
$('#btn-sync').addEventListener('touchstart', () => { holdTimer = setTimeout(openSettings, 800); }, { passive: true });
$('#btn-sync').addEventListener('mouseup',    () => clearTimeout(holdTimer));
$('#btn-sync').addEventListener('touchend',   () => clearTimeout(holdTimer));
$('#btn-sync').addEventListener('click',      syncFromSheets);

function openSettings() {
  $('#api-url-input').value = state.apiUrl;
  $('#settings-modal').classList.remove('hidden');
}
$('#btn-modal-cancel').addEventListener('click', () => {
  $('#settings-modal').classList.add('hidden');
});
$('#btn-modal-save').addEventListener('click', () => {
  const url = $('#api-url-input').value.trim();
  state.apiUrl = url;
  localStorage.setItem('euc_api_url', url);
  $('#settings-modal').classList.add('hidden');
  if (url) { showToast('API URL saved — syncing…', 'success'); syncFromSheets(); }
  else showToast('API URL cleared', '');
});

// ────────────────────────────────────────────────────────
// 12. SERVICE WORKER REGISTRATION
// ────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ────────────────────────────────────────────────────────
// 13. RENDER ALL
// ────────────────────────────────────────────────────────
function renderAll() {
  renderDashboard();
  if (state.activeTab === 'analytics') renderAnalytics();
  if (state.activeTab === 'garage') renderGarage();
  if (state.activeTab === 'entry') renderEntryForm();
}

// ────────────────────────────────────────────────────────
// 14. INIT
// ────────────────────────────────────────────────────────
function init() {
  // Check if first launch (no API configured)
  if (!state.apiUrl) {
    // Show hint on dashboard
    setTimeout(() => {
      showToast('Hold 🔄 to connect Google Sheets', '');
    }, 1500);
  }
  
  renderDashboard();
  
  // Dismiss splash
  setTimeout(() => {
    $('#splash').classList.add('fade-out');
    $('#app').classList.remove('hidden');
    setTimeout(() => {
      $('#splash').style.display = 'none';
    }, 500);
  }, 1400);
}

document.addEventListener('DOMContentLoaded', init);
