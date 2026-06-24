(function () {
  const api = window.NetlifySeoApi;
  if (!api) {
    console.error('NetlifySeoApi was not loaded.');
    return;
  }

  function currentFilters() {
    return typeof getCurrentFilters === 'function'
      ? getCurrentFilters()
      : {
          projectId: document.getElementById('projectSelector')?.value || 'demo',
          from: document.getElementById('fromDateSelector')?.value || '',
          to: document.getElementById('toDateSelector')?.value || ''
        };
  }

  function createRefreshButton() {
    if (document.getElementById('refreshReportBtn')) return;

    const generate = document.getElementById('submitReportBtn');
    if (!generate?.parentElement) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'refreshReportBtn';
    button.className = 'btn-refresh-data';
    button.textContent = 'Refresh data';
    button.title = 'Collect GA4 and GSC again and replace the cached snapshot.';
    generate.insertAdjacentElement('afterend', button);

    button.addEventListener('click', async () => {
      const filters = currentFilters();
      const view = window.SeoDashboardState?.activeView || 'overview';

      if (!filters.projectId || filters.projectId === 'demo') {
        emitSnapshotState('error', {
          message: 'Select a live project before refreshing data.'
        });
        return;
      }

      button.disabled = true;
      button.textContent = 'Refreshing…';
      emitSnapshotState('building', {
        message: 'Refreshing GA4 and GSC in the background…'
      });

      try {
        await api.refreshReport({
          clientId: filters.projectId,
          from: filters.from,
          to: filters.to
        });

        await api.waitForReport(
          {
            clientId: filters.projectId,
            from: filters.from,
            to: filters.to,
            view
          },
          {
            timeoutMs: 6 * 60 * 1000,
            onProgress(progress) {
              emitSnapshotState('building', {
                message: 'Refreshing GA4 and GSC in the background…',
                attempt: progress.attempt,
                elapsedMs: progress.elapsedMs
              });
            }
          }
        );

        window.SeoDashboardState?.clearReports();
        await loadReportView(view, { force: true });
        emitSnapshotState('ready', { message: 'Analytics refreshed.' });
      } catch (error) {
        console.error('Snapshot refresh failed:', error);
        emitSnapshotState('error', {
          message: error.message || 'The refresh failed.',
          code: error.code || 'REFRESH_ERROR'
        });
      } finally {
        button.disabled = false;
        button.textContent = 'Refresh data';
      }
    });
  }

  function createStatusPill() {
    if (document.getElementById('snapshotStatusPill')) return;

    const topbar = document.querySelector('.report-topbar');
    if (!topbar) return;

    const pill = document.createElement('div');
    pill.id = 'snapshotStatusPill';
    pill.className = 'snapshot-status-pill';
    pill.hidden = true;
    pill.setAttribute('role', 'status');
    pill.setAttribute('aria-live', 'polite');
    topbar.insertAdjacentElement('afterend', pill);

    let hideTimer = null;
    window.addEventListener('seo:snapshot-state', event => {
      const { state, message, elapsedMs } = event.detail || {};
      window.clearTimeout(hideTimer);
      pill.hidden = false;
      pill.dataset.state = state || 'ready';

      const elapsed = elapsedMs && state === 'building'
        ? ` ${Math.floor(elapsedMs / 1000)}s`
        : '';
      pill.textContent = `${message || state || 'Ready'}${elapsed}`;

      if (state === 'ready') {
        hideTimer = window.setTimeout(() => {
          pill.hidden = true;
        }, 6000);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    createRefreshButton();
    createStatusPill();
  });
})();
