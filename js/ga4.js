// ═══════════════════════════════════════════════════════════
// GA4 Analytics view
// Focused workspace with search, sorting, pagination, and
// an acquisition medium selector. Existing report contracts
// and Netlify/n8n data flows are preserved.
// ═══════════════════════════════════════════════════════════

const GA4_ACCENTS = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#ff6b35',
  red: '#ef4444',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  pink: '#ec4899',
  neutral: '#94a3b8'
};

const GA4_LITE_DEMO = {
  kpis: {
    sessions: { value: 24820, prev: 21340, change: 16.3, suffix: '', changeSuffix: '%' },
    totalUsers: { value: 20180, prev: 18120, change: 11.4, suffix: '', changeSuffix: '%' },
    newUsers: { value: 18420, prev: 16480, change: 11.8, suffix: '', changeSuffix: '%' },
    engagedSessions: { value: 15490, prev: 12780, change: 21.2, suffix: '', changeSuffix: '%' },
    engagementRate: { value: 62.4, prev: 59.9, change: 2.5, suffix: '%', changeSuffix: ' pp' },
    totalPageViews: { value: 46280, prev: 39810, change: 16.3, suffix: '', changeSuffix: '%' },
    averageSessionDuration: { value: 84.2, prev: 76.4, change: 10.2, suffix: ' sec', changeSuffix: '%' },
    conversions: { value: 186, prev: 162, change: 14.9, suffix: '', changeSuffix: '%' }
  },
  sessionsOverTime: {
    labels: ['01 Jun', '05 Jun', '10 Jun', '15 Jun', '20 Jun', '26 Jun'],
    current: [810, 930, 875, 1040, 990, 1110],
    previous: [720, 780, 760, 870, 840, 920]
  },
  trafficByChannel: [
    { name: 'Organic Search', value: 12400, prev: 11200, change: 10.7, engagementRate: 68.2, conversions: 94 },
    { name: 'Direct', value: 5600, prev: 5100, change: 9.8, engagementRate: 71.4, conversions: 52 },
    { name: 'Referral', value: 3100, prev: 2400, change: 29.2, engagementRate: 58.6, conversions: 22 },
    { name: 'Paid Search', value: 1800, prev: 1650, change: 9.1, engagementRate: 55.3, conversions: 12 },
    { name: 'Organic Social', value: 1200, prev: 820, change: 46.3, engagementRate: 49.8, conversions: 4 },
    { name: 'Email', value: 716, prev: 590, change: 21.4, engagementRate: 74.1, conversions: 2 }
  ],
  sourceMedium: [
    { name: 'google / organic', value: 11800, prev: 10640, change: 10.9, engagementRate: 68.5, conversions: 88 },
    { name: '(direct) / (none)', value: 5600, prev: 5100, change: 9.8, engagementRate: 71.4, conversions: 52 },
    { name: 'bing / organic', value: 610, prev: 540, change: 13.0, engagementRate: 63.2, conversions: 6 },
    { name: 'linkedin.com / referral', value: 820, prev: 490, change: 67.4, engagementRate: 60.1, conversions: 7 },
    { name: 'facebook.com / referral', value: 690, prev: 580, change: 19.0, engagementRate: 44.8, conversions: 3 },
    { name: 'google / cpc', value: 1800, prev: 1650, change: 9.1, engagementRate: 55.3, conversions: 12 },
    { name: 'newsletter / email', value: 716, prev: 590, change: 21.4, engagementRate: 74.1, conversions: 2 }
  ],
  topLandingPages: [
    { name: '/services/seo/', value: 3840, prev: 3340, change: 15.0, engagementRate: 71.2, conversions: 42 },
    { name: '/blog/seo-automation/', value: 2610, prev: 2140, change: 22.0, engagementRate: 68.5, conversions: 18 },
    { name: '/', value: 2290, prev: 2080, change: 10.1, engagementRate: 58.3, conversions: 31 },
    { name: '/blog/ai-overview/', value: 1720, prev: 1240, change: 38.7, engagementRate: 74.8, conversions: 9 },
    { name: '/contact/', value: 1340, prev: 1280, change: 4.7, engagementRate: 81.2, conversions: 62 },
    { name: '/pricing/', value: 980, prev: 720, change: 36.1, engagementRate: 64.4, conversions: 12 },
    { name: '/about/', value: 740, prev: 690, change: 7.2, engagementRate: 55.9, conversions: 3 }
  ],
  deviceSplit: [
    { name: 'Desktop', value: 14120, prev: 12840, change: 10.0 },
    { name: 'Mobile', value: 9480, prev: 7680, change: 23.4 },
    { name: 'Tablet', value: 1220, prev: 820, change: 48.8 }
  ],
  countries: [
    { name: 'India', value: 18840, prev: 16240, change: 16.0 },
    { name: 'United States', value: 2140, prev: 1980, change: 8.1 },
    { name: 'United Kingdom', value: 920, prev: 810, change: 13.6 },
    { name: 'United Arab Emirates', value: 610, prev: 540, change: 13.0 }
  ],
  warnings: [
    'Mobile sessions increased sharply. Review mobile landing-page speed and conversion paths.',
    'Some GA4 detail tables may use configured row limits while overall KPIs remain complete.'
  ]
};

