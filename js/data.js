const REPORT_CONFIG = {
  // Replace with your real n8n webhook URL before going live.
  // Example: 'https://your-n8n-domain/webhook/seo-overview-report'
  n8nWebhookUrl: 'https://YOUR-N8N-DOMAIN/webhook/seo-overview-report',

  // Keep true during development (uses DEMO_REPORT_DATA on fetch failure).
  // Set to false when your n8n webhook is live and tested.
  useDemoFallback: true
};

/*
  ============================================================
  N8N RESPONSE CONTRACT — read this before building the workflow
  ============================================================

  CTR (gscKeywords[].ctr):
    Must be a PERCENTAGE — e.g. 5.2 means 5.2%.
    GSC API returns a decimal ratio (0.052). In n8n: ctr: row.ctr * 100

  deviceSplit[].value:
    Must be a PERCENTAGE (0–100), not raw sessions.
    e.g. { name: 'Desktop', value: 68 }  → 68% of total sessions

  countries[].value:
    Must be a PERCENTAGE (0–100), not raw sessions.
    e.g. { name: 'India', value: 72 }    → 72% of total sessions

  aeoSources[].value:
    Raw session count is fine here (used only for chart proportions).

  CORS headers required from n8n:
    Access-Control-Allow-Origin: *
    Access-Control-Allow-Headers: Content-Type
    Access-Control-Allow-Methods: POST, OPTIONS

  Full expected shape is documented below in DEMO_REPORT_DATA.
  ============================================================
*/

const DEFAULT_KPIS = {
  totalSessions:   { value: 24816, change: 12.4,  suffix: '',  changeSuffix: '%' },
  organicSessions: { value: 18620, change: 9.7,   suffix: '',  changeSuffix: '%' },
  gscClicks:       { value: 9340,  change: 8.1,   suffix: '',  changeSuffix: '%' },
  gscImpressions:  { value: 163400,change: 11.6,  suffix: '',  changeSuffix: '%' },
  avgCtr:          { value: 5.7,   change: 0.4,   suffix: '%', changeSuffix: ' pp' },
  avgPosition:     { value: 14.2,  change: -2.3,  suffix: '',  changeSuffix: ' pos', betterWhenDown: true },
  engagementRate:  { value: 61.2,  change: 4.8,   suffix: '%', changeSuffix: ' pp' },
  conversions:     { value: 186,   change: 14.9,  suffix: '',  changeSuffix: '%' }
};

