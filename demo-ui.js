(() => {
 'use strict';
 const accepted='tracking_demo_intro_v1';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function notice(text){document.querySelector('.demo-notice')?.remove();const el=document.createElement('div');el.className='demo-notice';el.role='status';el.textContent=text;document.body.append(el);setTimeout(()=>el.remove(),6000);}
 let lang='ar',welcome,lastFocus;
 const text={
 ar:`<span class="demo-kicker">INTERACTIVE WEB APP DEMO</span><h1 id="demo-title">نظام إدارة طلبات الذهب</h1><p><strong>هذه نسخة تجريبية تفاعلية مستمدة من تطبيق ويب (Web App) طُوّر لإدارة العمليات اليومية لمحل ذهب حقيقي.</strong> تتيح لك استكشاف تجربة الاستخدام، من إنشاء الطلبات ومتابعتها إلى إدارة العملاء والكتالوج.</p><p>حفاظاً على خصوصية العملاء وسلامة النظام التشغيلي، عُزلت هذه النسخة بالكامل عن النظام الأصلي وقواعد بياناته. أُزيلت هوية المحل وشعاره واستُبدلت البيانات بأمثلة مصطنعة مخصصة للعرض.</p><div class="demo-facts"><div><b>تجربة مستقلة</b>لا تسجيل دخول ولا اتصال ببيانات المحل.</div><div><b>بيانات محلية</b>تُحفظ تغييراتك في هذا المتصفح فقط.</div><div><b>مسار عمل تفاعلي</b>أنشئ طلباً ثم تابعه من صفحة الإدارة.</div></div><p class="demo-small">الطلبات محاكاة فقط. لا تُرسل رسائل ولا تُنفَّذ طباعة لدى المحل، ولا تُطلب أسعار سوق حية. استخدم بيانات وهمية؛ يمكنك إعادة ضبط التجربة في أي وقت.</p>`,
 en:`<span class="demo-kicker">INTERACTIVE WEB APP DEMO</span><h1 id="demo-title">Jewelry Orders & Tracking</h1><p><strong>This interactive demo is adapted from a web application developed for the daily operations of a real jewelry business.</strong> Explore order creation and tracking, customer management and the product catalog.</p><p>To protect customer privacy and the operational system, this edition is fully isolated from the original application and its databases. The business identity and logo have been removed. All supplied records and illustrations are synthetic examples.</p><div class="demo-facts"><div><b>Independent demo</b>No sign-in or access to the real business.</div><div><b>Local data</b>Your changes stay in this browser only.</div><div><b>Interactive workflow</b>Create an order and track it in the admin view.</div></div><p class="demo-small">Orders are simulated. No messages, shop printing or live market requests are sent. Use fictional information. You can reset the demo at any time. The application interface is in Arabic.</p>`
 };
 function renderWelcome(){welcome.innerHTML=`<div class="demo-dialog-inner" dir="${lang==='ar'?'rtl':'ltr'}">${text[lang]}<div class="demo-dialog-actions"><button class="demo-primary" id="demo-enter">${lang==='ar'?'ابدأ التجربة':'Explore the demo'}</button><button class="demo-secondary" id="demo-language">${lang==='ar'?'English':'العربية'}</button></div></div>`;
  welcome.querySelector('#demo-enter').onclick=()=>{try{sessionStorage.setItem(accepted,'1');}catch{}welcome.close();document.body.style.overflow='';lastFocus?.focus();};
  welcome.querySelector('#demo-language').onclick=()=>{lang=lang==='ar'?'en':'ar';renderWelcome();welcome.querySelector('#demo-language').focus();};
 }
 function showWelcome(){lastFocus=document.activeElement;renderWelcome();welcome.showModal();document.body.style.overflow='hidden';}
 function preview(title,content){const dialog=document.createElement('dialog');dialog.className='demo-dialog';dialog.setAttribute('aria-label',title);dialog.innerHTML=`<div class="demo-dialog-inner"><h2>${escape(title)}</h2>${content}<div class="demo-dialog-actions"><button class="demo-primary">إغلاق المعاينة</button></div></div>`;dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();}
 window.DemoUI={notice,showWelcome,
  print(order){preview('معاينة ملصق تجريبي',`<div class="demo-print-label"><strong>نظام إدارة طلبات الذهب</strong><br>${escape(order.order_number)}<br>${escape(order.customer_name_snapshot)}<br>${escape(order.customer_phone_snapshot)}<br>${escape(order.notes||'')}</div><p class="demo-small">معاينة فقط — لا يوجد اتصال بطابعة المحل.</p>`);},
  message(order){preview('معاينة رسالة تجريبية',`<p>مرحباً ${escape(order.customer_name_snapshot)}، حالة الطلب ${escape(order.order_number)}: <strong>${order.status==='completed'?'مكتمل':'قيد التنفيذ'}</strong>.</p><p><a class="demo-track-link" href="track.html?order=${encodeURIComponent(order.id)}">رابط تتبّع الطلبية التجريبية</a></p><p class="demo-small">لن تُرسل هذه الرسالة ولن يُفتح واتساب.</p>`);}
 };
 function updateReminders(){const host=document.querySelector('#ncHost');if(!host)return;const s=DemoStore.snapshot();
  const open=s.orders.filter(o=>!s.order_pickups.some(p=>p.order_id===o.id));
  host.innerHTML=`<div class="demo-reminders">${open.length} طلبات تجريبية قيد المتابعة · <a href="admin-orders.html">عرض الطلبيات</a></div>`;}
 function refreshExternal(){
   if(typeof loadAll==='function')loadAll();
   if(typeof loadCustomers==='function')loadCustomers();
   if(typeof loadCatalog==='function')loadCatalog();
   if(typeof loadModels==='function')loadModels();
   updateReminders();
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const bar=document.createElement('aside');bar.className='demo-bar';bar.dir='rtl';
  bar.innerHTML=`<div><strong>نسخة تجريبية · Web App</strong><small>بيانات وهمية محفوظة في متصفحك فقط</small></div><nav aria-label="روابط النسخة التجريبية"><a href="index.html">الرئيسية</a><a href="admin-orders.html">الطلبيات</a><button id="demo-about">عن التجربة</button><button id="demo-reset">إعادة الضبط</button></nav>`;
  document.body.prepend(bar);
  welcome=document.createElement('dialog');welcome.className='demo-dialog';welcome.id='demo-welcome';welcome.setAttribute('aria-labelledby','demo-title');
  welcome.addEventListener('cancel',e=>{e.preventDefault();welcome.querySelector('#demo-enter').focus();});
  document.body.append(welcome);bar.querySelector('#demo-about').onclick=showWelcome;
  bar.querySelector('#demo-reset').onclick=()=>{if(confirm('إعادة البيانات التجريبية إلى حالتها الأصلية؟ ستُحذف تعديلات هذه التجربة فقط.')){
    try{DemoStore.reset();location.reload();}catch(error){notice(error.message);}
  }};
  let seen=false;try{seen=sessionStorage.getItem(accepted)==='1';}catch{}
  if(!seen)showWelcome();
  if(!DemoStore.persistent)notice('تخزين المتصفح غير متاح. ستبقى التغييرات في هذه الصفحة فقط حتى إغلاقها.');
  updateReminders();
  window.addEventListener('demo-data-change',updateReminders);
  window.addEventListener('demo-external-change',refreshExternal);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshExternal();});
 });
})();