function getGa4DemoReport(filters = {}) {
  return {
    ...JSON.parse(JSON.stringify(GA4_LITE_DEMO)),
    _demoGa4: true,
    partial: false,
    meta: {
      projectId: 'demo',
      projectName: 'Demo Data',
      from: filters.from,
      to: filters.to,
      dateRangeLabel: formatDateRangeLabel(filters.from, filters.to),
      comparisonMode: 'previous_equal_length_period',
      sourceLabel: 'Google Analytics 4'
    },
    dataQuality: { partial: false, truncatedReports: [] }
  };
}

const REPORT_PANEL_CONFIG = {
  overview: { navId: 'navOverview', panelId: 'dashboardContent', title: 'SEO Overview', logoSub: 'Overview' },
  ga4: { navId: 'navGa4', panelId: 'ga4TabContent', title: 'GA4 Analytics', logoSub: 'GA4' },
  gsc: { navId: 'navGsc', panelId: 'gscTabContent', title: 'Google Search Console', logoSub: 'GSC' },
  ai: { navId: 'navAiTraffic', panelId: 'aiTrafficTabContent', title: 'AI Traffic', logoSub: 'AI Traffic' }
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
  requestAnimationFrame(() => typeof resizeCharts === 'function' && resizeCharts());
}

const ga4ViewState = {
  initialized: false,
  section: 'overview',
  selectedMedium: 'all',
  channelSearch: '',
  sourceSearch: '',
  landingSearch: '',
  countrySearch: '',
  channelPage: 1,
  sourcePage: 1,
  landingPage: 1,
  countryPage: 1,
  channelPageSize: 10,
  sourcePageSize: 10,
  landingPageSize: 10,
  countryPageSize: 10,
  sort: {
    channel: { key: 'value', direction: 'desc' },
    source: { key: 'value', direction: 'desc' },
    landing: { key: 'value', direction: 'desc' },
    country: { key: 'value', direction: 'desc' }
  }
};

let ga4CurrentData = null;
let ga4DeviceChart = null;
let ga4TrendChart = null;

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

  initGa4WorkspaceControls();
}

function initGa4WorkspaceControls() {
  if (ga4ViewState.initialized) return;
  ga4ViewState.initialized = true;

  document.getElementById('ga4WorkspaceTabs')?.addEventListener('click', event => {
    const button = event.target.closest('[data-ga4-section]');
    if (!button) return;
    setGa4WorkspaceSection(button.dataset.ga4Section);
  });

  document.getElementById('ga4MediumChips')?.addEventListener('click', event => {
    const button = event.target.closest('[data-ga4-medium]');
    if (!button) return;
    ga4ViewState.selectedMedium = button.dataset.ga4Medium || 'all';
    ga4ViewState.channelPage = 1;
    ga4ViewState.sourcePage = 1;
    ga4ViewState.landingPage = 1;
    renderGa4InteractiveViews();
  });

  document.getElementById('ga4ClearMedium')?.addEventListener('click', () => {
    ga4ViewState.selectedMedium = 'all';
    ga4ViewState.channelPage = 1;
    ga4ViewState.sourcePage = 1;
    ga4ViewState.landingPage = 1;
    renderGa4InteractiveViews();
  });

  bindGa4Search('ga4ChannelSearch', 'channelSearch', 'channelPage');
  bindGa4Search('ga4SourceSearch', 'sourceSearch', 'sourcePage');
  bindGa4Search('ga4LandingSearch', 'landingSearch', 'landingPage');
  bindGa4Search('ga4CountrySearch', 'countrySearch', 'countryPage');

  bindGa4PageSize('ga4ChannelPageSize', 'channelPageSize', 'channelPage');
  bindGa4PageSize('ga4SourcePageSize', 'sourcePageSize', 'sourcePage');
  bindGa4PageSize('ga4LandingPageSize', 'landingPageSize', 'landingPage');

  bindGa4Pager('ga4ChannelPager', 'channelPage');
  bindGa4Pager('ga4SourcePager', 'sourcePage');
  bindGa4Pager('ga4LandingPager', 'landingPage');
  bindGa4Pager('ga4CountryPager', 'countryPage');

  document.getElementById('ga4TabContent')?.addEventListener('click', event => {
    const sortButton = event.target.closest('[data-ga4-sort-scope][data-ga4-sort-key]');
    if (sortButton) {
      const scope = sortButton.dataset.ga4SortScope;
      const key = sortButton.dataset.ga4SortKey;
      const current = ga4ViewState.sort[scope] || { key, direction: 'desc' };
      ga4ViewState.sort[scope] = {
        key,
        direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
      };
      ga4ViewState[`${scope}Page`] = 1;
      renderGa4InteractiveViews();
      return;
    }

    const mediumButton = event.target.closest('[data-ga4-medium-value]');
    if (mediumButton) {
      ga4ViewState.selectedMedium = mediumButton.dataset.ga4MediumValue || 'all';
      ga4ViewState.sourcePage = 1;
      ga4ViewState.channelPage = 1;
      renderGa4InteractiveViews();
    }
  });
}

