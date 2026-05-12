const REPORT_CONFIG = {
  /*
    Add your n8n webhook later.

    Example:
    n8nWebhookUrl: 'https://balsgowtham-n8n.hf.space/webhook/seo-report'
  */
  n8nWebhookUrl: 'https://balsgowtham-n8n.hf.space/webhook/seo-report'
};

const DEFAULT_KPIS = {
  totalSessions: {
    value: 24816,
    change: 12.4,
    suffix: '',
    changeSuffix: '%'
  },
  organicSessions: {
    value: 18620,
    change: 9.7,
    suffix: '',
    changeSuffix: '%'
  },
  gscClicks: {
    value: 9340,
    change: 8.1,
    suffix: '',
    changeSuffix: '%'
  },
  gscImpressions: {
    value: 163400,
    change: 11.6,
    suffix: '',
    changeSuffix: '%'
  },
  avgCtr: {
    value: 5.7,
    change: 0.4,
    suffix: '%',
    changeSuffix: ' pp'
  },
  avgPosition: {
    value: 14.2,
    change: -2.3,
    suffix: '',
    changeSuffix: ' pos',
    betterWhenDown: true
  },
  bounceRate: {
    value: 34.7,
    change: -5.2,
    suffix: '%',
    changeSuffix: ' pp',
    betterWhenDown: true
  },
  conversions: {
    value: 186,
    change: 14.9,
    suffix: '',
    changeSuffix: '%'
  }
};

const DEMO_REPORT_DATA = {
  meta: {
    clientId: 'acme-corp',
    clientName: 'Acme Corp',
    from: '2026-05-01',
    to: '2026-05-08',
    monthLabel: 'May 2026',
    sourceLabel: 'GA4 · GSC · DataForSEO'
  },
  kpis: { ...DEFAULT_KPIS },
  sessionsOverTime: {
    labels: ['May 1', 'May 2', 'May 3', 'May 4', 'May 5', 'May 6', 'May 7', 'May 8'],
    current: [2840, 3120, 2980, 3450, 3280, 3780, 3540, 2828],
    previous: [2200, 2650, 2410, 2900, 2760, 3100, 2940, 2500]
  },
  deviceSplit: [
    { name: 'Desktop', icon: '🖥', value: 68 },
    { name: 'Mobile', icon: '📱', value: 26 },
    { name: 'Tablet', icon: '📟', value: 6 }
  ],
  rankTracker: [
    { position: 1, keyword: 'seo agency india', url: '/services/seo', change: 3, volume: '8.2k' },
    { position: 3, keyword: 'digital marketing coimbatore', url: '/locations/cbtr', change: 1, volume: '2.9k' },
    { position: 5, keyword: 'seo reporting automation', url: '/blog/seo-auto', change: 0, volume: '1.6k' },
    { position: 7, keyword: 'best seo tools 2026', url: '/blog/seo-tools', change: -2, volume: '12.4k' },
    { position: 9, keyword: 'google search console tips', url: '/blog/gsc-tips', change: 4, volume: '5.1k' },
    { position: 14, keyword: 'n8n seo automation', url: '/blog/n8n-seo', change: 7, volume: '880' }
  ],
  trafficByChannel: [
    { name: 'Organic', value: 12400 },
    { name: 'Direct', value: 5600 },
    { name: 'Referral', value: 3100 },
    { name: 'Paid', value: 1800 },
    { name: 'Social', value: 1200 },
    { name: 'Email', value: 716 }
  ],
  gscTrend: {
    labels: ['May 1', 'May 2', 'May 3', 'May 4', 'May 5', 'May 6', 'May 7', 'May 8'],
    impressions: [18400, 21200, 19800, 23400, 22100, 25600, 24200, 20000],
    clicks: [1040, 1280, 1120, 1440, 1320, 1580, 1460, 1100]
  },
  serpFeatures: [
    { name: 'Featured Snippet', value: 24 },
    { name: 'AI Overview', value: 18 },
    { name: 'People Also Ask', value: 32 },
    { name: 'Local Pack', value: 12 },
    { name: 'Video', value: 8 },
    { name: 'Knowledge', value: 6 }
  ],
  countries: [
    { name: 'India', icon: '🇮🇳', value: 72 },
    { name: 'USA', icon: '🇺🇸', value: 14 },
    { name: 'UK', icon: '🇬🇧', value: 7 },
    { name: 'Australia', icon: '🇦🇺', value: 4 },
    { name: 'Singapore', icon: '🇸🇬', value: 3 }
  ]
};

async function fetchReportData(params) {
  const url = REPORT_CONFIG.n8nWebhookUrl;

  if (!url) {
    return getDemoData(params);
  }

  const requestUrl = new URL(url);
  requestUrl.searchParams.set('client', params.clientId);
  requestUrl.searchParams.set('from', params.from);
  requestUrl.searchParams.set('to', params.to);

  try {
    const response = await fetch(requestUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}`);
    }

    const liveData = await response.json();
    return normalizeReportData(liveData, params);
  } catch (error) {
    console.warn('Using demo data because report fetch failed:', error);
    return getDemoData(params);
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
    meta: {
      ...fallback.meta,
      ...(incoming.meta || {})
    },
    kpis: {
      ...fallback.kpis,
      ...(incoming.kpis || {})
    },
    sessionsOverTime: {
      ...fallback.sessionsOverTime,
      ...(incoming.sessionsOverTime || {})
    },
    gscTrend: {
      ...fallback.gscTrend,
      ...(incoming.gscTrend || {})
    },
    deviceSplit: Array.isArray(incoming.deviceSplit) ? incoming.deviceSplit : fallback.deviceSplit,
    rankTracker: Array.isArray(incoming.rankTracker) ? incoming.rankTracker : fallback.rankTracker,
    trafficByChannel: Array.isArray(incoming.trafficByChannel) ? incoming.trafficByChannel : fallback.trafficByChannel,
    serpFeatures: Array.isArray(incoming.serpFeatures) ? incoming.serpFeatures : fallback.serpFeatures,
    countries: Array.isArray(incoming.countries) ? incoming.countries : fallback.countries
  };

  if (params.clientId) {
    data.meta.clientId = params.clientId;
    data.meta.clientName = getClientName(params.clientId);
  }

  if (params.from) {
    data.meta.from = params.from;
  }

  if (params.to) {
    data.meta.to = params.to;
  }

  data.meta.monthLabel = formatMonthFromDate(data.meta.from);
  data.meta.sourceLabel = data.meta.sourceLabel || 'GA4 · GSC · DataForSEO';

  data.kpis = {
    ...DEFAULT_KPIS,
    ...data.kpis
  };

  return data;
}

function getClientName(clientId) {
  const names = {
    'acme-corp': 'Acme Corp',
    'techbrand-india': 'TechBrand India',
    startupx: 'StartupX',
    'local-seo-client': 'Local SEO Client',
    repute: 'Repute'
  };

  return names[clientId] || clientId;
}

function formatMonthFromDate(value) {
  if (!value) return 'May 2026';

  const date = new Date(value + 'T00:00:00');

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}
