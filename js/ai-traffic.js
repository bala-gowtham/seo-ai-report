// ═══════════════════════════════════════════════════════════
// AI referral traffic view
// ═══════════════════════════════════════════════════════════

const aiTrafficViewState = {
  landingSearch: '',
  landingPage: 1,
  pageSize: 10,
  initialized: false
};

let aiTrafficTrendChart = null;
let aiTrafficDeviceChart = null;

function getAiTrafficDemoReport(filters = {}) {
  const meta = {
    projectId:'demo', projectName:'Demo Data', from:filters.from, to:filters.to,
    prevFrom:filters.from, prevTo:filters.to, comparisonMode:'previous_equal_length_period',
    dateRangeLabel:formatDateRangeLabel(filters.from, filters.to), sourceLabel:'AI Referral Traffic'
  };
  const aiTraffic = {
    classification:{
      medium:'referral',
      channelLabel:'AI Assistant',
      campaignLabel:'AI referral traffic',
      note:'Google AI Overviews and Google AI Mode remain in Organic Search rather than this channel.'
    },
    kpis:{
      sessions:{value:88,prev:72,change:22.2,suffix:'',changeSuffix:'%'},
      users:{value:74,prev:61,change:21.3,suffix:'',changeSuffix:'%'},
      newUsers:{value:58,prev:46,change:26.1,suffix:'',changeSuffix:'%'},
      engagedSessions:{value:57,prev:44,change:29.5,suffix:'',changeSuffix:'%'},
      engagementRate:{value:64.8,prev:61.1,change:3.7,suffix:'%',changeSuffix:' pp'},
      conversions:{value:8,prev:5,change:60,suffix:'',changeSuffix:'%'},
      pageViews:{value:132,prev:101,change:30.7,suffix:'',changeSuffix:'%'},
      averageSessionDuration:{value:94.2,prev:80.4,change:17.2,suffix:' sec',changeSuffix:'%'}
    },
    trend:{
      labels:['2026-06-01','2026-06-02','2026-06-04','2026-06-05','2026-06-07'],
      previousLabels:['2026-05-25','2026-05-26','2026-05-28','2026-05-29','2026-05-31'],
      sessions:[18,14,20,17,19], prevSessions:[14,13,16,12,17],
      users:[15,12,17,14,16], prevUsers:[12,11,13,10,15],
      engagedSessions:[12,9,14,10,12], prevEngagedSessions:[9,8,10,7,10],
      conversions:[1,2,2,1,2], prevConversions:[1,1,1,1,1]
    },
    sources:[
      {name:'chatgpt.com',source:'chatgpt.com',sessions:48,prevSessions:38,change:26.3,users:41,engagementRate:68.8,conversions:5,pageViews:76,averageSessionDuration:102,status:'growing'},
      {name:'perplexity.ai',source:'perplexity.ai',sessions:22,prevSessions:19,change:15.8,users:18,engagementRate:63.6,conversions:2,pageViews:31,averageSessionDuration:88,status:'growing'},
      {name:'gemini.google.com',source:'gemini.google.com',sessions:14,prevSessions:11,change:27.3,users:12,engagementRate:57.1,conversions:1,pageViews:19,averageSessionDuration:79,status:'growing'},
      {name:'claude.ai',source:'claude.ai',sessions:4,prevSessions:4,change:0,users:3,engagementRate:50,conversions:0,pageViews:6,averageSessionDuration:61,status:'stable'}
    ],
    landingPages:[
      {landingPage:'/services/seo/',sessions:24,prevSessions:18,change:33.3,users:20,engagementRate:75,conversions:3,pageViews:39,averageSessionDuration:121,status:'growing'},
      {landingPage:'/blog/seo-automation/',sessions:19,prevSessions:14,change:35.7,users:17,engagementRate:68.4,conversions:2,pageViews:29,averageSessionDuration:106,status:'growing'},
      {landingPage:'/',sessions:13,prevSessions:16,change:-18.8,users:11,engagementRate:53.8,conversions:1,pageViews:18,averageSessionDuration:72,status:'declining'},
      {landingPage:'/contact/',sessions:9,prevSessions:6,change:50,users:8,engagementRate:77.8,conversions:2,pageViews:15,averageSessionDuration:98,status:'growing'}
    ],
    devices:[
      {name:'Mobile',sessions:54,prevSessions:42,change:28.6,users:46,engagementRate:63,conversions:4,status:'growing'},
      {name:'Desktop',sessions:34,prevSessions:30,change:13.3,users:28,engagementRate:67.6,conversions:4,status:'growing'}
    ],
    countries:[
      {name:'India',sessions:56,prevSessions:46,change:21.7,users:47,engagementRate:66.1,conversions:5,status:'growing'},
      {name:'United States',sessions:17,prevSessions:13,change:30.8,users:14,engagementRate:58.8,conversions:2,status:'growing'},
      {name:'United Kingdom',sessions:9,prevSessions:8,change:12.5,users:8,engagementRate:66.7,conversions:1,status:'stable'},
      {name:'Singapore',sessions:6,prevSessions:5,change:20,users:5,engagementRate:66.7,conversions:0,status:'growing'}
    ],
    coverage:{sources:{partial:false},landingPages:{partial:false},countries:{partial:false}},
    warnings:[]
  };
  return {
    ok:true,view:'ai',partial:false,meta,
    analyticsEvidence:{ga4:{aiAssistantTraffic:aiTraffic},gsc:{}},
    aiTraffic,
    warnings:[]
  };
}