function bindGa4Search(id, stateKey, pageKey) {
  document.getElementById(id)?.addEventListener('input', event => {
    ga4ViewState[stateKey] = String(event.target.value || '').trim().toLowerCase();
    ga4ViewState[pageKey] = 1;
    renderGa4InteractiveViews();
  });
}

function bindGa4PageSize(id, stateKey, pageKey) {
  document.getElementById(id)?.addEventListener('change', event => {
    ga4ViewState[stateKey] = Math.max(1, Number(event.target.value || 10));
    ga4ViewState[pageKey] = 1;
    renderGa4InteractiveViews();
  });
}

function bindGa4Pager(id, pageKey) {
  const pager = document.getElementById(id);
  pager?.querySelector('[data-page-prev]')?.addEventListener('click', () => {
    ga4ViewState[pageKey] = Math.max(1, ga4ViewState[pageKey] - 1);
    renderGa4InteractiveViews();
  });
  pager?.querySelector('[data-page-next]')?.addEventListener('click', () => {
    ga4ViewState[pageKey] += 1;
    renderGa4InteractiveViews();
  });
}

function setGa4WorkspaceSection(section) {
  const valid = new Set(['overview', 'acquisition', 'landing', 'audience']);
  ga4ViewState.section = valid.has(section) ? section : 'overview';
  document.querySelectorAll('[data-ga4-section]').forEach(button => {
    const active = button.dataset.ga4Section === ga4ViewState.section;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-ga4-panel]').forEach(panel => {
    panel.hidden = panel.dataset.ga4Panel !== ga4ViewState.section;
  });
  requestAnimationFrame(() => {
    if (ga4ViewState.section === 'audience' && ga4CurrentData) renderGa4DeviceChart(ga4CurrentData.deviceSplit);
    if (ga4ViewState.section === 'overview' && ga4CurrentData) renderGa4TrendChart(ga4CurrentData.sessionsOverTime);
    typeof resizeCharts === 'function' && resizeCharts();
  });
}

function renderGa4Tab(report) {
  ga4CurrentData = buildGa4LiteData(report);
  renderGa4Meta(report);
  renderGa4KpiStrip(ga4CurrentData.kpis);
  renderGa4TrendChart(ga4CurrentData.sessionsOverTime);
  renderGa4DeviceChart(ga4CurrentData.deviceSplit);
  renderGa4InteractiveViews();

  const warnings = [...(ga4CurrentData.warnings || [])];
  const truncated = ga4CurrentData.dataQuality?.truncatedReports || [];
  if (ga4CurrentData.partial && !warnings.some(item => /truncat|limited|partial/i.test(item))) {
    warnings.unshift('Some GA4 detail tables use limited row coverage. Overall KPI totals remain available.');
  }
  if (truncated.length) {
    warnings.push(`Limited tables: ${truncated.map(item => `${item.report} ${item.period}`).join(', ')}.`);
  }
  renderGa4Warnings(warnings);
  setGa4WorkspaceSection(ga4ViewState.section);

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
  const heroMeta = document.getElementById('ga4HeroMeta');
  const label = meta.dateRangeLabel || formatDateRangeLabel(meta.from, meta.to);
  if (subtitle) subtitle.textContent = `${meta.projectName || 'Selected project'} · ${label} · Google Analytics 4`;
  if (heroMeta) {
    const cache = meta.cache || {};
    const cacheLabel = cache.hit ? (cache.stale ? 'Stale cache' : 'Fresh cache') : 'Live report';
    heroMeta.textContent = `${label || 'Selected period'} · ${cacheLabel}`;
  }
  syncExportControls(report);
}

function buildGa4LiteData(report) {
  const live = report || {};
  if (live._demoGa4) {
    return {
      ...live,
      kpis: normalizeGa4Kpis(live.kpis || {}),
      trafficByChannel: enrichGa4Rows(live.trafficByChannel || []),
      sourceMedium: enrichGa4SourceRows(live.sourceMedium || []),
      topLandingPages: enrichGa4LandingRows(live.topLandingPages || []),
      deviceSplit: enrichGa4Rows(live.deviceSplit || []),
      countries: enrichGa4Rows(live.countries || [])
    };
  }

  const liveKpis = live.kpis || {};
  const hasLiveGa4 = Object.keys(liveKpis).length > 0 || ['trafficByChannel', 'sourceMedium', 'topLandingPages', 'deviceSplit'].some(key => Array.isArray(live[key]));
  if (!hasLiveGa4) return getGa4DemoReport(getCurrentFilters());

  return {
    kpis: normalizeGa4Kpis(liveKpis),
    sessionsOverTime: live.sessionsOverTime || { labels: [], current: [], previous: [] },
    trafficByChannel: Array.isArray(live.trafficByChannel) ? enrichGa4Rows(live.trafficByChannel) : [],
    sourceMedium: Array.isArray(live.sourceMedium) ? enrichGa4SourceRows(live.sourceMedium) : [],
    topLandingPages: Array.isArray(live.topLandingPages) ? enrichGa4LandingRows(live.topLandingPages) : [],
    deviceSplit: Array.isArray(live.deviceSplit) ? enrichGa4Rows(live.deviceSplit) : [],
    countries: Array.isArray(live.countries) ? enrichGa4Rows(live.countries) : [],
    warnings: Array.isArray(live.ga4Warnings) ? live.ga4Warnings : (Array.isArray(live.warnings) ? live.warnings : []),
    partial: live.partial === true || live.dataQuality?.partial === true,
    dataQuality: live.dataQuality || { partial: live.partial === true }
  };
}

