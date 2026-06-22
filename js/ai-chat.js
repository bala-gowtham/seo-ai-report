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

  function renderAssistantResult(messages, response) {
    const wrapper = element(
      "div",
      "ai-chat-message ai-chat-message-assistant ai-chat-result",
    );

    wrapper.appendChild(
      element("div", "ai-chat-message-role", "assistant"),
    );
    wrapper.appendChild(
      element("div", "ai-chat-message-text", response.answer || ""),
    );

    const meta = element("div", "ai-chat-answer-meta");
    meta.appendChild(
      element(
        "span",
        "ai-chat-confidence",
        `Confidence: ${response.confidence || "unknown"}`,
      ),
    );

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

    addListSection(wrapper, "Findings", response.findings, (card, item) => {
      card.appendChild(element("strong", "", item.title || "Finding"));
      card.appendChild(element("p", "", item.detail || ""));
      if (Array.isArray(item.evidenceIds) && item.evidenceIds.length) {
        card.appendChild(
          element(
            "small",
            "ai-chat-evidence",
            `Evidence: ${item.evidenceIds.join(", ")}`,
          ),
        );
      }
    });

    addListSection(
      wrapper,
      "Recommended actions",
      response.recommendations,
      (card, item) => {
        const heading = element("strong", "");
        heading.textContent = `${String(item.priority || "medium").toUpperCase()}: ${item.action || ""}`;
        card.appendChild(heading);
        card.appendChild(element("p", "", item.rationale || ""));
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
        list.appendChild(element("li", "", item));
      });
      details.appendChild(list);
      wrapper.appendChild(details);
    }

    if (
      Array.isArray(response.suggestedQuestions) &&
      response.suggestedQuestions.length
    ) {
      const suggestions = element("div", "ai-chat-suggestions");
      response.suggestedQuestions.slice(0, 4).forEach((question) => {
        const button = element(
          "button",
          "ai-chat-suggestion",
          question,
        );
        button.type = "button";
        button.dataset.question = question;
        suggestions.appendChild(button);
      });
      wrapper.appendChild(suggestions);
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
    [
      ["auto", "Auto"],
      ["overview", "Overview"],
      ["ga4", "GA4"],
      ["gsc", "GSC"],
      ["ai", "AI traffic"],
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
    appendMessage(
      messages,
      "assistant",
      "Ask about traffic, engagement, rankings, queries, landing pages, or AI-assistant referrals.",
    );

    const status = element("div", "ai-chat-status");
    status.hidden = true;

    const form = element("form", "ai-chat-form");
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Ask a question about this report…";
    textarea.rows = 3;
    textarea.maxLength = 2000;

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
      const question = event.target?.dataset?.question;
      if (!question || state.busy) return;
      textarea.value = question;
      textarea.focus();
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
        status.hidden = true;
        textarea.focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", buildChat);
})();
