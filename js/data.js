const REPORT_CONFIG = {
  useDemoFallback: false
};

const SeoDashboardState = {
  activeView: 'overview',
  filterKey: '',
  filters: null,
  reports: { overview: null, ga4: null },
  builds: new Map(),

  makeFilterKey(params = {}) {
    return [params.projectId || params.clientId || '', params.from || '', params.to || ''].join('|');
  },

  setFilters(params = {}) {
    const nextKey = this.makeFilterKey(params);
    if (nextKey !== this.filterKey) {
      this.filterKey = nextKey;
      this.reports = { overview: null, ga4: null };
    }
    this.filters = { ...params };
    return nextKey;
  },

  setReport(view, report, params = this.filters || {}) {
    this.setFilters(params);
    this.reports[view] = report;
    return report;
  },

  getReport(view, params = this.filters || {}) {
    return this.makeFilterKey(params) === this.filterKey
      ? this.reports[view] || null
      : null;
  },

  setActiveView(view) {
    this.activeView = view === 'ga4' ? 'ga4' : 'overview';
  },

  clearReports() {
    this.reports = { overview: null, ga4: null };
  }
};

window.SeoDashboardState = SeoDashboardState;

function emitSnapshotState(state, detail = {}) {
  window.dispatchEvent(new CustomEvent('seo:snapshot-state', {
    detail: { state, ...detail }
  }));
}

/*
  ============================================================
  REPORT VIEW CONTRACT
  ============================================================

  kpis[key]:
    { value, change, suffix, changeSuffix }
    change = % change vs previous period (positive = up, negative = down)
    avgCtr.changeSuffix = ' pp' (percentage points)
    keywordsTop10.changeSuffix = '' (raw count)

  sessionsOverTime:
    { labels: ['May 1',...], current: [...], previous: [...] }
    previous = same-length array for prev period, empty [] until Phase 2

  gscTrend:
    { labels: ['2026-05-01',...], impressions: [...], clicks: [...] }

  deviceSplit[]:      { name, value }  — raw session counts
  trafficByChannel[]: { name, value }  — raw session counts
  topLandingPages[]:  { name, value }  — raw session counts

  gscKeywords[]:
    { query, clicks, impressions, ctr (PERCENTAGE e.g. 5.2), position }

  opportunityQueries[]:
    { query, impressions, ctr (PERCENTAGE), position }

  aeoSources[]:       { name, value } — raw AI referral sessions
  aeoLandingPages[]:  { sourceMedium, landingPage, sessions, ... }
  countries[]:        { name, value }

  meta.comparisonMode:
    'previous_calendar_month' — selected range is a full calendar month;
                                comparison is previous calendar month (e.g. Apr vs May)
    'previous_equal_length_period' — custom date range;
                                comparison is the immediately preceding equal-length period

  CLIENTS API CONTRACT:
    Response: { ok: true, count: N, clients: [ { clientId, clientName, siteUrl } ] }
    Browser requests are routed through the Netlify API layer.
  ============================================================
*/

const DEFAULT_KPIS = {
  totalUsers:      { value: 0, change: 0,  suffix: '',  changeSuffix: '%' },
  totalPageViews:  { value: 0, change: 0,  suffix: '',  changeSuffix: '%' },
  conversions:     { value: 0, change: 0,  suffix: '',  changeSuffix: '%' },
  aiTraffic:       { value: 0, change: 0,  suffix: '',  changeSuffix: '%' },
  gscClicks:       { value: 0, change: 0,  suffix: '',  changeSuffix: '%' },
  gscImpressions:  { value: 0, change: 0,  suffix: '',  changeSuffix: '%' },
  avgCtr:          { value: 0, change: 0,  suffix: '%', changeSuffix: ' pp' },
  keywordsTop10:   { value: 0, change: 0,  suffix: '',  changeSuffix: '' }
};

