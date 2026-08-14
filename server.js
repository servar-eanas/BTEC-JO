import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const app=express();
const PORT=Number(process.env.PORT||10000);
const FRONTEND_URL=(process.env.FRONTEND_URL||"").trim();
const knowledge=JSON.parse(fs.readFileSync(path.join(__dirname,"knowledge.json"),"utf8"));

app.set("trust proxy",1);
app.use(helmet({
  crossOriginResourcePolicy:false,
  contentSecurityPolicy:{
    directives:{
      "script-src":["'self'"],
      "script-src-attr":["'unsafe-inline'"]
    }
  }
}));
app.use(express.json({limit:"20kb"}));
app.use(cors({origin:(origin,cb)=>{if(!origin||!FRONTEND_URL||origin===FRONTEND_URL)return cb(null,true);cb(new Error("CORS blocked"));}}));
app.use("/api/",rateLimit({windowMs:60000,max:Number(process.env.RATE_LIMIT||30),standardHeaders:"draft-8",legacyHeaders:false,message:{error:"تم تجاوز عدد الطلبات مؤقتًا، حاول بعد قليل."}}));

const normalize=s=>String(s||"").toLowerCase().replace(/[إأآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[^\u0600-\u06FFa-z0-9\s]/gi," ").replace(/\s+/g," ").trim();
const stop=new Set(["ما","هو","هي","هل","كيف","شو","ايش","عن","في","من","على","الى","و","او","ال","هذا","هذه","ذلك"]);
const tokens=s=>normalize(s).split(" ").filter(x=>x.length>1&&!stop.has(x));

// Detect the requested BTEC assessment level before fuzzy matching.
// This prevents a question about M or D from falling through to a generic P answer.
function detectCriterionLevel(question){
 const n=normalize(question);
 if(/\b(m|merit)\s*\d*\b/.test(n) || /ميري?ت|جداره|الجداره/.test(n)) return "M";
 if(/\b(d|distinction)\s*\d*\b/.test(n) || /ديستنكشن|تميز|التميز/.test(n)) return "D";
 if(/\b(p|pass)\s*\d*\b/.test(n) || /باس|اجتياز/.test(n)) return "P";
 return null;
}

function candidateLevel(text){
 const n=normalize(text);
 if(/\b(m|merit)\s*\d*\b/.test(n) || /ميري?ت|جداره|الجداره/.test(n)) return "M";
 if(/\b(d|distinction)\s*\d*\b/.test(n) || /ديستنكشن|تميز|التميز/.test(n)) return "D";
 if(/\b(p|pass)\s*\d*\b/.test(n) || /باس|اجتياز/.test(n)) return "P";
 return null;
}

function localMatch(q){
 const requestedLevel=detectCriterionLevel(q);
 const a=tokens(q); if(!a.length && !requestedLevel)return null;
 let best=null,bestScore=0;
 for(const item of knowledge){
  for(const candidate of (item.keys||[])){
   const level=candidateLevel(candidate);
   // If the student explicitly asks for P/M/D, only match candidates for that level
   // (or an intentionally general comparison question with no single level).
   if(requestedLevel && level && level!==requestedLevel) continue;
   if(requestedLevel && !level && requestedLevel!=='P' && /تحقيق|معنى|اعمل|اسوي/.test(normalize(q))) continue;
   const b=new Set(tokens(candidate)); let hit=0;
   for(const t of a){
    if(b.has(t)) hit+=2;
    else for(const x of b){if(x.includes(t)||t.includes(x)){hit+=.7;break}}
   }
   const nq=normalize(q), nc=normalize(candidate);
   const exact=nq===nc?8:0;
   // Strongly reward the exact requested level appearing in the candidate.
   const levelBoost=requestedLevel && level===requestedLevel?4:0;
   const score=(a.length?hit/a.length:0)+exact+levelBoost;
   if(score>bestScore){bestScore=score;best={answer:item.answer,matchedQuestion:candidate};}
  }
 }
 return bestScore>=0.48?{...best,score:bestScore}:null;
}

const btecTerms=["btec","بيتك","واجب","معيار","assignment","learning aim","pass","merit","distinction","توجيهي","التخصص","الشهادات","الامتحان","الثقافة المشتركة","المهني","الوحدة","unit","بيرسون","pearson"];
const btecOnly=q=>{
 const n=normalize(q);
 return btecTerms.some(t=>n.includes(normalize(t))) ||
   /\b(p|m|d)\s*\d*\b/i.test(n) ||
   /كيف|شو|ما|هل/.test(n) && /وحده|معيار|واجب|تخصص|دراسه|توجيهي|بيتک|بيتك/.test(n);
};

const apiKey=(process.env.OPENAI_API_KEY||"").trim();
// OpenAI auth headers are ASCII/ByteString values. Reject placeholders or malformed
// Unicode values before constructing the client so a bad Render secret cannot crash
// every /api/ask request with an undici ByteString error.
const looksLikeOpenAIKey = key => {
  if(!key || /ضع[_ ]?مفتاحك|your[_ ]?api[_ ]?key|xxxxxxxx|sk-?x+/i.test(key)) return false;
  if(!/^[\x00-\x7F]+$/.test(key)) return false;
  return /^(sk|sk-proj)-[A-Za-z0-9_-]{20,}$/.test(key);
};
const client=looksLikeOpenAIKey(apiKey) ? new OpenAI({apiKey}) : null;

app.get("/api/health",(req,res)=>res.json({
 ok:true,
 knowledge:knowledge.length,
 aiConfigured:Boolean(client),
 webSearchConfigured:Boolean(client),
 model:process.env.OPENAI_MODEL||"gpt-5-mini"
}));

function extractWebSources(response){
 const out=[];
 for(const item of (response?.output||[])){
  if(item?.type!=="web_search_call") continue;
  const sources=item?.action?.sources||item?.sources||[];
  for(const src of sources){
   if(src?.url && !out.some(x=>x.url===src.url)){
    out.push({title:src.title||src.url,url:src.url});
   }
  }
 }
 return out.slice(0,8);
}

function formatSources(sources){
 if(!sources.length)return "";
 return "\n\nالمصادر التي تم الرجوع إليها:\n"+sources.map((s,i)=>`${i+1}. ${s.title} — ${s.url}`).join("\n");
}

app.post("/api/ask",async(req,res)=>{
 try{
  const question=String(req.body?.question||"").trim();
  if(!question)return res.status(400).json({ok:false,error:"اكتب سؤالك أولًا."});
  if(question.length>1000)return res.status(413).json({ok:false,error:"السؤال طويل جدًا."});

  // 1) Always prefer the internal BTEC knowledge base.
  const local=localMatch(question);
  if(local){
   return res.json({
    ok:true,
    source:"قاعدة المعرفة الداخلية",
    answer:local.answer,
    matchedQuestion:local.matchedQuestion,
    searchedWeb:false
   });
  }

  // 2) Criterion fallback only when the requested level is explicit and
  // the internal knowledge base has no more specific criterion.
  const requestedLevel=detectCriterionLevel(question);
  if(requestedLevel){
   const levelAnswers={
    P:"لتحقيق P (Pass)، اقرأ نص معيار P نفسه ومواصفة الوحدة، وحدد كل جزء مطلوب، ونفّذه مع دليل واضح يثبت تحقيقه. عدد الصفحات وحده لا يضمن تحقيق P.",
    M:"لتحقيق M (Merit)، يجب الاعتماد على نص معيار M نفسه ومواصفة الوحدة. لا يكفي تكرار P أو زيادة الصفحات؛ نفّذ فعل المعيار بالمستوى المطلوب، مثل التحليل أو التبرير أو الربط، فقط عندما ينص المعيار عليه، واربط الاستنتاجات بالأدلة.",
    D:"لتحقيق D (Distinction)، يجب الاعتماد على نص معيار D نفسه ومواصفة الوحدة. لا يكفي تكرار P وM أو زيادة الصفحات؛ نفّذ مستوى التحليل أو التقييم أو الحكم المبرر الذي يطلبه المعيار، مع أدلة مناسبة وتبرير واضح."
   };
   return res.json({ok:true,source:"قاعدة المعرفة الداخلية",answer:levelAnswers[requestedLevel],matchedQuestion:`${requestedLevel} level fallback`,searchedWeb:false});
  }

  // 3) Unknown BTEC questions go to Web Search + AI.
  if(!btecOnly(question)){
   return res.json({
    ok:true,
    source:"نطاق BTEC JO",
    answer:"أنا مخصص لأسئلة نظام BTEC في الأردن فقط. اسألني عن الوحدات، المعايير، الواجبات، التخصصات، الدراسة، التقييم أو الفرص بعد BTEC.",
    searchedWeb:false
   });
  }

  if(!client){
   return res.status(503).json({
    ok:false,
    error:"خدمة Web Search + AI غير مفعلة. ضع مفتاح OpenAI الحقيقي في ملف .env ثم أعد تشغيل الـBackend."
   });
  }

  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||"gpt-5-mini",
   tools:[{
    type:"web_search",
    search_context_size:"high",
    user_location:{type:"approximate",city:"Amman",country:"JO",timezone:"Asia/Amman"}
   }],
   tool_choice:"required",
   instructions:`أنت BTEC JO AI، مساعد متخصص بنظام BTEC في الأردن فقط.
السؤال لم يوجد في قاعدة المعرفة الداخلية، لذلك يجب استخدام Web Search قبل الإجابة.
ابحث فعليًا في الإنترنت ولا تقل "غير موجود" لمجرد أنه غير موجود في قاعدة المعرفة.
أعط الأولوية للمصادر الرسمية الأردنية، وزارة التربية والتعليم الأردنية، بوابة BTEC الرسمية، والجهات الرسمية أو Pearson عندما تكون ذات صلة.
إذا لم توجد إجابة موثوقة، قل بوضوح إن المعلومات غير مؤكدة بدل اختلاقها.
أجب بالعربية وبأسلوب واضح لطالب المدرسة.
إذا كانت المعلومة متغيرة بمرور الوقت، اذكر أنها تعتمد على آخر تعليمات منشورة.
لا تجيب عن مواضيع خارج BTEC في الأردن.`,
   input:question
  });

  const sources=extractWebSources(response);
  const answer=(response.output_text||"لم أتمكن من استخراج إجابة من نتائج البحث.").trim();
  return res.json({
   ok:true,
   source:"البحث على الإنترنت + الذكاء الاصطناعي",
   answer,
   sources,
   searchedWeb:true
  });
 }catch(err){
  console.error("BTEC AI error:",err);
  return res.status(500).json({
   ok:false,
   error:"تعذر تنفيذ البحث على الإنترنت والذكاء الاصطناعي حاليًا. تأكد من مفتاح OpenAI واتصال الإنترنت ثم حاول مرة أخرى."
  });
 }
});

