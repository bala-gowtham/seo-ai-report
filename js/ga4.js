// ═══════════════════════════════════════════════════════════
//  GA4 Analytics View and Preview Renderers
//  Uses same chart color tokens and CSS classes as main UI
// ═══════════════════════════════════════════════════════════

// ── Demo data for UI preview ──────────────────────────────
const GA4_LITE_DEMO = {
  kpis: {
    sessions:       { value: 24820, prev: 21340, change: 16.3,  suffix: '',  changeSuffix: '%' },
    engagedSessions:{ value: 15490, prev: 12780, change: 21.2,  suffix: '',  changeSuffix: '%' },
    engagementRate: { value: 62.4,  prev: 59.9,  change: 2.5,   suffix: '%', changeSuffix: ' pp' },
    conversions:    { value: 186,   prev: 162,   change: 14.9,  suffix: '',  changeSuffix: '%' }
  },
  trafficByChannel: [
    { name: 'Organic Search', value: 12400, prev: 11200, change: 10.7,  engagementRate: 68.2, conversions: 94 },
    { name: 'Direct',         value: 5600,  prev: 5100,  change: 9.8,   engagementRate: 71.4, conversions: 52 },
    { name: 'Referral',       value: 3100,  prev: 2400,  change: 29.2,  engagementRate: 58.6, conversions: 22 },
    { name: 'Paid Search',    value: 1800,  prev: 1650,  change: 9.1,   engagementRate: 55.3, conversions: 12 },
    { name: 'Social',         value: 1200,  prev: 820,   change: 46.3,  engagementRate: 49.8, conversions: 4  },
    { name: 'Email',          value: 716,   prev: 590,   change: 21.4,  engagementRate: 74.1, conversions: 2  }
  ],
  sourceMedium: [
    { name: 'google / organic',       value: 11800, prev: 10640, change: 10.9, engagementRate: 68.5 },
    { name: '(direct) / (none)',      value: 5600,  prev: 5100,  change: 9.8,  engagementRate: 71.4 },
    { name: 'bing / organic',         value: 610,   prev: 540,   change: 13.0, engagementRate: 63.2 },
    { name: 'linkedin.com / referral',value: 820,   prev: 490,   change: 67.4, engagementRate: 60.1 },
    { name: 'facebook.com / referral',value: 690,   prev: 580,   change: 19.0, engagementRate: 44.8 },
    { name: 'google / cpc',           value: 1800,  prev: 1650,  change: 9.1,  engagementRate: 55.3 },
    { name: 'newsletter / email',     value: 716,   prev: 590,   change: 21.4, engagementRate: 74.1 }
  ],
  topLandingPages: [
    { name: '/services/seo/',        value: 3840, prev: 3340, change: 15.0, engagementRate: 71.2, conversions: 42 },
    { name: '/blog/seo-automation/', value: 2610, prev: 2140, change: 22.0, engagementRate: 68.5, conversions: 18 },
    { name: '/',                     value: 2290, prev: 2080, change: 10.1, engagementRate: 58.3, conversions: 31 },
    { name: '/blog/ai-overview/',    value: 1720, prev: 1240, change: 38.7, engagementRate: 74.8, conversions: 9  },
    { name: '/contact/',             value: 1340, prev: 1280, change: 4.7,  engagementRate: 81.2, conversions: 62 },
    { name: '/pricing/',             value: 980,  prev: 720,  change: 36.1, engagementRate: 64.4, conversions: 12 },
    { name: '/about/',               value: 740,  prev: 690,  change: 7.2,  engagementRate: 55.9, conversions: 3  }
  ],
  deviceSplit: [
    { name: 'Desktop', value: 14120, prev: 12840, change: 10.0 },
    { name: 'Mobile',  value: 9480,  prev: 7680,  change: 23.4 },
    { name: 'Tablet',  value: 1220,  prev: 820,   change: 48.8 }
  ],
  warnings: [
    'Mobile sessions up +23.4% — verify mobile landing page experience.',
    'Social traffic spike (+46.3%) — check for referral campaign or viral content.',
    '/contact/ has highest engagement rate (81.2%) — high-intent traffic.'
  ]
};