const DEMO_REPORT_DATA = {
  ok: true,
  meta: {
    projectId:      'local-seo-client',
    projectName:    'Local SEO Client',
    from:           '2026-05-01',
    to:             '2026-05-31',
    prevFrom:       '2026-04-01',
    prevTo:         '2026-04-30',
    comparisonMode: 'previous_calendar_month',
    monthLabel:     'May 2026',
    sourceLabel:    'GA4 · GSC · AEO Signals'
  },
  kpis: {
    totalUsers:      { value: 19840, change: 10.2,  suffix: '',  changeSuffix: '%' },
    totalPageViews:  { value: 68420, change: 13.5,  suffix: '',  changeSuffix: '%' },
    conversions:     { value: 186,   change: 14.9,  suffix: '',  changeSuffix: '%' },
    aiTraffic:       { value: 88,    change: 22.2,  suffix: '',  changeSuffix: '%' },
    gscClicks:       { value: 9340,  change: 8.1,   suffix: '',  changeSuffix: '%' },
    gscImpressions:  { value: 163400,change: 11.6,  suffix: '',  changeSuffix: '%' },
    avgCtr:          { value: 5.7,   change: 0.4,   suffix: '%', changeSuffix: ' pp' },
    keywordsTop10:   { value: 47,    change: 5,     suffix: '',  changeSuffix: '' }
  },
  sessionsOverTime: {
    labels:   ['May 1','May 5','May 10','May 15','May 20','May 25','May 31'],
    current:  [2840, 3120, 2980, 3450, 3280, 3780, 3540],
    previous: [2200, 2650, 2410, 2900, 2760, 3100, 2940]
  },
  deviceSplit: [
    { name: 'Desktop', value: 16884 },
    { name: 'Mobile',  value: 6452 },
    { name: 'Tablet',  value: 1490 }
  ],
  trafficByChannel: [
    { name: 'Organic Search', value: 12400 },
    { name: 'Direct',         value: 5600 },
    { name: 'Referral',       value: 3100 },
    { name: 'Paid Search',    value: 1800 },
    { name: 'Social',         value: 1200 },
    { name: 'Email',          value: 716 }
  ],
  topLandingPages: [
    { name: '/services/seo/',          value: 3840 },
    { name: '/blog/seo-automation/',   value: 2610 },
    { name: '/',                       value: 2290 },
    { name: '/blog/ai-overview/',      value: 1720 },
    { name: '/contact/',               value: 1340 }
  ],
  gscTrend: {
    labels:      ['May 1','May 5','May 10','May 15','May 20','May 31'],
    impressions: [18400, 21200, 19800, 23400, 22100, 24200],
    clicks:      [1040,  1280,  1120,  1440,  1320,  1460]
  },
  gscKeywords: [
    { query: 'seo agency india',             clicks: 420, impressions: 8200, ctr: 5.12, position: 3.4 },
    { query: 'digital marketing coimbatore', clicks: 290, impressions: 5900, ctr: 4.92, position: 4.1 },
    { query: 'seo reporting automation',     clicks: 185, impressions: 4400, ctr: 4.20, position: 5.7 },
    { query: 'ai seo tools 2026',            clicks: 130, impressions: 6100, ctr: 2.13, position: 9.2 },
    { query: 'rank tracking software',       clicks: 98,  impressions: 3800, ctr: 2.58, position: 7.8 }
  ],
  opportunityQueries: [
    { query: 'best seo tools 2026',       impressions: 14200, ctr: 0.62, position: 11.4 },
    { query: 'ai overview seo strategy',  impressions: 9800,  ctr: 0.48, position: 13.7 },
    { query: 'how to rank on chatgpt',    impressions: 7600,  ctr: 0.31, position: 16.2 },
    { query: 'seo automation n8n',        impressions: 5100,  ctr: 0.94, position: 9.8 },
    { query: 'gsc api google sheets',     impressions: 4300,  ctr: 0.70, position: 14.1 }
  ],
  aeoSources: [
    { name: 'chatgpt.com',           value: 38 },
    { name: 'perplexity.ai',         value: 22 },
    { name: 'gemini.google.com',     value: 14 },
    { name: 'claude.ai',             value: 9 },
    { name: 'copilot.microsoft.com', value: 5 }
  ],
  aeoLandingPages: [
    { sourceMedium: 'chatgpt.com / referral',       landingPage: '/services/seo',     sessions: 16, engagedSessions: 13, engagementRate: 81.25, avgEngagementTime: '2m 14s' },
    { sourceMedium: 'perplexity.ai / referral',     landingPage: '/blog/seo-auto',    sessions: 12, engagedSessions: 9,  engagementRate: 75.00, avgEngagementTime: '1m 52s' },
    { sourceMedium: 'gemini.google.com / referral', landingPage: '/contact/',          sessions: 8,  engagedSessions: 6,  engagementRate: 75.00, avgEngagementTime: '0m 58s' },
    { sourceMedium: 'claude.ai / referral',         landingPage: '/blog/ai-overview', sessions: 5,  engagedSessions: 4,  engagementRate: 80.00, avgEngagementTime: '3m 02s' }
  ],
  countries: [
    { name: 'India',     value: 72 },
    { name: 'USA',       value: 14 },
    { name: 'UK',        value: 7 },
    { name: 'Australia', value: 4 },
    { name: 'Singapore', value: 3 }
  ],
  warnings: []
};

