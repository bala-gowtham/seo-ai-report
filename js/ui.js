let currentReport = null;

// ── Demo on load ─────────────────────────────────────────
function loadDemoPreview() {
  const filters = getCurrentFilters();
  const report  = getDemoData(filters);
  currentReport = report;
  renderDashboard(report);
}

// ── Client selector loader ────────────────────────────────
async function loadClientOptions() {
  const select = document.getElementById('projectSelector');
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Loading clients\u2026</option>';
  select.disabled = true;

  try {
    const clients = await fetchClientList();

    if (!clients.length) {
      select.innerHTML = '<option value="" disabled selected>No active clients found</option>';
      select.disabled = false;
      return;
    }

    select.innerHTML = clients.map((client, idx) =>
      `<option value="${client.clientId}"${idx === 0 ? ' selected' : ''}>${client.clientName}</option>`
    ).join('');
    select.disabled = false;
  } catch (err) {
    console.warn('Client list load failed (using demo mode):', err);
    // Fallback: show a single demo option so the UI is still usable
    select.innerHTML = '<option value="local-seo-client" selected>Local SEO Client (demo)</option>';
    select.disabled = false;
  }
}

// ── Filters ───────────────────────────────────────────────
function getCurrentFilters() {
  const select    = document.getElementById('projectSelector');
  const projectId = select?.value || '';
  const from      = document.getElementById('fromDateSelector')?.value || getDefaultFrom();
  const to        = document.getElementById('toDateSelector')?.value   || getDefaultTo();
  return { projectId, from, to };
}

function getDefaultFrom() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}

function getDefaultTo() {
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
}

function setDefaultDates() {
  const fromEl = document.getElementById('fromDateSelector');
  const toEl   = document.getElementById('toDateSelector');
  if (fromEl) fromEl.value = getDefaultFrom();
  if (toEl)   toEl.value   = getDefaultTo();
}

// ── Controls ──────────────────────────────────────────────
function initReportControls() {
  const submitBtn = document.getElementById('submitReportBtn');
  if (submitBtn) submitBtn.addEventListener('click', reloadReport);

  const navExport = document.getElementById('navExport');
  if (navExport) navExport.addEventListener('click', () => {
    document.getElementById('exportBtn')?.click();
  });

  const fromEl = document.getElementById('fromDateSelector');
  const toEl   = document.getElementById('toDateSelector');
  if (fromEl && toEl) {
    fromEl.addEventListener('change', () => {
      if (toEl.value && fromEl.value > toEl.value) toEl.value = fromEl.value;
    });
    toEl.addEventListener('change', () => {
      if (fromEl.value && toEl.value < fromEl.value) fromEl.value = toEl.value;
    });
  }
}

