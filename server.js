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

const INTENT_PATTERNS = [
  ["criteria", [/\b(p|m|d)\s*\d*\b/i, /معيار|معايير|تحقيق|pass|merit|distinction|باس|ميرت|تميز/]],
  ["units", [/وحده|وحدات|unit|units|learning aim/]],
  ["assignments", [/واجب|واجبات|assignment|تسليم|تقييم/]],
  ["specializations", [/تخصص|تخصصات|مسار|اداره الاعمال|إدارة الأعمال|business/]],
  ["tawjihi", [/توجيهي|امتحان وزاري|الثقافه المشتركه|الثقافة المشتركة|وزاري/]],
  ["academic", [/اكاديمي|أكاديمي|مواد مشتركه|مواد مشتركة|عربي|انجليزي|إسلاميه|اسلاميه|تاريخ الاردن|تاريخ الأردن/]],
  ["certificates", [/شهاده|شهادات|مؤهل|جهة مانحه|الجهة المانحة/]],
  ["failure", [/رسوب|رسب|فشل|غش|انتحال|تأخر بالتسليم|عدم تسليم/]],
  ["opportunities", [/فرص|جامعه|جامعة|سوق العمل|توظيف|تدريب|بعد التخرج|portfolio|ملف الاعمال|ملف الأعمال/]],
  ["assessment", [/امتحان|امتحانات|تقييم داخلي|تقييم خارجي|تقييم/]],
];

function detectIntents(text){
 const n=normalize(text);
 return INTENT_PATTERNS.filter(([,patterns])=>patterns.some(re=>re.test(n))).map(([name])=>name);
}
function primaryIntent(text){
 const intents=detectIntents(text);
 // Explicitly prefer the student's requested object. "الوحدات" must beat
 // generic BTEC terms such as طالب/تخصص.
 const priority=["criteria","units","assignments","specializations","tawjihi","certificates","failure","opportunities","academic","assessment"];
 return priority.find(x=>intents.includes(x))||null;
}
function candidateHasIntent(text,intent){
 return intent ? detectIntents(text).includes(intent) : true;
}

function localMatch(q){
 const requestedLevel=detectCriterionLevel(q);
 const nq=normalize(q);
 const a=tokens(q);
 const intent=primaryIntent(q);
 if(!a.length && !requestedLevel && !intent)return null;

 // 1) Exact match always wins, but only inside the same detected intent.
 for(const item of knowledge){
  for(const candidate of (item.keys||[])){
   if(normalize(candidate)===nq){
    const level=candidateLevel(candidate);
    if((!requestedLevel || !level || level===requestedLevel) &&
       (!intent || candidateHasIntent(candidate,intent))){
     return {answer:item.answer,matchedQuestion:candidate,score:100,intent};
    }
   }
  }
 }

 // 2) Explicit P/M/D: only use candidates from the same level and criteria intent.
 if(requestedLevel && /تحقق|حقق|تحقيق|معيار|مطلوب|اكتب|اعمل|اسوي/.test(nq)){
  for(const item of knowledge){
   for(const candidate of (item.keys||[])){
    if(candidateLevel(candidate)!==requestedLevel) continue;
    if(intent && !candidateHasIntent(candidate,intent)) continue;
    const cn=normalize(candidate);
    const qTokens=new Set(a);
    const cTokens=new Set(tokens(candidate));
    const overlap=[...qTokens].filter(t=>cTokens.has(t)).length;
    if(overlap>=2){
     return {answer:item.answer,matchedQuestion:candidate,score:90,intent};
    }
   }
  }
  return null;
 }

 // 3) Intent-gated fuzzy matching. A candidate from another topic is never
 // allowed to answer this question. This fixes e.g. "ما هي الوحدات؟" picking
 // an unrelated "الرسوب" answer because both contain BTEC/student words.
 let best=null,bestScore=0;
 for(const item of knowledge){
  for(const candidate of (item.keys||[])){
   const level=candidateLevel(candidate);
   if(requestedLevel && level && level!==requestedLevel) continue;
   if(intent && !candidateHasIntent(candidate,intent)) continue;

   const b=new Set(tokens(candidate));
   let exactHits=0,partialHits=0;
   for(const t of a){
    if(b.has(t)) exactHits++;
    else for(const x of b){
     if(x.includes(t)||t.includes(x)){partialHits++;break;}
    }
   }

   const evidence=exactHits + partialHits*0.25;
   if(exactHits<2 && a.length>1) continue;
   if(exactHits<2 && a.length===1) continue;
   const coverage=evidence/Math.max(a.length,1);
   const specificity=exactHits*1.0;
   const levelBoost=requestedLevel && level===requestedLevel?2:0;
   const intentBoost=intent?1.5:0;
   const score=coverage+specificity+levelBoost+intentBoost;
   if(score>bestScore){bestScore=score;best={answer:item.answer,matchedQuestion:candidate};}
  }
 }
 return best && bestScore>=3.0 ? {...best,score:bestScore,intent}:null;
}

