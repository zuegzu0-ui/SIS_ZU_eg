/* ===== اختباراتي (جهة الطالب): قائمة الاختبارات + شاشة الاختبار المؤمَّنة =====
   الخادم لا يرسل الإجابات الصحيحة للطالب أبدًا، ويصحح الاختيارات عند التسليم. */
let sxL=[],sx=null,sxTimer=null;
const SXEV=['copy','cut','paste','contextmenu','dragstart'];

async function sExams(){
 if(sx)return sxRender();
 try{sxL=await rpc('my_exams',{p_token:T()})}catch(e){return err(e)}
 const skew=sxL.length?new Date(sxL[0].now).getTime()-Date.now():0,now=Date.now()+skew;
 $('#main').innerHTML=`<h2>اختباراتي</h2><div class="tw"><table><thead><tr><th>الاختبار</th><th>المادة</th><th>الموعد</th><th>الحالة</th><th></th></tr></thead><tbody>${sxL.map(e=>{
  const s=new Date(e.starts_at).getTime(),f=s+e.window_min*60000;let st='',act='';
  if(e.status==='submitted'){st='تم التسليم'+(e.show_result&&e.score!=null?` — النتيجة: ${+(+e.score).toFixed(2)} من ${e.max}${e.pending?' (المقالي قيد التصحيح)':''}`:'')}
  else if(now<s)st='لم يبدأ بعد';
  else if(now<f){st=e.status==='in_progress'?'جارٍ':'متاح الآن';act=`<button class="btn gold" onclick="sStart(${e.id})">${e.status==='in_progress'?'متابعة':'دخول الاختبار'}</button>`}
  else st='انتهى';
  return `<tr><td>${esc(e.name)}</td><td>${esc(e.course_code)}</td><td class="nw">${new Date(e.starts_at).toLocaleString('ar-EG')}</td><td>${st}</td><td>${act}</td></tr>`}).join('')||'<tr><td colspan="5">لا توجد اختبارات حاليًا.</td></tr>'}</tbody></table></div>`}

async function sStart(id){
 const e=sxL.find(x=>x.id===id);
 if(!confirm(`بدء الاختبار "${e.name}"؟`+(e.secure?'\nتنبيه: الاختبار مؤمَّن. مغادرة الشاشة تغلقه وترسل إجاباتك فورًا، ولا يمكن النسخ أو اللصق.':'')+(e.duration_min?`\nمدة الحل ${e.duration_min} دقيقة.`:'')))return;
 try{const r=await rpc('start_exam',{p_token:T(),p_exam:id});
  if(r.expired){alert('انتهى وقت هذا الاختبار وتم إغلاقه.');return sExams()}
  sx={id,exam:r.exam,deadline:new Date(r.deadline).getTime(),skew:new Date(r.now).getTime()-Date.now(),ans:r.answers||{},busy:false,dlg:false,hs:{}};
  sxRender();sxArm()}catch(er){err(er)}}

function sxRender(){const ex=sx.exam;
 $('#main').className=ex.secure?'noselect':'';
 $('#main').innerHTML=`<div class="bar"><h2 style="margin:0">${esc(ex.name)}</h2><span class="timer" id="tm">--:--</span></div>${ex.sections.map(s=>`<div class="card"><b>${esc(s.title)}</b>${s.questions.map(q=>`<div class="q"><div><b>${esc(q.text)}</b> <span class="chip">${q.score} درجة</span></div>${q.type==='mcq'?q.choices.map((c,k)=>`<label style="display:block;margin:6px 0"><input type="radio" name="${q.id}" ${sx.ans[q.id]==k?'checked':''} onchange="sx.ans['${q.id}']=${k}"> ${esc(c)}</label>`).join(''):`<textarea rows="5" oninput="sx.ans['${q.id}']=this.value">${esc(sx.ans[q.id]||'')}</textarea>`}</div>`).join('')}</div>`).join('')}<div class="bar"><button class="btn gold" onclick="sxConfirm()">تسليم الإجابات</button></div>`}

function sxArm(){const ex=sx.exam;
 const tick=()=>{if(!sx)return;const rem=sx.deadline-(Date.now()+sx.skew),t=$('#tm');
  if(t){const s=Math.max(0,Math.floor(rem/1000));t.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
  if(rem<=0)sSubmit('انتهى الوقت')};
 sxTimer=setInterval(tick,1000);tick();
 if(ex.secure){const h=sx.hs;
  h.bad=e=>{e.preventDefault();return false};
  h.vis=()=>{if(document.hidden)sSubmit('غادر شاشة الاختبار')};
  h.blur=()=>setTimeout(()=>{if(sx&&!sx.busy&&!sx.dlg&&!document.hasFocus())sSubmit('غادر شاشة الاختبار')},700);
  h.key=e=>{if(e.key==='PrintScreen'||((e.ctrlKey||e.metaKey)&&['c','x','v','p','s','u'].includes(e.key.toLowerCase())))e.preventDefault()};
  document.addEventListener('visibilitychange',h.vis);window.addEventListener('blur',h.blur);document.addEventListener('keydown',h.key);
  SXEV.forEach(n=>document.addEventListener(n,h.bad))}}

function sxConfirm(){sx.dlg=true;const ok=confirm('تأكيد تسليم الإجابات؟ لا يمكن التعديل بعد التسليم.');setTimeout(()=>{if(sx)sx.dlg=false},1500);if(ok)sSubmit(null)}
async function sSubmit(reason){
 if(!sx||sx.busy)return;sx.busy=true;clearInterval(sxTimer);
 const id=sx.id,h=sx.hs,ans=sx.ans;
 document.removeEventListener('visibilitychange',h.vis||(()=>0));window.removeEventListener('blur',h.blur||(()=>0));document.removeEventListener('keydown',h.key||(()=>0));
 SXEV.forEach(n=>document.removeEventListener(n,h.bad||(()=>0)));
 $('#main').className='';
 try{await rpc('submit_exam',{p_token:T(),p_exam:id,p_answers:ans,p_reason:reason||null});alert('تم إرسال إجاباتك.'+(reason?'\nسبب الإرسال: '+reason:''))}catch(e){err(e)}
 sx=null;sExams()}

addPage({k:'s_exams',t:'اختباراتي',a:'s',o:2,f:sExams});
