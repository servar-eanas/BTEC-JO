document.addEventListener("DOMContentLoaded",()=>{
const nav=document.querySelector("nav"), menu=document.getElementById("mobile-menu");
if(menu)menu.addEventListener("click",()=>nav.classList.toggle("open"));
document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const search=document.getElementById("searchInput");
const cards=[...document.querySelectorAll(".spec-card")];
if(search)search.addEventListener("input",()=>{
 const q=search.value.trim().toLowerCase();
 cards.forEach(c=>c.style.display=c.dataset.name.toLowerCase().includes(q)?"":"none");
});

const verbs={
"Describe":"صف: اذكر الخصائص أو المكونات أو الخطوات بوضوح، مع أمثلة مناسبة دون تحويل المطلوب إلى تحليل إذا لم يطلب ذلك.",
"Explain":"اشرح: وضح كيف ولماذا، واربط الأسباب بالنتائج بدل سرد معلومات منفصلة.",
"Analyse":"حلل: فكك الموضوع إلى عناصر، اربط بينها، وفسر أثرها باستخدام أدلة وأمثلة.",
"Assess":"قيّم: ناقش الأدلة ونقاط القوة والضعف ثم أصدر حكمًا مبررًا.",
"Evaluate":"قيّم بعمق: قارن الأدلة والبدائل والقيود ثم قدم حكمًا نهائيًا مدعومًا.",
"Compare":"قارن: وضح أوجه التشابه والاختلاف وفق نقاط واضحة بين العناصر المطلوبة."
};
const vb=document.getElementById("verbButtons"), vr=document.getElementById("verbResult");
if(vb){Object.entries(verbs).forEach(([k,v])=>{const b=document.createElement("button");b.textContent=k;b.onclick=()=>vr.textContent=v;vb.appendChild(b)})}

const theme=document.getElementById("themeBtn");
if(localStorage.getItem("btecjo-theme")==="dark"){document.body.classList.add("dark-mode");theme.innerHTML='<i class="fa-solid fa-sun"></i>'}
theme?.addEventListener("click",()=>{
 document.body.classList.toggle("dark-mode");
 const dark=document.body.classList.contains("dark-mode");
 localStorage.setItem("btecjo-theme",dark?"dark":"light");
 theme.innerHTML=dark?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';
 showToast(dark?"تم تفعيل الوضع الليلي":"تم تفعيل الوضع النهاري");
});

const checks=[...document.querySelectorAll(".checklist input")];
checks.forEach((c,i)=>{c.checked=localStorage.getItem("btecjo-check-"+i)==="1";c.addEventListener("change",()=>localStorage.setItem("btecjo-check-"+i,c.checked?"1":"0"))});
document.getElementById("resetChecklist")?.addEventListener("click",()=>{
 checks.forEach((c,i)=>{c.checked=false;localStorage.removeItem("btecjo-check-"+i)});showToast("تم تصفير القائمة");
});

const top=document.getElementById("topButton"), progress=document.getElementById("scrollProgress");
window.addEventListener("scroll",()=>{
 const max=document.documentElement.scrollHeight-innerHeight;
 if(progress)progress.style.width=(max?scrollY/max*100:0)+"%";
 if(top)top.style.display=scrollY>450?"grid":"none";
});
top?.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));

const sections=[...document.querySelectorAll("section[id]")], links=[...document.querySelectorAll("nav a")];
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(e.isIntersecting){links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+e.target.id))}
}),{rootMargin:"-35% 0px -55% 0px"});
sections.forEach(s=>io.observe(s));

function showToast(msg){const t=document.getElementById("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(window.btecToast);window.btecToast=setTimeout(()=>t.classList.remove("show"),2200)}
});