function getNetlifyApi() {
  const api = window.NetlifySeoApi;
  if (!api) throw new Error('The Netlify API client was not loaded.');
  return api;
}

async function fetchClientList() {
  const data = await getNetlifyApi().listClients();
  if (!data?.ok || !Array.isArray(data.clients)) {
    throw new Error(data?.error || 'Invalid clients response.');
  }
  return data.clients;
}

async function waitForSnapshot(api, input) {
  const buildKey = [input.clientId, input.from, input.to].join('|');
  let buildPromise = SeoDashboardState.builds.get(buildKey);

  if (!buildPromise) {
    buildPromise = (async () => {
      await api.refreshReport(input);
      return api.waitForReport(
        { ...input, view: 'overview' },
        {
          timeoutMs: 6 * 60 * 1000,
          onProgress(progress) {
            emitSnapshotState('building', {
              message: 'Preparing analytics snapshot…',
              attempt: progress.attempt,
              elapsedMs: progress.elapsedMs
            });
          }
        }
      );
    })().finally(() => {
      SeoDashboardState.builds.delete(buildKey);
    });

    SeoDashboardState.builds.set(buildKey, buildPromise);
  }

  const overview = await buildPromise;
  if (input.view === 'overview') return overview;

  return api.waitForReport(input, {
    timeoutMs: 90 * 1000,
    onProgress(progress) {
      emitSnapshotState('building', {
        message: `Loading the ${input.view.toUpperCase()} cached view…`,
        attempt: progress.attempt,
        elapsedMs: progress.elapsedMs
      });
    }
  });
}

async function fetchReportData(params) {
  const view = params.view === 'ga4' ? 'ga4' : 'overview';
  const input = {
    clientId: params.projectId,
    from: params.from,
    to: params.to,
    view
  };

  try {
    const api = getNetlifyApi();
    let response = await api.getReport(input);
    let payload = response.payload;

    if (response.status === 202 || payload?.pending === true) {
      emitSnapshotState('building', {
        message: 'No cached snapshot yet. Collecting GA4 and GSC…'
      });
      payload = await waitForSnapshot(api, input);
    }

    const report = normalizeReportView(payload, params, view);
    const cache = report.meta?.cache || {};
    const messages = [];

    if (cache.stale) messages.push('Loaded a stale cached snapshot.');
    else if (cache.hit) messages.push('Loaded cached analytics.');
    else messages.push('Analytics snapshot ready.');

    if (report.partial || cache.partial) {
      messages.push('Some tables are limited by configured row coverage.');
    }

    emitSnapshotState(cache.stale ? 'warning' : 'ready', {
      message: messages.join(' '),
      cache,
      partial: report.partial === true
    });

    return SeoDashboardState.setReport(view, report, params);
  } catch (error) {
    console.warn('Report fetch failed:', error);
    emitSnapshotState('error', {
      message: error.message || 'The report could not be loaded.',
      code: error.code || 'REPORT_LOAD_ERROR'
    });

    if (REPORT_CONFIG.useDemoFallback) return getDemoData(params);
    throw error;
  }
}