function getGa4DemoReport(filters = {}) {
  return {
    ...GA4_LITE_DEMO,
    _demoGa4: true,
    partial: false,
    meta: {
      projectId: 'demo',
      projectName: 'Demo Data',
      from: filters.from,
      to: filters.to,
      dateRangeLabel: formatDateRangeLabel(filters.from, filters.to),
      comparisonMode: 'previous_calendar_month',
      sourceLabel: 'Google Analytics 4'
    },
    dataQuality: { partial: false, truncatedReports: [] }
  };
}

const REPORT_PANEL_CONFIG = {
  overview: {
    navId: 'navOverview',
    panelId: 'dashboardContent',
    title: 'SEO Overview',
    logoSub: 'Overview'
  },
  ga4: {
    navId: 'navGa4',
    panelId: 'ga4TabContent',
    title: 'GA4 Analytics',
    logoSub: 'GA4'
  },
  gsc: {
    navId: 'navGsc',
    panelId: 'gscTabContent',
    title: 'Google Search Console',
    logoSub: 'GSC'
  },
  ai: {
    navId: 'navAiTraffic',
    panelId: 'aiTrafficTabContent',
    title: 'AI Traffic',
    logoSub: 'AI Traffic'
  }
};

function setActivePanel(view) {
  const activeView = REPORT_PANEL_CONFIG[view] ? view : 'overview';
  const footer = document.getElementById('reportFooter');
  const insight = document.getElementById('insightBanner');
  const error = document.getElementById('errorState');
  const title = document.querySelector('.page-title');
  const logoSub = document.querySelector('.logo-sub');

  SeoDashboardState.setActiveView(activeView);

  Object.entries(REPORT_PANEL_CONFIG).forEach(([key, config]) => {
    const nav = document.getElementById(config.navId);
    const panel = document.getElementById(config.panelId);
    const isActive = key === activeView;

    nav?.classList.toggle('active', isActive);
    nav?.setAttribute('aria-current', isActive ? 'page' : 'false');
    if (panel) panel.style.display = isActive ? 'block' : 'none';
  });

  if (footer) footer.style.display = activeView === 'overview' ? '' : 'none';
  if (title) title.textContent = REPORT_PANEL_CONFIG[activeView].title;
  if (logoSub) logoSub.textContent = REPORT_PANEL_CONFIG[activeView].logoSub;
  if (error) error.style.display = 'none';

  if (insight) {
    if (activeView === 'overview' && currentReport) renderInsightBanner(currentReport);
    else insight.style.display = 'none';
  }
}

// ── Tab switching ─────────────────────────────────────────
function initGa4Tab() {
  Object.entries(REPORT_PANEL_CONFIG).forEach(([view, config]) => {
    const nav = document.getElementById(config.navId);
    if (!nav || !document.getElementById(config.panelId)) return;

    const openView = () => {
      setActivePanel(view);
      const filters = getCurrentFilters();
      const report = SeoDashboardState.getReport(view, filters);

      if (report) renderViewReport(view, report);
      else loadReportView(view).catch(() => {});
    };

    nav.addEventListener('click', openView);
    activateOnKeyboard(nav, openView);
  });
}