function normalizeGa4Kpis(kpis) {
  const aliases = {
    sessions: ['sessions'],
    totalUsers: ['totalUsers', 'users'],
    newUsers: ['newUsers'],
    engagedSessions: ['engagedSessions'],
    engagementRate: ['engagementRate'],
    totalPageViews: ['totalPageViews', 'pageViews', 'screenPageViews'],
    averageSessionDuration: ['averageSessionDuration', 'avgSessionDuration'],
    conversions: ['conversions', 'keyEvents']
  };
  const result = {};
  Object.entries(aliases).forEach(([target, keys]) => {
    const key = keys.find(item => Object.prototype.hasOwnProperty.call(kpis, item));
    if (key) result[target] = { ...kpis[key], available: true };
  });
  ['sessions', 'engagedSessions', 'engagementRate', 'conversions'].forEach(key => {
    if (!result[key]) result[key] = { value: 0, prev: 0, change: 0, suffix: key === 'engagementRate' ? '%' : '', changeSuffix: key === 'engagementRate' ? ' pp' : '%', available: true };
  });
  return result;
}

function enrichGa4Rows(rows) {
  return rows.map(row => ({
    ...row,
    name: row.name || row.channel || row.country || row.device || row.source || row.medium || 'Unknown',
    value: Number(row.value ?? row.sessions ?? 0),
    prev: Number(row.prev ?? row.prevSessions ?? 0),
    change: Number(row.change ?? row.sessionsChange ?? 0),
    engagementRate: row.engagementRate != null ? Number(row.engagementRate) : null,
    conversions: row.conversions != null ? Number(row.conversions) : (row.keyEvents != null ? Number(row.keyEvents) : null)
  }));
}

function enrichGa4SourceRows(rows) {
  return enrichGa4Rows(rows).map(row => {
    const parts = parseGa4SourceMedium(row);
    return { ...row, source: parts.source, medium: parts.medium, mediumKey: parts.mediumKey };
  });
}

function enrichGa4LandingRows(rows) {
  return enrichGa4Rows(rows).map(row => ({
    ...row,
    name: row.name || row.landingPage || '/',
    mediumKey: row.medium || row.sessionMedium || row.sourceMedium ? parseGa4SourceMedium(row).mediumKey : ''
  }));
}

function parseGa4SourceMedium(row) {
  const directSource = String(row.source || '').trim();
  const directMedium = String(row.medium || row.sessionMedium || '').trim();
  if (directSource || directMedium) {
    const medium = directMedium || '(not set)';
    return { source: directSource || 'Unknown', medium, mediumKey: normalizeGa4Medium(medium) };
  }
  const raw = String(row.sourceMedium || row.name || 'Unknown / (not set)');
  const separator = raw.lastIndexOf(' / ');
  if (separator >= 0) {
    const source = raw.slice(0, separator).trim() || 'Unknown';
    const medium = raw.slice(separator + 3).trim() || '(not set)';
    return { source, medium, mediumKey: normalizeGa4Medium(medium) };
  }
  return { source: raw, medium: '(not set)', mediumKey: 'not-set' };
}

function normalizeGa4Medium(value) {
  return String(value || '(not set)').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'not-set';
}

