(function () {
  class SeoApiError extends Error {
    constructor(message, options = {}) {
      super(message);
      this.name = "SeoApiError";
      this.status = options.status || 0;
      this.code = options.code || "API_ERROR";
      this.payload = options.payload || null;
      this.retryable = options.retryable === true;
    }
  }

  async function request(path, options = {}) {
    const response = await fetch(path, {
      method: options.method || "GET",
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

    const raw = await response.text();
    let payload = null;

    if (raw.trim()) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = { raw };
      }
    }

    if (!response.ok && response.status !== 202) {
      throw new SeoApiError(
        payload?.error || payload?.message || `Request failed (${response.status}).`,
        {
          status: response.status,
          code: payload?.code,
          payload,
          retryable: payload?.retryable,
        },
      );
    }

    return {
      status: response.status,
      payload: payload || {},
      retryAfter: Number(response.headers.get("retry-after") || 0),
    };
  }

  function cleanInput(input) {
    return {
      clientId: String(input.clientId || input.projectId || "").trim(),
      from: String(input.from || "").trim(),
      to: String(input.to || "").trim(),
    };
  }

  async function listClients() {
    const result = await request("/.netlify/functions/clients");
    return result.payload;
  }

  async function getReport(input) {
    const result = await request("/.netlify/functions/report", {
      method: "POST",
      body: {
        ...cleanInput(input),
        view: input.view || "overview",
      },
    });

    return result;
  }

  async function refreshReport(input) {
    const result = await request("/.netlify/functions/refresh-report", {
      method: "POST",
      body: cleanInput(input),
    });

    return result;
  }

  async function askAi(input) {
    const result = await request("/.netlify/functions/ai-chat", {
      method: "POST",
      body: {
        ...cleanInput(input),
        question: input.question,
        pageContext: input.pageContext || "auto",
        conversation: Array.isArray(input.conversation)
          ? input.conversation.slice(-8)
          : [],
        debug: input.debug === true,
      },
    });

    return result;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForReport(input, options = {}) {
    const startedAt = Date.now();
    const timeoutMs = options.timeoutMs || 5 * 60 * 1000;
    let attempt = 0;

    while (Date.now() - startedAt < timeoutMs) {
      attempt += 1;

      const result = await getReport(input);

      if (result.status === 200 && result.payload?.ok === true) {
        return result.payload;
      }

      options.onProgress?.({
        attempt,
        elapsedMs: Date.now() - startedAt,
        payload: result.payload,
      });

      const waitSeconds = result.retryAfter || 8;
      await sleep(waitSeconds * 1000);
    }

    throw new SeoApiError(
      "The analytics snapshot is still being prepared. Try again shortly.",
      {
        status: 504,
        code: "SNAPSHOT_WAIT_TIMEOUT",
        retryable: true,
      },
    );
  }

  window.NetlifySeoApi = {
    SeoApiError,
    listClients,
    getReport,
    refreshReport,
    askAi,
    waitForReport,
  };
})();
