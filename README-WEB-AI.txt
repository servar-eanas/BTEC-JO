BTEC JO AI - Web Search + AI

1) افتح PowerShell داخل مجلد backend.
2) انسخ .env.example إلى .env:
   Copy-Item .env.example .env
3) افتح .env وضع مفتاح OpenAI الحقيقي في OPENAI_API_KEY.
4) ثبّت الحزم:
   npm.cmd install
5) شغّل:
   npm.cmd start
6) افتح:
   http://localhost:10000

طريقة عمل AI:
- يبحث أولاً في قاعدة knowledge.json الداخلية.
- إذا لم يجد إجابة، يرسل السؤال إلى OpenAI Responses API مع Web Search إجباري.
- يعيد الإجابة مع روابط المصادر التي استخدمها البحث.
- الأسئلة خارج نطاق BTEC الأردن يتم رفضها.
- لا تضع مفتاح API داخل ملفات HTML أو JavaScript.
