document.addEventListener('DOMContentLoaded', function () {
  createCharts();
  initReportControls();
  setDefaultMonth();
  // Do NOT call reloadReport() here.
  // The user must click Generate Report to fetch data.
  // To enable demo preview on load, uncomment the line below:
  // reloadReport();
});
