let currentReport = null;

/* ─── Filters ─────────────────────────────────────── */

function monthToDateRange(monthValue) {
  const [year, month] = monthValue.split('-').map(Number);
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function getCurrentFilters() {
  const projectId  = document.getElementById('projectSelector').value;
  const monthValue = document.getElementById('monthSelector').value || '2026-05';
  const { from, to } = monthToDateRange(monthValue);
  return { projectId, month: monthValue, from, to };
}

function initReportControls() {
  const submitBtn = document.getElementById('submitReportBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', reloadReport);
  }
}

/* ─── Report lifecycle ────────────────────────────── */

async function reloadReport() {
  const filters  = getCurrentFilters();
  const loadEl   = document.getElementById('loadingState');
  const errorEl  = document.getElementById('errorState');
  const submitBtn = document.getElementById('submitReportBtn');

  if (loadEl)  loadEl.style.display = 'flex';
  if (errorEl) errorEl.style.display = 'none';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Loading…'; }

  try {
    const report = await fetchReportData(filters);
    currentReport = report;
    renderDashboard(report);
  } catch (err) {
    console.error(err);
    if (errorEl) {
      const msgEl = document.getElementById('errorMessage');
      if (msgEl) msgEl.textContent = err.message || 'Failed to load report.';
      errorEl.style.display = 'flex';
    }
  } finally {
    if (loadEl)  loadEl.style.display = 'none';
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Generate Report'; }
  }
}

/* ─── Dashboard render ────────────────────────────── */

function renderDashboard(report) {
  renderMeta(report);
  renderKpis(report);
  renderGscKeywordTable(report.gscKeywords);
  renderAeoTable(report.aeoLandingPages);
  renderMetricBars('deviceBars',  report.deviceSplit,  ['#ff6b35','#ff9a6b','#f59e0b']);
  renderMetricBars('countryBars', report.countries,    ['#ff6b35','#8b5cf6','#3b82f6','#ff9a6b','#f59e0b']);
  renderCharts(report);
  syncExportControls();
}

function renderMeta(report) {
  const subtitle = document.getElementById('reportSubtitle');
  if (subtitle) {
    subtitle.textContent =
      `${report.meta.projectName} · ${report.meta.monthLabel} · ${report.meta.sourceLabel}`;
  }

  const projectSelector = document.getElementById('projectSelector');
  const monthSelector   = document.getElementById('monthSelector');

  if (projectSelector) projectSelector.value = report.meta.projectId;
  if (monthSelector && report.meta.month)   monthSelector.value = report.meta.month;
}

function renderKpis(report) {
  const kpis = report.kpis || {};
  const keys = ['totalSessions','organicSessions','gscClicks','gscImpressions',
                'avgCtr','avgPosition','engagementRate','conversions'];
  keys.forEach(key => setKpi(key, kpis[key]));
}

function setKpi(key, item) {
  const valueEl  = document.querySelector(`[data-kpi="${key}"]`);
  const changeEl = document.querySelector(`[data-kpi-change="${key}"]`);
  if (!valueEl || !changeEl || !item) return;

  valueEl.textContent = formatValue(item.value) + (item.suffix || '');

  const change       = Number(item.change || 0);
  const betterWhenDown = item.betterWhenDown === true;
  const isImproved   = betterWhenDown ? change <= 0 : change >= 0;
  const arrow        = isImproved ? '▲' : '▼';
  const suffix       = item.changeSuffix || '%';

  changeEl.textContent = `${arrow} ${formatValue(Math.abs(change))}${suffix}`;
  changeEl.classList.toggle('up',   isImproved);
  changeEl.classList.toggle('down', !isImproved);
}

/* ─── GSC keyword table ───────────────────────────── */

function renderGscKeywordTable(items) {
  const body = document.getElementById('gscKeywordTableBody');
  if (!body) return;

  if (!items || items.length === 0) {
    body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:24px;">No keyword data available</td></tr>`;
    return;
  }

  body.innerHTML = items.map(item => `
    <tr>
      <td class="primary-cell">${escapeHtml(item.query || '—')}</td>
      <td class="num-cell">${formatValue(item.clicks)}</td>
      <td class="num-cell">${formatValue(item.impressions)}</td>
      <td class="num-cell">${formatValue(item.ctr)}%</td>
      <td class="num-cell">${formatValue(item.position)}</td>
    </tr>
  `).join('');
}

/* ─── AEO landing pages table ─────────────────────── */

function renderAeoTable(items) {
  const body    = document.getElementById('aeoTableBody');
  const wrapper = document.getElementById('aeoTableWrap');
  if (!body || !wrapper) return;

  if (!items || items.length === 0) {
    wrapper.style.display = 'none';
    return;
  }

  wrapper.style.display = '';
  body.innerHTML = items.map(item => `
    <tr>
      <td class="primary-cell">${escapeHtml(item.sourceMedium || '—')}</td>
      <td class="url-cell">${escapeHtml(item.landingPage || '—')}</td>
      <td class="num-cell">${formatValue(item.sessions)}</td>
      <td class="num-cell">${formatValue(item.engagedSessions)}</td>
      <td class="num-cell">${formatValue(item.engagementRate)}%</td>
      <td class="num-cell">${escapeHtml(item.avgEngagementTime || '—')}</td>
    </tr>
  `).join('');
}

/* ─── Metric bars ─────────────────────────────────── */

function renderMetricBars(containerId, items, colors) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<p style="color:#9ca3af;font-size:12px;padding:12px 0;">No data</p>';
    return;
  }

  container.innerHTML = items.map((item, index) => {
    const color = colors[index] || '#ff6b35';
    const value = Number(item.value) || 0;
    return `
      <div class="mrow">
        <span class="mname">${escapeHtml(item.name)}</span>
        <div class="mbar"><div class="mfill" style="width:${value}%;background:${color};"></div></div>
        <span class="mval">${value}%</span>
      </div>
    `;
  }).join('');
}

/* ─── Export sync ─────────────────────────────────── */

function syncExportControls() {
  const projectSelector = document.getElementById('projectSelector');
  const monthSelector   = document.getElementById('monthSelector');
  const exportProjectText = document.getElementById('exportProjectText');
  const exportMonthText   = document.getElementById('exportMonthText');

  if (projectSelector && exportProjectText) {
    exportProjectText.textContent =
      projectSelector.options[projectSelector.selectedIndex].text;
  }

  if (monthSelector && exportMonthText) {
    exportMonthText.textContent = formatMonthLabel(monthSelector.value);
  }
}

/* ─── Helpers ─────────────────────────────────────── */

function setDefaultMonth() {
  const monthEl = document.getElementById('monthSelector');
  if (monthEl && !monthEl.value) {
    const now = new Date();
    monthEl.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

function formatValue(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return value ?? '—';
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(1);
}

function formatMonthLabel(monthValue) {
  if (!monthValue) return '';
  const [year, month] = monthValue.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
