document.addEventListener("DOMContentLoaded", () => {
  const config = window.btecAIConfig || {};

  const apiBaseUrl =
    String(config.apiBaseUrl || window.location.origin)
      .replace(/\/+$/, "");

  const timeoutMs =
    Number(config.timeoutMs || 30000);

  const form =
    document.getElementById("chatForm");

  const input =
    document.getElementById("userQuestion");

  const messages =
    document.getElementById("chatMessages");

  const typing =
    document.getElementById("typing");

  const clearChat =
    document.getElementById("clearChat");

  const pointsEl =
    document.getElementById("points");

  if (!form || !input || !messages) {
    console.error(
      "BTEC AI: chatForm/userQuestion/chatMessages not found"
    );

    return;
  }

  /* =========================
     Points
  ========================= */

  let points =
    Number(
      localStorage.getItem("btecjo-points") || 0
    );

  function updatePoints() {
    if (pointsEl) {
      pointsEl.textContent = String(points);
    }

    localStorage.setItem(
      "btecjo-points",
      String(points)
    );
  }

  /* =========================
     Add message
  ========================= */

  function addMessage(
    text,
    user = false,
    source = ""
  ) {
    const wrap =
      document.createElement("div");

    wrap.className =
      `message ${user ? "user" : "bot"}`;

    const avatar =
      document.createElement("div");

    avatar.className =
      "mini-avatar";

    avatar.innerHTML =
      user
        ? '<i class="fa-solid fa-user"></i>'
        : '<i class="fa-solid fa-robot"></i>';

    const content =
      document.createElement("div");

    const sender =
      document.createElement("span");

    sender.className =
      "sender";

    sender.textContent =
      user ? "أنت" : "BTEC AI";

    const paragraph =
      document.createElement("p");

    paragraph.textContent =
      String(text || "");

    content.appendChild(sender);

    if (source && !user) {
      const sourceEl =
        document.createElement("small");

      sourceEl.className =
        "ai-source";

      sourceEl.textContent =
        source;

      content.appendChild(sourceEl);
    }

    content.appendChild(paragraph);

    wrap.appendChild(avatar);
    wrap.appendChild(content);

    messages.appendChild(wrap);

    messages.scrollTop =
      messages.scrollHeight;

    return {
      wrap,
      paragraph,
      content
    };
  }

  /* =========================
     Show typing
  ========================= */

  function setTyping(show) {
    if (!typing) return;

    typing.classList.toggle(
      "hidden",
      !show
    );
  }

  /* =========================
     Sources
  ========================= */

  function addSources(
    content,
    sources
  ) {
    if (
      !Array.isArray(sources) ||
      sources.length === 0
    ) {
      return;
    }

    const box =
      document.createElement("div");

    box.className =
      "ai-web-sources";

    const title =
      document.createElement("strong");

    title.textContent =
      "مصادر البحث:";

    box.appendChild(title);

    sources
      .filter(source => source && source.url)
      .slice(0, 8)
      .forEach((source, index) => {
        const link =
          document.createElement("a");

        link.href =
          source.url;

        link.target =
          "_blank";

        link.rel =
          "noopener noreferrer";

        link.textContent =
          `${index + 1}. ${
            source.title || source.url
          }`;

        box.appendChild(link);
      });

    content.appendChild(box);
  }

  /* =========================
     Ask backend
  ========================= */

  async function askBackend(question) {
    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () => controller.abort(),
        timeoutMs
      );

    try {
      const response =
        await fetch(
          `${apiBaseUrl}/api/ask`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json"
            },

            body: JSON.stringify({
              question
            }),

            signal:
              controller.signal,

            cache:
              "no-store"
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          `HTTP ${response.status}`
        );
      }

      return data;

    } catch (error) {
      if (
        error?.name === "AbortError"
      ) {
        return {
          ok: false,
          error:
            "انتهت مهلة الاتصال بالـAI. جرّب مرة ثانية."
        };
      }

      return {
        ok: false,
        error:
          error?.message ||
          "تعذر الاتصال بخدمة BTEC JO AI."
      };

    } finally {
      clearTimeout(timer);
    }
  }

  /* =========================
     Main ask
  ========================= */

  async function ask(question) {
    const text =
      String(question || "")
        .trim();

    if (!text) {
      return;
    }

    addMessage(
      text,
      true
    );

    input.value = "";

    setTyping(true);

    const bot =
      addMessage(
        "جاري تجهيز الجواب...",
        false,
        "بحث + AI"
      );

    try {
      const result =
        await askBackend(text);

      if (result?.ok) {
        bot.paragraph.textContent =
          result.answer ||
          "لم يتم العثور على إجابة.";

        const sourceEl =
          bot.content.querySelector(
            ".ai-source"
          );

        if (sourceEl) {
          sourceEl.textContent =
            result.source ||
            "BTEC AI";
        }

        if (
          result.searchedWeb &&
          Array.isArray(result.sources)
        ) {
          addSources(
            bot.content,
            result.sources
          );
        }
      } else {
        bot.paragraph.textContent =
          result?.error ||
          "تعذر الاتصال بخدمة BTEC JO AI حاليًا.";
      }

      points += 5;
      updatePoints();

    } catch (error) {
      console.error(
        "BTEC AI:",
        error
      );

      bot.paragraph.textContent =
        "صار خطأ أثناء إرسال السؤال. جرّب مرة ثانية.";
    } finally {
      setTyping(false);
    }
  }

  /* =========================
     Form submit
  ========================= */

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      const question =
        input.value.trim();

      if (!question) {
        return;
      }

      ask(question);
    }
  );

  /* =========================
     Ready questions
  ========================= */

  document
    .querySelectorAll("[data-q]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          const question =
            button.dataset.q;

          if (!question) {
            return;
          }

          ask(question);
        }
      );
    });

  /* =========================
     Clear chat
  ========================= */

  clearChat?.addEventListener(
    "click",
    () => {
      messages.innerHTML = "";

      addMessage(
        "أهلًا 👋 أنا مساعد BTEC JO. اختار سؤال من القائمة أو اكتب سؤالك تحت. رح أجاوب فقط ضمن مواضيع نظام BTEC."
      );
    }
  );

  /* =========================
     Global helper
  ========================= */

  window.BTECAsk = ask;

  window.addEventListener(
    "btecjo:ask",
    (event) => {
      const question =
        event?.detail?.question;

      if (question) {
        ask(question);
      }
    }
  );

  updatePoints();
});