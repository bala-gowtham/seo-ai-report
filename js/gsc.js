// ═══════════════════════════════════════════════════════════
// Google Search Console view
// ═══════════════════════════════════════════════════════════

const GSC_QUERY_DATASETS = {
  queries: 'Top queries',
  queryWinners: 'Click winners',
  queryLosers: 'Click declines',
  rankingGainers: 'Ranking gainers',
  rankingLosers: 'Ranking declines',
  ctrGainers: 'CTR gainers',
  ctrLosers: 'CTR declines'
};

const GSC_PAGE_DATASETS = {
  pages: 'Top pages',
  pageWinners: 'Page winners',
  pageLosers: 'Page declines'
};

const gscViewState = {
  queryDataset: 'queries',
  pageDataset: 'pages',
  querySearch: '',
  pageSearch: '',
  pageQuerySearch: '',
  queryPage: 1,
  pagePage: 1,
  pageQueryPage: 1,
  pageSize: 10,
  trendMetric: 'clicks',
  initialized: false
};

let gscTrendChart = null;
let gscPositionChart = null;

function getGscDemoReport(filters = {}) {
  const rows = [
    { query:'seo reporting dashboard', clicks:132, prevClicks:104, clicksChange:26.9, impressions:5400, prevImpressions:4800, impressionsChange:12.5, ctr:2.44, prevCtr:2.17, ctrChange:0.27, position:4.3, prevPosition:5.1, positionChange:0.8, status:'growing', opportunityScore:210 },
    { query:'google search console reporting', clicks:88, prevClicks:96, clicksChange:-8.3, impressions:6100, prevImpressions:5700, impressionsChange:7, ctr:1.44, prevCtr:1.68, ctrChange:-0.24, position:7.8, prevPosition:6.9, positionChange:-0.9, status:'declining', opportunityScore:340 },
    { query:'seo automation', clicks:64, prevClicks:41, clicksChange:56.1, impressions:8200, prevImpressions:7100, impressionsChange:15.5, ctr:0.78, prevCtr:0.58, ctrChange:0.2, position:8.9, prevPosition:10.2, positionChange:1.3, status:'growing', opportunityScore:520 }
  ];
  const pages = rows.map((row, index) => ({ ...row, page: index ? `/blog/demo-${index}/` : '/' }));
  const meta = {
    projectId:'demo', projectName:'Demo Data', from:filters.from, to:filters.to,
    prevFrom:filters.from, prevTo:filters.to, comparisonMode:'previous_equal_length_period',
    dateRangeLabel:formatDateRangeLabel(filters.from, filters.to), sourceLabel:'Google Search Console'
  };
  return {
    ok:true, view:'gsc', partial:false, meta,
    kpis:{
      gscClicks:{value:2840,prev:2530,change:12.3,suffix:'',changeSuffix:'%'},
      gscImpressions:{value:184000,prev:171000,change:7.6,suffix:'',changeSuffix:'%'},
      avgCtr:{value:1.54,prev:1.48,change:0.06,suffix:'%',changeSuffix:' pp'},
      avgPosition:{value:7.2,prev:7.8,change:0.6,suffix:'',changeSuffix:' positions',positiveMeans:'improvement'},
      keywordsTop3:{value:86,prev:78,change:10.3,suffix:'',changeSuffix:'%'},
      keywordsTop10:{value:312,prev:287,change:8.7,suffix:'',changeSuffix:'%'},
      keywordsTop20:{value:620,prev:590,change:5.1,suffix:'',changeSuffix:'%'},
      opportunityCount:{value:48,prev:45,change:6.7,suffix:'',changeSuffix:'%'}
    },
    gsc:{
      meta,
      trend:{
        labels:['2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05','2026-06-06','2026-06-07'],
        clicks:[370,402,388,416,438,401,425], prevClicks:[340,360,351,372,390,348,369],
        impressions:[25000,26100,25400,26800,27600,26300,26800], prevImpressions:[23800,24200,24000,24700,25100,24400,24800],
        ctr:[1.48,1.54,1.53,1.55,1.59,1.52,1.59], prevCtr:[1.43,1.49,1.46,1.51,1.55,1.43,1.49],
        position:[7.5,7.3,7.2,7.1,6.9,7.2,7], prevPosition:[8,7.9,7.8,7.7,7.6,7.9,7.8]
      },
      queries:rows, queryWinners:rows.filter(r=>r.clicksChange>0), queryLosers:rows.filter(r=>r.clicksChange<0),
      rankingGainers:rows.filter(r=>r.positionChange>0), rankingLosers:rows.filter(r=>r.positionChange<0),
      ctrGainers:rows.filter(r=>r.ctrChange>0), ctrLosers:rows.filter(r=>r.ctrChange<0),
      pages, pageWinners:pages.filter(r=>r.clicksChange>0), pageLosers:pages.filter(r=>r.clicksChange<0),
      opportunities:rows.slice().sort((a,b)=>b.opportunityScore-a.opportunityScore),
      devices:[
        {name:'Mobile',clicks:1780,prevClicks:1540,clicksChange:15.6,impressions:118000,ctr:1.51,position:7.6,status:'growing'},
        {name:'Desktop',clicks:1010,prevClicks:950,clicksChange:6.3,impressions:62000,ctr:1.63,position:6.4,status:'stable'},
        {name:'Tablet',clicks:50,prevClicks:40,clicksChange:25,impressions:4000,ctr:1.25,position:8.1,status:'growing'}
      ],
      countries:[
        {name:'ind',clicks:2100,prevClicks:1900,clicksChange:10.5,impressions:132000,ctr:1.59,position:7.1,status:'growing'},
        {name:'usa',clicks:320,prevClicks:280,clicksChange:14.3,impressions:24000,ctr:1.33,position:8.4,status:'growing'},
        {name:'gbr',clicks:140,prevClicks:132,clicksChange:6.1,impressions:9800,ctr:1.43,position:7.9,status:'stable'}
      ],
      positionBuckets:[
        {label:'Positions 1–3',current:86,previous:78,change:10.3},
        {label:'Positions 4–10',current:226,previous:209,change:8.1},
        {label:'Positions 11–20',current:308,previous:303,change:1.7},
        {label:'Positions 21–50',current:510,previous:496,change:2.8},
        {label:'Positions 51+',current:290,previous:310,change:-6.5}
      ],
      pageQueries:pages.map((p,i)=>({page:p.page,query:rows[i].query,...rows[i]})),
      searchAppearance:[],
      warnings:[],
      dataQuality:{partial:false,limitHits:[],failedRequests:[]},
      cacheCoverage:{isCompact:true,detailLoadingStrategy:'on_demand',storedCounts:{queries:rows.length,pages:pages.length}}
    },
    warnings:[]
  };
}

