/* ===== حساب نتائج التيرم (منطق صرف قابل للاختبار) =====
   مقياس التقدير الافتراضي أدناه قابل للتعديل. يُحتسب الحد الأدنى للنجاح ونسبة الحد الأدنى في التحريري والعملي من اللائحة (60% و30%). */
const GPA_SCALE=[[90,'A',4.0],[85,'B+',3.5],[80,'B',3.0],[75,'C+',2.75],[70,'C',2.5],[65,'D+',2.25],[60,'D',2.0],[0,'F',0]];
const gpaOf=pct=>{const r=GPA_SCALE.find(x=>pct>=x[0]);return{letter:r[1],points:r[2]}};
const CW_KINDS=['midterm','quiz','coursework','exam'],PR_KINDS=['practical'],FE_KINDS=['final'];
/* درجة الحضور من الأرقام المجمَّعة للطالب: row={lt,lp,pt,pp,dt,dp} (محاضرات/عملي/أيام: المُسجَّل والحاضر) */
function attFromRow(row,rule){
 if(!row||!rule||rule.grade_mode==='none'||!rule.add_to_grades)return null;
 const both=rule.count_mode==='both',exp=both?(+row.lt+ +row.pt):+row.dt,att=both?(+row.lp+ +row.pp):+row.dp;if(!exp)return null;
 return{grade:attGrade(rule,att,exp,+(100*att/exp).toFixed(1)),max:+rule.grade_max||0}}
/* o={rc:سطر مادة اللائحة, reg:اللائحة, asm:اختبارات المادة في التيرم, grades:{assId:{code:score}}, code, attRow, rule} */
function termResult(o){
 const rc=o.rc,reg=o.reg||{},passPct=+reg.pass_pct||60,minc=+(reg.min_component_pct??30);
 const wCw=+rc.coursework||0,wPr=rc.has_practical==='نعم'?(+rc.practical||0):0,wFe=+rc.final_exam||0;
 const ag=attFromRow(o.attRow,o.rule);
 const comp=(kinds,exRaw,exMax)=>{const l=o.asm.filter(a=>kinds.includes(a.kind));let raw=exRaw||0,max=exMax||0,miss=0;
  l.forEach(a=>{const g=(o.grades[a.id]||{})[o.code];if(g===undefined)miss++;else raw+=g;max+=+a.max_score});return{has:max>0,raw,max,miss}};
 const cw=comp(CW_KINDS,ag&&ag.grade!==null?ag.grade:0,ag&&ag.grade!==null?ag.max:0),pr=comp(PR_KINDS),fe=comp(FE_KINDS);
 const cwS=wCw&&cw.max?cw.raw/cw.max*wCw:0,prS=wPr&&pr.max?pr.raw/pr.max*wPr:0,feS=wFe&&fe.max?fe.raw/fe.max*wFe:0;
 const total=+(cwS+prS+feS).toFixed(2),incomplete=(wFe>0&&!fe.has)||(wPr>0&&!pr.has)||(wCw>0&&!cw.has);
 const okMin=(wFe===0||feS>=minc/100*wFe)&&(wPr===0||prS>=minc/100*wPr),passed=total>=passPct&&okMin,g=passed?gpaOf(total):{letter:'F',points:0};
 return{cw:+cwS.toFixed(2),pr:+prS.toFixed(2),fe:+feS.toFixed(2),total,letter:g.letter,points:g.points,passed,incomplete,missing:cw.miss+pr.miss+fe.miss}}
/* خطة الطالب: سجل النتائج والمواد (ناجحة/مسجّلة/متاحة/محجوبة/مستنفدة) */
const PS={passed:'ناجح',enrolled:'مسجّلة هذا التيرم',available:'متاحة',locked:'محجوبة',exhausted:'استُنفدت المحاولات'};
function planHtml(p){const s=p.student;
 return `<div class="card"><b>${esc(s.name)}</b> (${esc(s.code)}) — ${esc(s.year)} / ${esc(s.level)} — ${s.status==='graduated'?'<span class="chip">خريج</span>':'على القيد'}<br>اللائحة: ${esc(s.regulation||'غير محددة')} — المعدل التراكمي <b>${p.cgpa??'-'}</b> — الساعات المجتازة <b>${p.earned}</b>${s.grad_hours?` من ${s.grad_hours}`:''}</div>
 <h3>المواد حسب اللائحة</h3><div class="tw"><table><thead><tr><th>المادة</th><th>الفرقة</th><th>المستوى</th><th>الساعات</th><th>الحالة</th><th>سبب الحجب (متطلبات لم تُجتز)</th></tr></thead><tbody>${p.courses.map(c=>`<tr><td>${esc(c.course)} - ${esc(c.name)}</td><td>${esc(c.year)}</td><td>${esc(c.level)}</td><td>${esc(c.hours)}</td><td>${PS[c.status]}${c.fails?` (رسب ${c.fails})`:''}</td><td>${c.status==='locked'||c.status==='available'?esc(c.missing.join('، ')):''}</td></tr>`).join('')||'<tr><td colspan="6">لا توجد لائحة مطابقة.</td></tr>'}</tbody></table></div>
 <h3>سجل النتائج</h3><div class="tw"><table><thead><tr><th>التيرم</th><th>المادة</th><th>الساعات</th><th>الدرجة</th><th>التقدير</th><th>النقاط</th><th>النتيجة</th></tr></thead><tbody>${p.results.map(r=>`<tr><td>${esc(r.term)}</td><td>${esc(r.course)} - ${esc(r.name)}</td><td>${esc(r.hours)}</td><td>${esc(r.total)}</td><td>${esc(r.letter)}</td><td>${esc(r.points)}</td><td>${r.passed?'ناجح':'راسب'}</td></tr>`).join('')||'<tr><td colspan="7">لا توجد نتائج بعد.</td></tr>'}</tbody></table></div>`}
