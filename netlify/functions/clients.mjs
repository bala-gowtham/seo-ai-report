import {
  createRequestId,
  errorResponse,
  fetchJson,
  jsonResponse,
  n8nHeaders,
  n8nUrl,
  safeUpstreamMessage,
} from "./_shared/http.mjs";

export default async function handler(request) {
  const requestId = createRequestId("clients");

  if (request.method !== "GET") {
    return errorResponse({
      status: 405,
      code: "METHOD_NOT_ALLOWED",
      message: "Use GET for this endpoint.",
      requestId,
    });
  }

  try {
    const result = await fetchJson(
      n8nUrl(
        process.env.N8N_CLIENTS_WEBHOOK_PATH ||
          "/webhook/seo-report-clients",
      ),
      {
        method: "GET",
        headers: n8nHeaders(requestId),
        timeoutMs: 25_000,
      },
    );

    if (!result.ok || !Array.isArray(result.payload?.clients)) {
      return errorResponse({
        status: result.status >= 400 ? result.status : 502,
        code: "CLIENTS_UPSTREAM_ERROR",
        message: safeUpstreamMessage(
          result,
          "The client list could not be loaded.",
        ),
        requestId,
        retryable: true,
      });
    }

    const clients = result.payload.clients
      .filter((client) => client && client.clientId && client.clientName)
      .map((client) => ({
        clientId: String(client.clientId),
        clientName: String(client.clientName),
        siteUrl: client.siteUrl ? String(client.siteUrl) : null,
      }));

    return jsonResponse(
      {
        ok: true,
        count: clients.length,
        clients,
        requestId,
      },
      200,
      {
        "netlify-cdn-cache-control":
          "public, max-age=300, stale-while-revalidate=600",
      },
    );
  } catch (error) {
    return errorResponse({
      status: error.status || 502,
      code: error.code || "CLIENTS_PROXY_ERROR",
      message: error.message || "The client list could not be loaded.",
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
    windowLimit: 60,
  },
};
