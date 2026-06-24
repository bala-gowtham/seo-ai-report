(function () {
  const api = window.NetlifySeoApi;
  if (!api) return;

  const state = {
    open: false,
    busy: false,
    conversation: [],
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function currentFilters() {
    return {
      clientId:
        document.getElementById("projectSelector")?.value || "demo",
      from: document.getElementById("fromDateSelector")?.value || "",
      to: document.getElementById("toDateSelector")?.value || "",
    };
  }

  function normalizeAiTerminology(value) {
    return String(value ?? "")
      .replace(/\bnative AI Assistant sessions\b/gi, "AI referral sessions")
      .replace(/\bAI[- ]Assistant sessions\b/gi, "AI referral sessions")
      .replace(/\bAI[- ]Assistant traffic\b/gi, "AI referral traffic")
      .replace(/\bAI[- ]assistant referrals\b/gi, "AI referrals")
      .replace(/\bAI traffic\b/gi, "AI referral traffic")
      .replace(
        /The data for AI referral traffic is new, with all previous values being zero, which means there is no historical trend for comparison\.?/gi,
        "No AI referral sessions were detected in the comparison period, so a historical trend cannot be established.",
      );
  }

  function numberValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatNumber(value) {
    const numeric = numberValue(value);
    if (numeric === null) return "Not available";
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    }).format(numeric);
  }

  function formatPercent(value) {
    const numeric = numberValue(value);
    return numeric === null ? "Not available" : `${formatNumber(numeric)}%`;
  }

  function sourceDisplayName(value) {
    const source = String(value || "Unknown").trim();
    const normalized = source.toLowerCase();
    const labels = {
      "chatgpt.com": "ChatGPT",
      "gemini.google.com": "Gemini",
      "perplexity.ai": "Perplexity",
      "copilot.microsoft.com": "Microsoft Copilot",
      "claude.ai": "Claude",
    };
    return labels[normalized] || source;
  }

  function supportingFacts(response) {
    return Array.isArray(response?.supportingData)
      ? response.supportingData.filter(Boolean)
      : [];
  }

  function isAiReferralResponse(response) {
    if (response?.classification?.intent === "ai_traffic") return true;
    return supportingFacts(response).some((fact) =>
      String(fact?.source || "").toLowerCase().includes("ai assistant"),
    );
  }

  function aiMetricValue(response, metric) {
    const fact = supportingFacts(response).find((item) => {
      const source = String(item?.source || "").toLowerCase();
      return (
        source.includes("ai assistant") &&
        String(item?.data?.metric || "").toLowerCase() === metric
      );
    });

    return numberValue(fact?.data?.value ?? fact?.data?.current);
  }

  function aiSourceRows(response) {
    if (!isAiReferralResponse(response)) return [];

    const rows = supportingFacts(response)
      .filter((fact) => {
        const source = String(fact?.source || "").toLowerCase();
        const data = fact?.data || {};
        return (
          source.includes("ai assistant") &&
          !data.metric &&
          !data.landingPage &&
          (data.source || /^AI source\b/i.test(String(fact?.statement || ""))) &&
          numberValue(data.sessions) !== null
        );
      })
      .map((fact) => {
        const data = fact.data || {};
        return {
          id: String(fact.id || ""),
          source: sourceDisplayName(data.source || data.name),
          sessions: numberValue(data.sessions),
          engagementRate: numberValue(data.engagementRate),
          conversions: numberValue(data.conversions),
        };
      });

    const deduplicated = new Map();
    rows.forEach((row) => {
      const key = row.source.toLowerCase();
      if (!deduplicated.has(key)) deduplicated.set(key, row);
    });

    return [...deduplicated.values()].sort(
      (a, b) => (b.sessions || 0) - (a.sessions || 0),
    );
  }

  function aiSessionSampleSize(response) {
    const metricValue = aiMetricValue(response, "sessions");
    if (metricValue !== null) return metricValue;

    const rows = aiSourceRows(response);
    return rows.length
      ? rows.reduce((sum, row) => sum + (row.sessions || 0), 0)
      : null;
  }

  function confidencePresentation(response) {
    const modelConfidence = ["high", "medium", "low"].includes(
      String(response?.confidence || "").toLowerCase(),
    )
      ? String(response.confidence).toLowerCase()
      : "unknown";

    let displayed = modelConfidence;
    let reason = "";
    let sampleSize = null;

    if (isAiReferralResponse(response)) {
      sampleSize = aiSessionSampleSize(response);
      if (displayed === "high" && sampleSize !== null && sampleSize < 30) {
        displayed = "medium";
        reason = `Displayed as medium because the answer is based on only ${formatNumber(sampleSize)} AI referral sessions.`;
      }
    }

    if (
      displayed === "high" &&
      (response?.meta?.partial === true || response?.meta?.overallParentPartial === true)
    ) {
      displayed = "medium";
      reason = "Displayed as medium because part of the analytics evidence is incomplete.";
    }

    return {
      displayed,
      modelConfidence,
      adjusted: displayed !== modelConfidence,
      reason,
      sampleSize,
    };
  }

  function appendMessage(container, role, content) {
    const wrapper = element(
      "div",
      `ai-chat-message ai-chat-message-${role}`,
    );
    wrapper.appendChild(element("div", "ai-chat-message-role", role));
    wrapper.appendChild(element("div", "ai-chat-message-text", content));
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
    return wrapper;
  }

  function addListSection(parent, title, items, formatter) {
    if (!Array.isArray(items) || items.length === 0) return;

    const section = element("section", "ai-chat-result-section");
    section.appendChild(element("h4", "", title));

    const list = element("div", "ai-chat-result-list");
    items.forEach((item) => {
      const card = element("div", "ai-chat-result-card");
      formatter(card, item);
      list.appendChild(card);
    });

    section.appendChild(list);
    parent.appendChild(section);
  }

  function renderAiSourceTable(parent, response) {
    const rows = aiSourceRows(response);
    if (!rows.length) return;

    const section = element("section", "ai-chat-result-section ai-chat-source-summary");
    section.appendChild(element("h4", "", "AI referral source summary"));

    const scroller = element("div", "ai-chat-table-scroll");
    const table = element("table", "ai-chat-source-table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Source", "Sessions", "Engagement", "Conversions"].forEach((label) => {
      headRow.appendChild(element("th", "", label));
    });
    head.appendChild(headRow);

    const body = document.createElement("tbody");
    rows.forEach((row) => {
      const tableRow = document.createElement("tr");
      tableRow.appendChild(element("th", "", row.source));
      tableRow.appendChild(element("td", "", formatNumber(row.sessions)));
      tableRow.appendChild(element("td", "", formatPercent(row.engagementRate)));
      tableRow.appendChild(element("td", "", formatNumber(row.conversions)));
      body.appendChild(tableRow);
    });

    const totalSessions = aiSessionSampleSize(response);
    const totalEngagement = aiMetricValue(response, "engagementrate");
    const totalConversions =
      aiMetricValue(response, "conversions") ??
      rows.reduce((sum, row) => sum + (row.conversions || 0), 0);

    if (totalSessions !== null) {
      const totalRow = document.createElement("tr");
      totalRow.className = "ai-chat-source-total";
      totalRow.appendChild(element("th", "", "Total"));
      totalRow.appendChild(element("td", "", formatNumber(totalSessions)));
      totalRow.appendChild(element("td", "", formatPercent(totalEngagement)));
      totalRow.appendChild(element("td", "", formatNumber(totalConversions)));
      body.appendChild(totalRow);
    }

    table.appendChild(head);
    table.appendChild(body);
    scroller.appendChild(table);
    section.appendChild(scroller);
    parent.appendChild(section);
  }

  function citedEvidence(response) {
    const ids = new Set(
      [
        ...(Array.isArray(response?.answerEvidenceIds)
          ? response.answerEvidenceIds
          : []),
        ...(Array.isArray(response?.findings)
          ? response.findings.flatMap((item) => item?.evidenceIds || [])
          : []),
      ].map(String),
    );

    const facts = supportingFacts(response);
    const selected = ids.size
      ? facts.filter((fact) => ids.has(String(fact?.id)))
      : facts;

    const seen = new Set();
    return selected.filter((fact) => {
      const id = String(fact?.id || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function renderEvidence(parent, response) {
    const facts = citedEvidence(response);
    if (!facts.length) return;

    const details = element("details", "ai-chat-evidence-details");
    details.appendChild(
      element("summary", "", `View supporting evidence (${facts.length})`),
    );

    const list = element("div", "ai-chat-evidence-list");
    facts.forEach((fact) => {
      const item = element("article", "ai-chat-evidence-item");
      const heading = element("div", "ai-chat-evidence-heading");
      heading.appendChild(element("strong", "", String(fact.id || "Evidence")));
      heading.appendChild(
        element(
          "span",
          "",
          normalizeAiTerminology(fact.source || "Analytics evidence"),
        ),
      );
      item.appendChild(heading);
      item.appendChild(
        element(
          "p",
          "",
          normalizeAiTerminology(fact.statement || "Supporting analytics fact"),
        ),
      );
      list.appendChild(item);
    });

    details.appendChild(list);
    parent.appendChild(details);
  }

  function renderAssistantResult(messages, response) {
    const wrapper = element(
      "div",
      "ai-chat-message ai-chat-message-assistant ai-chat-result",
    );

    wrapper.appendChild(
      element("div", "ai-chat-message-role", "assistant"),
    );
    wrapper.appendChild(
      element(
        "div",
        "ai-chat-message-text",
        normalizeAiTerminology(response.answer || ""),
      ),
    );

    const confidence = confidencePresentation(response);
    const meta = element("div", "ai-chat-answer-meta");
    const confidenceBadge = element(
      "span",
      `ai-chat-confidence ai-chat-confidence-${confidence.displayed}`,
      `Confidence: ${confidence.displayed}`,
    );
    if (confidence.reason) confidenceBadge.title = confidence.reason;
    meta.appendChild(confidenceBadge);

    if (confidence.adjusted && confidence.sampleSize !== null) {
      const sampleBadge = element(
        "span",
        "ai-chat-sample-badge",
        `small sample: ${formatNumber(confidence.sampleSize)} sessions`,
      );
      sampleBadge.title = confidence.reason;
      meta.appendChild(sampleBadge);
    }

    if (response.meta?.evidenceCache?.hit) {
      meta.appendChild(
        element("span", "ai-chat-cache-badge", "cached evidence"),
      );
    }

    if (response.grounding?.adjusted) {
      meta.appendChild(
        element("span", "ai-chat-grounding-badge", "grounding adjusted"),
      );
    }

    wrapper.appendChild(meta);

    if (confidence.reason) {
      wrapper.appendChild(
        element("p", "ai-chat-confidence-note", confidence.reason),
      );
    }

    renderAiSourceTable(wrapper, response);

    addListSection(wrapper, "Key findings", response.findings, (card, item) => {
      card.appendChild(
        element(
          "strong",
          "",
          normalizeAiTerminology(item.title || "Finding"),
        ),
      );
      card.appendChild(
        element("p", "", normalizeAiTerminology(item.detail || "")),
      );
    });

    addListSection(
      wrapper,
      "Recommended actions",
      response.recommendations,
      (card, item) => {
        const heading = element("div", "ai-chat-action-heading");
        const priority = String(item.priority || "medium").toLowerCase();
        heading.appendChild(
          element(
            "span",
            `ai-chat-priority ai-chat-priority-${priority}`,
            priority.toUpperCase(),
          ),
        );
        heading.appendChild(
          element(
            "strong",
            "",
            normalizeAiTerminology(item.action || ""),
          ),
        );
        card.appendChild(heading);
        card.appendChild(
          element("p", "", normalizeAiTerminology(item.rationale || "")),
        );
      },
    );

    if (Array.isArray(response.limitations) && response.limitations.length) {
      const details = element("details", "ai-chat-limitations");
      details.appendChild(
        element(
          "summary",
          "",
          `Data limitations (${response.limitations.length})`,
        ),
      );
      const list = element("ul");
      response.limitations.forEach((item) => {
        list.appendChild(
          element("li", "", normalizeAiTerminology(item)),
        );
      });
      details.appendChild(list);
      wrapper.appendChild(details);
    }

    renderEvidence(wrapper, response);

    if (
      Array.isArray(response.suggestedQuestions) &&
      response.suggestedQuestions.length
    ) {
      const section = element("section", "ai-chat-followups");
      section.appendChild(element("h4", "", "Ask a follow-up"));
      const suggestions = element("div", "ai-chat-suggestions");
      response.suggestedQuestions.slice(0, 4).forEach((question) => {
        const normalizedQuestion = normalizeAiTerminology(question);
        const button = element(
          "button",
          "ai-chat-suggestion",
          normalizedQuestion,
        );
        button.type = "button";
        button.dataset.question = normalizedQuestion;
        button.setAttribute("aria-label", `Ask: ${normalizedQuestion}`);
        suggestions.appendChild(button);
      });
      section.appendChild(suggestions);
      wrapper.appendChild(section);
    }

    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  async function prepareSnapshot(filters, status) {
    status.textContent = "Preparing analytics snapshot. This can take about two minutes…";

    await api.refreshReport(filters);
    await api.waitForReport(
      { ...filters, view: "ai" },
      {
        timeoutMs: 6 * 60 * 1000,
        onProgress(progress) {
          status.textContent =
            `Preparing analytics snapshot… ${Math.floor(progress.elapsedMs / 1000)}s`;
        },
      },
    );
  }

  function buildChat() {
    const launch = element("button", "ai-chat-launch", "Ask AI");
    launch.type = "button";
    launch.setAttribute("aria-expanded", "false");
    launch.setAttribute("aria-controls", "aiChatPanel");

    const panel = element("aside", "ai-chat-panel");
    panel.id = "aiChatPanel";
    panel.hidden = true;

    const header = element("header", "ai-chat-header");
    const heading = element("div");
    heading.appendChild(element("strong", "", "SEO AI Assistant"));
    heading.appendChild(
      element("span", "", "Answers use the selected project and date range."),
    );

    const close = element("button", "ai-chat-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close AI assistant");
    header.appendChild(heading);
    header.appendChild(close);

    const controls = element("div", "ai-chat-controls");
    const contextSelect = document.createElement("select");
    contextSelect.className = "ai-chat-context";
    contextSelect.setAttribute("aria-label", "AI answer context");
    [
      ["auto", "Auto"],
      ["overview", "Overview"],
      ["ga4", "GA4"],
      ["gsc", "GSC"],
      ["ai", "AI referral traffic"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      contextSelect.appendChild(option);
    });
    controls.appendChild(contextSelect);

    const clear = element("button", "ai-chat-clear", "Clear conversation");
    clear.type = "button";
    controls.appendChild(clear);

    const messages = element("div", "ai-chat-messages");
    messages.setAttribute("aria-live", "polite");
    appendMessage(
      messages,
      "assistant",
      "Ask about traffic, engagement, rankings, queries, landing pages, or AI referrals.",
    );

    const status = element("div", "ai-chat-status");
    status.hidden = true;

    const form = element("form", "ai-chat-form");
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Ask a question about this report…";
    textarea.rows = 3;
    textarea.maxLength = 2000;
    textarea.setAttribute("aria-label", "Question for SEO AI Assistant");

    const send = element("button", "ai-chat-send", "Send");
    send.type = "submit";

    form.appendChild(textarea);
    form.appendChild(send);

    panel.appendChild(header);
    panel.appendChild(controls);
    panel.appendChild(messages);
    panel.appendChild(status);
    panel.appendChild(form);

    document.body.appendChild(launch);
    document.body.appendChild(panel);

    function setOpen(open) {
      state.open = open;
      panel.hidden = !open;
      launch.setAttribute("aria-expanded", String(open));
      if (open) textarea.focus();
    }

    launch.addEventListener("click", () => setOpen(!state.open));
    close.addEventListener("click", () => setOpen(false));

    clear.addEventListener("click", () => {
      state.conversation = [];
      messages.textContent = "";
      appendMessage(
        messages,
        "assistant",
        "Conversation cleared. Ask a new analytics question.",
      );
    });

    messages.addEventListener("click", (event) => {
      const button = event.target?.closest?.("[data-question]");
      const question = button?.dataset?.question;
      if (!question || state.busy) return;
      textarea.value = question;
      form.requestSubmit();
    });

    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.busy) return;

      const question = textarea.value.trim();
      if (question.length < 3) return;

      const selected = currentFilters();
      if (!selected.clientId || selected.clientId === "demo") {
        appendMessage(
          messages,
          "assistant",
          "Select a live project and generate its report before using AI chat.",
        );
        return;
      }

      state.busy = true;
      send.disabled = true;
      textarea.disabled = true;
      messages
        .querySelectorAll(".ai-chat-suggestion")
        .forEach((button) => {
          button.disabled = true;
        });
      status.hidden = false;
      status.textContent = "Analyzing cached analytics data…";

      appendMessage(messages, "user", question);
      textarea.value = "";

      try {
        let result = await api.askAi({
          ...selected,
          question,
          pageContext: contextSelect.value,
          conversation: state.conversation,
        });

        if (result.status === 202 || result.payload?.pending) {
          await prepareSnapshot(selected, status);

          result = await api.askAi({
            ...selected,
            question,
            pageContext: contextSelect.value,
            conversation: state.conversation,
          });
        }

        const response = result.payload;
        renderAssistantResult(messages, response);

        state.conversation.push(
          { role: "user", content: question },
          {
            role: "assistant",
            content: response.answer || "No answer returned.",
          },
        );
        state.conversation = state.conversation.slice(-8);
      } catch (error) {
        console.error("AI chat failed:", error);
        appendMessage(
          messages,
          "assistant",
          error.message || "The AI assistant request failed.",
        );
      } finally {
        state.busy = false;
        send.disabled = false;
        textarea.disabled = false;
        messages
          .querySelectorAll(".ai-chat-suggestion")
          .forEach((button) => {
            button.disabled = false;
          });
        status.hidden = true;
        textarea.focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", buildChat);
})();
