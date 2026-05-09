document.addEventListener('DOMContentLoaded', async function() {
  createCharts();
  initReportControls();
  await reloadReport();
});
