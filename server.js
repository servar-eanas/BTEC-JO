import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* =========================================================
   BASIC SETUP
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = Number(
  process.env.PORT || 10000
);

const FRONTEND_URL =
  String(
    process.env.FRONTEND_URL || ""
  ).trim();

/* =========================================================
   KNOWLEDGE BASE
========================================================= */

const knowledgePath = path.join(
  __dirname,
  "knowledge.json"
);

let knowledge = [];

try {
  if (fs.existsSync(knowledgePath)) {
    knowledge = JSON.parse(
      fs.readFileSync(
        knowledgePath,
        "utf8"
      )
    );
  } else {
    console.warn(
      "knowledge.json not found:",
      knowledgePath
    );
  }
} catch (error) {
  console.error(
    "Failed to load knowledge.json:",
    error
  );

  knowledge = [];
}

/* =========================================================
   SECURITY / EXPRESS
========================================================= */

app.set(
  "trust proxy",
  1
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,

    contentSecurityPolicy: {
      directives: {
        "script-src": [
          "'self'"
        ],

        "script-src-attr": [
          "'unsafe-inline'"
        ]
      }
    }
  })
);

app.use(
  express.json({
    limit: "20kb"
  })
);

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: (
      origin,
      callback
    ) => {
      /*
       * Same-origin browser requests usually have no
       * Origin header in some cases, so allow them.
       */

      if (!origin) {
        return callback(
          null,
          true
        );
      }

      /*
       * When FRONTEND_URL is empty, allow requests.
       * This is useful because the frontend and backend
       * are served from the same Render service.
       */

      if (!FRONTEND_URL) {
        return callback(
          null,
          true
        );
      }

      if (
        origin ===
        FRONTEND_URL
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          "CORS blocked"
        )
      );
    }
  })
);

/* =========================================================
   API RATE LIMIT
========================================================= */

app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000,

    max: Number(
      process.env.RATE_LIMIT || 30
    ),

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      error:
        "تم تجاوز عدد الطلبات مؤقتًا، حاول بعد قليل."
    }
  })
);

/* =========================================================
   TEXT HELPERS
========================================================= */