const DEMO_REPORT_DATA = {
  ok: true,
  meta: {
    projectId:   'repute',
    projectName: 'Repute',
    from:        '2026-05-01',
    to:          '2026-05-31',
    monthLabel:  'May 2026',
    sourceLabel: 'GA4 · GSC · AEO Signals'
  },
  kpis: { ...DEFAULT_KPIS },
  sessionsOverTime: {
    labels:   ['May 1','May 5','May 10','May 15','May 20','May 25','May 31'],
    current:  [2840, 3120, 2980, 3450, 3280, 3780, 3540],
    previous: [2200, 2650, 2410, 2900, 2760, 3100, 2940]
  },
  // deviceSplit: values are PERCENTAGES (sum should equal ~100)
  deviceSplit: [
    { name: 'Desktop', value: 68 },
    { name: 'Mobile',  value: 26 },
    { name: 'Tablet',  value: 6 }
  ],
  trafficByChannel: [
    { name: 'Organic Search', value: 12400 },
    { name: 'Direct',         value: 5600 },
    { name: 'Referral',       value: 3100 },
    { name: 'Paid Search',    value: 1800 },
    { name: 'Social',         value: 1200 },
    { name: 'Email',          value: 716 }
  ],
  gscTrend: {
    labels:      ['May 1','May 5','May 10','May 15','May 20','May 25','May 31'],
    impressions: [18400, 21200, 19800, 23400, 22100, 25600, 24200],
    clicks:      [1040,  1280,  1120,  1440,  1320,  1580,  1460]
  },
  // gscKeywords: ctr is a PERCENTAGE (e.g. 5.12 means 5.12%)
  // n8n must multiply GSC API decimal ratio by 100 before sending
  gscKeywords: [
    { query: 'seo agency india',             clicks: 420, impressions: 8200, ctr: 5.12, position: 3.4 },
    { query: 'digital marketing coimbatore', clicks: 290, impressions: 5900, ctr: 4.92, position: 4.1 },
    { query: 'seo reporting automation',     clicks: 185, impressions: 4400, ctr: 4.20, position: 5.7 },
    { query: 'ai seo tools 2026',            clicks: 130, impressions: 6100, ctr: 2.13, position: 9.2 },
    { query: 'rank tracking software',       clicks: 98,  impressions: 3800, ctr: 2.58, position: 7.8 }
  ],
  // aeoSources: value is raw session count (used for doughnut proportions)
  aeoSources: [
    { name: 'chatgpt.com',           value: 38 },
    { name: 'perplexity.ai',         value: 22 },
    { name: 'gemini.google.com',     value: 14 },
    { name: 'claude.ai',             value: 9 },
    { name: 'copilot.microsoft.com', value: 5 }
  ],
  aeoLandingPages: [
    { sourceMedium: 'chatgpt.com / referral',      landingPage: '/services/seo',     sessions: 16, engagedSessions: 13, engagementRate: 81.25, avgEngagementTime: '2m 14s' },
    { sourceMedium: 'perplexity.ai / referral',    landingPage: '/blog/seo-auto',    sessions: 12, engagedSessions: 9,  engagementRate: 75.00, avgEngagementTime: '1m 52s' },
    { sourceMedium: 'gemini.google.com / referral',landingPage: '/contact/',          sessions: 8,  engagedSessions: 6,  engagementRate: 75.00, avgEngagementTime: '0m 58s' },
    { sourceMedium: 'claude.ai / referral',        landingPage: '/blog/ai-overview', sessions: 5,  engagedSessions: 4,  engagementRate: 80.00, avgEngagementTime: '3m 02s' }
  ],
  // countries: values are PERCENTAGES (sum should equal ~100)
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
        projectId: params.projectId,
        month:     params.month,
        from:      params.from,
        to:        params.to
      })
    });

    if (!response.ok) throw new Error(`n8n returned ${response.status}`);

    const liveData = await response.json();
    return normalizeReportData(liveData, params);
  } catch (error) {
    console.warn('Report fetch failed:', error);
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
    meta:             { ...fallback.meta,             ...(incoming.meta || {}) },
    sessionsOverTime: { ...fallback.sessionsOverTime, ...(incoming.sessionsOverTime || {}) },
    gscTrend:         { ...fallback.gscTrend,         ...(incoming.gscTrend || {}) },
    deviceSplit:      Array.isArray(incoming.deviceSplit)      ? incoming.deviceSplit      : fallback.deviceSplit,
    trafficByChannel: Array.isArray(incoming.trafficByChannel) ? incoming.trafficByChannel : fallback.trafficByChannel,
    gscKeywords:      Array.isArray(incoming.gscKeywords)      ? incoming.gscKeywords      : fallback.gscKeywords,
    aeoSources:       Array.isArray(incoming.aeoSources)       ? incoming.aeoSources       : fallback.aeoSources,
    aeoLandingPages:  Array.isArray(incoming.aeoLandingPages)  ? incoming.aeoLandingPages  : fallback.aeoLandingPages,
    countries:        Array.isArray(incoming.countries)        ? incoming.countries        : fallback.countries,
    warnings:         Array.isArray(incoming.warnings)         ? incoming.warnings         : []
  };

  if (params.projectId) {
    data.meta.projectId   = params.projectId;
    data.meta.projectName = getProjectName(params.projectId);
  }
  if (params.from)  data.meta.from  = params.from;
  if (params.to)    data.meta.to    = params.to;
  if (params.month) data.meta.month = params.month;

  data.meta.monthLabel  = data.meta.monthLabel  || formatMonthLabel(params.month || data.meta.from);
  data.meta.sourceLabel = data.meta.sourceLabel || 'GA4 · GSC · AEO Signals';

  data.kpis = mergeKpis(DEFAULT_KPIS, incoming.kpis || {});

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

function getProjectName(projectId) {
  const names = {
    'repute':           'Repute',
    'acme-corp':        'Acme Corp',
    'techbrand-india':  'TechBrand India',
    'startupx':         'StartupX',
    'local-seo-client': 'Local SEO Client'
  };
  return names[projectId] || projectId;
}

function formatMonthLabel(value) {
  if (!value) return 'May 2026';
  const parts = value.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
