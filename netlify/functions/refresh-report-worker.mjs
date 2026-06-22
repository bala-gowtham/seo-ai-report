import {
  createRequestId,
  fetchJson,
  n8nHeaders,
  n8nUrl,
  parseJsonBody,
  stringValue,
  validateDateRange,
} from "./_shared/http.mjs";

export default async function handler(request) {
  const requestId =
    request.headers.get("x-request-id") ||
    createRequestId("refresh_worker");

  const expectedToken = process.env.SEO_INTERNAL_REFRESH_TOKEN;
  const suppliedToken = request.headers.get("x-seo-internal-token");

  if (!expectedToken || suppliedToken !== expectedToken) {
    console.error(
      JSON.stringify({
        requestId,
        event: "refresh_worker_rejected",
        reason: "invalid_internal_token",
      }),
    );
    return;
  }

  try {
    const body = await parseJsonBody(request);
    const clientId = stringValue(body.clientId, 120).toLowerCase();
    const from = stringValue(body.from, 10);
    const to = stringValue(body.to, 10);

    const range = validateDateRange(from, to);
    if (!clientId || !range.valid) {
      throw new Error("Invalid background refresh payload.");
    }

    console.log(
      JSON.stringify({
        requestId,
        event: "snapshot_refresh_started",
        clientId,
        from,
        to,
      }),
    );

    const result = await fetchJson(
      n8nUrl(
        process.env.N8N_PARENT_WEBHOOK_PATH ||
          "/webhook/seo-report-orchestrator",
      ),
      {
        method: "POST",
        headers: n8nHeaders(requestId),
        body: {
          "client-id": clientId,
          from,
          to,
          view: "overview",
          forceRefresh: true,
          cacheEnabled: true,
          debug: false,
          requestId,
        },
        timeoutMs: 14 * 60 * 1_000,
      },
    );

    if (!result.ok || result.payload?.ok !== true) {
      throw new Error(
        result.payload?.error ||
          result.payload?.message ||
          `Parent returned ${result.status}.`,
      );
    }

    console.log(
      JSON.stringify({
        requestId,
        event: "snapshot_refresh_completed",
        clientId,
        from,
        to,
        stored: result.payload?.meta?.cache?.stored === true,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        requestId,
        event: "snapshot_refresh_failed",
        message: error.message,
      }),
    );
    throw error;
  }
}

export const config = {
  background: true,
};