// ── Main render ───────────────────────────────────────────
function renderGa4Tab(report) {
  const d = buildGa4LiteData(report);
  renderGa4Meta(report);
  renderGa4KpiStrip(d.kpis);
  renderGa4ChannelTable(d.trafficByChannel);
  renderGa4SourceMediumTable(d.sourceMedium);
  renderGa4LandingTable(d.topLandingPages);
  renderGa4DeviceChart(d.deviceSplit);

  const warnings = [...(d.warnings || [])];
  const truncated = d.dataQuality?.truncatedReports || [];
  if (d.partial && !warnings.some(item => /truncat|limited|partial/i.test(item))) {
    warnings.unshift('Some GA4 tables are partial because the configured row limits were reached.');
  }
  if (truncated.length) {
    warnings.push(`Limited tables: ${truncated.map(item => `${item.report} ${item.period}`).join(', ')}.`);
  }
  renderGa4Warnings(warnings);

  const dateEl = document.getElementById('ga4FooterDate');
  if (dateEl) {
    dateEl.textContent = 'Generated on ' + new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

function renderGa4Meta(report) {
  const meta = report?.meta || {};
  const subtitle = document.getElementById('reportSubtitle');
  const label = meta.dateRangeLabel || formatDateRangeLabel(meta.from, meta.to);
  if (subtitle) {
    subtitle.textContent = `${meta.projectName || 'Selected project'} · ${label} · Google Analytics 4`;
  }
  syncExportControls(report);
}

// ── Merge live + demo ────────────────────────────────────
function buildGa4LiteData(report) {
  const live = report || {};
  if (live._demoGa4) return live;

  const liveKpis = live.kpis || {};
  const hasLiveGa4 =
    Object.prototype.hasOwnProperty.call(liveKpis, 'sessions') ||
    Object.prototype.hasOwnProperty.call(live, 'trafficByChannel') ||
    Object.prototype.hasOwnProperty.call(live, 'sourceMedium') ||
    Object.prototype.hasOwnProperty.call(live, 'topLandingPages') ||
    Object.prototype.hasOwnProperty.call(live, 'deviceSplit');

  if (!hasLiveGa4) return getGa4DemoReport(getCurrentFilters());

  return {
    kpis: {
      sessions: liveKpis.sessions || { value: 0, prev: 0, change: 0, suffix: '', changeSuffix: '%' },
      engagedSessions: liveKpis.engagedSessions || { value: 0, prev: 0, change: 0, suffix: '', changeSuffix: '%' },
      engagementRate: liveKpis.engagementRate || { value: 0, prev: 0, change: 0, suffix: '%', changeSuffix: ' pp' },
      conversions: liveKpis.conversions || { value: 0, prev: 0, change: 0, suffix: '', changeSuffix: '%' }
    },
    trafficByChannel: Array.isArray(live.trafficByChannel) ? enrichChannels(live.trafficByChannel) : [],
    sourceMedium: Array.isArray(live.sourceMedium) ? enrichChannels(live.sourceMedium) : [],
    topLandingPages: Array.isArray(live.topLandingPages) ? enrichLanding(live.topLandingPages) : [],
    deviceSplit: Array.isArray(live.deviceSplit) ? enrichChannels(live.deviceSplit) : [],
    warnings: Array.isArray(live.ga4Warnings) ? live.ga4Warnings : (Array.isArray(live.warnings) ? live.warnings : []),
    partial: live.partial === true || live.dataQuality?.partial === true,
    dataQuality: live.dataQuality || { partial: live.partial === true }
  };
}

function enrichChannels(arr) {
  return arr.map(row => ({
    ...row,
    name: row.name || row.source || row.medium || 'Unknown',
    value: Number(row.value ?? row.sessions ?? 0),
    prev: Number(row.prev ?? row.prevSessions ?? 0),
    change: Number(row.change ?? row.sessionsChange ?? 0),
    engagementRate: row.engagementRate != null ? Number(row.engagementRate) : null,
    conversions: row.conversions != null ? Number(row.conversions) : null
  }));
}

function enrichLanding(arr) {
  return arr.map(row => ({
    ...row,
    name: row.name || row.landingPage || '/',
    value: Number(row.value ?? row.sessions ?? 0),
    prev: Number(row.prev ?? row.prevSessions ?? 0),
    change: Number(row.change ?? row.sessionsChange ?? 0),
    engagementRate: row.engagementRate != null ? Number(row.engagementRate) : null,
    conversions: row.conversions != null ? Number(row.conversions) : null
  }));
}

// ── KPI Strip ─────────────────────────────────────────────
function renderGa4KpiStrip(kpis) {
  const defs = [
    { key:'sessions',        label:'Sessions',        color:'#ff6b35' },
    { key:'engagedSessions', label:'Engaged Sessions',color:'#3b82f6' },
    { key:'engagementRate',  label:'Engagement Rate', color:'#14b8a6' },
    { key:'conversions',     label:'Conversions',     color:'#22c55e' }
  ];
  const wrap = document.getElementById('ga4KpiStrip');
  if (!wrap) return;

  wrap.innerHTML = defs.map(d => {
    const data = kpis[d.key] || { value:0, change:0, suffix:'', changeSuffix:'%' };
    const up   = data.change >= 0;
    const sign = data.change > 0 ? '+' : '';
    const val  = d.key === 'engagementRate'
      ? Number(data.value).toFixed(1) + (data.suffix || '%')
      : Math.round(data.value).toLocaleString() + (data.suffix || '');
    const chg  = Number(data.change).toFixed(1);
    return `
    <div class="kpi-card" style="--card-color:${d.color}">
      <div class="kpi-glow"></div>
      <div class="kpi-top">
        <div class="kpi-label">${d.label}</div>
        <div class="kpi-dot"></div>
      </div>
      <div class="kpi-value" style="font-size:26px">${val}</div>
      <div class="kpi-change ${up?'up':'down'}">
        ${sign}${chg}${data.changeSuffix || '%'} vs prev period
      </div>
    </div>`;
  }).join('');
}

// ── Traffic by Channel table ──────────────────────────────
const CHAN_COLORS = [
  'rgba(255,107,53,0.85)',
  'rgba(59,130,246,0.8)',
  'rgba(139,92,246,0.8)',
  'rgba(20,184,166,0.8)',
  'rgba(245,158,11,0.8)',
  'rgba(236,72,153,0.8)',
  'rgba(34,197,94,0.8)'
];

function renderGa4ChannelTable(rows) {
  const tbody = document.getElementById('ga4ChannelTableBody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px">No channel data</td></tr>`;
    return;
  }
  const maxVal = Math.max(...rows.map(r => r.value), 1);
  tbody.innerHTML = rows.map((r, i) => {
    const barW  = Math.round((r.value / maxVal) * 100);
    const up    = (r.change || 0) >= 0;
    const sign  = (r.change || 0) > 0 ? '+' : '';
    const color = CHAN_COLORS[i % CHAN_COLORS.length];
    const engHtml = r.engagementRate != null
      ? `<span style="background:rgba(20,184,166,0.1);color:#0d9488;font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px">${Number(r.engagementRate).toFixed(1)}%</span>`
      : '—';
    const convHtml = r.conversions != null ? r.conversions.toLocaleString() : '—';
    const chg = Number(r.change || 0).toFixed(1);
    return `<tr>
      <td class="row-num">${i+1}</td>
      <td style="font-weight:500;color:var(--text-primary);min-width:130px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="background:${color};width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block"></span>
          ${escHtml(r.name)}
        </div>
      </td>
      <td class="num-cell">
        <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
          <div style="width:60px;height:4px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${barW}%;background:${color};border-radius:3px"></div>
          </div>
          ${r.value.toLocaleString()}
        </div>
      </td>
      <td class="num-cell">${r.prev ? r.prev.toLocaleString() : '—'}</td>
      <td class="num-cell"><span class="kpi-change ${up?'up':'down'}" style="margin-top:0;padding:2px 7px;font-size:10px">${sign}${chg}%</span></td>
      <td class="num-cell">${engHtml}</td>
      <td class="num-cell">${convHtml}</td>
    </tr>`;
  }).join('');
}

// ── Source / Medium table ─────────────────────────────────
function renderGa4SourceMediumTable(rows) {
  const tbody = document.getElementById('ga4SourceMediumTableBody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px">No data</td></tr>`;
    return;
  }
  const maxVal = Math.max(...rows.map(r => r.value), 1);
  tbody.innerHTML = rows.map((r, i) => {
    const barW = Math.round((r.value / maxVal) * 100);
    const up   = (r.change || 0) >= 0;
    const sign = (r.change || 0) > 0 ? '+' : '';
    const chg  = Number(r.change || 0).toFixed(1);
    const engHtml = r.engagementRate != null
      ? `<span style="font-size:11px;font-weight:600;color:#0d9488">${Number(r.engagementRate).toFixed(1)}%</span>`
      : '—';
    return `<tr>
      <td class="row-num">${i+1}</td>
      <td style="font-weight:500;color:var(--text-primary);max-width:220px;word-break:break-all;font-size:12px">${escHtml(r.name)}</td>
      <td class="num-cell">
        <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
          <div style="width:50px;height:4px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${barW}%;background:#3b82f6;border-radius:3px"></div>
          </div>
          ${r.value.toLocaleString()}
        </div>
      </td>
      <td class="num-cell">${r.prev ? r.prev.toLocaleString() : '—'}</td>
      <td class="num-cell"><span class="kpi-change ${up?'up':'down'}" style="margin-top:0;padding:2px 7px;font-size:10px">${sign}${chg}%</span></td>
      <td class="num-cell">${engHtml}</td>
    </tr>`;
  }).join('');
}

// ── Landing Page table ────────────────────────────────────
function renderGa4LandingTable(rows) {
  const tbody = document.getElementById('ga4LandingTableBody');
  if (!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px">No landing page data</td></tr>`;
    return;
  }
  const maxVal = Math.max(...rows.map(r => r.value), 1);
  tbody.innerHTML = rows.map((r, i) => {
    const barW   = Math.round((r.value / maxVal) * 100);
    const up     = (r.change || 0) >= 0;
    const sign   = (r.change || 0) > 0 ? '+' : '';
    const chg    = Number(r.change || 0).toFixed(1);
    const eng    = r.engagementRate || 0;
    const engCls = eng >= 65 ? 'pos-top3' : eng >= 50 ? 'pos-top10' : 'pos-out';
    const engHtml = r.engagementRate != null
      ? `<span class="pos-badge ${engCls}">${Number(r.engagementRate).toFixed(1)}%</span>`
      : '—';
    const convHtml = r.conversions != null ? `<strong style="color:var(--text-primary)">${r.conversions}</strong>` : '—';
    return `<tr>
      <td class="row-num">${i+1}</td>
      <td style="font-size:11px;color:#3b82f6;word-break:break-all;max-width:200px;font-weight:500">${escHtml(r.name)}</td>
      <td class="num-cell">
        <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end">
          <div style="width:50px;height:4px;background:rgba(0,0,0,0.06);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${barW}%;background:#ff6b35;border-radius:3px"></div>
          </div>
          ${r.value.toLocaleString()}
        </div>
      </td>
      <td class="num-cell">${r.prev ? r.prev.toLocaleString() : '—'}</td>
      <td class="num-cell"><span class="kpi-change ${up?'up':'down'}" style="margin-top:0;padding:2px 7px;font-size:10px">${sign}${chg}%</span></td>
      <td class="num-cell">${engHtml}</td>
      <td class="num-cell">${convHtml}</td>
    </tr>`;
  }).join('');
}

// ── Device Chart ──────────────────────────────────────────
let ga4DeviceChart = null;
function renderGa4DeviceChart(rows) {
  const canvas = document.getElementById('ga4DeviceChart');
  if (!canvas) return;
  if (ga4DeviceChart) { ga4DeviceChart.destroy(); ga4DeviceChart = null; }
  const ctx    = canvas.getContext('2d');
  const colors = ['#ff6b35','#3b82f6','#14b8a6','#8b5cf6','#f59e0b'];
  ga4DeviceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: rows.map(r => r.name),
      datasets: [{
        data:            rows.map(r => r.value),
        backgroundColor: rows.map((_, i) => colors[i % colors.length]),
        borderWidth:     0,
        hoverOffset:     6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font:{ size:11 }, padding:12, boxWidth:10 } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
              const pct   = total > 0 ? ((ctx.raw/total)*100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${pct}%)`;
            }
          }
        }
      },
      cutout: '62%'
    }
  });
  const list = document.getElementById('ga4DeviceList');
  if (!list) return;
  list.innerHTML = rows.map((r,i) => {
    const up   = (r.change || 0) >= 0;
    const sign = (r.change || 0) > 0 ? '+' : '';
    const chg  = Number(r.change || 0).toFixed(1);
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="width:10px;height:10px;border-radius:50%;background:${colors[i%colors.length]};flex-shrink:0;display:inline-block"></span>
      <span style="font-size:12px;color:var(--text-secondary);flex:1">${r.name}</span>
      <span style="font-size:12px;font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums">${r.value.toLocaleString()}</span>
      <span class="kpi-change ${up?'up':'down'}" style="margin-top:0;padding:2px 6px;font-size:10px">${sign}${chg}%</span>
    </div>`;
  }).join('');
}

// ── Smart Insights / Warnings ─────────────────────────────
function renderGa4Warnings(warnings) {
  const wrap = document.getElementById('ga4Warnings');
  if (!wrap) return;
  if (!warnings || !warnings.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  wrap.innerHTML = `
    <div class="section-header" style="margin-top:0">
      <div class="section-header-left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span class="section-label">Smart Insights</span>
      </div>
      <span class="section-desc">Auto-generated observations · GA4</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
      ${warnings.map(w => `
        <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.18);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--text-secondary);display:flex;gap:10px;align-items:flex-start">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" style="flex-shrink:0;margin-top:1px" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>${escHtml(w)}</span>
        </div>`).join('')}
    </div>`;
}
