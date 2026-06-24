document.addEventListener('DOMContentLoaded', async function () {
  initReportControls();
  setDefaultDates();

  if (typeof window.Chart === 'function') {
    createCharts();
  } else {
    console.error('Chart.js was not loaded.');
    emitSnapshotState('error', {
      message: 'Charts could not be initialized because Chart.js did not load.'
    });
  }

  await loadClientOptions();
  loadDemoPreview();
  initGa4Tab();
});
