document.addEventListener('DOMContentLoaded', function () {
  createCharts();
  initReportControls();
  setDefaultMonth();
  // Demo mode: auto-load on page open so dashboard isn't blank
  reloadReport();
});