function initGscView() {
  if (gscViewState.initialized) return;
  gscViewState.initialized = true;

  document.getElementById('gscQueryTabs')?.addEventListener('click', event => {
    const button = event.target.closest('[data-gsc-query-dataset]');
    if (!button) return;
    gscViewState.queryDataset = button.dataset.gscQueryDataset;
    gscViewState.queryPage = 1;
    renderGscQueryTable(currentGscReport);
    updateGscActiveTabs();
  });

  document.getElementById('gscPageTabs')?.addEventListener('click', event => {
    const button = event.target.closest('[data-gsc-page-dataset]');
    if (!button) return;
    gscViewState.pageDataset = button.dataset.gscPageDataset;
    gscViewState.pagePage = 1;
    renderGscPageTable(currentGscReport);
    updateGscActiveTabs();
  });

  document.getElementById('gscMetricTabs')?.addEventListener('click', event => {
    const button = event.target.closest('[data-gsc-metric]');
    if (!button) return;
    gscViewState.trendMetric = button.dataset.gscMetric;
    updateGscActiveTabs();
    renderGscTrendChart(currentGscReport);
  });

  bindGscSearch('gscQuerySearch', 'querySearch', () => {
    gscViewState.queryPage = 1;
    renderGscQueryTable(currentGscReport);
  });
  bindGscSearch('gscPageSearch', 'pageSearch', () => {
    gscViewState.pagePage = 1;
    renderGscPageTable(currentGscReport);
  });
  bindGscSearch('gscPageQuerySearch', 'pageQuerySearch', () => {
    gscViewState.pageQueryPage = 1;
    renderGscPageQueryTable(currentGscReport);
  });

  bindGscPager('gscQueryPrev','gscQueryNext','queryPage',()=>renderGscQueryTable(currentGscReport));
  bindGscPager('gscPagePrev','gscPageNext','pagePage',()=>renderGscPageTable(currentGscReport));
  bindGscPager('gscPageQueryPrev','gscPageQueryNext','pageQueryPage',()=>renderGscPageQueryTable(currentGscReport));
}

