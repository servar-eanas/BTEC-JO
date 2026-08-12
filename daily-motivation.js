
const tasks={
"business":[
["حلل شركة محلية","اختر شركة تعرفها واكتب 5 نقاط عن منتجها وعملائها ومنافسيها وكيف يمكنها تحسين التسويق.","30 دقيقة","تحليل الأعمال"],
["فكرة مشروع","اكتب فكرة مشروع صغيرة وحدد العميل المستهدف والمشكلة التي يحلها ومصدر الإيراد.","25 دقيقة","ريادة الأعمال"],
["تحدي التسويق","صمم حملة قصيرة من 3 منشورات لمنتج واحد وحدد هدف كل منشور.","30 دقيقة","التسويق"],
["Excel للأعمال","أنشئ جدولًا بسيطًا لمبيعات 10 منتجات واحسب الإجمالي والمتوسط وأعلى قيمة.","30 دقيقة","البيانات"],
["خدمة العملاء","اكتب سيناريو لعميل غير راضٍ ثم صمم ردًا مهنيًا يحافظ على العميل.","20 دقيقة","خدمة العملاء"]],
"it":[
["موقع صغير","أنشئ صفحة HTML بسيطة عن تخصصك تحتوي عنوانًا وفقرة وقائمة وزرًا.","30 دقيقة","Web"],
["تحدي JavaScript","اكتب تفاعلًا بسيطًا: زر يغير نصًا أو يحسب نتيجة أو يعرض رسالة.","30 دقيقة","Programming"],
["قاعدة بيانات","صمم على الورق جداول Users وProjects وحدد 5 حقول لكل جدول.","20 دقيقة","Data"],
["الأمن السيبراني","اكتب 7 قواعد لحماية حساب طالب من التصيد وكلمات المرور الضعيفة.","20 دقيقة","Cyber Security"],
["فكرة تطبيق","ارسم واجهة أولية لتطبيق يخدم الطلاب وحدد 5 وظائف أساسية.","30 دقيقة","Apps"]],
"engineering":[
["حل مشكلة هندسية","اختر مشكلة يومية وصمم حلًا هندسيًا لها مع رسم أولي و3 متطلبات.","30 دقيقة","Design"],
["قياسات","اختر جسمًا حولك وسجل 5 قياسات ثم اشرح لماذا الدقة مهمة.","20 دقيقة","Measurement"],
["سلامة","أنشئ قائمة فحص سلامة من 10 نقاط لورشة أو مختبر.","20 دقيقة","Safety"]],
"travel":[
["خطة رحلة","خطط لرحلة داخل الأردن لمدة يومين: الوجهات والوقت والميزانية والفئة المستهدفة.","30 دقيقة","Tourism"],
["تسويق وجهة","اكتب 5 أسباب تجعل سائحًا يزور مدينة أردنية وصمم فكرة منشور ترويجي.","25 دقيقة","Marketing"],
["خدمة عميل","اكتب ردًا مهنيًا على سائح يسأل عن تغيير موعد رحلة.","15 دقيقة","Customer Service"]],
"hospitality":[
["تجربة ضيف","صمم رحلة عميل من الحجز حتى المغادرة وحدد 5 نقاط لتحسين التجربة.","25 دقيقة","Hospitality"],
["قائمة خدمة","أنشئ Checklist من 10 خطوات لتجهيز غرفة أو مساحة استقبال.","20 دقيقة","Operations"]],
"creative-media":[
["فكرة فيديو","اكتب فكرة فيديو قصير من 30 ثانية: الهدف والجمهور والمشاهد الأساسية.","25 دقيقة","Media"],
["Portfolio","اختر عملًا قديمًا وأعد تصميم جزء منه واشرح ما الذي حسنته.","30 دقيقة","Creative"]],
"art-design":[
["لوحة أفكار","أنشئ Moodboard لمشروع تصميم وحدد 5 مصادر إلهام مع سبب اختيارها.","30 دقيقة","Design"],
["تجريب","جرب أسلوبًا بصريًا جديدًا وسجل ما نجح وما يحتاج تطويرًا.","30 دقيقة","Experimentation"]],
"agriculture":[
["ملاحظة نبات","اختر نباتًا وسجل 5 ملاحظات عن التربة والضوء والماء والنمو.","20 دقيقة","Agriculture"],
["استدامة","اقترح 5 طرق لتقليل هدر الماء في نشاط زراعي.","20 دقيقة","Sustainability"]],
"sport":[
["تحليل أداء","اختر تمرينًا وحدد 3 مؤشرات يمكن قياسها لمتابعة التطور.","20 دقيقة","Sport"],
["خطة تدريب","ضع خطة أسبوعية بسيطة لشخص يريد تحسين اللياقة مع أهداف قابلة للقياس.","30 دقيقة","Training"]],
"health-social":[
["تواصل مهني","اكتب 5 قواعد للتواصل المحترم مع شخص يحتاج خدمة أو دعمًا.","20 دقيقة","Communication"],
["حالة دراسية","اقرأ موقفًا خياليًا عن شخص يحتاج دعمًا وحدد 3 احتياجات و3 طرق للمساعدة المهنية.","30 دقيقة","Case Study"]],
"hair-beauty":[
["Portfolio عملي","صور أو ارسم فكرة تسريحة/خدمة تجميل وحدد الأدوات والخطوات الأساسية.","30 دقيقة","Practical"],
["استشارة عميل","اكتب 7 أسئلة يجب طرحها قبل تقديم خدمة شعر أو تجميل.","20 دقيقة","Client Consultation"]]
};
const names={business:"إدارة الأعمال",it:"تكنولوجيا المعلومات",engineering:"الهندسة",travel:"السفر والسياحة",hospitality:"الضيافة","creative-media":"الوسائط الإبداعية","art-design":"الفن والتصميم",agriculture:"الزراعة",sport:"الرياضة","health-social":"الرعاية الصحية والاجتماعية","hair-beauty":"الشعر والتجميل",construction:"الإنشاءات والبيئة العمرانية"};
tasks.construction=[["رسم أولي","ارسم مخططًا بسيطًا لمساحة أو مبنى وحدد 5 متطلبات أساسية.","30 دقيقة","Construction"],["السلامة","أنشئ قائمة تحقق من 10 نقاط للسلامة في موقع بناء.","20 دقيقة","Safety"]];