function normalize(value) {
  return String(
    value || ""
  )
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(
      /[ًٌٍَُِّْـ]/g,
      ""
    )
    .replace(
      /[^\u0600-\u06FFa-z0-9\s]/gi,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

const stopWords =
  new Set([
    "ما",
    "هو",
    "هي",
    "هل",
    "كيف",
    "شو",
    "ايش",
    "عن",
    "في",
    "من",
    "على",
    "الى",
    "و",
    "او",
    "ال",
    "هذا",
    "هذه",
    "ذلك"
  ]);

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter(
      (token) =>
        token.length > 1 &&
        !stopWords.has(token)
    );
}

/* =========================================================
   P / M / D DETECTION
========================================================= */

function detectCriterionLevel(
  question
) {
  const n =
    normalize(question);

  if (
    /\b(m|merit)\s*\d*\b/.test(
      n
    ) ||
    /ميري?ت|جداره|الجداره/.test(
      n
    )
  ) {
    return "M";
  }

  if (
    /\b(d|distinction)\s*\d*\b/.test(
      n
    ) ||
    /ديستنكشن|تميز|التميز/.test(
      n
    )
  ) {
    return "D";
  }

  if (
    /\b(p|pass)\s*\d*\b/.test(
      n
    ) ||
    /باس|اجتياز/.test(
      n
    )
  ) {
    return "P";
  }

  return null;
}

function candidateLevel(
  text
) {
  return detectCriterionLevel(
    text
  );
}

/* =========================================================
   INTERNAL KNOWLEDGE SEARCH
========================================================= */

function localMatch(
  question
) {
  const requestedLevel =
    detectCriterionLevel(
      question
    );

  const queryTokens =
    tokens(question);

  if (
    !queryTokens.length &&
    !requestedLevel
  ) {
    return null;
  }

  let best = null;
  let bestScore = 0;

  for (
    const item of knowledge
  ) {
    for (
      const candidate of
        item.keys || []
    ) {
      const level =
        candidateLevel(
          candidate
        );

      /*
       * If the user asks specifically for M,
       * do not return a P answer.
       */

      if (
        requestedLevel &&
        level &&
        level !==
          requestedLevel
      ) {
        continue;
      }

      /*
       * Avoid generic answers for explicit M/D
       * where the candidate has no criterion level.
       */

      if (
        requestedLevel &&
        !level &&
        requestedLevel !== "P" &&
        /تحقيق|معنى|اعمل|اسوي/.test(
          normalize(question)
        )
      ) {
        continue;
      }

      const candidateTokens =
        new Set(
          tokens(candidate)
        );

      let hits = 0;

      for (
        const token of
          queryTokens
      ) {
        if (
          candidateTokens.has(
            token
          )
        ) {
          hits += 2;
        } else {
          for (
            const c of
              candidateTokens
          ) {
            if (
              c.includes(
                token
              ) ||
              token.includes(
                c
              )
            ) {
              hits += 0.7;
              break;
            }
          }
        }
      }

      const exact =
        normalize(question) ===
        normalize(candidate)
          ? 8
          : 0;

      const levelBoost =
        requestedLevel &&
        level ===
          requestedLevel
          ? 4
          : 0;

      const score =
        (
          queryTokens.length
            ? hits /
              queryTokens.length
            : 0
        ) +
        exact +
        levelBoost;

      if (
        score >
        bestScore
      ) {
        bestScore = score;

        best = {
          answer:
            item.answer,
          matchedQuestion:
            candidate
        };
      }
    }
  }

  if (
    bestScore < 0.48 ||
    !best
  ) {
    return null;
  }

  return {
    ...best,
    score: bestScore
  };
}

/* =========================================================
   BTEC SCOPE
========================================================= */

const btecTerms = [
  "btec",
  "بيتك",
  "واجب",
  "معيار",
  "assignment",
  "learning aim",
  "pass",
  "merit",
  "distinction",
  "توجيهي",
  "التخصص",
  "الشهادات",
  "الامتحان",
  "الثقافة المشتركة",
  "المهني",
  "الوحدة",
  "unit",
  "بيرسون",
  "pearson"
];

function isBtecQuestion(
  question
) {
  const n =
    normalize(question);

  if (
    btecTerms.some(
      (term) =>
        n.includes(
          normalize(term)
        )
    )
  ) {
    return true;
  }

  if (
    /\b(p|m|d)\s*\d*\b/i.test(
      n
    )
  ) {
    return true;
  }

  return (
    /كيف|شو|ما|هل/.test(n) &&
    /وحده|معيار|واجب|تخصص|دراسه|توجيهي|بيتک|بيتك/.test(
      n
    )
  );
}

/* =========================================================
   OPENAI
========================================================= */

const apiKey =
  String(
    process.env.OPENAI_API_KEY ||
      ""
  ).trim();

function looksLikeOpenAIKey(
  key
) {
  if (!key) {
    return false;
  }

  /*
   * Reject common placeholders.
   */

  if (
    /ضع[_ ]?مفتاحك|your[_ ]?api[_ ]?key|xxxxxxxx|sk-?x+/i.test(
      key
    )
  ) {
    return false;
  }

  /*
   * OpenAI auth header must be ASCII.
   */

  if (
    !/^[\x00-\x7F]+$/.test(
      key
    )
  ) {
    return false;
  }

  return /^(sk|sk-proj)-[A-Za-z0-9_-]{20,}$/.test(
    key
  );
}

const openai =
  looksLikeOpenAIKey(
    apiKey
  )
    ? new OpenAI({
        apiKey
      })
    : null;

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,

      knowledge:
        knowledge.length,

      aiConfigured:
        Boolean(openai),

      webSearchConfigured:
        Boolean(openai),

      model:
        process.env.OPENAI_MODEL ||
        "gpt-5-mini"
    });
  }
);

/* =========================================================
   WEB SOURCES
========================================================= */

