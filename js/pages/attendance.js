/* ===== الغياب: الصفحة الرئيسية + غياب اليوم وأخذ الغياب =====
   الملفات المرتبطة: att_calc.js (الحساب) · att_sections.js (السكاشن) · att_rules.js (القواعد وفترة التيرم) · att_report.js (النسب والتقارير) · s_att.js (الطالب) */
let aTab='today',aTerm={},aDate=ymd(new Date()),aTk=null;
const aKind={lecture:'محاضرة',practical:'عملي'};
/* بنود الجداول المعتمدة المسكّنة للمستخدم (الإدارة ترى الكل) */
const aMine=()=>ttItems.filter(i=>i.day&&ttList.some(t=>t.id===i.tt_id&&t.status==='approved')&&(exAll()||i.staff_id===user.id));
const aRoster=tt=>gStu.filter(s=>s.college===tt.college&&s.department===tt.department&&(!tt.track||s.track===tt.track)&&s.year===tt.year&&s.level===tt.level).sort((a,b)=>(a.name||'').localeCompare(b.name||'','ar'));
async function attLoad(){
 [ttList,ttItems,gStu,crs]=await Promise.all([db.list('timetables'),db.list('tt_items'),db.list('students'),db.list('courses')]);
 ttItems.forEach(x=>{x.start_time=hm(x.start_time)||null;x.end_time=hm(x.end_time)||null});
 aTerm=(await rpc('get_term',{p_token:T()}))||{}}
async function pgAtt(){aTk=null;try{await attLoad()}catch(e){return err(e)}attShow()}
function attShow(){
 $('#main').innerHTML=`<h2>الغياب</h2><div class="tabs">${[['today','غياب اليوم'],['sec','السكاشن'],['rule','قواعد الحضور'],['rep','النسب والتقارير']].map(([k,t])=>`<button class="${aTab===k?'on':''}" onclick="aTab='${k}';attShow()">${t}</button>`).join('')}</div><div id="ab"></div>`;
 ({today:aToday,sec:aSecView,rule:aRuleView,rep:aRepView}[aTab])()}

/* غياب اليوم: المحاضرات والسكاشن المسكّنة في هذا اليوم حسب الجدول */
async function aToday(){
 let ses=[];try{ses=await rpc('att_day',{p_token:T(),p_date:aDate})}catch(e){return err(e)}
 const dn=WD[new Date(aDate+'T00:00:00').getDay()],now=new Date(),mm=now.getHours()*60+now.getMinutes(),isT=aDate===ymd(now),w=true;
 const items=aMine().filter(i=>i.day===dn).sort((a,b)=>toMin(a.start_time)-toMin(b.start_time));
 $('#ab').innerHTML=`<div class="bar"><label>التاريخ <input type="date" value="${aDate}" max="${ymd(now)}" onchange="aDate=this.value;aToday()"></label><b>${dn}</b></div><div class="note">تظهر هنا محاضراتك وسكاشنك المسكّنة في الجدول المعتمد لهذا اليوم، والجارية الآن بشارة. لا يمكن تسجيل غياب لتاريخ مستقبلي. اليوم المُلغى (إجازة) لا يُحتسب في النسب.</div><div class="tw"><table><thead><tr><th>الوقت</th><th>المادة</th><th>النوع</th><th>المرحلة</th><th>القاعة</th><th>الحالة</th><th></th></tr></thead><tbody>${items.map(i=>{
  const tt=ttList.find(t=>t.id===i.tt_id),ss=ses.filter(x=>x.tt===i.tt_id&&x.course===i.course_code&&x.kind===i.kind),live=isT&&toMin(i.start_time)<=mm&&mm<toMin(i.end_time);
  const st=ss.length?ss.map(x=>x.cancelled?'ملغاة':`تم (${x.present}/${x.total})`+(x.section?` سكشن ${x.section}`:'')).join('، '):'لم يُؤخذ بعد';
  return `<tr><td class="nw">${i.start_time} - ${i.end_time}${live?' <span class="chip">جارية الآن</span>':''}</td><td>${esc(i.course_code)} - ${esc(nm(i.course_code))}</td><td>${aKind[i.kind]}</td><td>${esc([tt.department,tt.track,tt.year,tt.level].filter(Boolean).join(' / '))}</td><td>${esc(i.room_name)}</td><td>${st}</td><td class="nw"><button class="mini" onclick="aOpen(${i.id})">${ss.length?'تعديل / أخذ':'أخذ الغياب'}</button><button class="mini red" onclick="aCancel(${i.id})">إلغاء اليوم (إجازة)</button></td></tr>`}).join('')||'<tr><td colspan="7">لا توجد محاضرات أو سكاشن مسكّنة لك في هذا اليوم.</td></tr>'}</tbody></table></div>`}