const btecTerms=["btec","بيتك","واجب","معيار","assignment","learning aim","pass","merit","distinction","توجيهي","التخصص","الشهادات","الامتحان","الامتحانات","الثقافة المشتركة","المهني","الوحدة","الوحدات","وحدات","unit","units","بيرسون","pearson"];
const btecOnly=q=>{
 const n=normalize(q);
 const topicTerms=[
  "وحده","وحدات","معيار","معايير","واجب","واجبات","assignment","learning aim",
  "تخصص","تخصصات","دراسه","دراسة","توجيهي","بيتك","btec","شهاده","شهادات",
  "امتحان","امتحانات","رسوب","رسوب","نجاح","pass","merit","distinction",
  "p","m","d","فرص","جامعه","جامعة","تقييم","portfolio","مشروع","مشاريع"
 ];
 return btecTerms.some(t=>n.includes(normalize(t))) ||
   topicTerms.some(t=>n.includes(normalize(t))) ||
   /\b(p|m|d)\s*\d*\b/i.test(n);
};

const apiKey=(process.env.OPENAI_API_KEY||"").trim();
const client=apiKey && !/ضع[_ ]?مفتاحك|your[_ ]?api[_ ]?key|xxxxxxxx|sk-?x+/i.test(apiKey)
  ? new OpenAI({apiKey})
  : null;

app.get("/robots.txt",(req,res)=>{
  const base=(process.env.PUBLIC_URL||`${req.protocol}://${req.get("host")}`).replace(/\/$/,"");
  res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});

app.get("/sitemap.xml",(req,res)=>{
  const base=(process.env.PUBLIC_URL||`${req.protocol}://${req.get("host")}`).replace(/\/$/,"");
  const pages=["/","/ai.html","/specialties-encyclopedia.html","/quick-quiz.html","/daily-motivation.html"];
  const xml='<?xml version="1.0" encoding="UTF-8"?>'+pages.map(p=>`<url><loc>${base}${p}</loc></url>`).join("");
  res.type("application/xml").send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`);
});

app.get("/api/health",(req,res)=>res.json({
 ok:true,
 knowledge:knowledge.length,
 aiConfigured:Boolean(client),
 webSearchConfigured:Boolean(client),
 model:process.env.OPENAI_MODEL||"gpt-5-mini"
}));

function extractWebSources(response){
 const out=[];
 const add=(src)=>{
  if(!src)return;
  const url=src.url || src.uri;
  if(url && !out.some(x=>x.url===url)) out.push({title:src.title||url,url});
 };
 for(const item of (response?.output||[])){
  if(item?.type==="web_search_call"){
   for(const src of (item?.action?.sources||[])) add(src);
  }
  if(item?.type==="message"){
   for(const part of (item?.content||[])){
    for(const ann of (part?.annotations||[])){
     if(ann?.type==="url_citation") add({title:ann.title,url:ann.url});
    }
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
  const intent=primaryIntent(question);
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
السؤال لم يوجد في قاعدة المعرفة الداخلية، لذلك يجب استخدام Web Search قبل الإجابة. اعتبر أي سؤال يصل إلى هذه الخدمة ضمن سياق BTEC JO، حتى لو كان مختصرًا مثل "ما هي الوحدات؟"، وفسره على أنه عن BTEC في الأردن.
ابحث فعليًا في الإنترنت ولا تقل "غير موجود" لمجرد أنه غير موجود في قاعدة المعرفة.
أعط الأولوية للمصادر الرسمية الأردنية، وزارة التربية والتعليم الأردنية، بوابة BTEC الرسمية، والجهات الرسمية أو Pearson عندما تكون ذات صلة.
إذا لم توجد إجابة موثوقة، قل بوضوح إن المعلومات غير مؤكدة بدل اختلاقها.
أجب بالعربية وبأسلوب واضح لطالب المدرسة.
إذا كانت المعلومة متغيرة بمرور الوقت، اذكر أنها تعتمد على آخر تعليمات منشورة.
لا تجيب عن مواضيع خارج BTEC في الأردن.`,
   input:`تصنيف السؤال: ${intent||"عام"}\nسؤال الطالب: ${question}`
  });

  const sources=extractWebSources(response);
  const answer=(response.output_text||"لم أتمكن من استخراج إجابة من نتائج البحث.").trim();
  return res.json({
   ok:true,
   source:"البحث على الإنترنت + الذكاء الاصطناعي",
   answer,
   sources,
   searchedWeb:true,
   intent
  });
 }catch(err){
  console.error("BTEC AI error:",err);
  const status=Number(err?.status||err?.statusCode||500);
  const apiMessage=String(err?.error?.message||err?.message||"");
  let userError="تعذر تنفيذ البحث على الإنترنت والذكاء الاصطناعي حاليًا.";
  if(status===401) userError="مفتاح OpenAI غير صالح أو غير مقبول. تأكد من OPENAI_API_KEY ثم أعد تشغيل الـBackend.";
  else if(status===403) userError="مفتاح OpenAI لا يملك صلاحية استخدام Web Search حاليًا.";
  else if(status===429) userError="تم تجاوز حد الاستخدام أو لا يوجد رصيد كافٍ في حساب OpenAI حاليًا.";
  else if(/web_search|tool/i.test(apiMessage)) userError="تعذر تشغيل أداة البحث على الإنترنت من OpenAI. تأكد من أن حسابك والنموذج يدعمان Web Search.";
  if(process.env.NODE_ENV!=="production" && apiMessage) userError += `\n\nتفاصيل تقنية: ${apiMessage.slice(0,500)}`;
  return res.status(status>=400&&status<600?status:500).json({ok:false,error:userError});
 }
});

const site = __dirname;

app.use(express.static(site));

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(site, "index.html"));
  }
  next();
});
app.listen(PORT,"0.0.0.0",()=>console.log(`BTEC JO server listening on ${PORT}`));