function initAiTrafficView() {
  if (aiTrafficViewState.initialized) return;
  aiTrafficViewState.initialized = true;

  document.getElementById('aiLandingSearch')?.addEventListener('input', event => {
    aiTrafficViewState.landingSearch = event.target.value.trim().toLowerCase();
    aiTrafficViewState.landingPage = 1;
    renderAiTrafficLandingPages(currentAiTrafficReport);
  });

  document.getElementById('aiLandingPrev')?.addEventListener('click', () => {
    aiTrafficViewState.landingPage = Math.max(1, aiTrafficViewState.landingPage - 1);
    renderAiTrafficLandingPages(currentAiTrafficReport);
  });

  document.getElementById('aiLandingNext')?.addEventListener('click', () => {
    aiTrafficViewState.landingPage += 1;
    renderAiTrafficLandingPages(currentAiTrafficReport);
  });
}

function renderAiTrafficTab(report) {
  if (!report) return;
  const traffic = report.aiTraffic || report.analyticsEvidence?.ga4?.aiAssistantTraffic || {};
  renderAiTrafficMeta(report);
  renderAiTrafficNotices(report, traffic);
  renderAiTrafficKpis(traffic.kpis || {});
  renderAiTrafficTrend(report, traffic);
  renderAiTrafficSources(traffic.sources || []);
  renderAiTrafficLandingPages(report);
  renderAiTrafficDeviceChart(traffic.devices || []);
  renderAiTrafficCountries(traffic.countries || []);
  renderAiTrafficWarnings(report, traffic);
  syncExportControls(report);

  const dateEl = document.getElementById('aiTrafficFooterDate');
  if (dateEl) dateEl.textContent = `Generated on ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`;
}

function renderAiTrafficMeta(report) {
  const meta = report.meta || {};
  const subtitle = document.getElementById('reportSubtitle');
  if (subtitle) subtitle.textContent = `${meta.projectName || 'Selected project'} · ${meta.dateRangeLabel || formatDateRangeLabel(meta.from,meta.to)} · AI Referral Traffic`;
}