function bindGscSearch(id, stateKey, callback) {
  document.getElementById(id)?.addEventListener('input', event => {
    gscViewState[stateKey] = event.target.value.trim().toLowerCase();
    callback();
  });
}

function bindGscPager(prevId, nextId, stateKey, callback) {
  document.getElementById(prevId)?.addEventListener('click', () => {
    gscViewState[stateKey] = Math.max(1, gscViewState[stateKey] - 1);
    callback();
  });
  document.getElementById(nextId)?.addEventListener('click', () => {
    gscViewState[stateKey] += 1;
    callback();
  });
}

function updateGscActiveTabs() {
  document.querySelectorAll('[data-gsc-query-dataset]').forEach(button => {
    button.classList.toggle('active', button.dataset.gscQueryDataset === gscViewState.queryDataset);
  });
  document.querySelectorAll('[data-gsc-page-dataset]').forEach(button => {
    button.classList.toggle('active', button.dataset.gscPageDataset === gscViewState.pageDataset);
  });
  document.querySelectorAll('[data-gsc-metric]').forEach(button => {
    button.classList.toggle('active', button.dataset.gscMetric === gscViewState.trendMetric);
  });
}

function renderGscTab(report) {
  if (!report) return;
  const gsc = report.gsc || {};
  renderGscMeta(report);
  renderGscKpis(report.kpis || gsc.kpis || {});
  renderGscQualityNotice(report);
  renderGscTrendChart(report);
  renderGscPositionChart(gsc.positionBuckets || []);
  renderGscOpportunityTable(gsc.opportunities || gsc.opportunityQueries || []);
  renderGscQueryTable(report);
  renderGscPageTable(report);
  renderGscBreakdowns(report);
  renderGscPageQueryTable(report);
  renderGscWarnings(report);
  updateGscActiveTabs();
  syncExportControls(report);

  const dateEl = document.getElementById('gscFooterDate');
  if (dateEl) dateEl.textContent = `Generated on ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`;
}

function renderGscMeta(report) {
  const meta = report.meta || {};
  const subtitle = document.getElementById('reportSubtitle');
  if (subtitle) subtitle.textContent = `${meta.projectName || 'Selected project'} · ${meta.dateRangeLabel || formatDateRangeLabel(meta.from,meta.to)} · Google Search Console`;
}

function renderGscKpis(kpis) {
  const defs = [
    ['gscClicks','Search Clicks','#22c55e'],
    ['gscImpressions','Impressions','#3b82f6'],
    ['avgCtr','Average CTR','#14b8a6'],
    ['avgPosition','Average Position','#f59e0b'],
    ['keywordsTop3','Keywords Top 3','#8b5cf6'],
    ['keywordsTop10','Keywords Top 10','#ff6b35'],
    ['keywordsTop20','Keywords Top 20','#ec4899'],
    ['opportunityCount','Opportunities','#ef4444']
  ];
  const wrap = document.getElementById('gscKpiStrip');
  if (!wrap) return;
  wrap.innerHTML = defs.map(([key,label,color]) => {
    const data = kpis[key] || {value:0,change:0,suffix:'',changeSuffix:'%'};
    const change = Number(data.change || 0);
    const better = key === 'avgPosition' ? change >= 0 : change >= 0;
    const sign = change > 0 ? '+' : '';
    const value = Number(data.value || 0);
    const shown = `${Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)}${data.suffix || ''}`;
    return `<div class="kpi-card" style="--card-color:${color}">
      <div class="kpi-glow"></div><div class="kpi-top"><div class="kpi-label">${label}</div><div class="kpi-dot"></div></div>
      <div class="kpi-value" style="font-size:25px">${shown}</div>
      <div class="kpi-change ${better?'up':'down'}">${sign}${Number.isInteger(change)?change:change.toFixed(2)}${data.changeSuffix || '%'} vs prev period</div>
    </div>`;
  }).join('');
}

