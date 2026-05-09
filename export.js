async function exportPDF() {
  const target = document.getElementById('pdf-content');
  const btn = document.getElementById('exportBtn');

  if (!target) {
    alert('Dashboard content was not found.');
    return;
  }

  if (!window.html2canvas) {
    alert('Export failed: html2canvas is not loaded.');
    return;
  }

  const JsPDFClass = window.jspdf && window.jspdf.jsPDF;

  if (!JsPDFClass) {
    alert('Export failed: jsPDF is not loaded.');
    return;
  }

  const oldScrollX = window.scrollX;
  const oldScrollY = window.scrollY;

  btn.disabled = true;

  document.documentElement.classList.add('dashboard-exporting-html');
  document.body.classList.add('dashboard-exporting');

  syncExportControls();
  window.scrollTo(0, 0);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));

    resizeCharts();

    await new Promise(resolve => setTimeout(resolve, 800));

    const exportWidth = 1200;
    const exportHeight = target.scrollHeight;

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f0f2f5',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: exportWidth,
      height: exportHeight,
      windowWidth: exportWidth,
      windowHeight: exportHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new JsPDFClass({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297],
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let pageIndex = 0;
    let heightLeft = imgHeight;

    pdf.setFillColor(240, 242, 245);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      pageIndex += 1;
      pdf.addPage([210, 297], 'portrait');

      pdf.setFillColor(240, 242, 245);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      const yPosition = -pageIndex * pageHeight;
      pdf.addImage(imgData, 'JPEG', 0, yPosition, imgWidth, imgHeight);

      heightLeft -= pageHeight;
    }

    const filters = getCurrentFilters();
    pdf.save(`SEO_Dashboard_${filters.clientId}_${filters.from}_${filters.to}.pdf`);
  } catch (err) {
    console.error(err);
    alert('Export failed: ' + (err && err.message ? err.message : 'unknown error'));
  } finally {
    document.body.classList.remove('dashboard-exporting');
    document.documentElement.classList.remove('dashboard-exporting-html');

    window.scrollTo(oldScrollX, oldScrollY);

    btn.disabled = false;
    resizeCharts();
  }
}

document.addEventListener('click', function(event) {
  const exportButton = event.target.closest('#exportBtn');

  if (exportButton) {
    exportPDF();
  }
});