function extractWebSources(
  response
) {
  const sources = [];

  for (
    const item of
      response?.output || []
  ) {
    if (
      item?.type !==
      "web_search_call"
    ) {
      continue;
    }

    const list =
      item?.action?.sources ||
      item?.sources ||
      [];

    for (
      const source of
        list
    ) {
      if (
        !source?.url
      ) {
        continue;
      }

      if (
        sources.some(
          (item) =>
            item.url ===
            source.url
        )
      ) {
        continue;
      }

      sources.push({
        title:
          source.title ||
          source.url,

        url:
          source.url
      });
    }
  }

  return sources.slice(
    0,
    8
  );
}

/* =========================================================
   AI ASK
========================================================= */

app.post(
  "/api/ask",
  async (req, res) => {
    try {
      const question =
        String(
          req.body?.question ||
            ""
        ).trim();

      if (!question) {
        return res.status(
          400
        ).json({
          ok: false,

          error:
            "اكتب سؤالك أولًا."
        });
      }

      if (
        question.length >
        1000
      ) {
        return res.status(
          413
        ).json({
          ok: false,

          error:
            "السؤال طويل جدًا."
        });
      }

      /*
       * 1) Internal knowledge
       */

      const local =
        localMatch(
          question
        );

      if (local) {
        return res.json({
          ok: true,

          source:
            "قاعدة المعرفة الداخلية",

          answer:
            local.answer,

          matchedQuestion:
            local.matchedQuestion,

          searchedWeb:
            false
        });
      }

      /*
       * 2) Explicit P/M/D fallback
       */

      const requestedLevel =
        detectCriterionLevel(
          question
        );

      if (
        requestedLevel
      ) {
        const answers = {
          P:
            "لتحقيق P (Pass)، اقرأ نص معيار P نفسه ومواصفة الوحدة، وحدد كل جزء مطلوب، ونفّذه مع دليل واضح يثبت تحقيقه. عدد الصفحات وحده لا يضمن تحقيق P.",

          M:
            "لتحقيق M (Merit)، يجب الاعتماد على نص معيار M نفسه ومواصفة الوحدة. لا يكفي تكرار P أو زيادة الصفحات؛ نفّذ فعل المعيار بالمستوى المطلوب، مثل التحليل أو التبرير أو الربط، فقط عندما ينص المعيار عليه، واربط الاستنتاجات بالأدلة.",

          D:
            "لتحقيق D (Distinction)، يجب الاعتماد على نص معيار D نفسه ومواصفة الوحدة. لا يكفي تكرار P وM أو زيادة الصفحات؛ نفّذ مستوى التحليل أو التقييم أو الحكم المبرر الذي يطلبه المعيار، مع أدلة مناسبة وتبرير واضح."
        };

        return res.json({
          ok: true,

          source:
            "قاعدة المعرفة الداخلية",

          answer:
            answers[
              requestedLevel
            ],

          matchedQuestion:
            `${requestedLevel} level fallback`,

          searchedWeb:
            false
        });
      }

      /*
       * 3) Only answer BTEC questions.
       */

      if (
        !isBtecQuestion(
          question
        )
      ) {
        return res.json({
          ok: true,

          source:
            "نطاق BTEC JO",

          answer:
            "أنا مخصص لأسئلة نظام BTEC في الأردن فقط. اسألني عن الوحدات، المعايير، الواجبات، التخصصات، الدراسة، التقييم أو الفرص بعد BTEC.",

          searchedWeb:
            false
        });
      }

      /*
       * 4) OpenAI
       */

      if (!openai) {
        return res.status(
          503
        ).json({
          ok: false,

          error:
            "خدمة Web Search + AI غير مفعلة. تأكد من وضع OPENAI_API_KEY الحقيقي في Environment Variables داخل Render."
        });
      }

      const response =
        await openai.responses.create(
          {
            model:
              process.env.OPENAI_MODEL ||
              "gpt-5-mini",

            tools: [
              {
                type:
                  "web_search",

                search_context_size:
                  "high",

                user_location: {
                  type:
                    "approximate",

                  city:
                    "Amman",

                  country:
                    "JO",

                  timezone:
                    "Asia/Amman"
                }
              }
            ],

            tool_choice:
              "required",

            instructions: `
أنت BTEC JO AI، مساعد متخصص بنظام BTEC في الأردن فقط.

السؤال لم يوجد في قاعدة المعرفة الداخلية،
لذلك استخدم Web Search قبل الإجابة.

ابحث فعليًا في الإنترنت.

أعط الأولوية للمصادر الرسمية:
- وزارة التربية والتعليم الأردنية
- بوابة BTEC الأردنية
- Pearson
- المصادر الحكومية والرسمية

إذا لم تجد معلومة موثوقة، قل ذلك بوضوح ولا تخترع معلومات.

أجب بالعربية وبأسلوب واضح لطالب المدرسة.

إذا كانت المعلومة قد تتغير حسب السنة الدراسية،
اذكر ذلك بوضوح.

لا تجيب عن مواضيع خارج BTEC في الأردن.
`,

            input:
              question
          }
        );

      const sources =
        extractWebSources(
          response
        );

      const answer =
        String(
          response.output_text ||
            "لم أتمكن من استخراج إجابة من نتائج البحث."
        ).trim();

      return res.json({
        ok: true,

        source:
          "البحث على الإنترنت + الذكاء الاصطناعي",

        answer,

        sources,

        searchedWeb:
          true
      });

    } catch (error) {
      console.error(
        "BTEC AI error:",
        error
      );

      return res.status(
        500
      ).json({
        ok: false,

        error:
          "تعذر تنفيذ البحث على الإنترنت والذكاء الاصطناعي حاليًا. تأكد من مفتاح OpenAI واتصال الإنترنت ثم حاول مرة أخرى."
      });
    }
  }
);

