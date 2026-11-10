/* ===== الاختبارات الإلكترونية: جهة الدكتور / المعيد / الإدارة =====
   قائمة الاختبارات + منشئ الاختبار (أقسام وأسئلة) + النتائج وتصحيح المقالي.
   جهة الطالب في s_exams.js */
let exView='list',exs=[],ex={},exTT=[],exTI=[],exCur=null,exAtt=[];
const qid=()=>'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const exMax=e=>(e.sections||[]).reduce((t,s)=>t+s.questions.reduce((a,q)=>a+(+q.score||0),0),0);
const exStatus=e=>{const n=Date.now(),s=new Date(e.starts_at).getTime();return n<s?'مجدول':n<s+e.window_min*60000?'نشط الآن':'منتهي'};
const locIso=iso=>{const d=new Date(iso),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
const exAll=()=>['admin','employee'].includes(user.role);
/* مواد الدكتور/المعيد = المواد المسكّنة له في جداول معتمدة. الإدارة ترى كل المواد */
const myCourses=()=>{if(exAll())return crs;const ok=new Set(exTI.filter(i=>i.staff_id===user.id&&exTT.some(t=>t.id===i.tt_id&&t.status==='approved')).map(i=>i.course_code));return crs.filter(c=>ok.has(c.code))};

async function pgExams(){
 try{[exs,crs,exTT,exTI]=await Promise.all([rpc('list_exams',{p_token:T()}),db.list('courses'),db.list('timetables'),db.list('tt_items')]);gStu=await db.list('students')}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>الاختبارات الإلكترونية</h2><div id="xb"></div>`;
 if(exView==='res'&&exs.find(e=>e.id===exCur))return exRes();
 if(exView==='build'&&ex.name!==undefined)return exBuild();
 exView='list';exList()}

/* القائمة */
function exList(){
 $('#xb').innerHTML=`<div class="note">اختر مادتك والمرحلة (قسم أو أكثر وشعبة أو أكثر)، وأضف الأقسام والأسئلة (اختيار من متعدد أو مقالي)، وحدد موعد الظهور والقواعد. يظهر الاختبار للطلاب المسجلين في المرحلة فقط وفي الوقت المحدد. تظهر مواد الدكتور والمعيد وفق الجدول المعتمد.</div><div class="bar"><button class="btn gold" onclick="exNew()">+ اختبار جديد</button></div><div class="tw"><table><thead><tr><th>الاختبار</th><th>المادة</th><th>المرحلة</th><th>الموعد</th><th>مدة الإتاحة</th><th>الحالة</th><th>دخلوا / سلّموا</th><th>النتيجة للطلاب</th><th></th></tr></thead><tbody>${exs.map(e=>`<tr><td>${esc(e.name)}</td><td>${esc(e.course_code)} - ${esc(nm(e.course_code))}</td><td>${esc([e.college,dsText(dsOf(e)),e.year,e.level].filter(Boolean).join(' / '))}</td><td class="nw">${new Date(e.starts_at).toLocaleString('ar-EG')}</td><td>${e.window_min} د</td><td>${exStatus(e)}</td><td>${e.attempts} / ${e.submitted}</td><td>${e.show_result?'ظاهرة':'مخفية'}</td><td class="nw"><button class="mini" onclick="exOpenRes(${e.id})">النتائج</button><button class="mini" onclick="exEdit(${e.id})">تحرير</button><button class="mini red" onclick="exDel(${e.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="9">لا توجد اختبارات.</td></tr>'}</tbody></table></div>`}
async function exDel(id){if(!confirm('حذف الاختبار وكل إجابات الطلاب؟'))return;try{await rpc('delete_exam',{p_token:T(),p_id:id});pgExams()}catch(e){err(e)}}

/* المنشئ */
function exNew(){
 if(!myCourses().length)return alert('لا توجد مواد مسكّنة لك في جدول معتمد. اطلب من الإدارة اعتماد الجدول وتسكينك على المادة.');
 ex={name:'',course_code:'',depts:{},term:'',starts_at:'',window_min:60,duration_min:'',show_result:false,secure:true,sections:[{title:'القسم الأول',questions:[]}]};exView='build';exBuild()}
function exEdit(id){const e=exs.find(x=>x.id===id);
 ex={id:e.id,name:e.name,course_code:e.course_code,college:e.college,depts:dsOf(e),year:e.year||undefined,level:e.level||undefined,term:e.term||'',starts_at:locIso(e.starts_at),window_min:e.window_min,duration_min:e.duration_min||'',show_result:e.show_result,secure:e.secure,sections:JSON.parse(JSON.stringify(e.sections))};exView='build';exBuild()}
function exBuild(){
 const so=(v,l)=>l.map(([k,t])=>`<option value="${k}" ${String(v)===k?'selected':''}>${t}</option>`).join('');
 $('#xb').innerHTML=`<div class="bar"><button class="btn ghost" onclick="exView='list';pgExams()">← رجوع</button><b>${ex.id?'تحرير الاختبار':'اختبار جديد'}</b></div>
 <div class="card"><div class="grid">
 <label>اسم الاختبار<input value="${esc(ex.name)}" oninput="ex.name=this.value"></label>
 <label>المادة<select onchange="exCourse(this.value)"><option value="">اختر...</option>${myCourses().map(c=>`<option value="${esc(c.code)}" ${ex.course_code===c.code?'selected':''}>${esc(c.code)} - ${esc(c.name)}</option>`).join('')}</select></label>
 <label>الفصل الدراسي<input value="${esc(ex.term)}" oninput="ex.term=this.value"></label>
 <label>موعد ظهور الاختبار<input type="datetime-local" value="${ex.starts_at}" onchange="ex.starts_at=this.value"></label>
 <label>مدة بقاء الاختبار متاحًا (دقيقة) ثم يصبح غير نشط ويختفي<input type="number" min="1" value="${ex.window_min}" onchange="ex.window_min=+this.value"></label>
 <label>مدة الحل لكل طالب (دقيقة، اختياري)<input type="number" min="1" value="${ex.duration_min}" onchange="ex.duration_min=this.value"></label>
 <label>إظهار النتيجة للطلاب<select onchange="ex.show_result=this.value==='true'">${so(ex.show_result,[['false','لا'],['true','نعم']])}</select></label>
 <label>تأمين الاختبار<select onchange="ex.secure=this.value==='true'">${so(ex.secure,[['true','نعم: منع النسخ وإغلاق وإرسال تلقائي عند مغادرة الشاشة'],['false','لا']])}</select></label></div>
 <div id="exsp" style="margin-top:10px"></div></div>
 <div id="exsec"></div><div class="bar"><button class="btn gold" onclick="exSave()">حفظ الاختبار</button></div>`;
 scopePicker('exsp',ex,{year:true,level:true});exSec()}
function exCourse(code){ex.course_code=code;
 if(!ex.id&&code&&!ex.college){const ok=i=>i.course_code===code&&exTT.some(t=>t.id===i.tt_id&&t.status==='approved'),it=exTI.find(i=>ok(i)&&i.staff_id===user.id)||exTI.find(ok),t=it&&exTT.find(x=>x.id===it.tt_id);
  if(t){ex.college=t.college;ex.depts=t.department?{[t.department]:t.track?[t.track]:[]}:{};ex.year=t.year;ex.level=t.level;scopePicker('exsp',ex,{year:true,level:true})}}}
function exSec(){
 $('#exsec').innerHTML=ex.sections.map((s,si)=>`<div class="card"><div class="bar" style="margin:0 0 8px"><label style="flex:1">عنوان القسم <input style="width:100%" value="${esc(s.title)}" oninput="ex.sections[${si}].title=this.value"></label><button class="btn ghost" onclick="exAddQ(${si},'mcq')">+ اختيار من متعدد</button><button class="btn ghost" onclick="exAddQ(${si},'essay')">+ سؤال مقالي</button><button class="mini red" onclick="exDelSec(${si})">حذف القسم</button></div>${s.questions.map((q,qi)=>exQ(si,qi,q)).join('')||'<div class="note">لا توجد أسئلة في هذا القسم.</div>'}</div>`).join('')+`<div class="bar"><button class="btn ghost" onclick="exAddSec()">+ قسم جديد</button><b id="xt"></b></div>`;exTot()}
function exQ(si,qi,q){const p=`ex.sections[${si}].questions[${qi}]`;
 return `<div class="q"><div class="bar" style="margin:0 0 6px"><span class="chip">${q.type==='mcq'?'اختيار من متعدد':'مقالي (تصحيح يدوي)'}</span><label>الدرجة <input type="number" min="0" step="any" style="width:80px" value="${q.score??''}" oninput="${p}.score=+this.value;exTot()"></label><button class="mini red" onclick="exDelQ(${si},${qi})">حذف السؤال</button></div><label style="display:block">نص السؤال<textarea rows="2" oninput="${p}.text=this.value">${esc(q.text)}</textarea></label>${q.type==='mcq'?`<label style="display:block;margin-top:6px">الاختيارات (سطر لكل اختيار)<textarea rows="4" onchange="exCh(${si},${qi},this.value)">${esc((q.choices||[]).join('\n'))}</textarea></label><label>الإجابة الصحيحة <select onchange="${p}.correct=+this.value">${(q.choices||[]).map((c,i)=>`<option value="${i}" ${q.correct===i?'selected':''}>${i+1}) ${esc(c)}</option>`).join('')}</select></label>`:''}</div>`}
const exAddSec=()=>{ex.sections.push({title:'قسم '+(ex.sections.length+1),questions:[]});exSec()};
const exDelSec=si=>{if(confirm('حذف القسم وأسئلته؟')){ex.sections.splice(si,1);exSec()}};
const exAddQ=(si,type)=>{ex.sections[si].questions.push({id:qid(),type,text:'',score:1,...(type==='mcq'?{choices:['',''],correct:0}:{})});exSec()};
const exDelQ=(si,qi)=>{ex.sections[si].questions.splice(qi,1);exSec()};
function exCh(si,qi,v){const q=ex.sections[si].questions[qi];q.choices=v.split('\n').map(x=>x.trim()).filter(Boolean);if(!(q.correct<q.choices.length))q.correct=0;exSec()}
function exTot(){const t=$('#xt');if(t)t.textContent='مجموع الدرجات: '+exMax(ex)}
async function exSave(){
 if(!ex.name.trim()||!ex.course_code||!ex.starts_at||!ex.college)return alert('اسم الاختبار والمادة والكلية وموعد الظهور مطلوبة.');
 if(!(+ex.window_min>0))return alert('حدد مدة بقاء الاختبار متاحًا.');
 const qs=ex.sections.flatMap(s=>s.questions);if(!qs.length)return alert('أضف سؤالًا واحدًا على الأقل.');
 for(const q of qs){if(!q.text.trim())return alert('يوجد سؤال بلا نص.');if(!(q.score>0))return alert('كل سؤال يحتاج درجة أكبر من صفر.');
  if(q.type==='mcq'&&((q.choices||[]).length<2||!(q.correct>=0&&q.correct<q.choices.length)))return alert('أسئلة الاختيار تحتاج اختيارين على الأقل وإجابة صحيحة.')}
 try{await rpc('save_exam',{p_token:T(),p_row:{id:ex.id||null,name:ex.name.trim(),course_code:ex.course_code,college:ex.college,dscope:ex.depts||{},year:ex.year||null,level:ex.level||null,term:ex.term||null,starts_at:new Date(ex.starts_at).toISOString(),window_min:+ex.window_min,duration_min:ex.duration_min?+ex.duration_min:null,show_result:!!ex.show_result,secure:!!ex.secure,sections:ex.sections}});
  exView='list';pgExams()}catch(e){err(e)}}

/* النتائج وتصحيح المقالي */
async function exOpenRes(id){exCur=id;exView='res';await exRes()}
const exEss=e=>e.sections.flatMap(s=>s.questions).filter(q=>q.type==='essay');
async function exRes(){
 const e=exs.find(x=>x.id===exCur);if(!e){exView='list';return exList()}
 try{exAtt=await rpc('exam_attempts',{p_token:T(),p_exam:exCur})}catch(er){return err(er)}
 const att={};exAtt.forEach(a=>att[a.code]=a);
 const stus=gStu.filter(s=>s.college===e.college&&dsMatch(e.dscope||{},s.department,s.track)&&(!e.year||s.year===e.year)&&(!e.level||s.level===e.level)).sort((a,b)=>(a.name||'').localeCompare(b.name||'','ar'));
 const max=exMax(e),ess=exEss(e);
 const rows=stus.map(s=>{const a=att[s.code];let auto='',essay='',total='';
  if(a){auto=+a.auto;const man=Object.values(a.manual||{}).reduce((t,v)=>t+ +v,0),pend=ess.some(q=>!((a.manual||{}).hasOwnProperty(q.id)));
   if(ess.length)essay=a.status==='submitted'?(pend?'بانتظار التصحيح':man):'';if(a.status==='submitted')total=+(auto+man).toFixed(2)}
  return {code:s.code,name:s.name,status:!a?'لم يدخل':a.status==='submitted'?'سلّم':'جارٍ',auto,essay,total,reason:a?a.reason||'':''}});
 const done=rows.filter(r=>r.total!=='');
 window.exRows=rows;window.exCols=[['code','الكود'],['name','الاسم'],['status','الحالة'],['auto','درجة الاختيار'],['essay','المقالي'],['total','المجموع (من '+max+')'],['reason','ملاحظة']];
 $('#xb').innerHTML=`<div class="bar"><button class="btn ghost" onclick="exView='list';pgExams()">← رجوع</button><b>${esc(e.name)}</b><span class="chip">${exStatus(e)}</span></div>
 <div class="card"><b>${stus.length}</b> طالب في المرحلة — دخل <b>${exAtt.length}</b> — سلّم <b>${exAtt.filter(a=>a.status==='submitted').length}</b> — المجموع الكلي للاختبار ${max}${done.length?` — متوسط المصحَّحين ${(done.reduce((t,r)=>t+r.total,0)/done.length).toFixed(2)}`:''}</div>
 <div class="bar"><button class="btn gold" onclick="exShow(${!e.show_result})">${e.show_result?'إخفاء النتيجة عن الطلاب':'إظهار النتيجة للطلاب'}</button>${ess.length?'<button class="btn ghost" onclick="exUniform()">درجة موحدة لسؤال مقالي</button>':''}<button class="btn ghost" onclick="exExport()">تحميل النتائج (Excel / PDF)</button></div>
 <div class="tw"><table><thead><tr>${exCols.map(c=>`<th>${esc(c[1])}</th>`).join('')}<th></th></tr></thead><tbody>${rows.slice(0,400).map(r=>`<tr>${exCols.map(c=>`<td>${esc(r[c[0]])}</td>`).join('')}<td>${ess.length&&r.status==='سلّم'?`<button class="mini" onclick="exGrade('${esc(r.code)}')">تصحيح المقالي</button>`:''}</td></tr>`).join('')||'<tr><td colspan="8">لا يوجد طلاب.</td></tr>'}</tbody></table></div>`}
function exExport(){const e=exs.find(x=>x.id===exCur);exportModal(exRows,exCols,'exam_'+e.id,'نتائج: '+e.name)}
async function exShow(on){try{await rpc('exam_show_result',{p_token:T(),p_exam:exCur,p_show:on});exs=await rpc('list_exams',{p_token:T()});exRes()}catch(e){err(e)}}
function exGrade(code){const e=exs.find(x=>x.id===exCur),a=exAtt.find(x=>x.code===code),ess=exEss(e);
 const d=modal(`<h2>تصحيح: ${esc(a.name)} (${esc(code)})</h2>${ess.map(q=>`<div class="q"><b>${esc(q.text)}</b> <span class="chip">من ${q.score}</span><div style="white-space:pre-wrap;margin:8px 0;padding:8px;background:#fff;border:1px dashed var(--line)">${esc((a.answers||{})[q.id]||'— لم يُجب —')}</div><label>الدرجة <input type="number" min="0" max="${q.score}" step="any" data-q="${q.id}" value="${(a.manual||{})[q.id]??''}"></label></div>`).join('')}<div class="bar" style="margin:12px 0 0"><button class="btn gold" id="sv">حفظ</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 d.querySelector('#sv').onclick=async()=>{const rows=[...d.querySelectorAll('input[data-q]')].filter(i=>i.value!=='').map(i=>({student_code:code,qid:i.dataset.q,score:+i.value}));
  try{await rpc('grade_essays',{p_token:T(),p_exam:exCur,p_rows:rows});d.remove();exRes()}catch(er){err(er)}}}
function exUniform(){const e=exs.find(x=>x.id===exCur),ess=exEss(e);
 const d=modal(`<h2>درجة موحدة لكل الإجابات</h2><div class="note">تُمنح الدرجة نفسها لكل الطلاب الذين سلّموا، على سؤال مقالي واحد (يمكنك تعديلها لكل طالب لاحقًا).</div><div class="grid"><label>السؤال<select id="uq">${ess.map(q=>`<option value="${q.id}" data-m="${q.score}">${esc(q.text.slice(0,60))} (من ${q.score})</option>`).join('')}</select></label><label>الدرجة<input id="us" type="number" min="0" step="any"></label></div><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="sv">تطبيق</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 d.querySelector('#sv').onclick=async()=>{const q=d.querySelector('#uq').value,s=+d.querySelector('#us').value,m=+d.querySelector('#uq').selectedOptions[0].dataset.m;if(!(s>=0&&s<=m))return alert('الدرجة يجب أن تكون بين 0 و '+m);
  const rows=exAtt.filter(a=>a.status==='submitted').map(a=>({student_code:a.code,qid:q,score:s}));if(!rows.length)return alert('لا توجد إجابات مُسلَّمة.');
  if(!confirm('منح '+s+' لـ '+rows.length+' طالب؟'))return;
  try{await rpc('grade_essays',{p_token:T(),p_exam:exCur,p_rows:rows});d.remove();exRes()}catch(er){err(er)}}}

addPage({k:'exams',t:'الاختبارات الإلكترونية',a:'r',o:80,f:pgExams});
