const REPORT_CONFIG = {
  n8nWebhookUrl: 'https://balsgowtham-n8n.hf.space/webhook/seo-overview-phase1',
  useDemoFallback: true
};

/*
  ============================================================
  N8N RESPONSE CONTRACT
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

  CORS headers required from n8n:
    Access-Control-Allow-Origin: *
    Access-Control-Allow-Headers: Content-Type
    Access-Control-Allow-Methods: POST, OPTIONS
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
    projectId:   'local-seo-client',
    projectName: 'Local SEO Client',
    from:        '2026-05-01',
    to:          '2026-05-31',
    monthLabel:  'May 2026',
    sourceLabel: 'GA4 · GSC · AEO Signals'
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

async function fetchReportData(params) {
  try {
    const response = await fetch(REPORT_CONFIG.n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'client-id': params.projectId,
        from:        params.from,
        to:          params.to
      })
    });

    if (!response.ok) throw new Error(`n8n returned ${response.status}`);

    const liveData = await response.json();
    return normalizeReportData(liveData, params);
  } catch (error) {
    console.warn('Report fetch failed, using demo data:', error);
    if (REPORT_CONFIG.useDemoFallback) {
      return getDemoData(params);
    }
    throw error;
  }
}

function getDemoData(params) {
  return normalizeReportData(DEMO_REPORT_DATA, params);
}

function normalizeReportData(report, params = {}) {
  const fallback = JSON.parse(JSON.stringify(DEMO_REPORT_DATA));
  const incoming = report || {};

  const data = {
    ...fallback,
    ...incoming,
    meta:               { ...fallback.meta,             ...(incoming.meta             || {}) },
    sessionsOverTime:   { ...fallback.sessionsOverTime, ...(incoming.sessionsOverTime || {}) },
    gscTrend:           { ...fallback.gscTrend,         ...(incoming.gscTrend         || {}) },
    deviceSplit:        Array.isArray(incoming.deviceSplit)        ? incoming.deviceSplit        : fallback.deviceSplit,
    trafficByChannel:   Array.isArray(incoming.trafficByChannel)   ? incoming.trafficByChannel   : fallback.trafficByChannel,
    topLandingPages:    Array.isArray(incoming.topLandingPages)    ? incoming.topLandingPages    : fallback.topLandingPages,
    gscKeywords:        Array.isArray(incoming.gscKeywords)        ? incoming.gscKeywords        : fallback.gscKeywords,
    opportunityQueries: Array.isArray(incoming.opportunityQueries) ? incoming.opportunityQueries : fallback.opportunityQueries,
    aeoSources:         Array.isArray(incoming.aeoSources)         ? incoming.aeoSources         : fallback.aeoSources,
    aeoLandingPages:    Array.isArray(incoming.aeoLandingPages)    ? incoming.aeoLandingPages    : fallback.aeoLandingPages,
    countries:          Array.isArray(incoming.countries)          ? incoming.countries          : fallback.countries,
    warnings:           Array.isArray(incoming.warnings)           ? incoming.warnings           : []
  };

  // Preserve live projectName — only fall back to 'Local SEO Client' if not provided
  data.meta.projectId   = incoming.meta?.projectId   || 'local-seo-client';
  data.meta.projectName = incoming.meta?.projectName || 'Local SEO Client';

  if (params.from) data.meta.from = params.from;
  if (params.to)   data.meta.to   = params.to;

  data.meta.dateRangeLabel = formatDateRangeLabel(data.meta.from, data.meta.to);
  data.meta.monthLabel     = data.meta.dateRangeLabel;
  data.meta.sourceLabel    = data.meta.sourceLabel || 'GA4 · GSC · AEO Signals';

  // Merge KPIs: live values override defaults, preserve suffix/changeSuffix from defaults
  data.kpis = mergeKpis(DEFAULT_KPIS, incoming.kpis || {});

  // Ensure sessionsOverTime.previous is always an array (empty ok, not undefined)
  if (!Array.isArray(data.sessionsOverTime.previous)) {
    data.sessionsOverTime.previous = [];
  }

  return data;
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