async function reloadReport() {
  const submitBtn = document.getElementById('submitReportBtn');
  const loading   = document.getElementById('loadingState');
  const error     = document.getElementById('errorState');
  const content   = document.getElementById('dashboardContent');

  const filters = getCurrentFilters();

  if (!filters.projectId) {
    alert('Please select a client from the Project dropdown.');
    return;
  }

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Loading\u2026'; }
  if (loading)   loading.style.display = 'flex';
  if (error)     error.style.display   = 'none';
  if (content)   content.style.opacity = '0.4';

  try {
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
  renderGscKeywordTable(report.gscKeywords          || []);
  renderAiSourcesTable(report.aeoSources            || []);
  renderAiLandingPageBars('aiLandingPageBars', report.aeoLandingPages || []);
  renderLandingPageBars('landingPageBars', report.topLandingPages || []);
  renderInsightBanner(report);
  renderAeoTotalPill(report);
  renderFooter(report);
  syncExportControls(report);
}

function renderMeta(report) {
  const meta     = report.meta || {};
  const subtitle = document.getElementById('reportSubtitle');
  const label    = meta.dateRangeLabel || meta.monthLabel || '';
  if (subtitle) subtitle.textContent =
    `${meta.projectName || 'Local SEO Client'} \u00b7 ${label} \u00b7 ${meta.sourceLabel || 'GA4 \u00b7 GSC \u00b7 AEO Signals'}`;
}

// ── Insight banner ────────────────────────────────────────
function renderInsightBanner(report) {
  const banner = document.getElementById('insightBanner');
  const text   = document.getElementById('insightBannerText');
  if (!banner || !text) return;

  const meta     = report.meta || {};
  const kpis     = report.kpis || {};
  const insights = [];

  if (meta.from && meta.to) {
    const days = Math.round((new Date(meta.to) - new Date(meta.from)) / 86400000) + 1;
    const cmpLabel = getComparisonLabel(meta.comparisonMode);
    insights.push(`Report covers ${meta.dateRangeLabel || meta.from} \u00b7 ${days} days \u00b7 ${cmpLabel}`);
  }
  const totalUsers = kpis.totalUsers?.value;
  if (totalUsers) insights.push(`Total users this period: ${totalUsers.toLocaleString()}`);
  const aiTraffic = kpis.aiTraffic?.value;
  if (aiTraffic) insights.push(`AI referral sessions: ${aiTraffic.toLocaleString()}`);

  text.textContent = insights.join('  \u00b7  ');
  banner.style.display = 'flex';
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
  const kpis           = report.kpis || {};
  const comparisonMode = report.meta?.comparisonMode || 'previous_equal_length_period';
  document.querySelectorAll('.kpi-value[data-kpi]').forEach(valEl => {
    const key  = valEl.dataset.kpi;
    const data = kpis[key];
    if (!data) return;
    animateNumber(valEl, data.value, data.suffix || '');
    const changeEl = valEl.parentElement?.querySelector(`[data-kpi-change="${key}"]`);
    if (changeEl) setKpiChange(changeEl, data, comparisonMode);
  });
}

function setKpiChange(el, data, comparisonMode) {
  const raw    = data.change;
  const better = data.betterWhenDown ? raw <= 0 : raw >= 0;
  const sign   = raw > 0 ? '+' : '';
  const vsLabel = comparisonMode === 'previous_calendar_month'
    ? 'vs prev month'
    : 'vs prev period';
  el.textContent = `${sign}${formatValue(raw)}${data.changeSuffix || '%'} ${vsLabel}`;
  el.className   = 'kpi-change ' + (better ? 'up' : 'down');
}

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

function renderAiSourcesTable(items) {
  const tbody = document.getElementById('aiSourcesTableBody');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="opp-empty">No AI source data available</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((item, idx) => `
    <tr>
      <td class="row-num">${idx + 1}</td>
      <td style="font-weight:500;color:var(--text-primary)">${escHtml(item.name)}</td>
      <td class="num-cell">${formatInt(item.value)}</td>
    </tr>`).join('');
}

function renderAiLandingPageBars(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<div class="opp-empty">No AI landing page data</div>`;
    return;
  }
  const max = Math.max(...items.map(i => i.sessions || 0), 1);
  el.innerHTML = items.map((item, idx) => {
    const color = BAR_COLORS[idx % BAR_COLORS.length];
    const label = (item.landingPage || '').replace(/^\//, '').replace(/\/$/, '') || '/';
    return `
      <div class="mrow">
        <span class="mname" title="${escHtml(item.landingPage)}">${escHtml(label || item.landingPage)}</span>
        <div class="mbar"><div class="mfill" style="width:0%;background:${color}"></div></div>
        <span class="mval">${fmtShort(item.sessions || 0)}</span>
      </div>`;
  }).join('');
  requestAnimationFrame(() => {
    el.querySelectorAll('.mfill').forEach((fill, idx) => {
      const pct = ((items[idx].sessions || 0) / max) * 100;
      fill.style.width = pct.toFixed(1) + '%';
    });
  });
}

function renderLandingPageBars(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el || !items.length) {
    if (el) el.innerHTML = `<div class="opp-empty">No landing page data</div>`;
    return;
  }
  const max = Math.max(...items.map(i => i.value), 1);
  el.innerHTML = items.map((item, idx) => {
    const color = BAR_COLORS[idx % BAR_COLORS.length];
    const label = item.name.replace(/^\//, '').replace(/\/$/, '') || '/';
    return `
      <div class="mrow">
        <span class="mname" title="${escHtml(item.name)}">${escHtml(label || item.name)}</span>
        <div class="mbar"><div class="mfill" style="width:0%;background:${color}"></div></div>
        <span class="mval">${fmtShort(item.value)}</span>
      </div>`;
  }).join('');
  requestAnimationFrame(() => {
    el.querySelectorAll('.mfill').forEach((fill, idx) => {
      const pct = (items[idx].value / max) * 100;
      fill.style.width = pct.toFixed(1) + '%';
    });
  });
}

const BAR_COLORS = [
  'var(--accent-orange)','var(--accent-sky)',
  'var(--accent-violet)','var(--accent-amber)','var(--accent-teal)'
];

function renderMetricBars(containerId, items, suffix) {
  const el = document.getElementById(containerId);
  if (!el || !items.length) return;
  const max = Math.max(...items.map(i => i.value), 1);
  el.innerHTML = items.map((item, idx) => {
    const color = BAR_COLORS[idx % BAR_COLORS.length];
    return `
      <div class="mrow">
        <span class="mname">${escHtml(item.name)}</span>
        <div class="mbar"><div class="mfill" style="width:0%;background:${color}"></div></div>
        <span class="mval">${formatValue(item.value)}${suffix || ''}</span>
      </div>`;
  }).join('');
  requestAnimationFrame(() => {
    el.querySelectorAll('.mfill').forEach((fill, idx) => {
      const pct = (items[idx].value / max) * 100;
      fill.style.width = pct.toFixed(1) + '%';
    });
  });
}

function syncExportControls(report) {
  const meta    = report?.meta || {};
  const projEl  = document.getElementById('exportProjectValue');
  const fromEl  = document.getElementById('exportFromValue');
  const toEl    = document.getElementById('exportToValue');
  if (projEl)  projEl.textContent  = meta.projectName || 'Local SEO Client';
  if (fromEl)  fromEl.textContent  = meta.from || '';
  if (toEl)    toEl.textContent    = meta.to   || '';
}

function formatValue(v) {
  if (v === null || v === undefined) return '\u2014';
  const n = parseFloat(v);
  if (isNaN(n)) return '\u2014';
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
}

function formatInt(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? '\u2014' : n.toLocaleString();
}

function fmtShort(v) {
  if (v >= 1_000_000) return (v/1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000)      return (v/1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return v.toLocaleString();
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