const sel=document.getElementById("specialty"), challenge=document.getElementById("challenge");
Object.keys(names).forEach(k=>sel.add(new Option(names[k],k)));
sel.value=localStorage.getItem("btecjo-specialty")||"business";
let state=JSON.parse(localStorage.getItem("btecjo-daily")||'{"points":0,"done":0,"streak":0,"last":"","completed":{}}');

function dateKey(){return new Date().toISOString().slice(0,10)}
function todayTask(){
 const arr=tasks[sel.value]||tasks.business;
 const n=Math.floor(Date.now()/86400000)%arr.length;
 return arr[n];
}
function render(){
 const t=todayTask(), key=dateKey(), id=sel.value+"-"+key;
 const done=!!state.completed[id];
 challenge.innerHTML=`<div class="challenge-card"><div class="challenge-meta"><span class="pill">🎯 تحدي اليوم</span><span class="pill">${t[3]}</span><span class="pill">⏱️ ${t[2]}</span></div><h2>${t[0]}</h2><p>${t[1]}</p><button class="complete ${done?"done":""}" ${done?"disabled":""} onclick="completeTask()">${done?"✅ تم إنجاز تحدي اليوم":"أنجزت التحدي ✅"}</button></div>`;
 document.getElementById("streak").textContent=state.streak;
 document.getElementById("points").textContent=state.points;
 document.getElementById("done").textContent=state.done;
 let level=state.points>=1000?"أسطوري":state.points>=500?"متقدم":state.points>=200?"متميز":"مبتدئ";
 document.getElementById("level").textContent=level;
 document.getElementById("bar").style.width=(state.points%200)/2+"%";
 const msgs=["كل إنجاز صغير اليوم يبني طالب أقوى بكرة 💪","لا تستنى الإلهام؛ ابدأ بـ20 دقيقة فقط.","اشتغل على شيء تقدر تضيفه إلى Portfolio تبعك.","أنت مش مطالب تكون كامل، المطلوب تتطور.","خطوة اليوم أهم من خطة ما بدأت فيها."];
 document.getElementById("motivation").textContent=msgs[state.done%msgs.length];
}
window.completeTask=function(){
 const key=sel.value+"-"+dateKey();
 if(state.completed[key]) return;
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
 if(state.last===yesterday) state.streak++;
 else if(state.last!==dateKey()) state.streak=1;
 state.last=dateKey(); state.completed[key]=true; state.done++; state.points+=100;
 localStorage.setItem("btecjo-daily",JSON.stringify(state));
 render();
}
sel.onchange=()=>{localStorage.setItem("btecjo-specialty",sel.value);render()};
document.getElementById("newChallenge").onclick=()=>{alert("تحدي اليوم مرتبط بتاريخ اليوم حتى يحافظ النظام على فكرة العادة اليومية. أنجز تحدي اليوم أولًا ثم ارجع غدًا لتحدٍ جديد.")};
const theme=document.getElementById("themeBtn");
if(localStorage.getItem("btecjo-theme")==="dark") document.body.classList.add("dark");
theme.onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("btecjo-theme",document.body.classList.contains("dark")?"dark":"light");theme.textContent=document.body.classList.contains("dark")?"☀️":"🌙"};
theme.textContent=document.body.classList.contains("dark")?"☀️":"🌙";
render();
