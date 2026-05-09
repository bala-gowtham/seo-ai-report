let chartInstances = {};

const chartColors = {
  orange: '#ff6b35',
  lightOrange: '#ff9a6b',
  amber: '#ffb830',
  rose: '#ef4444',
  sky: '#3b82f6',
  violet: '#8b5cf6',
  purple: '#c084fc',
  grid: 'rgba(255,107,53,0.04)',
  border: 'rgba(0,0,0,0.04)'
};

function initChartDefaults() {
  Chart.defaults.color = '#7b8db0';
  Chart.defaults.font = {
    family: 'Inter',
    size: 11
  };
}

function createCharts() {
  initChartDefaults();

  chartInstances.sessions = createSessionsChart();
  chartInstances.device = createDeviceChart();
  chartInstances.channel = createChannelChart();
  chartInstances.gsc = createGscChart();
  chartInstances.serp = createSerpChart();
}

function createSessionsChart() {
  const canvas = document.getElementById('sessChart');
  const ctx = canvas.getContext('2d');

  const g1 = ctx.createLinearGradient(0, 0, 0, 220);
  g1.addColorStop(0, 'rgba(255,107,53,0.18)');
  g1.addColorStop(1, 'rgba(255,107,53,0)');

  const g2 = ctx.createLinearGradient(0, 0, 0, 220);
  g2.addColorStop(0, 'rgba(255,154,107,0.12)');
  g2.addColorStop(1, 'rgba(255,154,107,0)');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'This Period',
          data: [],
          borderColor: chartColors.orange,
          backgroundColor: g1,
          borderWidth: 2.5,
          fill: true,
          tension: 0.45,
          pointBackgroundColor: chartColors.orange,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'Prev Period',
          data: [],
          borderColor: chartColors.lightOrange,
          backgroundColor: g2,
          borderWidth: 2,
          fill: true,
          tension: 0.45,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderDash: [4, 3],
          pointBackgroundColor: chartColors.lightOrange
        }
      ]
    },
    options: baseLineOptions()
  });
}

function createDeviceChart() {
  return new Chart(document.getElementById('devChart'), {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [chartColors.orange, chartColors.lightOrange, chartColors.amber],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: tooltipOptions()
      }
    }
  });
}

function createChannelChart() {
  return new Chart(document.getElementById('chanChart'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          'rgba(255,107,53,0.85)',
          'rgba(255,154,107,0.75)',
          'rgba(139,92,246,0.7)',
          'rgba(245,158,11,0.7)',
          'rgba(239,68,68,0.7)',
          'rgba(59,130,246,0.7)'
        ],
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: baseBarOptions()
  });
}

function createGscChart() {
  return new Chart(document.getElementById('impChart'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Impressions',
          data: [],
          backgroundColor: 'rgba(255,107,53,0.2)',
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y'
        },
        {
          label: 'Clicks',
          data: [],
          type: 'line',
          borderColor: chartColors.lightOrange,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: chartColors.lightOrange,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { boxWidth: 10, boxHeight: 2, usePointStyle: true }
        },
        tooltip: tooltipOptions()
      },
      scales: {
        x: axisOptions(),
        y: axisOptions(),
        y1: {
          position: 'right',
          grid: { display: false },
          border: { color: chartColors.border }
        }
      }
    }
  });
}

function createSerpChart() {
  return new Chart(document.getElementById('serpChart'), {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          chartColors.orange,
          chartColors.purple,
          chartColors.lightOrange,
          chartColors.amber,
          chartColors.rose,
          chartColors.sky
        ],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            padding: 8,
            font: { size: 10 }
          }
        },
        tooltip: tooltipOptions()
      }
    }
  });
}

function renderCharts(report) {
  chartInstances.sessions.data.labels = report.sessionsOverTime.labels;
  chartInstances.sessions.data.datasets[0].data = report.sessionsOverTime.current;
  chartInstances.sessions.data.datasets[1].data = report.sessionsOverTime.previous;
  chartInstances.sessions.update();

  chartInstances.device.data.labels = report.deviceSplit.map(item => item.name);
  chartInstances.device.data.datasets[0].data = report.deviceSplit.map(item => item.value);
  chartInstances.device.update();

  chartInstances.channel.data.labels = report.trafficByChannel.map(item => item.name);
  chartInstances.channel.data.datasets[0].data = report.trafficByChannel.map(item => item.value);
  chartInstances.channel.update();

  chartInstances.gsc.data.labels = report.gscTrend.labels;
  chartInstances.gsc.data.datasets[0].data = report.gscTrend.impressions;
  chartInstances.gsc.data.datasets[1].data = report.gscTrend.clicks;
  chartInstances.gsc.update();

  chartInstances.serp.data.labels = report.serpFeatures.map(item => item.name);
  chartInstances.serp.data.datasets[0].data = report.serpFeatures.map(item => item.value);
  chartInstances.serp.update();
}

function resizeCharts() {
  Object.values(chartInstances).forEach(chart => {
    if (chart && typeof chart.resize === 'function') {
      chart.resize();
    }
  });
}

function tooltipOptions() {
  return {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(255,107,53,0.18)',
    borderWidth: 1,
    padding: 10,
    titleColor: '#1a1d23',
    bodyColor: '#6b7280'
  };
}

function axisOptions() {
  return {
    grid: { color: chartColors.grid },
    border: { color: chartColors.border }
  };
}

function baseLineOptions() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 10, boxHeight: 2, usePointStyle: true }
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
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: tooltipOptions()
    },
    scales: {
      x: axisOptions(),
      y: axisOptions()
    }
  };
}