function ga4MediumLabel(value) {
  const normalized = normalizeGa4Medium(value);
  const labels = {
    'not-set': 'Not set',
    'none': 'Direct / none',
    'organic': 'Organic',
    'referral': 'Referral',
    'cpc': 'Paid search',
    'ppc': 'Paid search',
    'email': 'Email',
    'social': 'Social',
    'organic-social': 'Organic social',
    'paid-social': 'Paid social',
    'ai-assistant': 'AI assistant'
  };
  return labels[normalized] || String(value || 'Unknown').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function renderGa4KpiStrip(kpis) {
  const definitions = [
    ['sessions', 'Sessions', GA4_ACCENTS.blue],
    ['totalUsers', 'Users', GA4_ACCENTS.green],
    ['newUsers', 'New users', GA4_ACCENTS.orange],
    ['engagedSessions', 'Engaged sessions', GA4_ACCENTS.teal],
    ['engagementRate', 'Engagement rate', GA4_ACCENTS.green],
    ['totalPageViews', 'Page views', GA4_ACCENTS.pink],
    ['averageSessionDuration', 'Avg. duration', GA4_ACCENTS.violet],
    ['conversions', 'Conversions', GA4_ACCENTS.red]
  ].filter(([key]) => kpis[key]?.available !== false && kpis[key]);

  const wrap = document.getElementById('ga4KpiStrip');
  if (!wrap) return;
  wrap.innerHTML = definitions.map(([key, label, color]) => {
    const data = kpis[key] || { value: 0, prev: 0, change: 0, suffix: '', changeSuffix: '%' };
    const change = Number(data.change || 0);
    const previous = Number(data.prev || 0);
    const value = formatGa4KpiValue(key, Number(data.value || 0), data.suffix || '');
    return `<article class="kpi-card premium-kpi-card" style="--card-color:${color}">
      <div class="kpi-top"><div class="kpi-label">${escHtml(label)}</div><span class="kpi-icon-dot" aria-hidden="true"></span></div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-card-footer"><span class="kpi-change ${change >= 0 ? 'up' : 'down'}">${change > 0 ? '+' : ''}${ga4FormatChange(change)}${data.changeSuffix || '%'}</span><span class="kpi-previous">vs ${formatGa4Compact(previous)}</span></div>
    </article>`;
  }).join('');
}

function formatGa4KpiValue(key, value, suffix) {
  if (key === 'engagementRate') return `${value.toFixed(1)}${suffix || '%'}`;
  if (key === 'averageSessionDuration') return `${value.toFixed(1)}${suffix || ' sec'}`;
  return `${Math.round(value).toLocaleString()}${suffix}`;
}

function renderGa4InteractiveViews() {
  if (!ga4CurrentData) return;
  renderGa4MediumSelector(ga4CurrentData.sourceMedium);
  renderGa4ChannelSummary(ga4CurrentData.trafficByChannel);
  renderGa4ChannelTable(ga4CurrentData.trafficByChannel);
  renderGa4SourceMediumTable(ga4CurrentData.sourceMedium);
  renderGa4LandingTable(ga4CurrentData.topLandingPages);
  renderGa4CountryTable(ga4CurrentData.countries);
  updateGa4SortIndicators();
}

function renderGa4MediumSelector(rows) {
  const wrap = document.getElementById('ga4MediumChips');
  const summary = document.getElementById('ga4MediumSummary');
  const clear = document.getElementById('ga4ClearMedium');
  if (!wrap || !summary) return;

  const aggregates = new Map();
  rows.forEach(row => {
    const key = row.mediumKey || normalizeGa4Medium(row.medium);
    const existing = aggregates.get(key) || { key, label: ga4MediumLabel(row.medium), sessions: 0, sources: 0 };
    existing.sessions += Number(row.value || 0);
    existing.sources += 1;
    aggregates.set(key, existing);
  });
  const mediums = [...aggregates.values()].sort((a, b) => b.sessions - a.sessions);
  const validKeys = new Set(mediums.map(item => item.key));
  if (ga4ViewState.selectedMedium !== 'all' && !validKeys.has(ga4ViewState.selectedMedium)) ga4ViewState.selectedMedium = 'all';

  const totalSessions = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
  wrap.innerHTML = [
    `<button type="button" class="medium-chip ${ga4ViewState.selectedMedium === 'all' ? 'active' : ''}" data-ga4-medium="all"><span>All</span><strong>${formatGa4Compact(totalSessions)}</strong></button>`,
    ...mediums.map(item => `<button type="button" class="medium-chip ${ga4ViewState.selectedMedium === item.key ? 'active' : ''}" data-ga4-medium="${escHtml(item.key)}"><span>${escHtml(item.label)}</span><strong>${formatGa4Compact(item.sessions)}</strong></button>`)
  ].join('');

  const selected = ga4ViewState.selectedMedium === 'all' ? null : aggregates.get(ga4ViewState.selectedMedium);
  summary.innerHTML = selected
    ? `<span class="summary-dot"></span><strong>${escHtml(selected.label)}</strong><span>${selected.sessions.toLocaleString()} sessions across ${selected.sources.toLocaleString()} source${selected.sources === 1 ? '' : 's'}</span>`
    : `<span class="summary-dot"></span><strong>All mediums</strong><span>${totalSessions.toLocaleString()} sessions across ${rows.length.toLocaleString()} source / medium rows</span>`;
  if (clear) clear.hidden = ga4ViewState.selectedMedium === 'all';
}

function filterGa4SourceRows(rows) {
  return rows.filter(row => {
    const mediumMatch = ga4ViewState.selectedMedium === 'all' || row.mediumKey === ga4ViewState.selectedMedium;
    const searchMatch = `${row.source} ${row.medium} ${row.name}`.toLowerCase().includes(ga4ViewState.sourceSearch);
    return mediumMatch && searchMatch;
  });
}

function filterGa4ChannelRows(rows) {
  return rows.filter(row => {
    const searchMatch = String(row.name || '').toLowerCase().includes(ga4ViewState.channelSearch);
    if (!searchMatch) return false;
    if (ga4ViewState.selectedMedium === 'all') return true;
    return ga4ChannelMatchesMedium(row.name, ga4ViewState.selectedMedium);
  });
}

function ga4ChannelMatchesMedium(channelName, mediumKey) {
  const channel = String(channelName || '').toLowerCase();
  const mappings = {
    organic: ['organic search'],
    none: ['direct'],
    'not-set': ['unassigned', 'direct'],
    referral: ['referral'],
    cpc: ['paid search'],
    ppc: ['paid search'],
    email: ['email'],
    social: ['social'],
    'organic-social': ['organic social'],
    'paid-social': ['paid social'],
    'ai-assistant': ['ai', 'referral']
  };
  const candidates = mappings[mediumKey];
  return !candidates || candidates.some(item => channel.includes(item));
}

function renderGa4ChannelSummary(rows) {
  const wrap = document.getElementById('ga4ChannelSummary');
  if (!wrap) return;
  const filtered = sortGa4Rows(filterGa4ChannelRows(rows), ga4ViewState.sort.channel).slice(0, 6);
  const max = Math.max(...filtered.map(row => row.value), 1);
  wrap.innerHTML = filtered.length ? filtered.map((row, index) => `<div class="ranked-summary-row">
    <div class="ranked-summary-heading"><span>${index + 1}</span><strong>${escHtml(row.name)}</strong><em>${row.value.toLocaleString()}</em></div>
    <div class="summary-progress"><span style="width:${Math.max(3, (row.value / max) * 100)}%"></span></div>
    <small>${ga4DeltaBadge(row.change)} · ${row.engagementRate != null ? `${row.engagementRate.toFixed(1)}% engaged` : 'Engagement unavailable'}</small>
  </div>`).join('') : '<div class="empty-inline">No channels match the selected medium.</div>';
}

function renderGa4ChannelTable(rows) {
  const filtered = sortGa4Rows(filterGa4ChannelRows(rows), ga4ViewState.sort.channel);
  const page = paginateGa4Rows(filtered, 'channelPage', ga4ViewState.channelPageSize);
  const tbody = document.getElementById('ga4ChannelTableBody');
  if (!tbody) return;
  const max = Math.max(...filtered.map(row => row.value), 1);
  tbody.innerHTML = page.items.length ? page.items.map((row, index) => `<tr>
    <td class="row-num">${page.start + index + 1}</td>
    <td class="primary-cell"><span class="channel-marker channel-marker-${(page.start + index) % 4}"></span>${escHtml(row.name)}</td>
    <td class="num-cell"><div class="metric-with-bar"><span class="metric-bar"><i style="width:${Math.max(2, (row.value / max) * 100)}%"></i></span><strong>${row.value.toLocaleString()}</strong></div></td>
    <td class="num-cell">${ga4FormatOptionalInt(row.prev)}</td>
    <td class="num-cell">${ga4DeltaBadge(row.change)}</td>
    <td class="num-cell">${ga4EngagementBadge(row.engagementRate)}</td>
    <td class="num-cell">${ga4FormatOptionalInt(row.conversions)}</td>
  </tr>`).join('') : ga4EmptyRow(7, 'No acquisition channels match this filter.');
  updateGa4Pager('ga4ChannelPager', page.page, page.totalPages, filtered.length);
}

function renderGa4SourceMediumTable(rows) {
  const filtered = sortGa4Rows(filterGa4SourceRows(rows), ga4ViewState.sort.source);
  const page = paginateGa4Rows(filtered, 'sourcePage', ga4ViewState.sourcePageSize);
  const tbody = document.getElementById('ga4SourceMediumTableBody');
  if (!tbody) return;
  const max = Math.max(...filtered.map(row => row.value), 1);
  tbody.innerHTML = page.items.length ? page.items.map((row, index) => `<tr>
    <td class="row-num">${page.start + index + 1}</td>
    <td class="primary-cell table-text-wrap" title="${escHtml(row.source)}">${escHtml(row.source)}</td>
    <td><button class="medium-value-button ${ga4ViewState.selectedMedium === row.mediumKey ? 'active' : ''}" type="button" data-ga4-medium-value="${escHtml(row.mediumKey)}">${escHtml(ga4MediumLabel(row.medium))}</button></td>
    <td class="num-cell"><div class="metric-with-bar"><span class="metric-bar"><i style="width:${Math.max(2, (row.value / max) * 100)}%"></i></span><strong>${row.value.toLocaleString()}</strong></div></td>
    <td class="num-cell">${ga4FormatOptionalInt(row.prev)}</td>
    <td class="num-cell">${ga4DeltaBadge(row.change)}</td>
    <td class="num-cell">${ga4EngagementBadge(row.engagementRate)}</td>
    <td class="num-cell">${ga4FormatOptionalInt(row.conversions)}</td>
  </tr>`).join('') : ga4EmptyRow(8, 'No source / medium rows match this filter.');
  updateGa4Pager('ga4SourcePager', page.page, page.totalPages, filtered.length);
}

function renderGa4LandingTable(rows) {
  const hasMediumDimension = rows.some(row => Boolean(row.mediumKey));
  const note = document.getElementById('ga4LandingFilterNote');
  if (note) {
    note.textContent = ga4ViewState.selectedMedium !== 'all' && !hasMediumDimension
      ? 'The compact payload has no medium-to-landing-page dimension, so this table remains property-wide.'
      : (hasMediumDimension && ga4ViewState.selectedMedium !== 'all' ? 'Filtered to the selected medium.' : 'Property-wide landing-page data.');
  }
  const filtered = rows.filter(row => {
    const searchMatch = String(row.name || '').toLowerCase().includes(ga4ViewState.landingSearch);
    const mediumMatch = ga4ViewState.selectedMedium === 'all' || !hasMediumDimension || row.mediumKey === ga4ViewState.selectedMedium;
    return searchMatch && mediumMatch;
  });
  const sorted = sortGa4Rows(filtered, ga4ViewState.sort.landing);
  const page = paginateGa4Rows(sorted, 'landingPage', ga4ViewState.landingPageSize);
  const tbody = document.getElementById('ga4LandingTableBody');
  if (!tbody) return;
  const max = Math.max(...sorted.map(row => row.value), 1);
  tbody.innerHTML = page.items.length ? page.items.map((row, index) => `<tr>
    <td class="row-num">${page.start + index + 1}</td>
    <td class="url-cell table-text-wrap"><span title="${escHtml(row.name)}">${escHtml(row.name)}</span></td>
    <td class="num-cell"><div class="metric-with-bar"><span class="metric-bar"><i style="width:${Math.max(2, (row.value / max) * 100)}%"></i></span><strong>${row.value.toLocaleString()}</strong></div></td>
    <td class="num-cell">${ga4FormatOptionalInt(row.prev)}</td>
    <td class="num-cell">${ga4DeltaBadge(row.change)}</td>
    <td class="num-cell">${ga4EngagementBadge(row.engagementRate)}</td>
    <td class="num-cell">${ga4FormatOptionalInt(row.conversions)}</td>
  </tr>`).join('') : ga4EmptyRow(7, 'No landing pages match this search.');
  updateGa4Pager('ga4LandingPager', page.page, page.totalPages, sorted.length);
}

function renderGa4CountryTable(rows) {
  const filtered = sortGa4Rows(rows.filter(row => String(row.name || '').toLowerCase().includes(ga4ViewState.countrySearch)), ga4ViewState.sort.country);
  const page = paginateGa4Rows(filtered, 'countryPage', ga4ViewState.countryPageSize);
  const tbody = document.getElementById('ga4CountryTableBody');
  if (!tbody) return;
  tbody.innerHTML = page.items.length ? page.items.map((row, index) => `<tr>
    <td class="row-num">${page.start + index + 1}</td><td class="primary-cell">${escHtml(ga4CountryLabel(row.name))}</td><td class="num-cell"><strong>${row.value.toLocaleString()}</strong></td><td class="num-cell">${ga4DeltaBadge(row.change)}</td>
  </tr>`).join('') : ga4EmptyRow(4, 'No country rows match this search.');
  updateGa4Pager('ga4CountryPager', page.page, page.totalPages, filtered.length);
}

function paginateGa4Rows(rows, pageKey, pageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(Math.max(1, ga4ViewState[pageKey]), totalPages);
  ga4ViewState[pageKey] = page;
  const start = (page - 1) * pageSize;
  return { page, totalPages, start, items: rows.slice(start, start + pageSize) };
}

function sortGa4Rows(rows, config) {
  const direction = config?.direction === 'asc' ? 1 : -1;
  const key = config?.key || 'value';
  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    if (typeof left === 'number' || typeof right === 'number') return (Number(left || 0) - Number(right || 0)) * direction;
    return String(left || '').localeCompare(String(right || ''), undefined, { numeric: true, sensitivity: 'base' }) * direction;
  });
}