function renderAiTrafficNotices(report, traffic) {
  const wrap = document.getElementById('aiTrafficNotices');
  if (!wrap) return;
  const sessions = Number(traffic.kpis?.sessions?.value || 0);
  const supportingWarnings = (report.warnings || []).filter(item => /\b(ai|assistant|referral)\b/i.test(String(item)));
  const notes = [];
  if (sessions < 30) {
    notes.push(`This period contains ${sessions.toLocaleString()} AI referral session${sessions === 1 ? '' : 's'}. Percentage changes can move sharply with a small sample.`);
  }
  if (traffic.classification?.note) notes.push(traffic.classification.note);
  if (report.partial) {
    const coverage = traffic.coverage || {};
    const dedicatedPartial = Object.values(coverage).some(value => value?.partial === true || value?.complete === false);
    notes.push(dedicatedPartial
      ? 'Some dedicated AI referral detail tables are incomplete.'
      : 'AI referral detail is available, while some supporting GA4 or GSC tables use limited row coverage.');
  }
  notes.push(...(traffic.warnings || []), ...supportingWarnings);
  const uniqueNotes = notes.filter((value, index, array) => value && array.indexOf(value) === index);
  if (!uniqueNotes.length) {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    return;
  }
  wrap.style.display = 'block';
  wrap.innerHTML = `<details class="data-notes-card ai-data-notes">
    <summary><span class="data-notes-icon" aria-hidden="true">i</span><span><strong>Data notes</strong><small>AI referral traffic</small></span><span class="data-notes-badge">${sessions < 30 ? `Small sample · ${sessions.toLocaleString()} sessions` : `${uniqueNotes.length} notes`}</span><span class="data-notes-chevron" aria-hidden="true"></span></summary>
    <div class="data-notes-body"><p>AI referral traffic is a focused channel view and should be interpreted separately from Organic Search.</p><ul>${uniqueNotes.map(note => `<li>${escHtml(note)}</li>`).join('')}</ul></div>
  </details>`;
}

function renderAiTrafficKpis(kpis) {
  const defs = [
    ['sessions','AI Sessions','#8b5cf6'],
    ['users','Users','#3b82f6'],
    ['newUsers','New Users','#ff6b35'],
    ['engagedSessions','Engaged Sessions','#14b8a6'],
    ['engagementRate','Engagement Rate','#22c55e'],
    ['pageViews','Page Views','#ec4899'],
    ['averageSessionDuration','Avg. Duration','#f59e0b'],
    ['conversions','Conversions','#ef4444']
  ];
  const wrap=document.getElementById('aiTrafficKpiStrip');
  if(!wrap)return;
  wrap.innerHTML=defs.map(([key,label,color])=>{
    const data=kpis[key]||{value:0,change:0,suffix:'',changeSuffix:'%'};
    const value=Number(data.value||0);
    const change=Number(data.change||0);
    const shown=key==='averageSessionDuration'
      ? `${value.toFixed(1)}${data.suffix||' sec'}`
      : `${Number.isInteger(value)?value.toLocaleString():value.toFixed(2)}${data.suffix||''}`;
    const sign=change>0?'+':'';
    return `<div class="kpi-card" style="--card-color:${color}"><div class="kpi-glow"></div><div class="kpi-top"><div class="kpi-label">${label}</div><div class="kpi-dot"></div></div><div class="kpi-value" style="font-size:25px">${shown}</div><div class="kpi-change ${change>=0?'up':'down'}">${sign}${Number.isInteger(change)?change:change.toFixed(1)}${data.changeSuffix||'%'} vs prev period</div></div>`;
  }).join('');
}

function renderAiTrafficTrend(report, traffic) {
  const canvas=document.getElementById('aiTrafficTrendChart');
  if(!canvas||!window.Chart)return;
  const meta=report.meta||{};
  const current=normalizeAiDateSeries(meta.from,meta.to,traffic.trend?.labels,traffic.trend?.sessions);
  const previous=normalizeAiDateSeries(meta.prevFrom,meta.prevTo,traffic.trend?.previousLabels,traffic.trend?.prevSessions);
  const labels=current.labels.length?current.labels:previous.labels;
  if(aiTrafficTrendChart)aiTrafficTrendChart.destroy();
  aiTrafficTrendChart=new Chart(canvas,{
    type:'line',
    data:{labels,datasets:[
      {label:'Current AI sessions',data:current.values,borderColor:'#8b5cf6',backgroundColor:'rgba(139,92,246,.15)',fill:true,tension:.3,borderWidth:2.5,pointRadius:3},
      {label:'Previous AI sessions',data:previous.values,borderColor:'#94a3b8',backgroundColor:'transparent',fill:false,tension:.3,borderWidth:1.5,borderDash:[5,4],pointRadius:2}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',align:'end'}},scales:{x:{grid:{color:'rgba(0,0,0,.04)'}},y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.04)'},ticks:{precision:0}}}}
  });
}

