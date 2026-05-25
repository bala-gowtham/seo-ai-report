let chartInstances = {};

const chartColors = {
  orange:  '#ff6b35',
  peach:   '#ff9a6b',
  amber:   '#f59e0b',
  rose:    '#ef4444',
  sky:     '#3b82f6',
  violet:  '#8b5cf6',
  teal:    '#14b8a6',
  green:   '#22c55e',
  purple:  '#c084fc',
  pink:    '#ec4899',
  grid:    'rgba(0,0,0,0.04)',
  border:  'rgba(0,0,0,0.05)'
};

const CHANNEL_COLORS = [
  'rgba(255,107,53,0.85)',
  'rgba(59,130,246,0.8)',
  'rgba(139,92,246,0.8)',
  'rgba(20,184,166,0.8)',
  'rgba(245,158,11,0.8)',
  'rgba(236,72,153,0.8)',
  'rgba(34,197,94,0.8)'
];

const AEO_COLORS = [
  '#8b5cf6','#ff6b35','#3b82f6','#14b8a6','#f59e0b','#ec4899'
];

function fmtK(v) {
  if (v >= 1_000_000) return (v/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M';
  if (v >= 1000)      return (v/1000).toFixed(1).replace(/\.0$/,'') + 'k';
  return v;
}

function initChartDefaults() {
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font  = { family: 'Inter', size: 11 };
}

function createCharts() {
  initChartDefaults();
  chartInstances.sessions = createSessionsChart();
  chartInstances.device   = createDeviceChart();
  chartInstances.channel  = createChannelChart();
  chartInstances.gsc      = createGscChart();
  chartInstances.aeo      = createAeoChart();
}

// ── Sessions Over Time ────────────────────────────────────
function createSessionsChart() {
  const canvas = document.getElementById('sessChart');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');

  const g1 = ctx.createLinearGradient(0,0,0,220);
  g1.addColorStop(0, 'rgba(255,107,53,0.15)');
  g1.addColorStop(1, 'rgba(255,107,53,0)');

  const g2 = ctx.createLinearGradient(0,0,0,220);
  g2.addColorStop(0, 'rgba(59,130,246,0.1)');
  g2.addColorStop(1, 'rgba(59,130,246,0)');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'This Period',
          data: [], borderColor: chartColors.orange,
          backgroundColor: g1, borderWidth: 2.5,
          fill: true, tension: 0.3,
          pointBackgroundColor: chartColors.orange,
          pointRadius: 3, pointHoverRadius: 6
        },
        {
          label: 'Prev Period',
          data: [], borderColor: chartColors.sky,
          backgroundColor: g2, borderWidth: 1.5,
          fill: true, tension: 0.3,
          borderDash: [4,3],
          pointRadius: 2, pointHoverRadius: 4,
          pointBackgroundColor: chartColors.sky
        }
      ]
    },
    options: {
      ...baseLineOptions(),
      scales: {
        x: axisOptions(),
        y: { ...axisOptions(), beginAtZero: false, ticks: { callback: fmtK } }
      }
    }
  });
}

// ── Device Doughnut ───────────────────────────────────────
function createDeviceChart() {
  const canvas = document.getElementById('devChart');
  if (!canvas) return null;
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [chartColors.orange, chartColors.sky, chartColors.violet],
        borderWidth: 0, hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 8, boxHeight: 8, padding: 10, font: { size: 10 } }
        },
        tooltip: {
          ...tooltipOptions(),
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ── Channel Bar ───────────────────────────────────────────
function createChannelChart() {
  const canvas = document.getElementById('chanChart');
  if (!canvas) return null;
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: CHANNEL_COLORS,
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      ...baseBarOptions(),
      scales: {
        x: { ...axisOptions(), ticks: { maxRotation: 35, font: { size: 10 } } },
        y: { ...axisOptions(), ticks: { callback: fmtK } }
      }
    }
  });
}