function updateGa4SortIndicators() {
  document.querySelectorAll('[data-ga4-sort-scope][data-ga4-sort-key]').forEach(button => {
    const config = ga4ViewState.sort[button.dataset.ga4SortScope];
    const active = config?.key === button.dataset.ga4SortKey;
    button.classList.toggle('active', active);
    button.dataset.sortDirection = active ? config.direction : '';
    button.setAttribute('aria-sort', active ? (config.direction === 'asc' ? 'ascending' : 'descending') : 'none');
  });
}

function updateGa4Pager(id, page, totalPages, totalRows) {
  const pager = document.getElementById(id);
  if (!pager) return;
  const status = pager.querySelector('[data-page-status]');
  const prev = pager.querySelector('[data-page-prev]');
  const next = pager.querySelector('[data-page-next]');
  if (status) status.textContent = `Page ${page} of ${totalPages} · ${totalRows.toLocaleString()} rows`;
  if (prev) prev.disabled = page <= 1;
  if (next) next.disabled = page >= totalPages;
}

function renderGa4TrendChart(series) {
  const canvas = document.getElementById('ga4TrendChart');
  if (!canvas || !window.Chart) return;
  if (ga4TrendChart) ga4TrendChart.destroy();
  const labels = Array.isArray(series?.labels) ? series.labels : [];
  const current = Array.isArray(series?.current) ? series.current : [];
  const previous = Array.isArray(series?.previous) ? series.previous : [];
  ga4TrendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Current sessions', data: current, borderColor: GA4_ACCENTS.blue, backgroundColor: 'rgba(37,99,235,.10)', fill: true, tension: .35, borderWidth: 2.5, pointRadius: 2, pointHoverRadius: 5 },
        { label: 'Previous sessions', data: previous, borderColor: GA4_ACCENTS.neutral, backgroundColor: 'transparent', fill: false, tension: .35, borderWidth: 1.5, borderDash: [5, 4], pointRadius: 1.5 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, padding: 16 } } },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { beginAtZero: false, grid: { color: 'rgba(15,23,42,.055)' }, border: { display: false }, ticks: { callback: value => formatGa4Compact(value) } }
      }
    }
  });
}

