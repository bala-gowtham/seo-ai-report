async function exportPDF() {
  const target = document.getElementById('pdf-content');
  const btn = document.getElementById('exportBtn');

  if (!target) { alert('Dashboard content was not found.'); return; }
  if (!window.html2canvas) { alert('Export failed: html2canvas is not loaded.'); return; }

  const JsPDFClass = window.jspdf?.jsPDF;
  if (!JsPDFClass) { alert('Export failed: jsPDF is not loaded.'); return; }

  const oldScrollX = window.scrollX;
  const oldScrollY = window.scrollY;
  const activeView = window.SeoDashboardState?.activeView || 'overview';
  const activeReports = {
    overview: currentReport,
    ga4: currentGa4Report,
    gsc: currentGscReport,
    ai: currentAiTrafficReport
  };
  const activeReport = activeReports[activeView] || currentReport;
  const hiddenEls = [];

  btn.disabled = true;
  document.documentElement.classList.add('dashboard-exporting-html');
  document.body.classList.add('dashboard-exporting');

  const hideSelectors = [
    '#loadingState', '#errorState', '#exportBtn', '#refreshReportBtn',
    '.nav-export-btn', '#navExport', '#snapshotStatusPill',
    '.mobile-nav-toggle', '.sidebar-backdrop', '.ai-chat-launch', '.ai-chat-panel'
  ];

  hideSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      if (element.style.display !== 'none') {
        element.dataset.pdfDisplay = element.style.display;
        element.style.display = 'none';
        hiddenEls.push(element);
      }
    });
  });

  syncExportControls(activeReport || undefined);
  window.scrollTo(0, 0);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(resolve));
    resizeCharts();
    await new Promise(resolve => setTimeout(resolve, 500));

    const captureWidth = 1200;
    const captureHeight = target.scrollHeight;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#f0f2f5',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 6;
    const imageWidthMm = pageWidthMm - (marginMm * 2);
    const imageHeightMm = pageHeightMm - (marginMm * 2);
    const sliceHeightPx = Math.floor(canvas.width * (imageHeightMm / imageWidthMm));
    const pdf = new JsPDFClass({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
      const pageSliceHeight = Math.min(sliceHeightPx, canvas.height - offsetY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageSliceHeight;

      const context = pageCanvas.getContext('2d');
      context.fillStyle = '#f0f2f5';
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(
        canvas,
        0, offsetY, canvas.width, pageSliceHeight,
        0, 0, canvas.width, pageSliceHeight
      );

      if (pageIndex > 0) pdf.addPage('a4', 'portrait');

      const renderedHeightMm = (pageSliceHeight / canvas.width) * imageWidthMm;
      const imageData = pageCanvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(
        imageData,
        'JPEG',
        marginMm,
        marginMm,
        imageWidthMm,
        renderedHeightMm,
        undefined,
        'FAST'
      );

      offsetY += pageSliceHeight;
      pageIndex += 1;
    }

    const filters = getCurrentFilters();
    const safeProject = String(filters.projectId || 'report').replace(/[^a-z0-9_-]+/gi, '_');
    const safeFrom = String(filters.from || '').replace(/-/g, '');
    const safeTo = String(filters.to || '').replace(/-/g, '');
    const viewLabels = {
      overview: 'Overview',
      ga4: 'GA4',
      gsc: 'GSC',
      ai: 'AI_Traffic'
    };
    const viewLabel = viewLabels[activeView] || 'Overview';
    pdf.save(`SEO_${viewLabel}_${safeProject}_${safeFrom}_${safeTo}.pdf`);
  } catch (error) {
    console.error(error);
    alert(`Export failed: ${error?.message || 'unknown error'}`);
  } finally {
    hiddenEls.forEach(element => {
      element.style.display = element.dataset.pdfDisplay || '';
      delete element.dataset.pdfDisplay;
    });
    document.body.classList.remove('dashboard-exporting');
    document.documentElement.classList.remove('dashboard-exporting-html');
    window.scrollTo(oldScrollX, oldScrollY);
    btn.disabled = false;
    resizeCharts();
  }
}

document.addEventListener('click', event => {
  if (event.target.closest('#exportBtn')) exportPDF();
});
