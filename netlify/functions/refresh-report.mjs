import {
  createRequestId,
  enforceSameOrigin,
  errorResponse,
  fetchJson,
  jsonResponse,
  parseJsonBody,
  stringValue,
  validateDateRange,
} from "./_shared/http.mjs";

export default async function handler(request) {
  const requestId = createRequestId("refresh");

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

  const token = process.env.SEO_INTERNAL_REFRESH_TOKEN;
  if (!token) {
    return errorResponse({
      status: 500,
      code: "REFRESH_TOKEN_NOT_CONFIGURED",
      message:
        "SEO_INTERNAL_REFRESH_TOKEN is not configured in Netlify.",
      requestId,
    });
  }

  try {
    const body = await parseJsonBody(request);

    const clientId = stringValue(
      body.clientId ?? body["client-id"] ?? body.projectId,
      120,
    ).toLowerCase();
    const from = stringValue(body.from, 10);
    const to = stringValue(body.to, 10);

    if (!clientId) {
      return errorResponse({
        status: 400,
        code: "CLIENT_REQUIRED",
        message: "clientId is required.",
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

    const workerUrl = new URL(
      "/.netlify/functions/refresh-report-worker",
      request.url,
    ).toString();

    const workerResult = await fetchJson(workerUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-seo-internal-token": token,
        "x-request-id": requestId,
      },
      body: {
        clientId,
        from,
        to,
        requestId,
      },
      timeoutMs: 15_000,
    });

    if (workerResult.status !== 202 && !workerResult.ok) {
      return errorResponse({
        status: 502,
        code: "REFRESH_WORKER_REJECTED",
        message: "The background refresh could not be started.",
        requestId,
        retryable: true,
      });
    }

    return jsonResponse(
      {
        ok: true,
        accepted: true,
        status: "building",
        clientId,
        from,
        to,
        requestId,
        pollAfterSeconds: 8,
      },
      202,
      { "retry-after": "8" },
    );
  } catch (error) {
    return errorResponse({
      status: error.status || 500,
      code: error.code || "REFRESH_PROXY_ERROR",
      message: error.message || "The refresh could not be started.",
      requestId,
      retryable: true,
    });
  }
}

export const config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip"],
    windowSize: 300,
    windowLimit: 6,
  },
};
