let currentReport = null;

function getCurrentFilters() {
  return {
    clientId: document.getElementById('projectSelector').value,
    from: document.getElementById('fromDate').value,
    to: document.getElementById('toDate').value
  };
}

async function reloadReport() {
  const filters = getCurrentFilters();
  const report = await fetchReportData(filters);

  currentReport = report;
  renderDashboard(report);
}

function initReportControls() {
  const controls = [
    document.getElementById('projectSelector'),
    document.getElementById('fromDate'),
    document.getElementById('toDate')
  ];

  controls.forEach(control => {
    if (!control) return;
    control.addEventListener('change', reloadReport);
  });
}

function renderDashboard(report) {
  renderMeta(report);
  renderKpis(report);
  renderRankTable(report.rankTracker);
  renderMetricBars('deviceBars', report.deviceSplit, ['#ff6b35', '#ff9a6b', '#f59e0b']);
  renderMetricBars('countryBars', report.countries, ['#ff6b35', '#8b5cf6', '#3b82f6', '#ff9a6b', '#f59e0b']);
  renderCharts(report);
  syncExportControls();
}

function renderMeta(report) {
  const subtitle = document.getElementById('reportSubtitle');

  if (subtitle) {
    subtitle.textContent =
      `${report.meta.clientName} · ${report.meta.monthLabel} · ${report.meta.sourceLabel}`;
  }

  const projectSelector = document.getElementById('projectSelector');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');

  if (projectSelector) projectSelector.value = report.meta.clientId;
  if (fromDate) fromDate.value = report.meta.from;
  if (toDate) toDate.value = report.meta.to;
}

function renderKpis(report) {
  const kpis = report.kpis || {};

  setKpi('totalSessions', kpis.totalSessions);
  setKpi('organicSessions', kpis.organicSessions);
  setKpi('gscClicks', kpis.gscClicks);
  setKpi('gscImpressions', kpis.gscImpressions);
  setKpi('avgCtr', kpis.avgCtr);
  setKpi('avgPosition', kpis.avgPosition);
  setKpi('bounceRate', kpis.bounceRate);
  setKpi('conversions', kpis.conversions);
}

function setKpi(key, item) {
  const valueEl = document.querySelector(`[data-kpi="${key}"]`);
  const changeEl = document.querySelector(`[data-kpi-change="${key}"]`);

  if (!valueEl || !changeEl || !item) return;

  valueEl.textContent = formatValue(item.value) + (item.suffix || '');

  const change = Number(item.change || 0);
  const betterWhenDown = item.betterWhenDown === true;
  const isImproved = betterWhenDown ? change <= 0 : change >= 0;
  const arrow = isImproved ? '▲' : '▼';
  const cleanChange = Math.abs(change);
  const suffix = item.changeSuffix || '%';

  changeEl.textContent = `${arrow} ${formatValue(cleanChange)}${suffix}`;
  changeEl.classList.toggle('up', isImproved);
  changeEl.classList.toggle('down', !isImproved);
}

function renderRankTable(items) {
  const body = document.getElementById('rankTableBody');
  if (!body) return;

  body.innerHTML = '';

  (items || []).forEach(item => {
    const tr = document.createElement('tr');

    const hasPosition =
      item.position !== null &&
      item.position !== undefined &&
      item.position !== '';

    const positionText = hasPosition ? `#${item.position}` : 'Not found';

    tr.innerHTML = `
      <td><span class="rank-pill ${getRankClass(item.position)}">${escapeHtml(positionText)}</span></td>
      <td class="kw">${escapeHtml(item.keyword)}</td>
      <td class="url-cell">${escapeHtml(item.url)}</td>
      <td class="${getChangeClass(item.change)}">${formatChange(item.change)}</td>
      <td>${escapeHtml(String(item.volume))}</td>
    `;

    body.appendChild(tr);
  });
}

function renderMetricBars(containerId, items, colors) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  (items || []).forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'mrow';

    const color = colors[index] || '#ff6b35';
    const label = item.icon ? `${item.icon} ${item.name}` : item.name;
    const value = Number(item.value) || 0;

    row.innerHTML = `
      <span class="mname">${escapeHtml(label)}</span>
      <div class="mbar">
        <div class="mfill" style="width:${value}%;background:${color};"></div>
      </div>
      <span class="mval">${value}%</span>
    `;

    container.appendChild(row);
  });
}

function syncExportControls() {
  const projectSelector = document.getElementById('projectSelector');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');

  const exportProjectText = document.getElementById('exportProjectText');
  const exportFromText = document.getElementById('exportFromText');
  const exportToText = document.getElementById('exportToText');

  if (projectSelector && exportProjectText) {
    exportProjectText.textContent =
      projectSelector.options[projectSelector.selectedIndex].text;
  }

  if (fromDate && exportFromText) {
    exportFromText.textContent = fromDate.value;
  }

  if (toDate && exportToText) {
    exportToText.textContent = toDate.value;
  }
}

function getRankClass(position) {
  if (!position || Number(position) <= 0) return 'rout';
  if (position <= 1) return 'r1';
  if (position <= 5) return 'r3';
  if (position <= 10) return 'r10';
  return 'rout';
}

function getChangeClass(change) {
  if (change > 0) return 'up-sm';
  if (change < 0) return 'dn-sm';
  return 'eq-sm';
}

function formatChange(change) {
  if (change > 0) return `▲ ${change}`;
  if (change < 0) return `▼ ${Math.abs(change)}`;
  return '-';
}

function formatValue(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return value;

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(1);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
