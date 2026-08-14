BTEC JO Smart AI backend
=========================
الواجهة الأمامية لا تضع API Key داخل JavaScript.
أنشئ endpoint POST /api/ask يعيد JSON مثل:
{"answer":"..."}
ثم ضع رابط endpoint في ai.html داخل window.btecAIConfig.aiEndpoint.

يمكن أيضًا إنشاء endpoint للبحث الخارجي وإرجاع:
{"answer":"..."}
ووضعه في webEndpoint.

الترتيب في الموقع:
1) قاعدة المعرفة الداخلية (100 سؤال)
2) webEndpoint إن تم ربطه
3) aiEndpoint إن تم ربطه

مهم: لا تضع مفتاح OpenAI أو أي مفتاح API داخل ملفات الموقع المنشورة.