// ── GSC Clicks vs Impressions (combo bar+line) ────────────
function createGscChart() {
  const canvas = document.getElementById('impChart');
  if (!canvas) return null;
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Impressions',
          data: [],
          backgroundColor: 'rgba(255,107,53,0.18)',
          borderRadius: 4, borderSkipped: false,
          yAxisID: 'y'
        },
        {
          label: 'Clicks',
          data: [], type: 'line',
          borderColor: chartColors.orange,
          backgroundColor: 'transparent',
          borderWidth: 2.5, tension: 0.3,
          pointRadius: 3, pointHoverRadius: 6,
          pointBackgroundColor: chartColors.orange,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: tooltipOptions()
      },
      scales: {
        x: { ...axisOptions(), ticks: { maxRotation: 35 } },
        y:  { ...axisOptions(), position: 'left',  ticks: { callback: fmtK }, title: { display: true, text: 'Impressions', font: { size: 10 }, color: '#9ca3af' } },
        y1: { position: 'right', grid: { display: false }, border: { color: chartColors.border }, ticks: { callback: fmtK }, title: { display: true, text: 'Clicks', font: { size: 10 }, color: '#9ca3af' } }
      }
    }
  });
}

// ── AEO Doughnut — with no-data empty state ───────────────
function createAeoChart() {
  const canvas = document.getElementById('aeoChart');
  if (!canvas) return null;

  // Custom plugin: show empty state message when chart has no data
  const noDataPlugin = {
    id: 'aeoNoData',
    afterDraw(chart) {
      const total = chart.data.datasets[0]?.data?.reduce((a, b) => a + b, 0) || 0;
      if (total > 0) return;
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = '12px Inter, sans-serif';
      ctx.fillStyle    = '#9ca3af';
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top  + chartArea.bottom) / 2;
      ctx.fillText('No AI referral sessions available', cx, cy);
      ctx.restore();
    }
  };

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: AEO_COLORS,
        borderWidth: 0, hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 8, boxHeight: 8, padding: 10, font: { size: 10 } }
        },
        tooltip: tooltipOptions()
      }
    },
    plugins: [noDataPlugin]
  });
}

// ── Render all charts with live data ─────────────────────
function renderCharts(report) {
  if (chartInstances.sessions) {
    chartInstances.sessions.data.labels              = report.sessionsOverTime.labels;
    chartInstances.sessions.data.datasets[0].data   = report.sessionsOverTime.current;
    chartInstances.sessions.data.datasets[1].data   = report.sessionsOverTime.previous;
    chartInstances.sessions.update();
  }

  if (chartInstances.device) {
    chartInstances.device.data.labels              = report.deviceSplit.map(i => i.name);
    chartInstances.device.data.datasets[0].data   = report.deviceSplit.map(i => i.value);
    chartInstances.device.update();
  }

  if (chartInstances.channel) {
    chartInstances.channel.data.labels             = report.trafficByChannel.map(i => i.name);
    chartInstances.channel.data.datasets[0].data  = report.trafficByChannel.map(i => i.value);
    chartInstances.channel.update();
  }

  if (chartInstances.gsc) {
    chartInstances.gsc.data.labels                = report.gscTrend.labels;
    chartInstances.gsc.data.datasets[0].data      = report.gscTrend.impressions;
    chartInstances.gsc.data.datasets[1].data      = report.gscTrend.clicks;
    chartInstances.gsc.update();
  }

  if (chartInstances.aeo) {
    chartInstances.aeo.data.labels                = report.aeoSources.map(i => i.name);
    chartInstances.aeo.data.datasets[0].data      = report.aeoSources.map(i => i.value);
    chartInstances.aeo.update();
  }
}

function resizeCharts() {
  Object.values(chartInstances).forEach(chart => {
    if (chart && typeof chart.resize === 'function') chart.resize();
  });
}

// ── Shared options helpers ────────────────────────────────
function tooltipOptions() {
  return {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    padding: 10,
    titleColor: '#1a1d23',
    bodyColor: '#6b7280',
    titleFont: { family: 'Space Grotesk', size: 12, weight: '600' },
    bodyFont:  { family: 'Inter', size: 11 }
  };
}

function axisOptions() {
  return {
    grid:   { color: chartColors.grid },
    border: { color: chartColors.border }
  };
}

function baseLineOptions() {
  return {
    responsive: true, maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top', align: 'end',
        labels: { boxWidth: 10, boxHeight: 2, usePointStyle: true, padding: 14, font: { size: 11 } }
      },
      tooltip: tooltipOptions()
    },
    scales: {
      x: axisOptions(),
      y: { ...axisOptions(), beginAtZero: false }
    }
  };
}

function baseBarOptions() {
  return {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: tooltipOptions()
    },
    scales: { x: axisOptions(), y: axisOptions() }
  };
}
