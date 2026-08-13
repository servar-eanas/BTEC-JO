(function(){
  const page=location.pathname.split('/').pop()||'index.html';
  const links=[
    ['specialties-encyclopedia.html','📚','التخصصات والوحدات'],
    ['daily-motivation.html','🚀','تحفيز يومي'],
    ['quick-quiz.html','🧠','اختبار سريع'],
    ['ai.html','🤖','BTEC AI'],
    ['student-dashboard.html','📊','لوحة الطالب'],
    ['sources.html','🔗','المصادر الرسمية'],
    ['top-students.html','🏆','أوائل التخصصات']
  ];
  const homeSections=[
    ['about','📘','عن نظام BTEC'],['specialties','🎓','التخصصات'],['assignments','📝','الواجبات والمعايير'],['failure','⚠️','أسباب الرسوب'],['certificates','🏆','الشهادات والفرص'],['journey','🧭','شرح الصفوف والمواد'],['academic','📚','نظام الدراسة الأكاديمي'],['criteria-guide','🎯','دليل تحقيق المعايير'],['assignment-process','✅','طريقة حل الواجب']
  ];
  const sidebar=document.createElement('aside');
  sidebar.className='btec-sidebar';
  sidebar.setAttribute('aria-label','التنقل بين صفحات BTEC JO');
  sidebar.innerHTML=`<a class="side-brand" href="index.html"><span>🎓</span><span class="brand-text">BTEC<span>JO</span></span></a><div class="side-label">التنقل الرئيسي</div><nav><div class="home-nav-item"><button class="home-toggle" id="homeToggle" type="button" aria-expanded="false"><span class="side-icon">🏠</span><span class="side-text">الرئيسية</span><span class="home-chevron">⌄</span></button><div class="home-menu" id="homeMenu" aria-hidden="true">${homeSections.map(([id,icon,text])=>`<a href="index.html#${id}" class="home-section-link"><span>${icon}</span><span>${text}</span></a>`).join('')}</div></div>${links.map(([href,icon,text])=>`<a href="${href}" class="${page===href?'active':''}" title="${text}"><span class="side-icon">${icon}</span><span class="side-text">${text}</span></a>`).join('')}</nav><div class="side-bottom"><a class="side-home" href="index.html" title="فتح الرئيسية" aria-label="فتح الرئيسية">⌂</a><button id="themeBtn" title="الوضع الليلي" aria-label="الوضع الليلي">🌙</button></div><div class="side-note">الوضع الليلي محفوظ على الجهاز</div>`;
  document.body.prepend(sidebar);
  document.body.classList.add('has-btec-sidebar');
  const toggle=sidebar.querySelector('#homeToggle'), menu=sidebar.querySelector('#homeMenu'), chevron=sidebar.querySelector('.home-chevron');
  toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.classList.toggle('expanded',open);toggle.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-hidden',String(!open));chevron.textContent=open?'⌃':'⌄';});
  sidebar.querySelectorAll('.home-section-link').forEach(link=>link.addEventListener('click',e=>{const targetId=link.getAttribute('href').split('#')[1];if(page==='index.html'||page===''){const t=document.getElementById(targetId);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#'+targetId);}}}));
  if((page==='index.html'||page==='')&&location.hash){menu.classList.add('open');toggle.classList.add('expanded');toggle.setAttribute('aria-expanded','true');menu.setAttribute('aria-hidden','false');chevron.textContent='⌃';}

  const savedTheme=localStorage.getItem('btecjo-theme')||'light';
  const applyTheme=(dark)=>{
    document.body.classList.toggle('dark',dark);
    document.body.classList.toggle('dark-mode',dark);
    document.documentElement.style.colorScheme=dark?'dark':'light';
  };
  applyTheme(savedTheme==='dark');
  const themeBtn=sidebar.querySelector('#themeBtn');
  const syncThemeButton=()=>{const dark=document.body.classList.contains('dark');themeBtn.textContent=dark?'☀️':'🌙';themeBtn.title=dark?'الوضع النهاري':'الوضع الليلي';themeBtn.setAttribute('aria-label',dark?'الوضع النهاري':'الوضع الليلي');};
  syncThemeButton();
  themeBtn.addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);localStorage.setItem('btecjo-theme',dark?'dark':'light');syncThemeButton();});

  // Dedicated theme button at top on all screens + mobile bottom navigation.
  if(!document.querySelector('.btec-theme-switch')){
    const theme=document.createElement('button');theme.className='btec-theme-switch';theme.type='button';theme.setAttribute('aria-label','تبديل الوضع');theme.textContent=document.body.classList.contains('dark')?'☀️':'🌙';
    theme.addEventListener('click',()=>themeBtn.click());document.body.appendChild(theme);
  }
  if(!document.querySelector('.btec-mobile-nav')){
    const mobile=document.createElement('nav');mobile.className='btec-mobile-nav';mobile.setAttribute('aria-label','تنقل الهاتف');
    const items=[['index.html','🏠','الرئيسية'],['specialties-encyclopedia.html','🎓','التخصصات'],['ai.html','🤖','AI'],['student-dashboard.html','📊','لوحتي'],['top-students.html','🏆','الأوائل']];
    mobile.innerHTML=items.map(([href,icon,text])=>`<a href="${href}" class="${page===href||(page===''&&href==='index.html')?'active':''}"><span>${icon}</span>${text}</a>`).join('');document.body.appendChild(mobile);
  }

  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}
})();