function normalizeReportView(report, params = {}, view = 'overview') {
  return view === 'ga4'
    ? normalizeGa4ReportData(report, params)
    : normalizeReportData(report, params);
}

function normalizeGa4ReportData(report, params = {}) {
  const incoming = report || {};
  const payload = incoming.ga4 && typeof incoming.ga4 === 'object'
    ? incoming.ga4
    : incoming;

  const meta = {
    ...(payload.meta || {}),
    ...(incoming.meta || {})
  };

  if (params.from) meta.from = params.from;
  if (params.to) meta.to = params.to;

  meta.projectId = meta.projectId || meta.clientId || params.projectId || '';
  meta.projectName = meta.projectName || meta.clientName || params.projectName || meta.projectId || 'Selected project';
  meta.comparisonMode = meta.comparisonMode || 'previous_equal_length_period';
  meta.dateRangeLabel = formatDateRangeLabel(meta.from, meta.to);
  meta.monthLabel = meta.dateRangeLabel;
  meta.sourceLabel = 'Google Analytics 4';

  return {
    ...payload,
    ok: incoming.ok !== false,
    view: 'ga4',
    partial: incoming.partial === true || payload.partial === true || payload.dataQuality?.partial === true,
    meta,
    kpis: { ...(payload.kpis || {}), ...(incoming.kpis || {}) },
    sessionsOverTime: normalizeSessionsOverTime(payload.sessionsOverTime, meta.comparisonMode),
    deviceSplit: safeArray(payload.deviceSplit),
    trafficByChannel: safeArray(payload.trafficByChannel),
    topLandingPages: safeArray(payload.topLandingPages),
    sourceMedium: safeArray(payload.sourceMedium),
    countries: safeArray(payload.countries),
    aeoSources: safeArray(payload.aeoSources),
    aeoLandingPages: safeArray(payload.aeoLandingPages),
    ga4Warnings: safeArray(incoming.ga4Warnings).length
      ? safeArray(incoming.ga4Warnings)
      : safeArray(payload.warnings || payload.ga4Warnings),
    warnings: safeArray(incoming.warnings).length
      ? safeArray(incoming.warnings)
      : safeArray(payload.warnings || payload.ga4Warnings),
    dataQuality: payload.dataQuality || { partial: incoming.partial === true }
  };
}

function getDemoData(params) {
  return normalizeReportData(DEMO_REPORT_DATA, params);
}

