# BTEC JO — النشر العام (GitHub + Render)

## 1) GitHub
- أنشئ Repository جديد باسم `btec-jo`.
- ارفع محتويات هذا المجلد، وليس مجلد `node_modules`.
- لا ترفع أي ملف `.env` ولا مفتاح OpenAI.

## 2) Render
- Render → New → Web Service → اربط مستودع GitHub.
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: Free (للبداية).
- أضف Environment Variables:
  - `OPENAI_API_KEY` = مفتاحك الحقيقي
  - `OPENAI_MODEL` = `gpt-5-mini`
  - `RATE_LIMIT` = `30`
  - `PUBLIC_URL` = رابط Render بعد إنشاء الخدمة (مثال: `https://btec-jo.onrender.com`)

## 3) بعد Deploy
افتح `/api/health` ويجب أن ترى `ok:true` و`aiConfigured:true` و`webSearchConfigured:true`.

## 4) مهم
- مفتاح OpenAI يبقى داخل Render Environment Variables فقط.
- الواجهة والـBackend يعملان من نفس الخدمة، لذلك `FRONTEND_URL` غير مطلوب.
- Render يعيد النشر تلقائيًا عند دفع تحديثات إلى الفرع المرتبط.

## 5) دومين خاص
بعد أن يعمل الرابط المجاني، أضف Custom Domain من إعدادات Render ثم ضع الدومين الذي تملكه واتبع سجلات DNS التي يعرضها Render.
