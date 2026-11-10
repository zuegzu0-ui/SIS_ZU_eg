/* ===== إغلاق التيرم: احتساب النتائج (درجات الاختبارات + الحضور) ثم النجاح والرسوب والترقية ===== */
let tcRes=[],tcD=null;
async function tcLoad(t){
 const [stu,regsL,rcsL,asmL,enr,att,crsL]=await Promise.all([db.list('students'),db.list('regulations'),db.list('reg_courses'),db.list('assessments'),rpc('term_enrollments',{p_token:T(),p_term:t.id}),rpc('term_attendance',{p_token:T(),p_term:t.id}),db.list('courses')]);
 const asm=asmL.filter(a=>a.term_id===t.id||(!a.term_id&&a.created_at>=t.created_at)),G={};
 (await gFetch(asm.map(a=>a.id))).forEach(x=>(G[x.a]=G[x.a]||{})[x.c]=+x.s);
 return{stu,regs:regsL,rcs:rcsL,asm,enr,att,crs:crsL,G}}
function tcCompute(D){
 const rcBy=new Map(D.rcs.map(r=>[r.reg_id+'|'+r.course_code,r])),regBy=new Map(D.regs.map(r=>[r.id,r])),asmBy={};
 D.asm.forEach(a=>(asmBy[a.course_code]=asmBy[a.course_code]||[]).push(a));
 const attBy=new Map(D.att.rows.map(r=>[r.c+'|'+r.k,r])),ruleBy=new Map(D.att.rules.map(r=>[r.course_code,r]));
 return D.enr.map(e=>{const rc=rcBy.get(e.r+'|'+e.c);if(!rc)return null;
  const r=termResult({rc,reg:regBy.get(e.r),asm:asmBy[e.c]||[],grades:D.G,code:e.s,attRow:attBy.get(e.s+'|'+e.c),rule:ruleBy.get(e.c)});
  return{s:e.s,c:e.c,r:e.r,h:+rc.credit_hours||0,cw:r.cw,pr:r.pr,fe:r.fe,t:r.total,l:r.letter,p:r.points,ok:r.passed,inc:r.incomplete,miss:r.missing}}).filter(Boolean)}
async function tcStart(){
 const t=tmOpen;$('#main').innerHTML='<h2>إغلاق التيرم</h2><div class="note">جارٍ تحميل البيانات وحساب النتائج... قد يستغرق ذلك دقيقة.</div>';
 try{tcD=await tcLoad(t);tcRes=tcCompute(tcD)}catch(e){err(e);return pgTerm()}
 const names={};tcD.crs.forEach(c=>names[c.code]=c.name);
 const by={};tcRes.forEach(r=>{const o=by[r.c]=by[r.c]||{n:0,p:0,f:0,sum:0,inc:0,miss:0};o.n++;r.ok?o.p++:o.f++;o.sum+=r.t;if(r.inc)o.inc++;o.miss+=r.miss});
 const rows=Object.entries(by).sort((a,b)=>a[0].localeCompare(b[0])),incC=rows.filter(([,o])=>o.inc).length,reg=t.kind==='regular';
 $('#main').innerHTML=`<h2>إغلاق التيرم: ${esc(t.name)}</h2><div class="card"><b>${tcRes.length}</b> تسجيل في ${rows.length} مادة — ناجح <b>${tcRes.filter(r=>r.ok).length}</b> — راسب <b>${tcRes.filter(r=>!r.ok).length}</b>${incC?` — <b style="color:#a32">${incC} مادة ناقصة الدرجات</b>`:''}</div>
 ${incC?'<div class="note">مواد ناقصة الدرجات: لا يوجد لها اختبار لأحد مكوّنات الدرجة (أعمال فصلية/عملي/تحريري) في هذا التيرم، فيُحتسب المكوّن صفرًا. راجع سجل الدرجات قبل الإغلاق. الطالب الغائب عن اختبار يُحتسب له صفر فيه.</div>':''}
 <div class="tw"><table><thead><tr><th>المادة</th><th>المسجلون</th><th>ناجح</th><th>راسب</th><th>متوسط الدرجة</th><th>درجات مفقودة</th><th></th></tr></thead><tbody>${rows.map(([c,o])=>`<tr><td>${esc(c)} - ${esc(names[c]||'')}</td><td>${o.n}</td><td>${o.p}</td><td>${o.f}</td><td>${(o.sum/o.n).toFixed(1)}</td><td>${o.miss}</td><td>${o.inc?'<span class="chip" style="background:#f4c7c3">ناقصة</span>':''}</td></tr>`).join('')||'<tr><td colspan="7">لا توجد تسجيلات في هذا التيرم.</td></tr>'}</tbody></table></div>
 <div class="card" style="margin-top:12px">${reg?`<label style="display:block;margin:6px 0"><input type="checkbox" id="cp" checked> ترقية الطلاب تلقائيًا إلى المستوى التالي (والفرقة التالية عند آخر مستوى)، وإعلان الخريجين (الساعات المطلوبة ومعدل 2.00 فأكثر)</label><label style="display:block;margin:6px 0"><input type="checkbox" id="cs"> إتاحة فصل صيفي للطلاب الراسبين</label>`:'<div class="note">إغلاق فصل صيفي: تُحفظ النتائج بدون ترقية.</div>'}<div class="bar" style="margin:10px 0 0"><button class="btn red" onclick="tcFinish()">تأكيد الإغلاق وحفظ النتائج</button><button class="btn ghost" onclick="pgTerm()">إلغاء</button></div></div>`}
async function tcFinish(){
 const t=tmOpen,pr=!!($('#cp')&&$('#cp').checked),su=!!($('#cs')&&$('#cs').checked);
 if(!confirm('إغلاق التيرم نهائيًا؟ لا يمكن التراجع عن حفظ النتائج والترقية.'))return;
 try{for(let i=0;i<tcRes.length;i+=1500)await rpc('add_results',{p_token:T(),p_term:t.id,p_rows:tcRes.slice(i,i+1500).map(({miss,...r})=>r)});
  const r=await rpc('close_term',{p_token:T(),p_term:t.id,p_promote:pr,p_summer:su});
  alert(`تم إغلاق التيرم.\nرُقّي ${r.promoted} طالب، وتخرّج ${r.graduated} طالب.`);pgTerm()}catch(e){err(e)}}
