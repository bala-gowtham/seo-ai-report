let currentReport = null;

// ── Demo on load ─────────────────────────────────────────
function loadDemoPreview() {
  const filters = getCurrentFilters();
  const report  = getDemoData(filters);
  currentReport = report;
  renderDashboard(report);
}

// ── Filters ───────────────────────────────────────────────
function getCurrentFilters() {
  const projectId  = document.getElementById('projectSelector')?.value || 'repute';
  const monthValue = document.getElementById('monthSelector')?.value   || getCurrentMonth();
  const { from, to } = monthToDateRange(monthValue);
  return { projectId, month: monthValue, from, to };
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function monthToDateRange(monthValue) {
  const [year, month] = monthValue.split('-').map(Number);
  const from    = `${year}-${String(month).padStart(2,'0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to      = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
  return { from, to };
}

function setDefaultMonth() {
  const el = document.getElementById('monthSelector');
  if (el) el.value = getCurrentMonth();
}

// ── Controls ──────────────────────────────────────────────
function initReportControls() {
  const submitBtn = document.getElementById('submitReportBtn');
  if (submitBtn) submitBtn.addEventListener('click', reloadReport);

  const navExport = document.getElementById('navExport');
  if (navExport) navExport.addEventListener('click', () => {
    document.getElementById('exportBtn')?.click();
  });
}

async function reloadReport() {
  const submitBtn = document.getElementById('submitReportBtn');
  const loading   = document.getElementById('loadingState');
  const error     = document.getElementById('errorState');
  const content   = document.getElementById('dashboardContent');

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Loading…'; }
  if (loading)   loading.style.display = 'flex';
  if (error)     error.style.display   = 'none';
  if (content)   content.style.opacity = '0.4';

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
    if (content) content.style.opacity = '1';
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Generate Report'; }
  }
}

// ── Dashboard render ──────────────────────────────────────
function renderDashboard(report) {
  renderMeta(report);
  renderKpis(report);
  renderCharts(report);
  renderGscKeywordTable(report.gscKeywords  || []);
  renderAeoTable(report.aeoLandingPages     || []);
  renderMetricBars('deviceBars',  report.deviceSplit || [], '%');
  renderMetricBars('countryBars', report.countries   || [], '%');
  renderInsightBanner(report);
  renderDonutCenter(report);
  renderAeoTotalPill(report);
  renderFooter(report);
  syncExportControls(report);
}

function renderMeta(report) {
  const meta     = report.meta || {};
  const subtitle = document.getElementById('reportSubtitle');
  if (subtitle) subtitle.textContent =
    `${meta.projectName || meta.projectId || 'Project'} · ${meta.monthLabel || ''} · ${meta.sourceLabel || 'GA4 · GSC · AEO Signals'}`;
}

// ── Insight banner ────────────────────────────────────────
function renderInsightBanner(report) {
  const banner = document.getElementById('insightBanner');
  const text   = document.getElementById('insightBannerText');
  if (!banner || !text) return;

  const meta    = report.meta || {};
  const kpis    = report.kpis || {};
  const insights = [];

  if (meta.from && meta.to) {
    const days = Math.round((new Date(meta.to) - new Date(meta.from)) / 86400000) + 1;
    insights.push(`Report covers ${meta.monthLabel || meta.from} · ${days} days`);
  }
  const total   = kpis.totalSessions?.value;
  const organic = kpis.organicSessions?.value;
  if (total && organic) {
    const orgPct = Math.round((organic / total) * 100);
    insights.push(`${orgPct}% of sessions are organic`);
  }
  const pos = kpis.avgPosition?.value;
  if (pos)   insights.push(`Average GSC position: ${pos}`);

  text.textContent = insights.join('  ·  ');
  banner.style.display = 'flex';
}

// ── Donut center total ────────────────────────────────────
function renderDonutCenter(report) {
  const el = document.getElementById('donutTotal');
  if (!el) return;
  const total = report.kpis?.totalSessions?.value;
  el.textContent = total ? fmtShort(total) : '—';
}

// ── AEO pill total ────────────────────────────────────────
function renderAeoTotalPill(report) {
  const pill  = document.getElementById('aeoTotalPill');
  const count = document.getElementById('aeoTotalCount');
  if (!pill || !count) return;
  const total = (report.aeoSources || []).reduce((s, i) => s + (i.value || 0), 0);
  if (total > 0) {
    count.textContent = total;
    pill.style.display = 'block';
  } else {
    pill.style.display = 'none';
  }
}

// ── Footer ────────────────────────────────────────────────
function renderFooter(report) {
  const el = document.getElementById('footerGenDate');
  if (!el) return;
  const now = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  el.textContent = `Generated on ${now}`;
}

// ── KPIs ─────────────────────────────────────────────────
function renderKpis(report) {
  const kpis = report.kpis || {};
  document.querySelectorAll('.kpi-value[data-kpi]').forEach(valEl => {
    const key  = valEl.dataset.kpi;
    const data = kpis[key];
    if (!data) return;
    animateNumber(valEl, data.value, data.suffix || '');
    const changeEl = valEl.parentElement?.querySelector(`[data-kpi-change="${key}"]`);
    if (changeEl) setKpiChange(changeEl, data);
  });
}

function setKpiChange(el, data) {
  const raw    = data.change;
  const better = data.betterWhenDown ? raw <= 0 : raw >= 0;
  const sign   = raw > 0 ? '+' : '';
  el.textContent = `${sign}${formatValue(raw)}${data.changeSuffix || '%'} vs prev`;
  el.className   = 'kpi-change ' + (better ? 'up' : 'down');
}

// ── Number animation ─────────────────────────────────────
function animateNumber(el, target, suffix) {
  const start    = 0;
  const duration = 600;
  const startTs  = performance.now();
  const isFloat  = !Number.isInteger(target);

  function step(ts) {
    const progress = Math.min((ts - startTs) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = start + (target - start) * eased;
    el.textContent = (isFloat ? value.toFixed(1) : Math.round(value).toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── GSC keyword table ─────────────────────────────────────
function renderGscKeywordTable(items) {
  const tbody = document.getElementById('gscKeywordTableBody');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">No keyword data available</td></tr>`;
    return;
  }
  const maxCtr = Math.max(...items.map(i => i.ctr), 1);
  tbody.innerHTML = items.map((item, idx) => {
    const pos     = item.position;
    const posCls  = pos <= 3 ? 'pos-top3' : pos <= 10 ? 'pos-top10' : 'pos-out';
    const ctrPct  = Math.min((item.ctr / maxCtr) * 100, 100).toFixed(1);
    return `
    <tr>
      <td class="row-num">${idx + 1}</td>
      <td style="font-weight:500;color:var(--text-primary);max-width:260px">${escHtml(item.query)}</td>
      <td class="num-cell">${formatInt(item.clicks)}</td>
      <td class="num-cell">${formatInt(item.impressions)}</td>
      <td class="num-cell">
        <div class="ctr-bar-wrap">
          <div class="ctr-mini-bar"><div class="ctr-mini-fill" style="width:${ctrPct}%"></div></div>
          <span>${formatValue(item.ctr)}%</span>
        </div>
      </td>
      <td class="num-cell"><span class="pos-badge ${posCls}">${formatValue(item.position)}</span></td>
    </tr>`;
  }).join('');
}