/* =========================
   Frontend path resolver
========================= */

const frontendCandidates = [
  // إذا backend موجود بجانب BTEC JO
  path.resolve(__dirname, "../BTEC JO"),

  // إذا Render وضع المشروع داخل src
  path.resolve(__dirname, "../src/BTEC JO"),

  // إذا Current Working Directory هو المشروع الرئيسي
  path.resolve(process.cwd(), "BTEC JO"),

  // إذا Current Working Directory داخل src
  path.resolve(process.cwd(), "src/BTEC JO"),

  // إذا الموقع نفسه هو Current Working Directory
  path.resolve(process.cwd()),

  // احتياط إضافي
  path.resolve(__dirname)
];

const site = frontendCandidates.find((candidate) =>
  fs.existsSync(
    path.join(candidate, "index.html")
  )
);

if (!site) {
  console.error(
    "BTEC JO frontend NOT FOUND."
  );

  console.error(
    "Checked paths:"
  );

  frontendCandidates.forEach((candidate) => {
    console.error(" -", candidate);
  });

} else {

  console.log(
    "BTEC JO frontend path:",
    site
  );

  app.use(
    express.static(site)
  );

  app.use((req, res, next) => {

    if (
      req.method === "GET" &&
      !req.path.startsWith("/api/")
    ) {

      return res.sendFile(
        path.join(
          site,
          "index.html"
        )
      );
    }

    next();

  });
}

/* =========================
   Start Server
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `BTEC JO server listening on ${PORT}`
    );
  }
);
app.use(express.static(site));
app.use((req,res,next)=>{if(req.method==="GET"&&!req.path.startsWith("/api/"))return res.sendFile(path.join(site,"index.html"));next();});
app.listen(PORT,"0.0.0.0",()=>console.log(`BTEC JO server listening on ${PORT}`));
