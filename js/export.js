async function exportPDF() {
  const target = document.getElementById('pdf-content');
  const btn    = document.getElementById('exportBtn');

  if (!target) { alert('Dashboard content was not found.'); return; }
  if (!window.html2canvas) { alert('Export failed: html2canvas is not loaded.'); return; }

  const JsPDFClass = window.jspdf && window.jspdf.jsPDF;
  if (!JsPDFClass) { alert('Export failed: jsPDF is not loaded.'); return; }

  const oldScrollX = window.scrollX;
  const oldScrollY = window.scrollY;

  btn.disabled = true;
  document.documentElement.classList.add('dashboard-exporting-html');
  document.body.classList.add('dashboard-exporting');

  // Hide UI-only elements from capture
  const hideSelectors = ['#loadingState', '#errorState', '#exportBtn', '.nav-export-btn', '#navExport'];
  const hiddenEls = [];
  hideSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.style.display !== 'none') {
        el.dataset.pdfHide = '1';
        el.style.display = 'none';
        hiddenEls.push(el);
      }
    });
  });

  syncExportControls();
  window.scrollTo(0, 0);

  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    resizeCharts();
    await new Promise(r => setTimeout(r, 900));

    // Capture at 1200px width — matches the dashboard's design width
    const CAPTURE_W = 1200;
    const CAPTURE_H = target.scrollHeight;

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f0f2f5',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width:        CAPTURE_W,
      height:       CAPTURE_H,
      windowWidth:  CAPTURE_W,
      windowHeight: CAPTURE_H
    });

    // PDF page = same aspect ratio as captured canvas
    // Keep width fixed at 210mm, derive height from actual content ratio
    const PDF_W = 210; // mm
    const PDF_H = Math.ceil((canvas.height / canvas.width) * PDF_W);

    const pdf = new JsPDFClass({
      orientation: PDF_H > PDF_W ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [PDF_W, PDF_H],
      compress: true
    });

    pdf.setFillColor(240, 242, 245);
    pdf.rect(0, 0, PDF_W, PDF_H, 'F');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, PDF_W, PDF_H);

    const filters   = getCurrentFilters();
    const projectId = filters.projectId || 'report';
    const now       = new Date();
    const safeMonth = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    pdf.save(`SEO_Overview_${projectId}_${safeMonth}.pdf`);

  } catch (err) {
    console.error(err);
    alert('Export failed: ' + (err && err.message ? err.message : 'unknown error'));
  } finally {
    hiddenEls.forEach(el => {
      el.style.display = '';
      delete el.dataset.pdfHide;
    });
    document.body.classList.remove('dashboard-exporting');
    document.documentElement.classList.remove('dashboard-exporting-html');
    window.scrollTo(oldScrollX, oldScrollY);
    btn.disabled = false;
    resizeCharts();
  }
}

document.addEventListener('click', function (event) {
  if (event.target.closest('#exportBtn')) exportPDF();
});
