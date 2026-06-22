import {
  cacheRequestBody,
  createRequestId,
  enforceSameOrigin,
  errorResponse,
  fetchJson,
  jsonResponse,
  n8nHeaders,
  n8nUrl,
  parseJsonBody,
  safeUpstreamMessage,
  stringValue,
  validateDateRange,
} from "./_shared/http.mjs";

const ALLOWED_VIEWS = new Set(["overview", "ga4", "gsc", "ai"]);

export default async function handler(request) {
  const requestId = createRequestId("report");

  if (request.method !== "POST") {
    return errorResponse({
      status: 405,
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST for this endpoint.",
      requestId,
    });
  }

  const originError = enforceSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await parseJsonBody(request);

    const clientId = stringValue(
      body.clientId ?? body["client-id"] ?? body.projectId,
      120,
    ).toLowerCase();
    const from = stringValue(body.from, 10);
    const to = stringValue(body.to, 10);
    const view = stringValue(body.view || "overview", 20).toLowerCase();

    if (!clientId) {
      return errorResponse({
        status: 400,
        code: "CLIENT_REQUIRED",
        message: "clientId is required.",
        requestId,
      });
    }

    if (!ALLOWED_VIEWS.has(view)) {
      return errorResponse({
        status: 400,
        code: "INVALID_VIEW",
        message: "view must be overview, ga4, gsc, or ai.",
        requestId,
      });
    }

    const range = validateDateRange(from, to);
    if (!range.valid) {
      return errorResponse({
        status: 400,
        code: "INVALID_DATE_RANGE",
        message: range.message,
        requestId,
      });
    }

    const result = await fetchJson(
      n8nUrl(
        process.env.N8N_CACHE_WEBHOOK_PATH ||
          "/webhook/seo-report-snapshot-cache",
      ),
      {
        method: "POST",
        headers: n8nHeaders(requestId),
        body: cacheRequestBody({
          clientId,
          from,
          to,
          view,
          action: "get",
          requestId,
        }),
        timeoutMs: 55_000,
      },
    );

    if (
      result.ok &&
      result.payload?.ok === true &&
      result.payload?.hit === true &&
      result.payload?.payload
    ) {
      const report = structuredClone(result.payload.payload);
      report.meta =
        report.meta && typeof report.meta === "object" ? report.meta : {};

      report.meta.cache = {
        hit: true,
        stale: result.payload.cache?.stale === true,
        partial: result.payload.cache?.partial === true,
        snapshotKey: result.payload.cache?.snapshotKey || null,
        cacheKey: result.payload.cache?.cacheKey || null,
        generatedAt: result.payload.cache?.generatedAt || null,
        expiresAt: result.payload.cache?.expiresAt || null,
        schemaVersion: result.payload.cache?.schemaVersion || null,
        view,
      };

      report.requestId = requestId;
      return jsonResponse(report);
    }

    if (
      result.ok &&
      result.payload?.ok === true &&
      result.payload?.hit === false
    ) {
      return jsonResponse(
        {
          ok: false,
          pending: true,
          code: "SNAPSHOT_MISSING",
          message:
            "This project and date range do not have a ready snapshot yet.",
          clientId,
          from,
          to,
          view,
          reason: result.payload.reason || "not_found",
          requestId,
        },
        202,
        { "retry-after": "8" },
      );
    }

    return errorResponse({
      status: result.status >= 400 ? result.status : 502,
      code: "CACHE_READ_ERROR",
      message: safeUpstreamMessage(
        result,
        "The cached report could not be loaded.",
      ),
      requestId,
      retryable: true,
    });
  } catch (error) {
    return errorResponse({
      status: error.status || 500,
      code: error.code || "REPORT_PROXY_ERROR",
      message: error.message || "The report could not be loaded.",
      requestId,
      retryable: true,
    });
  }
}

export const config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip"],
    windowSize: 60,
    windowLimit: 40,
  },
};