function renderGa4DeviceChart(rows) {
  const canvas = document.getElementById('ga4DeviceChart');
  if (!canvas || !window.Chart) return;
  if (ga4DeviceChart) ga4DeviceChart.destroy();
  const colors = [GA4_ACCENTS.blue, GA4_ACCENTS.green, GA4_ACCENTS.orange, GA4_ACCENTS.red];
  ga4DeviceChart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: rows.map(row => row.name), datasets: [{ data: rows.map(row => row.value), backgroundColor: rows.map((_, index) => colors[index % colors.length]), borderWidth: 0, hoverOffset: 5 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 14 } }, tooltip: { callbacks: { label: context => {
        const total = context.dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
        const percentage = total ? (Number(context.raw || 0) / total * 100).toFixed(1) : '0.0';
        return ` ${context.label}: ${Number(context.raw || 0).toLocaleString()} (${percentage}%)`;
      } } } }
    }
  });

  const list = document.getElementById('ga4DeviceList');
  if (list) {
    list.innerHTML = rows.length ? rows.map((row, index) => `<div class="metric-summary-row"><span><i class="legend-dot" style="background:${colors[index % colors.length]}"></i>${escHtml(row.name)}</span><strong>${row.value.toLocaleString()} · ${ga4FormatChange(row.change)}%</strong></div>`).join('') : '<div class="empty-inline">No device data available.</div>';
  }
}

