document.addEventListener('DOMContentLoaded', async function () {
  createCharts();
  initReportControls();
  setDefaultDates();

  // Load active clients from Google Sheets via n8n.
  // Falls back to a demo option if the webhook is unreachable.
  await loadClientOptions();

  // Load demo data on page open so the dashboard is presentable.
  // Do NOT call reloadReport() here because that calls n8n.
  // User must click Generate Report to fetch live data.
  loadDemoPreview();
  initGa4Tab();
});
