/* ===== حساب الحضور (مشترك بين الدكتور والطالب) =====
   المتوقَّع من الجدول: أيام المادة المسكّنة بين بداية التيرم واليوم (أو نهاية التيرم). اليوم الذي لم يُؤخذ فيه غياب لا يُحتسب حتى يُؤخذ
   (ويظهر كتذكير)، واليوم المُلغى (إجازة) لا يُحتسب. */
const WD=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const occDates=(day,from,to)=>{const out=[],wi=WD.indexOf(day);if(wi<0||!from||!to)return out;const d=new Date(from+'T00:00:00'),e=new Date(to+'T00:00:00');while(d<=e){if(d.getDay()===wi)out.push(ymd(d));d.setDate(d.getDate()+1)}return out};
function attGrade(rule,att,expected,pct){
 if(!rule||rule.grade_mode==='none'||!expected)return null;
 if(rule.grade_mode==='per_day'){const v=att*(+rule.session_score||0);return +((+rule.grade_max>0)?Math.min(v,+rule.grade_max):v).toFixed(2)}
 const b=(rule.bands||[]).find(x=>pct>=+x.from&&(pct<+x.to||(+x.to>=100&&pct<=100)));return b?+b.score:0}
/* o={items:[{day,kind}], sessions:[{id,kind,date,section,cancelled}], rec:(sessionId,code)=>true|false|undefined, code, sec, rule, term:{start,end}, today} */
function attCalc(o){
 const t=o.term||{},end=t.end&&t.end<o.today?t.end:o.today,keys=new Map();
 (o.items||[]).forEach(i=>occDates(i.day,t.start,end).forEach(d=>keys.set(d+'|'+i.kind,{d,k:i.kind,st:'untaken'})));
 (o.sessions||[]).forEach(s=>{
  if(s.kind==='practical'&&s.section&&s.section!==o.sec)return;if(s.kind==='lecture'&&s.section)return;
  const key=s.date+'|'+s.kind,c=keys.get(key)||{d:s.date,k:s.kind,st:'untaken'};
  c.st=s.cancelled?'cancelled':(o.rec(s.id,o.code)===false?'absent':'present');keys.set(key,c)});
 const all=[...keys.values()],held=all.filter(x=>x.st==='present'||x.st==='absent'),untaken=all.filter(x=>x.st==='untaken'&&x.d<=o.today);
 let expected,attended;
 if(o.rule&&o.rule.count_mode==='both'){expected=held.length;attended=held.filter(x=>x.st==='present').length}
 else{const by={};held.forEach(x=>{by[x.d]=!!by[x.d]||x.st==='present'});expected=Object.keys(by).length;attended=Object.values(by).filter(Boolean).length}
 const pct=expected?+(100*attended/expected).toFixed(1):null,rule=o.rule||null;
 return {expected,attended,pct,grade:attGrade(rule,attended,expected,pct),warn:pct!==null&&pct<(rule?+rule.warn_pct:75),
  absent:held.filter(x=>x.st==='absent').map(x=>x.d+(x.k==='practical'?' (عملي)':'')).sort(),
  untaken:untaken.map(x=>x.d+(x.k==='practical'?' (عملي)':'')).sort(),
  termTotal:(o.items||[]).reduce((a,i)=>a+occDates(i.day,t.start,t.end).length,0)}}
