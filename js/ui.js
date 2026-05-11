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

  subtitle.textContent =
    `${report.meta.clientName} · ${report.meta.monthLabel} · ${report.meta.sourceLabel}`;

  document.getElementById('projectSelector').value = report.meta.clientId;
  document.getElementById('fromDate').value = report.meta.from;
  document.getElementById('toDate').value = report.meta.to;
}

function renderKpis(report) {
  setKpi('organicSessions', report.kpis.organicSessions);
  setKpi('gscClicks', report.kpis.gscClicks);
  setKpi('avgPosition', report.kpis.avgPosition);
  setKpi('bounceRate', report.kpis.bounceRate);
}

function setKpi(key, item) {
  const valueEl = document.querySelector(`[data-kpi="${key}"]`);
  const changeEl = document.querySelector(`[data-kpi-change="${key}"]`);

  valueEl.textContent = formatValue(item.value) + (item.suffix || '');

  const isDown = Number(item.change) < 0;
  const arrow = isDown ? '▼' : '▲';
  const cleanChange = Math.abs(item.change);
  const suffix = item.changeSuffix || '%';

  changeEl.textContent = `${arrow} ${cleanChange}${suffix}`;
  changeEl.classList.toggle('down', isDown);
  changeEl.classList.toggle('up', !isDown);
}

function renderRankTable(items) {
  const body = document.getElementById('rankTableBody');
  body.innerHTML = '';

  items.forEach(item => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><span class="rank-pill ${getRankClass(item.position)}">#${item.position}</span></td>
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
  container.innerHTML = '';

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'mrow';

    const color = colors[index] || '#ff6b35';
    const label = item.icon ? `${item.icon} ${item.name}` : item.name;

    row.innerHTML = `
      <span class="mname">${escapeHtml(label)}</span>
      <div class="mbar">
        <div class="mfill" style="width:${Number(item.value)}%;background:${color};"></div>
      </div>
      <span class="mval">${Number(item.value)}%</span>
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
  if (typeof value !== 'number') return value;

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(1);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