/* =========================================================
   FRONTEND
   ملفات BTEC-JO كلها موجودة في نفس مجلد server.js
========================================================= */

const site =
  __dirname;

const indexPath =
  path.join(
    site,
    "index.html"
  );

console.log(
  "BTEC JO frontend path:",
  site
);

console.log(
  "BTEC JO index path:",
  indexPath
);

if (
  !fs.existsSync(
    indexPath
  )
) {
  console.error(
    "BTEC JO index.html NOT FOUND:",
    indexPath
  );
}

/*
 * Serve all static files:
 *
 * /style.css
 * /script.js
 * /ai.html
 * /ai.js
 * /student-dashboard.html
 * /sources.html
 * /assets/*
 * etc.
 */

app.use(
  express.static(
    site,
    {
      index: false
    }
  )
);

/* =========================================================
   FRONTEND FALLBACK
   Express 5 compatible
========================================================= */

app.use(
  (req, res, next) => {
    /*
     * Never let this fallback handle API requests.
     */

    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return next();
    }

    /*
     * If the requested URL contains a filename,
     * try to serve the corresponding existing file.
     */

    const cleanPath =
      decodeURIComponent(
        req.path
      );

    const requestedPath =
      path.normalize(
        path.join(
          site,
          cleanPath
        )
      );

    /*
     * Security check:
     * prevent escaping the site folder.
     */

    const sitePrefix =
      path.resolve(
        site
      ) + path.sep;

    const resolvedRequested =
      path.resolve(
        requestedPath
      );

    if (
      resolvedRequested.startsWith(
        sitePrefix
      ) &&
      fs.existsSync(
        resolvedRequested
      ) &&
      fs.statSync(
        resolvedRequested
      ).isFile()
    ) {
      return res.sendFile(
        resolvedRequested
      );
    }

    /*
     * Anything else goes to homepage.
     */

    return res.sendFile(
      indexPath
    );
  }
);

/* =========================================================
   404 / ERROR HANDLER
========================================================= */

app.use(
  (req, res) => {
    if (
      req.path.startsWith(
        "/api/"
      )
    ) {
      return res.status(
        404
      ).json({
        ok: false,
        error:
          "API endpoint not found."
      });
    }

    return res.sendFile(
      indexPath
    );
  }
);

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(
        error
      );
    }

    return res.status(
      500
    ).json({
      ok: false,

      error:
        "حدث خطأ داخلي في السيرفر."
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `BTEC JO server listening on ${PORT}`
    );
  }
);
