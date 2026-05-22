let currentReport = null;

// ─── Demo preview ────────────────────────────────────────────────────────────
function loadDemoPreview() {
  const filters = getCurrentFilters();
  const report  = getDemoData(filters);
  currentReport = report;
  renderDashboard(report);
}

// ─── Filters ─────────────────────────────────────────────────────────────────
function getCurrentFilters() {
  const projectId  = document.getElementById('projectSelector')?.value  || 'repute';
  const monthValue = document.getElementById('monthSelector')?.value    || getCurrentMonth();
  const { from, to } = monthToDateRange(monthValue);
  return { projectId, month: monthValue, from, to };
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthToDateRange(monthValue) {
  const [year, month] = monthValue.split('-').map(Number);
  const from    = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to      = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function setDefaultMonth() {
  const el = document.getElementById('monthSelector');
  if (el && !el.value) el.value = getCurrentMonth();
}

// ─── Report controls ─────────────────────────────────────────────────────────
function initReportControls() {
  const submitBtn = document.getElementById('submitReportBtn');
  if (submitBtn) submitBtn.addEventListener('click', reloadReport);
}

async function reloadReport() {
  const submitBtn = document.getElementById('submitReportBtn');
  const loading   = document.getElementById('loadingState');
  const error     = document.getElementById('errorState');

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Loading…'; }
  if (loading)   loading.style.display = 'flex';
  if (error)     error.style.display   = 'none';

  try {
    const filters = getCurrentFilters();
    const report  = await fetchReportData(filters);
    currentReport = report;
    renderDashboard(report);
  } catch (err) {
    console.error('Report load failed:', err);
    if (error) error.style.display = 'flex';
  } finally {
    if (loading) loading.style.display = 'none';
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Generate Report'; }
  }
}

// ─── Dashboard render ─────────────────────────────────────────────────────────
function renderDashboard(report) {
  renderMeta(report);
  renderKpis(report);
  renderCharts(report);
  renderGscKeywordTable(report.gscKeywords   || []);
  renderAeoTable(report.aeoLandingPages      || []);
  renderMetricBars('deviceBars',  report.deviceSplit || [], '%');
  renderMetricBars('countryBars', report.countries   || [], '%');
  syncExportControls(report);
}

function renderMeta(report) {
  const meta     = report.meta || {};
  const subtitle = document.getElementById('reportSubtitle');
  const title    = document.getElementById('reportTitle');
  if (subtitle) subtitle.textContent =
    `${meta.projectName || meta.projectId || 'Project'} · ${meta.monthLabel || ''} · ${meta.sourceLabel || 'GA4 · GSC · AEO Signals'}`;
  if (title) title.textContent =
    `${meta.projectName || 'SEO Overview'} — ${meta.monthLabel || ''}`;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
// HTML structure:
//   <div class="kpi-card">
//     <div class="kpi-value" data-kpi="totalSessions">—</div>
//     <div class="kpi-change" data-kpi-change="totalSessions">—</div>
//   </div>
// → select .kpi-value[data-kpi] directly, then find sibling [data-kpi-change]
function renderKpis(report) {
  const kpis = report.kpis || {};

  document.querySelectorAll('.kpi-value[data-kpi]').forEach(valEl => {
    const key  = valEl.dataset.kpi;
    const data = kpis[key];
    if (!data) return;

    valEl.textContent = formatValue(data.value) + (data.suffix || '');

    // sibling change element uses data-kpi-change
    const changeEl = valEl.parentElement?.querySelector(`[data-kpi-change="${key}"]`);
    if (changeEl) setKpiChange(changeEl, data);
  });
}

function setKpiChange(el, data) {
  const raw    = data.change;
  const better = data.betterWhenDown ? raw < 0 : raw >= 0;
  const sign   = raw >= 0 ? '+' : '';
  el.textContent = `${sign}${formatValue(raw)}${data.changeSuffix || '%'} vs prev`;
  el.className   = 'kpi-change ' + (better ? 'up' : 'down');
}

// ─── Tables ───────────────────────────────────────────────────────────────────
function renderGscKeywordTable(items) {
  const tbody = document.getElementById('gscKeywordTableBody');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">No keyword data available</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(item => `
    <tr>
      <td style="font-weight:500;color:var(--text-primary)">${escHtml(item.query)}</td>
      <td class="num-cell">${formatInt(item.clicks)}</td>
      <td class="num-cell">${formatInt(item.impressions)}</td>
      <td class="num-cell">${formatValue(item.ctr)}%</td>
      <td class="num-cell">${formatValue(item.position)}</td>
    </tr>`).join('');
}

function renderAeoTable(items) {
  const wrap  = document.getElementById('aeoTableWrap');
  const tbody = document.getElementById('aeoTableBody');
  if (!tbody) return;
  if (!items.length) { if (wrap) wrap.style.display = 'none'; return; }
  if (wrap) wrap.style.display = '';
  tbody.innerHTML = items.map(item => `
    <tr>
      <td>${escHtml(item.sourceMedium)}</td>
      <td class="url-cell">${escHtml(item.landingPage)}</td>
      <td class="num-cell">${formatInt(item.sessions)}</td>
      <td class="num-cell">${formatInt(item.engagedSessions)}</td>
      <td class="num-cell">${formatValue(item.engagementRate)}%</td>
      <td class="num-cell">${escHtml(item.avgEngagementTime)}</td>
    </tr>`).join('');
}

// ─── Metric bars ─────────────────────────────────────────────────────────────
// Uses .mrow / .mname / .mbar / .mfill / .mval from layout.css
// items[].value must be PERCENTAGE (0–100)
const BAR_COLORS = [
  'var(--accent-teal)',
  'var(--accent-sky)',
  'var(--accent-violet)',
  'var(--accent-amber)',
  'var(--accent-lime)'
];

function renderMetricBars(containerId, items, suffix) {
  const el = document.getElementById(containerId);
  if (!el || !items.length) return;
  const max = Math.max(...items.map(i => i.value), 1);
  el.innerHTML = items.map((item, idx) => {
    const pct   = (item.value / max) * 100;
    const color = BAR_COLORS[idx % BAR_COLORS.length];
    return `
      <div class="mrow">
        <span class="mname">${escHtml(item.name)}</span>
        <div class="mbar"><div class="mfill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>
        <span class="mval">${formatValue(item.value)}${suffix || ''}</span>
      </div>`;
  }).join('');
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function syncExportControls(report) {
  const meta    = report?.meta || {};
  const projEl  = document.getElementById('exportProjectValue');
  const monthEl = document.getElementById('exportMonthValue');
  if (projEl)  projEl.textContent  = meta.projectName || meta.projectId || '';
  if (monthEl) monthEl.textContent = meta.monthLabel || '';
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatValue(v) {
  if (v === null || v === undefined) return '—';
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
}

function formatInt(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? '—' : n.toLocaleString();
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
