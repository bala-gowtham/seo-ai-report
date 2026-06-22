(function () {
  const api = window.NetlifySeoApi;
  if (!api) {
    console.error("NetlifySeoApi was not loaded.");
    return;
  }

  function filters() {
    return {
      projectId:
        document.getElementById("projectSelector")?.value || "demo",
      from: document.getElementById("fromDateSelector")?.value || "",
      to: document.getElementById("toDateSelector")?.value || "",
    };
  }

  function emitState(state, detail = {}) {
    window.dispatchEvent(
      new CustomEvent("seo:snapshot-state", {
        detail: { state, ...detail },
      }),
    );
  }

  window.fetchClientList = async function fetchClientListViaNetlify() {
    const response = await api.listClients();

    if (!response.ok || !Array.isArray(response.clients)) {
      throw new Error("Invalid clients response.");
    }

    return response.clients;
  };

  window.fetchReportData = async function fetchReportDataViaNetlify(params) {
    const input = {
      clientId: params.projectId,
      from: params.from,
      to: params.to,
      view: "overview",
    };

    let response = await api.getReport(input);

    if (response.status === 202 || response.payload?.pending) {
      emitState("building", {
        message: "Preparing analytics snapshot…",
      });

      await api.refreshReport(input);

      const report = await api.waitForReport(input, {
        timeoutMs: 6 * 60 * 1000,
        onProgress(progress) {
          emitState("building", {
            message: "Preparing analytics snapshot…",
            attempt: progress.attempt,
            elapsedMs: progress.elapsedMs,
          });
        },
      });

      emitState("ready", { message: "Snapshot ready." });
      return normalizeReportData(report, params);
    }

    emitState("ready", {
      message: response.payload?.meta?.cache?.hit
        ? "Loaded cached analytics."
        : "Analytics ready.",
    });

    return normalizeReportData(response.payload, params);
  };

  function createRefreshButton() {
    if (document.getElementById("refreshReportBtn")) return;

    const generate = document.getElementById("submitReportBtn");
    if (!generate?.parentElement) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "refreshReportBtn";
    button.className = "btn-refresh-data";
    button.textContent = "Refresh data";
    button.title =
      "Collect GA4 and GSC again and replace the cached snapshot.";

    generate.insertAdjacentElement("afterend", button);

    button.addEventListener("click", async () => {
      const current = filters();

      if (!current.projectId || current.projectId === "demo") {
        emitState("error", {
          message: "Select a live project before refreshing data.",
        });
        return;
      }

      button.disabled = true;
      button.textContent = "Refreshing…";
      emitState("building", {
        message: "Refreshing GA4 and GSC in the background…",
      });

      try {
        await api.refreshReport({
          clientId: current.projectId,
          from: current.from,
          to: current.to,
        });

        const payload = await api.waitForReport(
          {
            clientId: current.projectId,
            from: current.from,
            to: current.to,
            view: "overview",
          },
          {
            timeoutMs: 6 * 60 * 1000,
            onProgress(progress) {
              emitState("building", {
                message: "Refreshing GA4 and GSC in the background…",
                attempt: progress.attempt,
                elapsedMs: progress.elapsedMs,
              });
            },
          },
        );

        const report = normalizeReportData(payload, current);

        try {
          currentReport = report;
        } catch {
          // The current repository keeps this variable in ui.js.
        }

        if (typeof renderDashboard === "function") {
          renderDashboard(report);
        }

        const ga4Panel = document.getElementById("ga4TabContent");
        if (
          ga4Panel?.style.display === "block" &&
          typeof renderGa4Tab === "function"
        ) {
          renderGa4Tab(report);
        }

        emitState("ready", { message: "Analytics refreshed." });
      } catch (error) {
        console.error("Snapshot refresh failed:", error);
        emitState("error", {
          message: error.message || "The refresh failed.",
        });
      } finally {
        button.disabled = false;
        button.textContent = "Refresh data";
      }
    });
  }

  function createStatusPill() {
    if (document.getElementById("snapshotStatusPill")) return;

    const topbar = document.querySelector(".report-topbar");
    if (!topbar) return;

    const pill = document.createElement("div");
    pill.id = "snapshotStatusPill";
    pill.className = "snapshot-status-pill";
    pill.hidden = true;
    topbar.insertAdjacentElement("afterend", pill);

    window.addEventListener("seo:snapshot-state", (event) => {
      const { state, message, elapsedMs } = event.detail || {};
      pill.hidden = false;
      pill.dataset.state = state || "ready";

      const elapsed =
        elapsedMs && state === "building"
          ? ` ${Math.floor(elapsedMs / 1000)}s`
          : "";

      pill.textContent = `${message || state || "Ready"}${elapsed}`;

      if (state === "ready") {
        window.setTimeout(() => {
          pill.hidden = true;
        }, 5000);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    createRefreshButton();
    createStatusPill();
  });
})();