function renderGscQualityNotice(report) {
  const el = document.getElementById('gscQualityNotice');
  if (!el) return;
  const gsc = report.gsc || {};
  const quality = gsc.dataQuality || {};
  const coverage = gsc.cacheCoverage || {};
  const limitHits = Array.isArray(quality.limitHits) ? quality.limitHits : [];
  const failed = Array.isArray(quality.failedRequests) ? quality.failedRequests : [];
  const notes = [];

  if (report.partial || quality.partial) notes.push('Detailed query tables use compact cached coverage. Overall KPI totals remain available.');
  if (limitHits.length) notes.push(`${limitHits.length} source request${limitHits.length===1?'':'s'} reached the configured row limit.`);
  if (coverage.detailLoadingStrategy === 'on_demand') notes.push('More detailed rows can be added later with on-demand loading.');
  if (failed.length) notes.push(`${failed.length} upstream request${failed.length===1?'':'s'} failed.`);

  el.style.display = notes.length ? 'flex' : 'none';
  el.classList.toggle('data-notice-danger', failed.length > 0);
  const text = el.querySelector('[data-notice-text]');
  if (text) text.textContent = notes.join(' ');
}

function gscMetricConfig(metric) {
  const configs = {
    clicks:{label:'Clicks',current:'clicks',previous:'prevClicks',color:'#22c55e',format:v=>Number(v).toLocaleString(),reverse:false},
    impressions:{label:'Impressions',current:'impressions',previous:'prevImpressions',color:'#3b82f6',format:v=>fmtShort(Number(v)||0),reverse:false},
    ctr:{label:'CTR',current:'ctr',previous:'prevCtr',color:'#14b8a6',format:v=>`${Number(v).toFixed(2)}%`,reverse:false},
    position:{label:'Average position',current:'position',previous:'prevPosition',color:'#f59e0b',format:v=>Number(v).toFixed(2),reverse:true}
  };
  return configs[metric] || configs.clicks;
}