async function aCancel(id){const i=ttItems.find(x=>x.id===id);if(!confirm('تسجيل هذا اليوم كملغى (إجازة)؟ لن يُحتسب في النسب.'))return;
 try{await rpc('att_save',{p_token:T(),p_tt:i.tt_id,p_course:i.course_code,p_kind:i.kind,p_date:aDate,p_section:0,p_records:[],p_cancelled:true,p_note:null});aToday()}catch(e){err(e)}}

/* أخذ الغياب */
async function aOpen(id){
 const i=ttItems.find(x=>x.id===id),tt=ttList.find(t=>t.id===i.tt_id);let d;
 try{d=await rpc('att_load',{p_token:T(),p_tt:i.tt_id,p_course:i.course_code})}catch(e){return err(e)}
 const secs=[...new Set(d.sections.map(x=>x.n))].sort((a,b)=>a-b);
 aTk={i,tt,d,secs,sec:i.kind==='practical'&&secs.length?secs[0]:0,pres:{},key:null};aTkDraw()}
function aTkDraw(){
 const k=aTk,d=k.d,ros=aRoster(k.tt).filter(s=>!k.sec||d.sections.some(x=>x.c===s.code&&x.n===k.sec));
 const sess=d.sessions.find(s=>s.kind===k.i.kind&&s.date===aDate&&s.section===k.sec),rec={};
 d.records.filter(r=>sess&&r.s===sess.id).forEach(r=>rec[r.c]=r.p);
 if(k.key!==k.sec){k.pres={};ros.forEach(s=>k.pres[s.code]=rec[s.code]===undefined?true:rec[s.code]);k.key=k.sec}
 k.ros=ros;
 $('#ab').innerHTML=`<div class="bar"><button class="btn ghost" onclick="aTk=null;aToday()">← رجوع</button><b>${esc(k.i.course_code)} - ${esc(nm(k.i.course_code))} (${aKind[k.i.kind]}) — ${aDate}</b>${k.secs.length&&k.i.kind==='practical'?`<label>السكشن <select onchange="aTk.sec=+this.value;aTkDraw()">${k.secs.map(n=>`<option value="${n}" ${n===k.sec?'selected':''}>سكشن ${n}</option>`).join('')}</select></label>`:''}</div>
 <div class="bar"><button class="btn ghost" onclick="aAll(true)">الكل حاضر</button><button class="btn ghost" onclick="aAll(false)">الكل غائب</button><b id="ac2"></b><button class="btn gold" onclick="aSaveTk()">حفظ الغياب</button></div>
 <div class="tw"><table><thead><tr><th>الكود</th><th>الاسم</th><th>حاضر</th></tr></thead><tbody>${ros.map(s=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td><input type="checkbox" ${k.pres[s.code]?'checked':''} onchange="aTk.pres['${esc(s.code)}']=this.checked;aCnt()"></td></tr>`).join('')||'<tr><td colspan="3">لا يوجد طلاب في هذا الكشف.</td></tr>'}</tbody></table></div>`;aCnt()}
function aCnt(){const p=aTk.ros.filter(s=>aTk.pres[s.code]).length;$('#ac2').textContent=`حاضر ${p} — غائب ${aTk.ros.length-p} من ${aTk.ros.length}`}
function aAll(v){aTk.ros.forEach(s=>aTk.pres[s.code]=v);aTkDraw()}
async function aSaveTk(){const k=aTk;
 try{await rpc('att_save',{p_token:T(),p_tt:k.i.tt_id,p_course:k.i.course_code,p_kind:k.i.kind,p_date:aDate,p_section:k.sec,p_records:k.ros.map(s=>({code:s.code,present:!!k.pres[s.code]})),p_cancelled:false,p_note:null});
  alert('تم حفظ الغياب');aTk=null;aToday()}catch(e){err(e)}}

addPage({k:'attendance',t:'الغياب',a:'r',o:90,f:pgAtt});
