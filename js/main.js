document.addEventListener('DOMContentLoaded', function () {
  createCharts();
  initReportControls();
  setDefaultDates();

  // Load demo data on page open so the dashboard is presentable.
  // Do NOT call reloadReport() here because that calls n8n.
  // User must click Generate Report to fetch live data.
  loadDemoPreview();
});
