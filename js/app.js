/* ===== التطبيق: تسجيل الدخول + سجل الصفحات + التنقل =====
   كل صفحة في js/pages ملف مستقل يسجّل نفسه بـ addPage({k,t,a,o,f}):
   k مفتاح، t عنوان القائمة، a الوصول ('r' للجميع، 'w' مدير وموظف، 'a' مدير فقط)، o الترتيب، f دالة العرض. */
const PAGES=[];
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
 if(user.role==='student'){shell(`<main style="padding:22px;max-width:640px;margin:auto"><h2>أهلاً ${esc(user.name)}</h2><div class="note">تم تسجيل دخولك بكودك الجامعي (${esc(user.code)}). بوابة الطالب (التسجيل والجدول والدرجات) ستُضاف في المراحل القادمة. يمكنك الآن تغيير كلمة المرور.</div><button class="btn gold" onclick="pwModal()">تغيير كلمة المرور</button></main>`);return}
 try{orgs=await db.list('org')}catch(e){orgs=[]}
 const items=PAGES.filter(p=>p.a==='r'||(p.a==='w'&&W())||(p.a==='a'&&user.role==='admin')).sort((a,b)=>a.o-b.o);
 if(!items.find(p=>p.k===cur))cur=items[0].k;
 shell(`<div class="layout"><nav>${items.map(p=>`<button data-k="${p.k}" class="${p.k===cur?'on':''}" onclick="go('${p.k}')">${p.t}</button>`).join('')}</nav><main id="main"></main></div>`);go(cur)}
function go(k){cur=k;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));const p=PAGES.find(x=>x.k===k);if(p)p.f()}
