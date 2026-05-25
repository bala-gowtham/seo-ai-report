async function exportPDF() {
  const target  = document.getElementById('pdf-content');
  const btn     = document.getElementById('exportBtn');

  if (!target) { alert('Dashboard content was not found.'); return; }
  if (!window.html2canvas) { alert('Export failed: html2canvas is not loaded.'); return; }

  const JsPDFClass = window.jspdf && window.jspdf.jsPDF;
  if (!JsPDFClass) { alert('Export failed: jsPDF is not loaded.'); return; }

  const oldScrollX = window.scrollX;
  const oldScrollY = window.scrollY;

  btn.disabled = true;
  document.documentElement.classList.add('dashboard-exporting-html');
  document.body.classList.add('dashboard-exporting');

  // Hide elements that should not appear in PDF
  const hideSelectors = ['#loadingState', '#errorState', '#exportBtn', '.nav-export-btn'];
  const hiddenEls = [];
  hideSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.style.display !== 'none') {
        el.dataset.pdfHide = 'true';
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

    // Use a fixed capture width that maps cleanly to A4
    // A4 = 210mm wide. At 96dpi: 210mm * (96/25.4) ≈ 794px
    // We use 960px capture → scale 1.5 → 1440px canvas
    // Then fit into 210mm PDF page keeping aspect ratio
    const captureWidth = 960;
    const captureHeight = target.scrollHeight;

    const canvas = await html2canvas(target, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f0f2f5',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width:        captureWidth,
      height:       captureHeight,
      windowWidth:  captureWidth,
      windowHeight: captureHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // A4 dimensions in mm
    const pageW = 210;
    const pageH = 297;
    const margin = 6; // mm margin each side
    const usableW = pageW - margin * 2;

    // Scale image to fit usable width
    const imgW = usableW;
    const imgH = (canvas.height * imgW) / canvas.width;

    const pdf = new JsPDFClass({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageW, pageH],
      compress: true
    });

    let y = margin;
    let remainingH = imgH;
    let srcY = 0;
    let pageIndex = 0;

    while (remainingH > 0) {
      if (pageIndex > 0) {
        pdf.addPage([pageW, pageH], 'portrait');
        y = margin;
      }

      pdf.setFillColor(240, 242, 245);
      pdf.rect(0, 0, pageW, pageH, 'F');

      const sliceH = Math.min(remainingH, pageH - margin * 2);

      // Calculate source slice in canvas pixels
      const srcH = (sliceH / imgH) * canvas.height;

      // Create a slice canvas for this page
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = Math.round(srcH);
      const sliceCtx = sliceCanvas.getContext('2d');
      sliceCtx.drawImage(
        canvas,
        0, Math.round(srcY),          // source x, y
        canvas.width, Math.round(srcH), // source w, h
        0, 0,                           // dest x, y
        canvas.width, Math.round(srcH)  // dest w, h
      );

      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(sliceData, 'JPEG', margin, y, imgW, sliceH);

      srcY        += srcH;
      remainingH  -= sliceH;
      pageIndex   += 1;
    }

    const filters   = getCurrentFilters();
    const projectId = filters.projectId || 'report';
    const now       = new Date();
    const safeMonth = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    pdf.save(`SEO_Overview_${projectId}_${safeMonth}.pdf`);

  } catch (err) {
    console.error(err);
    alert('Export failed: ' + (err && err.message ? err.message : 'unknown error'));
  } finally {
    // Restore hidden elements
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
