export const CACHE_SCHEMA_VERSION =
  process.env.SEO_CACHE_SCHEMA || "parent-v5-compact-gsc1";

export function createRequestId(prefix = "netlify") {
  const random =
    globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function jsonResponse(payload, status = 200, extraHeaders = {}) {
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

export function errorResponse({
  status = 500,
  code = "INTERNAL_ERROR",
  message = "The request could not be completed.",
  requestId,
  details,
  retryable = false,
}) {
  return jsonResponse(
    {
      ok: false,
      code,
      error: message,
      requestId,
      retryable,
      ...(details ? { details } : {}),
    },
    status,
  );
}

export async function parseJsonBody(request, maxBytes = 64_000) {
  const raw = await request.text();
  if (raw.length > maxBytes) {
    const error = new Error("Request body is too large.");
    error.code = "BODY_TOO_LARGE";
    error.status = 413;
    throw error;
  }

  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Request body must contain valid JSON.");
    error.code = "INVALID_JSON";
    error.status = 400;
    throw error;
  }
}

export function stringValue(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function booleanValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(
    String(value).trim().toLowerCase(),
  );
}

export function validateDateRange(from, to, maxDays = 366) {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  const parse = (value) => {
    if (!pattern.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      return null;
    }
    return date;
  };

  const start = parse(from);
  const end = parse(to);

  if (!start || !end) {
    return {
      valid: false,
      message: "from and to must be valid YYYY-MM-DD dates.",
    };
  }

  if (start > end) {
    return {
      valid: false,
      message: "from must be on or before to.",
    };
  }

  const days = Math.floor((end - start) / 86_400_000) + 1;
  if (days > maxDays) {
    return {
      valid: false,
      message: `The date range cannot exceed ${maxDays} days.`,
    };
  }

  return { valid: true, days };
}

export function n8nUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = stringValue(process.env.N8N_BASE_URL, 500).replace(/\/+$/, "");
  if (!base) {
    const error = new Error("N8N_BASE_URL is not configured in Netlify.");
    error.code = "N8N_BASE_URL_MISSING";
    error.status = 500;
    throw error;
  }

  const path = String(pathOrUrl || "").startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;

  return `${base}${path}`;
}

export function n8nHeaders(requestId, additional = {}) {
  const sharedSecret = stringValue(
    process.env.SEO_REPORT_SHARED_SECRET,
    2_000,
  );

  if (!sharedSecret) {
    const error = new Error(
      "SEO_REPORT_SHARED_SECRET is not configured in Netlify.",
    );
    error.code = "N8N_SHARED_SECRET_MISSING";
    error.status = 500;
    throw error;
  }

  const legacySecret = stringValue(process.env.N8N_PROXY_SECRET, 2_000);

  return {
    "content-type": "application/json",
    accept: "application/json",
    "x-request-id": requestId,
    ...additional,
    "x-seo-report-secret": sharedSecret,
    ...(legacySecret ? { "x-seo-proxy-secret": legacySecret } : {}),
  };
}

export async function fetchJson(
  url,
  { method = "POST", headers = {}, body, timeoutMs = 50_000 } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : typeof body === "string"
            ? body
            : JSON.stringify(body),
      signal: controller.signal,
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

    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      payload,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("The upstream request timed out.");
      timeoutError.code = "UPSTREAM_TIMEOUT";
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function enforceSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.SEO_ALLOWED_ORIGIN;

  if (origin !== requestOrigin && origin !== configuredOrigin) {
    return errorResponse({
      status: 403,
      code: "ORIGIN_NOT_ALLOWED",
      message: "This origin is not allowed to use the API.",
      requestId: createRequestId("origin"),
    });
  }

  return null;
}

export function safeUpstreamMessage(result, fallback) {
  return (
    result?.payload?.error ||
    result?.payload?.message ||
    result?.payload?.code ||
    fallback
  );
}

export function cacheRequestBody({
  clientId,
  from,
  to,
  view,
  action = "get",
  requestId,
}) {
  return {
    action,
    clientId,
    from,
    to,
    view,
    schemaVersion: CACHE_SCHEMA_VERSION,
    requestId,
  };
}
