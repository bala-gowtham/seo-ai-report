const REPORT_CONFIG = {
  /*
    Add your n8n webhook later.

    Example:
    n8nWebhookUrl: 'https://balsgowtham-n8n.hf.space/webhook/seo-report'
  */
  n8nWebhookUrl: 'https://balsgowtham-n8n.hf.space/webhook/seo-report'
};

const DEMO_REPORT_DATA = {
  meta: {
    clientId: 'acme-corp',
    clientName: 'Acme Corp',
    from: '2026-05-01',
    to: '2026-05-08',
    monthLabel: 'May 2026',
    sourceLabel: 'Powered by DataForSEO'
  },
  kpis: {
    organicSessions: { value: 24816, change: 12.4, suffix: '', changeSuffix: '%' },
    gscClicks: { value: 9340, change: 8.1, suffix: '', changeSuffix: '%' },
    avgPosition: { value: 14.2, change: 2.3, suffix: '', changeSuffix: ' pos' },
    bounceRate: { value: 34.7, change: -5.2, suffix: '%', changeSuffix: '%' }
  },
  sessionsOverTime: {
    labels: ['May 1','May 2','May 3','May 4','May 5','May 6','May 7','May 8'],
    current: [2840,3120,2980,3450,3280,3780,3540,2828],
    previous: [2200,2650,2410,2900,2760,3100,2940,2500]
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
    labels: ['May 1','May 2','May 3','May 4','May 5','May 6','May 7','May 8'],
    impressions: [18400,21200,19800,23400,22100,25600,24200,20000],
    clicks: [1040,1280,1120,1440,1320,1580,1460,1100]
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
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Using demo data because report fetch failed:', error);
    return getDemoData(params);
  }
}

function getDemoData(params) {
  const data = JSON.parse(JSON.stringify(DEMO_REPORT_DATA));

  const clientName = getClientName(params.clientId);
  data.meta.clientId = params.clientId;
  data.meta.clientName = clientName;
  data.meta.from = params.from;
  data.meta.to = params.to;
  data.meta.monthLabel = formatMonthFromDate(params.from);

  return data;
}

function getClientName(clientId) {
  const names = {
    'acme-corp': 'Acme Corp',
    'techbrand-india': 'TechBrand India',
    'startupx': 'StartupX',
    'local-seo-client': 'Local SEO Client',
    'repute': 'Repute'
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
