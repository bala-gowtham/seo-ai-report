const CONTEXTS = new Set(["auto", "overview", "ga4", "gsc", "ai"]);

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function createRequestId() {
  return `ai_edge_${Date.now().toString(36)}_${crypto.randomUUID()}`;
}

function stringValue(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export default async function handler(request) {
  const requestId = createRequestId();

  if (request.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        code: "METHOD_NOT_ALLOWED",
        error: "Use POST for this endpoint.",
        requestId,
        retryable: false,
      },
      405,
    );
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const requestOrigin = new URL(request.url).origin;
      const suppliedOrigin = new URL(origin).origin;
      if (requestOrigin !== suppliedOrigin) {
        return jsonResponse(
          {
            ok: false,
            code: "ORIGIN_NOT_ALLOWED",
            error: "Cross-origin requests are not allowed.",
            requestId,
            retryable: false,
          },
          403,
        );
      }
    } catch {
      return jsonResponse(
        {
          ok: false,
          code: "INVALID_ORIGIN",
          error: "The request origin is invalid.",
          requestId,
          retryable: false,
        },
        403,
      );
    }
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 80_000) {
    return jsonResponse(
      {
        ok: false,
        code: "REQUEST_TOO_LARGE",
        error: "The request body is too large.",
        requestId,
        retryable: false,
      },
      413,
    );
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse(
      {
        ok: false,
        code: "INVALID_BODY",
        error: "The request body could not be read.",
        requestId,
        retryable: false,
      },
      400,
    );
  }

  if (new TextEncoder().encode(rawBody).length > 80_000) {
    return jsonResponse(
      {
        ok: false,
        code: "REQUEST_TOO_LARGE",
        error: "The request body is too large.",
        requestId,
        retryable: false,
      },
      413,
    );
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse(
      {
        ok: false,
        code: "INVALID_JSON",
        error: "Request body must contain valid JSON.",
        requestId,
        retryable: false,
      },
      400,
    );
  }

  const clientId = stringValue(
    body.clientId ?? body["client-id"] ?? body.projectId,
    120,
  ).toLowerCase();
  const from = stringValue(body.from, 10);
  const to = stringValue(body.to, 10);
  const question = stringValue(body.question ?? body.message, 2_000);
  const contextValue = stringValue(
    body.pageContext ?? body.context ?? "auto",
    20,
  ).toLowerCase();
  const pageContext = CONTEXTS.has(contextValue) ? contextValue : "auto";

  if (!clientId) {
    return jsonResponse(
      {
        ok: false,
        code: "CLIENT_REQUIRED",
        error: "clientId is required.",
        requestId,
        retryable: false,
      },
      400,
    );
  }

  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    return jsonResponse(
      {
        ok: false,
        code: "INVALID_DATE_RANGE",
        error: "Provide a valid from and to date range.",
        requestId,
        retryable: false,
      },
      400,
    );
  }

  if (question.length < 3) {
    return jsonResponse(
      {
        ok: false,
        code: "QUESTION_REQUIRED",
        error: "question must contain at least 3 characters.",
        requestId,
        retryable: false,
      },
      400,
    );
  }

  const conversation = (
    Array.isArray(body.conversation) ? body.conversation : []
  )
    .slice(-8)
    .map((message) => ({
      role:
        String(message?.role).toLowerCase() === "assistant"
          ? "assistant"
          : "user",
      content: stringValue(
        message?.content ?? message?.text ?? message?.message,
        1_200,
      ),
    }))
    .filter((message) => message.content);

  const baseUrl = stringValue(Netlify.env.get("N8N_BASE_URL"), 500).replace(
    /\/+$/,
    "",
  );
  const webhookPath =
    stringValue(Netlify.env.get("N8N_AI_WEBHOOK_PATH"), 500) ||
    "/webhook/seo-report-ai-assistant";
  const sharedSecret = stringValue(
    Netlify.env.get("SEO_REPORT_SHARED_SECRET"),
    2_000,
  );
  const legacySecret = stringValue(Netlify.env.get("N8N_PROXY_SECRET"), 2_000);

  if (!baseUrl) {
    return jsonResponse(
      {
        ok: false,
        code: "N8N_BASE_URL_MISSING",
        error: "The AI service is not configured.",
        requestId,
        retryable: false,
      },
      500,
    );
  }

  if (!sharedSecret) {
    return jsonResponse(
      {
        ok: false,
        code: "N8N_SHARED_SECRET_MISSING",
        error: "The AI service authentication is not configured.",
        requestId,
        retryable: false,
      },
      500,
    );
  }

  const upstreamUrl = new URL(webhookPath, `${baseUrl}/`).toString();
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "x-request-id": requestId,
    "x-seo-report-secret": sharedSecret,
    ...(legacySecret ? { "x-seo-proxy-secret": legacySecret } : {}),
  };

  const upstreamBody = {
    clientId,
    from,
    to,
    question,
    pageContext,
    conversation,
    cacheEnabled: true,
    forceRefresh: false,
    allowStale: false,
    debug: body.debug === true,
    requestId,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 36_000);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
    });

    const upstreamText = await upstreamResponse.text();
    let payload;
    try {
      payload = JSON.parse(upstreamText);
    } catch {
      return jsonResponse(
        {
          ok: false,
          code: "AI_UPSTREAM_INVALID_JSON",
          error: "The AI service returned an invalid response.",
          requestId,
          retryable: true,
        },
        502,
      );
    }

    if (!upstreamResponse.ok || payload?.ok !== true) {
      return jsonResponse(
        {
          ok: false,
          code: payload?.code || "AI_UPSTREAM_ERROR",
          error:
            payload?.error ||
            payload?.message ||
            "The AI assistant could not answer this question.",
          requestId,
          retryable: true,
          ...(payload?.fallbackAnswer
            ? { details: { fallbackAnswer: payload.fallbackAnswer } }
            : {}),
        },
        upstreamResponse.status >= 400 ? upstreamResponse.status : 502,
      );
    }

    return jsonResponse(
      { ...payload, requestId: payload.requestId || requestId },
      200,
    );
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return jsonResponse(
      {
        ok: false,
        code: timedOut ? "AI_UPSTREAM_TIMEOUT" : "AI_PROXY_ERROR",
        error: timedOut
          ? "The AI assistant took too long to respond."
          : "The AI assistant request failed.",
        requestId,
        retryable: true,
      },
      timedOut ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const config = {
  path: "/api/ai-chat",
  rateLimit: {
    action: "rate_limit",
    aggregateBy: ["ip"],
    windowSize: 60,
    windowLimit: 12,
  },
};