// ── AEO table ─────────────────────────────────────────────
function renderAeoTable(items) {
  const section = document.getElementById('aeoTableSection');
  const tbody   = document.getElementById('aeoTableBody');
  if (!tbody) return;
  if (!items.length) { if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = '';
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

// ── Metric bars ───────────────────────────────────────────
const BAR_COLORS = [
  'var(--accent-orange)','var(--accent-sky)',
  'var(--accent-violet)','var(--accent-amber)','var(--accent-teal)'
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
        <div class="mbar"><div class="mfill" style="width:0%;background:${color}"></div></div>
        <span class="mval">${formatValue(item.value)}${suffix || ''}</span>
      </div>`;
  }).join('');
  // Animate bars in next frame
  requestAnimationFrame(() => {
    el.querySelectorAll('.mfill').forEach((fill, idx) => {
      const pct = (items[idx].value / max) * 100;
      fill.style.width = pct.toFixed(1) + '%';
    });
  });
}

// ── Export helpers ────────────────────────────────────────
function syncExportControls(report) {
  const meta    = report?.meta || {};
  const projEl  = document.getElementById('exportProjectValue');
  const monthEl = document.getElementById('exportMonthValue');
  if (projEl)  projEl.textContent  = meta.projectName || meta.projectId || '';
  if (monthEl) monthEl.textContent = meta.monthLabel || '';
}

// ── Formatters ────────────────────────────────────────────
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

function fmtShort(v) {
  if (v >= 1_000_000) return (v/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M';
  if (v >= 1000)      return (v/1000).toFixed(1).replace(/\.0$/,'') + 'k';
  return v.toLocaleString();
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