function renderGscTrendChart(report) {
  const canvas = document.getElementById('gscTrendChart');
  if (!canvas || !window.Chart) return;
  const trend = report?.gsc?.trend || {};
  const config = gscMetricConfig(gscViewState.trendMetric);
  const labels = (trend.labels || []).map(gscShortDate);
  if (gscTrendChart) gscTrendChart.destroy();

  gscTrendChart = new Chart(canvas, {
    type:'line',
    data:{labels,datasets:[
      {label:`Current ${config.label}`,data:trend[config.current]||[],borderColor:config.color,backgroundColor:`${config.color}22`,fill:true,tension:.3,borderWidth:2.5,pointRadius:3},
      {label:`Previous ${config.label}`,data:trend[config.previous]||[],borderColor:'#94a3b8',backgroundColor:'transparent',fill:false,tension:.3,borderWidth:1.5,borderDash:[5,4],pointRadius:2}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',align:'end'},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${config.format(ctx.raw)}`}}},scales:{x:{grid:{color:'rgba(0,0,0,.04)'}},y:{reverse:config.reverse,grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:config.format}}}}
  });
}

function renderGscPositionChart(rows) {
  const canvas = document.getElementById('gscPositionChart');
  if (!canvas || !window.Chart) return;
  if (gscPositionChart) gscPositionChart.destroy();
  gscPositionChart = new Chart(canvas, {
    type:'bar',
    data:{labels:rows.map(r=>r.label),datasets:[
      {label:'Current',data:rows.map(r=>Number(r.current||0)),backgroundColor:'rgba(139,92,246,.75)',borderRadius:5},
      {label:'Previous',data:rows.map(r=>Number(r.previous||0)),backgroundColor:'rgba(148,163,184,.35)',borderRadius:5}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',align:'end'}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:v=>fmtShort(v)}}}}
  });
}

function renderGscOpportunityTable(rows) {
  const tbody = document.getElementById('gscOpportunityTableBody');
  if (!tbody) return;
  const items = (rows || []).slice(0,15);
  tbody.innerHTML = items.length ? items.map((r,i)=>`<tr>
    <td class="row-num">${i+1}</td><td class="primary-cell table-text-wrap">${escHtml(r.query||r.name||'')}</td>
    <td class="num-cell"><strong>${formatValue(r.opportunityScore)}</strong></td>
    <td class="num-cell">${formatInt(r.impressions)}</td><td class="num-cell">${formatInt(r.clicks)}</td>
    <td class="num-cell">${Number(r.ctr||0).toFixed(2)}%</td><td class="num-cell">${Number(r.position||0).toFixed(2)}</td>
    <td class="num-cell">${gscDeltaBadge(r.positionChange,true)}</td><td>${gscStatusBadge(r.status)}</td>
  </tr>`).join('') : gscEmptyRow(9,'No search opportunities available.');
}

function renderGscQueryTable(report) {
  const gsc = report?.gsc || {};
  const rows = Array.isArray(gsc[gscViewState.queryDataset]) ? gsc[gscViewState.queryDataset] : [];
  const filtered = rows.filter(r=>String(r.query||r.name||'').toLowerCase().includes(gscViewState.querySearch));
  renderGscEntityRows('gscQueryTableBody',filtered,'query',gscViewState.queryPage,'gscQueryPager','queryPage');
}

function renderGscPageTable(report) {
  const gsc = report?.gsc || {};
  const rows = Array.isArray(gsc[gscViewState.pageDataset]) ? gsc[gscViewState.pageDataset] : [];
  const filtered = rows.filter(r=>String(r.page||r.name||'').toLowerCase().includes(gscViewState.pageSearch));
  renderGscEntityRows('gscPageTableBody',filtered,'page',gscViewState.pagePage,'gscPagePager','pagePage');
}

function renderGscEntityRows(tbodyId, rows, type, requestedPage, pagerId, stateKey) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const totalPages = Math.max(1,Math.ceil(rows.length/gscViewState.pageSize));
  const page = Math.min(requestedPage,totalPages);
  gscViewState[stateKey] = page;
  const start = (page-1)*gscViewState.pageSize;
  const items = rows.slice(start,start+gscViewState.pageSize);

  tbody.innerHTML = items.length ? items.map((r,i)=>{
    const label = type === 'page' ? (r.page||r.name||'') : (r.query||r.name||'');
    const labelHtml = type === 'page' ? gscPageLink(label) : escHtml(label);
    return `<tr><td class="row-num">${start+i+1}</td><td class="primary-cell table-text-wrap">${labelHtml}</td>
      <td class="num-cell">${formatInt(r.clicks)}</td><td class="num-cell">${formatInt(r.prevClicks)}</td>
      <td class="num-cell">${gscDeltaBadge(r.clicksChange,false)}</td><td class="num-cell">${formatInt(r.impressions)}</td>
      <td class="num-cell">${Number(r.ctr||0).toFixed(2)}%</td><td class="num-cell"><span class="pos-badge ${gscPositionClass(r.position)}">${Number(r.position||0).toFixed(2)}</span></td>
      <td class="num-cell">${gscDeltaBadge(r.positionChange,true)}</td><td>${gscStatusBadge(r.status)}</td></tr>`;
  }).join('') : gscEmptyRow(10,`No ${type} data matches this search.`);

  updateGscPager(pagerId,page,totalPages,rows.length);
}

function renderGscBreakdowns(report) {
  const gsc = report?.gsc || {};
  renderGscCompactTable('gscDeviceTableBody',gsc.devices||[],'device');
  renderGscCompactTable('gscCountryTableBody',gsc.countries||[],'country');
  const appearance = document.getElementById('gscAppearanceSummary');
  if (appearance) {
    const rows = gsc.searchAppearance || [];
    appearance.innerHTML = rows.length ? rows.map(r=>`<div class="metric-summary-row"><span>${escHtml(r.name||r.searchAppearance||'Unknown')}</span><strong>${formatInt(r.clicks)} clicks</strong></div>`).join('') : '<div class="empty-inline">No search appearance split returned.</div>';
  }
}

function renderGscCompactTable(tbodyId, rows, type) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const items = (rows||[]).slice(0,type==='country'?12:10);
  tbody.innerHTML = items.length ? items.map((r,i)=>{
    const raw = r.name || r[type] || 'Unknown';
    const label = type === 'country' ? gscCountryName(raw) : String(raw).replace(/^./,m=>m.toUpperCase());
    return `<tr><td class="row-num">${i+1}</td><td class="primary-cell">${escHtml(label)}</td><td class="num-cell">${formatInt(r.clicks)}</td><td class="num-cell">${formatInt(r.impressions)}</td><td class="num-cell">${Number(r.ctr||0).toFixed(2)}%</td><td class="num-cell">${Number(r.position||0).toFixed(2)}</td><td>${gscStatusBadge(r.status)}</td></tr>`;
  }).join('') : gscEmptyRow(7,`No ${type} data available.`);
}

function renderGscPageQueryTable(report) {
  const rows = report?.gsc?.pageQueries || [];
  const search = gscViewState.pageQuerySearch;
  const filtered = rows.filter(r=>`${r.page||''} ${r.query||''}`.toLowerCase().includes(search));
  const totalPages = Math.max(1,Math.ceil(filtered.length/gscViewState.pageSize));
  const page = Math.min(gscViewState.pageQueryPage,totalPages);
  gscViewState.pageQueryPage = page;
  const start=(page-1)*gscViewState.pageSize;
  const items=filtered.slice(start,start+gscViewState.pageSize);
  const tbody=document.getElementById('gscPageQueryTableBody');
  if (!tbody) return;
  tbody.innerHTML=items.length?items.map((r,i)=>`<tr><td class="row-num">${start+i+1}</td><td class="url-cell table-text-wrap">${gscPageLink(r.page)}</td><td class="primary-cell table-text-wrap">${escHtml(r.query||'')}</td><td class="num-cell">${formatInt(r.clicks)}</td><td class="num-cell">${formatInt(r.impressions)}</td><td class="num-cell">${Number(r.ctr||0).toFixed(2)}%</td><td class="num-cell">${Number(r.position||0).toFixed(2)}</td><td>${gscStatusBadge(r.status)}</td></tr>`).join(''):gscEmptyRow(8,'No page-query rows match this search.');
  updateGscPager('gscPageQueryPager',page,totalPages,filtered.length);
}

function renderGscWarnings(report) {
  const wrap=document.getElementById('gscWarnings');
  if (!wrap) return;
  const warnings=[...(report.warnings||[]),...(report.gsc?.warnings||[])].filter((v,i,a)=>v&&a.indexOf(v)===i);
  if (!warnings.length){wrap.style.display='none';return;}
  wrap.style.display='block';
  wrap.innerHTML=`<div class="section-header"><div class="section-header-left"><span class="section-label">Data notes</span></div><span class="section-desc">Coverage and collection notes · GSC</span></div><div class="notice-stack">${warnings.map(w=>`<div class="data-note">${escHtml(w)}</div>`).join('')}</div>`;
}

function updateGscPager(id,page,totalPages,totalRows) {
  const el=document.getElementById(id);
  if (!el) return;
  const status=el.querySelector('[data-page-status]');
  const prev=el.querySelector('[data-page-prev]');
  const next=el.querySelector('[data-page-next]');
  if(status) status.textContent=`Page ${page} of ${totalPages} · ${totalRows.toLocaleString()} rows`;
  if(prev) prev.disabled=page<=1;
  if(next) next.disabled=page>=totalPages;
}

function gscDeltaBadge(value, higherIsBetter=false) {
  const n=Number(value||0);
  const positive=higherIsBetter?n>=0:n>=0;
  const sign=n>0?'+':'';
  return `<span class="delta-badge ${positive?'positive':'negative'}">${sign}${n.toFixed(2)}</span>`;
}

function gscStatusBadge(status) {
  const value=String(status||'stable').toLowerCase();
  return `<span class="status-badge status-${escHtml(value)}">${escHtml(value.replace(/_/g,' '))}</span>`;
}

function gscPositionClass(value) {
  const n=Number(value||0);
  return n<=3?'pos-top3':n<=10?'pos-top10':'pos-out';
}

function gscPageLink(value) {
  const raw=String(value||'');
  if (!raw) return '—';
  if (/^https?:\/\//i.test(raw)) return `<a class="table-link" href="${escHtml(raw)}" target="_blank" rel="noopener noreferrer">${escHtml(raw)}</a>`;
  return escHtml(raw);
}

function gscShortDate(value) {
  if (!value) return '';
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())?value:date.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
}

function gscCountryName(value) {
  const code=String(value||'').toLowerCase();
  const labels={ind:'India',usa:'United States',gbr:'United Kingdom',can:'Canada',aus:'Australia',are:'United Arab Emirates',sgp:'Singapore',mys:'Malaysia',qat:'Qatar',sau:'Saudi Arabia',deu:'Germany',fra:'France',nld:'Netherlands',irl:'Ireland',zaf:'South Africa',lka:'Sri Lanka',pak:'Pakistan',bgd:'Bangladesh',nzl:'New Zealand',phl:'Philippines'};
  return labels[code] || String(value||'Unknown').toUpperCase();
}

function gscEmptyRow(colspan,message) {
  return `<tr><td colspan="${colspan}" class="table-empty">${escHtml(message)}</td></tr>`;
}
