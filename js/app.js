/* ===== التطبيق: تسجيل الدخول + سجل الصفحات + التنقل =====
   كل صفحة في js/pages ملف مستقل يسجّل نفسه بـ addPage({k,t,a,o,f}):
   k مفتاح، t عنوان القائمة، a الوصول ('r' للجميع، 'w' مدير وموظف، 'a' مدير فقط)، o الترتيب، f دالة العرض. */
const PAGES=[];
let SLK=[];   /* حجوب الطالب: [{reason,tabs}] وtabs تحوي '*' لكل التبويبات ما عدا «حسابي» */
const slock=k=>SLK.filter(l=>l.tabs.includes('*')||l.tabs.includes(k));
const addPage=p=>PAGES.push(p);
/* ===== الدخول والتنقل ===== */
function login(msg=''){shell(`<div id="login"><h2 style="border:0">تسجيل الدخول</h2><input id="u" placeholder="اسم المستخدم أو الكود الجامعي" autocomplete="username"><input id="p" type="password" placeholder="كلمة المرور" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"><div style="color:#a32;min-height:22px">${msg}</div><button class="btn gold" style="width:100%" onclick="doLogin()">دخول</button></div>`)}
async function doLogin(){const u=$('#u').value.trim(),p=$('#p').value;
 try{user=await rpc('login',{p_username:u,p_password:p});S('user',user);home()}catch(e){user=null;login(esc(e.message))}}
async function logout(){try{await rpc('logout',{p_token:T()})}catch{}localStorage.removeItem('user');user=null;login()}
function pwModal(){form('تغيير كلمة المرور',[['o','كلمة المرور الحالية','password'],['n','كلمة المرور الجديدة (6 أحرف فأكثر)','password'],['c','تأكيد كلمة المرور الجديدة','password']],{},{},async(r,d)=>{
 if(r.n!==r.c)return alert('تأكيد كلمة المرور غير مطابق');
 await rpc('change_password',{p_token:T(),p_old:r.o||'',p_new:r.n||''});d.remove();alert('تم تغيير كلمة المرور')})}
async function home(){
  if(user.role!=='student')try{orgs=await db.list('org')}catch(e){orgs=[]}
 if(user.role==='student')try{SLK=await rpc('my_locks',{p_token:T()})}catch{SLK=[]}
 const items=PAGES.filter(p=>user.role==='student'?p.a==='s':(p.a==='r'||(p.a==='w'&&W())||(p.a==='a'&&user.role==='admin'))).sort((a,b)=>a.o-b.o);
 if(!items.find(p=>p.k===cur))cur=items[0].k;
 shell(`<div class="layout"><nav>${items.map(p=>`<button data-k="${p.k}" class="${p.k===cur?'on':''}" onclick="go('${p.k}')">${p.t}${user.role==='student'&&p.k!=='s_home'&&slock(p.k).length?' 🔒':''}</button>`).join('')}</nav><main id="main"></main></div>`);go(cur)}
function go(k){cur=k;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));const p=PAGES.find(x=>x.k===k);if(!p)return;
 if(user.role==='student'&&k!=='s_home'&&slock(k).length){$('#main').innerHTML=`<h2>${p.t}</h2><div class="note" style="background:#f4c7c3;border-color:#a32"><b>هذا التبويب مغلق.</b><br>السبب:<br>${slock(k).map(l=>'• '+esc(l.reason)).join('<br>')}<br><small>تجد تفاصيل مصروفاتك ومدفوعاتك في تبويب «حسابي».</small></div>`;return}
 p.f()}