function normalizeReportData(report, params = {}) {
  const fallback = JSON.parse(JSON.stringify(DEMO_REPORT_DATA));
  const incoming = report || {};
  const isDemo = incoming === DEMO_REPORT_DATA || incoming.meta?.projectId === 'local-seo-client';

  const meta = {
    ...fallback.meta,
    ...(incoming.meta || {})
  };

  if (params.from) meta.from = params.from;
  if (params.to) meta.to = params.to;

  meta.projectId = incoming.meta?.projectId || params.projectId || 'local-seo-client';
  meta.projectName = incoming.meta?.projectName || params.projectName || (params.projectId === 'demo' ? 'Demo Data' : params.projectId || 'Selected project');
  meta.comparisonMode = incoming.meta?.comparisonMode || 'previous_equal_length_period';

  if (incoming.meta?.prevFrom) meta.prevFrom = incoming.meta.prevFrom;
  if (incoming.meta?.prevTo) meta.prevTo = incoming.meta.prevTo;

  meta.dateRangeLabel = formatDateRangeLabel(meta.from, meta.to);
  meta.monthLabel = meta.dateRangeLabel;
  meta.sourceLabel = meta.sourceLabel || 'GA4 · GSC · AEO Signals';

  const sessionsOverTime = normalizeSessionsOverTime(
    incoming.sessionsOverTime || (isDemo ? fallback.sessionsOverTime : null),
    meta.comparisonMode
  );

  const data = {
    ...fallback,
    ...incoming,
    meta,
    kpis: mergeKpis(DEFAULT_KPIS, incoming.kpis || {}),
    sessionsOverTime,
    gscTrend: normalizeGscTrend(incoming.gscTrend || (isDemo ? fallback.gscTrend : null)),
    deviceSplit: Array.isArray(incoming.deviceSplit) ? incoming.deviceSplit : (isDemo ? fallback.deviceSplit : []),
    trafficByChannel: Array.isArray(incoming.trafficByChannel) ? incoming.trafficByChannel : (isDemo ? fallback.trafficByChannel : []),
    topLandingPages: Array.isArray(incoming.topLandingPages) ? incoming.topLandingPages : (isDemo ? fallback.topLandingPages : []),
    sourceMedium: Array.isArray(incoming.sourceMedium) ? incoming.sourceMedium : [],
    ga4Warnings: Array.isArray(incoming.ga4Warnings) ? incoming.ga4Warnings : [],
    gscKeywords: Array.isArray(incoming.gscKeywords) ? incoming.gscKeywords : (isDemo ? fallback.gscKeywords : []),
    opportunityQueries: Array.isArray(incoming.opportunityQueries) ? incoming.opportunityQueries : (isDemo ? fallback.opportunityQueries : []),
    aeoSources: Array.isArray(incoming.aeoSources) ? incoming.aeoSources : (isDemo ? fallback.aeoSources : []),
    aeoLandingPages: Array.isArray(incoming.aeoLandingPages) ? incoming.aeoLandingPages : (isDemo ? fallback.aeoLandingPages : []),
    countries: Array.isArray(incoming.countries) ? incoming.countries : (isDemo ? fallback.countries : []),
    warnings: Array.isArray(incoming.warnings) ? incoming.warnings : []
  };

  return data;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function padArray(arr, length, fillValue = null) {
  const out = arr.slice(0, length);
  while (out.length < length) out.push(fillValue);
  return out;
}

function makeDayLabels(length) {
  return Array.from({ length }, (_, i) => `Day ${i + 1}`);
}

function normalizeSessionsOverTime(series, comparisonMode) {
  const labels = safeArray(series?.labels);
  const current = safeArray(series?.current);
  const previous = safeArray(series?.previous);

  if (comparisonMode === 'previous_calendar_month') {
    const length = Math.max(labels.length, current.length, previous.length);

    return {
      labels: makeDayLabels(length),
      current: padArray(current, length, null),
      previous: padArray(previous, length, null)
    };
  }

  const length = Math.max(labels.length, current.length, previous.length);

  return {
    labels: labels.length === length ? labels : makeDayLabels(length),
    current: padArray(current, length, null),
    previous: padArray(previous, length, null)
  };
}

function normalizeGscTrend(series) {
  return {
    labels: safeArray(series?.labels),
    impressions: safeArray(series?.impressions),
    clicks: safeArray(series?.clicks),
    prevImpressions: safeArray(series?.prevImpressions),
    prevClicks: safeArray(series?.prevClicks)
  };
}

function mergeKpis(defaultKpis, incomingKpis) {
  const merged = {};
  Object.keys(defaultKpis).forEach(key => {
    merged[key] = { ...defaultKpis[key], ...((incomingKpis && incomingKpis[key]) || {}) };
  });
  Object.keys(incomingKpis || {}).forEach(key => {
    if (!merged[key]) merged[key] = { ...incomingKpis[key] };
  });
  return merged;
}

function formatDateRangeLabel(from, to) {
  if (!from && !to) return 'May 2026';
  const fmt = dateStr => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  if (from && to && from !== to) return `${fmt(from)} \u2013 ${fmt(to)}`;
  if (from) return fmt(from);
  return fmt(to);
}

function getComparisonLabel(comparisonMode) {
  return comparisonMode === 'previous_calendar_month'
    ? 'vs previous month'
    : 'vs previous period';
}