function renderGa4Warnings(warnings) {
  const wrap = document.getElementById('ga4Warnings');
  if (!wrap) return;
  const notes = (warnings || []).filter((value, index, array) => value && array.indexOf(value) === index);
  if (!notes.length) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';
  wrap.innerHTML = `<details class="data-notes-card">
    <summary><span class="data-notes-icon" aria-hidden="true">i</span><span><strong>Data notes</strong><small>GA4 collection and interpretation notes</small></span><span class="data-notes-badge">${notes.length} note${notes.length === 1 ? '' : 's'}</span><span class="data-notes-chevron" aria-hidden="true"></span></summary>
    <div class="data-notes-body"><p>Overall KPI totals remain available. Expand these notes when validating detailed tables.</p><ul>${notes.map(note => `<li>${escHtml(note)}</li>`).join('')}</ul></div>
  </details>`;
}

function ga4DeltaBadge(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? '+' : '';
  return `<span class="delta-badge ${number >= 0 ? 'positive' : 'negative'}">${sign}${ga4FormatChange(number)}%</span>`;
}

function ga4EngagementBadge(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const number = Number(value);
  const tone = number >= 65 ? 'positive' : number >= 45 ? 'neutral' : 'negative';
  return `<span class="engagement-badge ${tone}">${number.toFixed(1)}%</span>`;
}

function ga4FormatChange(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function ga4FormatOptionalInt(value) {
  return value == null ? '—' : Number(value).toLocaleString();
}

function formatGa4Compact(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(number) >= 1_000) return `${(number / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return Math.round(number).toLocaleString();
}

function ga4CountryLabel(value) {
  const code = String(value || '').trim().toLowerCase();
  const labels = { ind: 'India', usa: 'United States', gbr: 'United Kingdom', are: 'United Arab Emirates', can: 'Canada', aus: 'Australia', sgp: 'Singapore', mys: 'Malaysia', qat: 'Qatar', sau: 'Saudi Arabia' };
  return labels[code] || String(value || 'Unknown');
}

function ga4EmptyRow(colspan, message) {
  return `<tr><td colspan="${colspan}" class="table-empty">${escHtml(message)}</td></tr>`;
}
