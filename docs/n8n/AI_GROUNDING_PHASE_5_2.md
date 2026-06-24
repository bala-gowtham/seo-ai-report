# Import Phase 5.2 into n8n

## Workflow to replace

Deactivate:

`SEO Report - AI Assistant Orchestrator - Phase 5.1 Evidence-Aware AI Grounding`

Import and activate:

`SEO Report - AI Assistant Orchestrator - Phase 5.2 Resilient Deterministic Fallback.json`

## Import steps

1. In n8n, deactivate the currently active AI Assistant workflow.
2. Use **Import from File**.
3. Select the Phase 5.2 JSON file included in this kit.
4. Open `Call Gemini` and confirm the `Gemini API Key` credential is selected.
5. Save the workflow.
6. Activate Phase 5.2.
7. Confirm that Phase 5.1 remains inactive.

Only one active workflow should own:

`/webhook/seo-report-ai-assistant`

## Expected behavior

### AI source question

Question:

`Where did AI referral traffic come from?`

Expected:

* HTTP 200
* `classification.intent` is `ai_sources`
* `meta.responseMode` is `deterministic_evidence`
* source table contains ChatGPT, Gemini, and Perplexity
* Gemini is not called

### AI landing-page question

Question:

`What are the top landing pages for AI referral traffic?`

Expected:

* HTTP 200
* `classification.intent` is `ai_landing_pages`
* `meta.responseMode` is `deterministic_evidence`
* landing-page table is returned
* Gemini is not called

### Gemini outage on other questions

Expected:

* HTTP 200 when deterministic facts are available
* `meta.responseMode` is `deterministic_model_fallback`
* `grounding.modelFallback` is true
* the model error is only exposed under debug output
