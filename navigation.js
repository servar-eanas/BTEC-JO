(function(){
  const page=location.pathname.split('/').pop()||'index.html';
  const links=[
    ['specialties-encyclopedia.html','📚','شرح جميع التخصصات'],
    ['daily-motivation.html','🚀','تحفيز الطالب اليومي'],
    ['quick-quiz.html','🧠','الاختبار السريع'],
    ['ai.html','🤖','BTEC AI'],
    ['student-dashboard.html','📊','لوحة الطالب'],
    ['sources.html','🔗','المصادر الرسمية'],
    ['top-students.html','🏆','أوائل التخصصات']
  ];
  const homeSections=[
    ['about','📘','عن نظام BTEC'],
    ['specialties','🎓','التخصصات'],
    ['assignments','📝','نظام الواجبات والمعايير'],
    ['failure','⚠️','أسباب الرسوب'],
    ['certificates','🏆','الشهادات والفرص'],
    ['journey','🧭','شرح الصفوف والمواد'],
    ['academic','📚','نظام الدراسة الأكاديمي'],
    ['criteria-guide','🎯','دليل تحقيق المعايير'],
    ['assignment-process','✅','طريقة حل الواجب']
  ];

  const sidebar=document.createElement('aside');
  sidebar.className='btec-sidebar';
  sidebar.setAttribute('aria-label','التنقل بين صفحات BTEC JO');
  sidebar.innerHTML=`
    <a class="side-brand" href="index.html"><span>🎓</span><span class="brand-text">BTEC<span>JO</span></span></a>
    <div class="side-label">التنقل الرئيسي</div>
    <nav>
      <div class="home-nav-item">
        <button class="home-toggle" id="homeToggle" type="button" aria-expanded="false">
          <span class="side-icon">🏠</span><span class="side-text">الرئيسية</span><span class="home-chevron">⌄</span>
        </button>
        <div class="home-menu" id="homeMenu" aria-hidden="true">
          ${homeSections.map(([id,icon,text])=>`<a href="index.html#${id}" class="home-section-link"><span>${icon}</span><span>${text}</span></a>`).join('')}
        </div>
      </div>
      ${links.map(([href,icon,text])=>`<a href="${href}" class="${page===href?'active':''}" title="${text}"><span class="side-icon">${icon}</span><span class="side-text">${text}</span></a>`).join('')}
    </nav>
    <div class="side-bottom">
      <a class="side-home" href="index.html" title="فتح الرئيسية" aria-label="فتح الرئيسية">⌂</a>
      <button id="themeBtn" title="الوضع الليلي" aria-label="الوضع الليلي">🌙</button>
    </div>
    <div class="side-note">اضغط الرئيسية لعرض أقسام الصفحة</div>`;

  document.body.prepend(sidebar);
  document.body.classList.add('has-btec-sidebar');

  const toggle=sidebar.querySelector('#homeToggle');
  const menu=sidebar.querySelector('#homeMenu');
  const chevron=sidebar.querySelector('.home-chevron');
  toggle.addEventListener('click',()=>{
    const open=menu.classList.toggle('open');
    toggle.classList.toggle('expanded',open);
    toggle.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-hidden',String(!open));
    chevron.textContent=open?'⌃':'⌄';
  });

  // On the homepage, clicking a section smoothly scrolls to it.
  sidebar.querySelectorAll('.home-section-link').forEach(link=>{
    link.addEventListener('click',e=>{
      const targetId=link.getAttribute('href').split('#')[1];
      if(page==='index.html' || page===''){
        const target=document.getElementById(targetId);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth',block:'start'});
          history.replaceState(null,'','#'+targetId);
        }
      }
    });
  });

  // Open the menu automatically when arriving with a homepage section hash.
  if((page==='index.html'||page==='') && location.hash){
    menu.classList.add('open');
    toggle.classList.add('expanded');
    toggle.setAttribute('aria-expanded','true');
    menu.setAttribute('aria-hidden','false');
    chevron.textContent='⌃';
  }

  // Shared light/dark mode across all pages.
  const themeBtn = sidebar.querySelector('#themeBtn');
  const savedTheme = localStorage.getItem('btecjo-theme') || 'light';
  document.body.classList.toggle('dark', savedTheme === 'dark');
  const syncThemeButton = () => {
    const dark = document.body.classList.contains('dark');
    themeBtn.textContent = dark ? '☀️' : '🌙';
    themeBtn.title = dark ? 'الوضع النهاري' : 'الوضع الليلي';
    themeBtn.setAttribute('aria-label', dark ? 'الوضع النهاري' : 'الوضع الليلي');
  };
  syncThemeButton();
  themeBtn.addEventListener('click',()=>{
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('btecjo-theme', dark ? 'dark' : 'light');
    syncThemeButton();
  });

  if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }
})();