function normalizeAiDateSeries(from,to,dates,values) {
  const map=new Map();
  (dates||[]).forEach((date,index)=>map.set(date,Number(values?.[index]||0)));
  if(!from||!to){
    return {labels:(dates||[]).map(aiShortDate),values:(values||[]).map(v=>Number(v||0))};
  }
  const labels=[];
  const normalized=[];
  const start=new Date(`${from}T00:00:00Z`);
  const end=new Date(`${to}T00:00:00Z`);
  for(let date=new Date(start);date<=end;date.setUTCDate(date.getUTCDate()+1)){
    const key=date.toISOString().slice(0,10);
    labels.push(date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',timeZone:'UTC'}));
    normalized.push(map.get(key)||0);
  }
  return {labels,values:normalized};
}

function renderAiTrafficSources(rows) {
  const tbody=document.getElementById('aiSourceDetailTableBody');
  if(!tbody)return;
  const items=(rows||[]).slice().sort((a,b)=>Number(b.sessions||b.value||0)-Number(a.sessions||a.value||0));
  tbody.innerHTML=items.length?items.map((r,i)=>`<tr><td class="row-num">${i+1}</td><td class="primary-cell">${escHtml(aiSourceLabel(r.source||r.name))}</td><td class="num-cell"><strong>${formatInt(r.sessions??r.value)}</strong></td><td class="num-cell">${formatInt(r.prevSessions??r.prev)}</td><td class="num-cell">${aiDeltaBadge(r.change??r.sessionsChange)}</td><td class="num-cell">${formatInt(r.users)}</td><td class="num-cell">${Number(r.engagementRate||0).toFixed(2)}%</td><td class="num-cell">${formatInt(r.conversions)}</td><td>${aiStatusBadge(r.status)}</td></tr>`).join(''):`<tr><td colspan="9" class="table-empty">No AI referral sources were detected.</td></tr>`;
}

function renderAiTrafficLandingPages(report) {
  const traffic=report?.aiTraffic||report?.analyticsEvidence?.ga4?.aiAssistantTraffic||{};
  const rows=traffic.landingPages||[];
  const filtered=rows.filter(r=>String(r.landingPage||r.name||'').toLowerCase().includes(aiTrafficViewState.landingSearch));
  const totalPages=Math.max(1,Math.ceil(filtered.length/aiTrafficViewState.pageSize));
  const page=Math.min(aiTrafficViewState.landingPage,totalPages);
  aiTrafficViewState.landingPage=page;
  const start=(page-1)*aiTrafficViewState.pageSize;
  const items=filtered.slice(start,start+aiTrafficViewState.pageSize);
  const tbody=document.getElementById('aiLandingDetailTableBody');
  if(!tbody)return;
  tbody.innerHTML=items.length?items.map((r,i)=>{
    const pageName=r.landingPage||r.name||'';
    return `<tr><td class="row-num">${start+i+1}</td><td class="url-cell table-text-wrap">${aiLandingLink(pageName)}</td><td class="num-cell"><strong>${formatInt(r.sessions??r.value)}</strong></td><td class="num-cell">${formatInt(r.prevSessions??r.prev)}</td><td class="num-cell">${aiDeltaBadge(r.change??r.sessionsChange)}</td><td class="num-cell">${formatInt(r.users)}</td><td class="num-cell">${Number(r.engagementRate||0).toFixed(2)}%</td><td class="num-cell">${formatInt(r.pageViews)}</td><td class="num-cell">${Number(r.averageSessionDuration||0).toFixed(1)} sec</td><td>${aiStatusBadge(r.status)}</td></tr>`;
  }).join(''):`<tr><td colspan="10" class="table-empty">No AI landing pages match this search.</td></tr>`;
  updateAiLandingPager(page,totalPages,filtered.length);
}

function updateAiLandingPager(page,totalPages,totalRows) {
  const el=document.getElementById('aiLandingPager');
  if(!el)return;
  const status=el.querySelector('[data-page-status]');
  const prev=el.querySelector('[data-page-prev]');
  const next=el.querySelector('[data-page-next]');
  if(status)status.textContent=`Page ${page} of ${totalPages} · ${totalRows.toLocaleString()} rows`;
  if(prev)prev.disabled=page<=1;
  if(next)next.disabled=page>=totalPages;
}

function renderAiTrafficDeviceChart(rows) {
  const canvas=document.getElementById('aiTrafficDeviceChart');
  if(!canvas||!window.Chart)return;
  if(aiTrafficDeviceChart)aiTrafficDeviceChart.destroy();
  aiTrafficDeviceChart=new Chart(canvas,{
    type:'doughnut',
    data:{labels:(rows||[]).map(r=>r.name||r.device||'Unknown'),datasets:[{data:(rows||[]).map(r=>Number(r.sessions??r.value??0)),backgroundColor:['#8b5cf6','#3b82f6','#14b8a6','#f59e0b'],borderWidth:0,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:12}},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${Number(ctx.raw||0).toLocaleString()} sessions`}}}}
  });
  const list=document.getElementById('aiDeviceDetailList');
  if(list)list.innerHTML=(rows||[]).map(r=>`<div class="metric-summary-row"><span>${escHtml(r.name||r.device||'Unknown')}</span><strong>${formatInt(r.sessions??r.value)} sessions · ${Number(r.engagementRate||0).toFixed(1)}% engaged</strong></div>`).join('')||'<div class="empty-inline">No device data available.</div>';
}

function renderAiTrafficCountries(rows) {
  const tbody=document.getElementById('aiCountryTableBody');
  if(!tbody)return;
  tbody.innerHTML=(rows||[]).length?(rows||[]).map((r,i)=>`<tr><td class="row-num">${i+1}</td><td class="primary-cell">${escHtml(aiCountryLabel(r.country||r.name))}</td><td class="num-cell">${formatInt(r.sessions??r.value)}</td><td class="num-cell">${formatInt(r.prevSessions??r.prev)}</td><td class="num-cell">${aiDeltaBadge(r.change??r.sessionsChange)}</td><td class="num-cell">${Number(r.engagementRate||0).toFixed(2)}%</td><td class="num-cell">${formatInt(r.conversions)}</td><td>${aiStatusBadge(r.status)}</td></tr>`).join(''):`<tr><td colspan="8" class="table-empty">No country data available.</td></tr>`;
}

function renderAiTrafficWarnings() {
  const wrap = document.getElementById('aiTrafficWarnings');
  if (!wrap) return;
  wrap.style.display = 'none';
  wrap.innerHTML = '';
}

function aiSourceLabel(value) {
  const normalized=String(value||'Unknown').trim().toLowerCase();
  const labels={'chatgpt.com':'ChatGPT','gemini.google.com':'Gemini','perplexity.ai':'Perplexity','copilot.microsoft.com':'Microsoft Copilot','claude.ai':'Claude'};
  return labels[normalized]||String(value||'Unknown');
}

function aiLandingLink(value) {
  const raw=String(value||'');
  if(!raw||raw==='(not set)')return 'Unknown landing page';
  const site=currentAiTrafficReport?.meta?.siteUrl||'';
  let url='';
  try{url=new URL(raw,site||window.location.origin).toString();}catch{}
  return url?`<a class="table-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${escHtml(raw)}</a>`:escHtml(raw);
}

function aiCountryLabel(value) {
  const code=String(value||'').toLowerCase();
  const labels={ind:'India',mys:'Malaysia',qat:'Qatar',svk:'Slovakia',usa:'United States',gbr:'United Kingdom',sgp:'Singapore'};
  return labels[code]||String(value||'Unknown');
}

function aiDeltaBadge(value) {
  const n=Number(value||0);const sign=n>0?'+':'';
  return `<span class="delta-badge ${n>=0?'positive':'negative'}">${sign}${n.toFixed(1)}%</span>`;
}

function aiStatusBadge(status) {
  const value=String(status||'stable').toLowerCase();
  return `<span class="status-badge status-${escHtml(value)}">${escHtml(value.replace(/_/g,' '))}</span>`;
}

function aiShortDate(value) {
  if(!value)return'';
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())?value:date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',timeZone:'UTC'});
}
