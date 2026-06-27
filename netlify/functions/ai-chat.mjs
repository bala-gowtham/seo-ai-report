import {
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

const CONTEXTS = new Set(["auto", "overview", "ga4", "gsc", "ai"]);

export default async function handler(request) {
const requestId = createRequestId("ai");

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
const body = await parseJsonBody(request, 80_000);

```
const clientId = stringValue(
  body.clientId ?? body["client-id"] ?? body.projectId,
  120,
).toLowerCase();

const from = stringValue(body.from, 10);
const to = stringValue(body.to, 10);
const question = stringValue(body.question ?? body.message, 2_000);

const contextRaw = stringValue(
  body.pageContext ?? body.context ?? "auto",
  20,
).toLowerCase();

const pageContext = CONTEXTS.has(contextRaw) ? contextRaw : "auto";

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

if (question.length < 3) {
  return errorResponse({
    status: 400,
    code: "QUESTION_REQUIRED",
    message: "question must contain at least 3 characters.",
    requestId,
  });
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

const result = await fetchJson(
  n8nUrl(
    process.env.N8N_AI_WEBHOOK_PATH ||
      "/webhook/seo-report-ai-assistant",
  ),
  {
    method: "POST",
    headers: n8nHeaders(requestId),
    body: {
      clientId,
      from,
      to,
      question,
      pageContext,
      conversation,
      cacheEnabled: true,
      forceRefresh: false,
      allowStale: false,
      debug: Boolean(body.debug),
      requestId,
    },
    timeoutMs: 55_000,
  },
);

if (
  result.status === 202 &&
  result.payload?.pending === true &&
  result.payload?.code === "REPORT_REQUIRED"
) {
  return jsonResponse(
    {
      ...result.payload,
      requestId: result.payload.requestId || requestId,
    },
    202,
    {
      "retry-after": String(
        result.payload.retryAfterSeconds || 8
      ),
    },
  );
}

if (!result.ok || result.payload?.ok !== true) {
  return errorResponse({
    status: result.status >= 400 ? result.status : 502,
    code: result.payload?.code || "AI_UPSTREAM_ERROR",
    message: safeUpstreamMessage(
      result,
      "The AI assistant could not answer this question.",
    ),
    requestId: result.payload?.requestId || requestId,
    details: result.payload?.fallbackAnswer
      ? {
          fallbackAnswer: result.payload.fallbackAnswer,
        }
      : undefined,
    retryable: result.payload?.retryable !== false,
  });
}

return jsonResponse({
  ...result.payload,
  requestId: result.payload.requestId || requestId,
});
```

} catch (error) {
return errorResponse({
status: error.status || 500,
code: error.code || "AI_PROXY_ERROR",
message:
error.message || "The AI assistant request failed.",
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
windowLimit: 12,
},
};
