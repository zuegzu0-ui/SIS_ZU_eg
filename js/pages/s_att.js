/* ===== حضوري: جهة الطالب (متابعة الحضور والغياب في كل مادة وسكشن) ===== */
async function sAtt(){
 let d;try{d=await rpc('my_attendance',{p_token:T()})}catch(e){return err(e)}
 const names={};d.names.forEach(x=>names[x.code]=x.name);
 const recs=new Map(d.records.map(r=>[r.s,r.p])),combos=[...new Map(d.items.map(i=>[i.tt+'|'+i.course,i])).values()],today=ymd(new Date());
 const cards=combos.map(c=>{
  const items=d.items.filter(i=>i.tt===c.tt&&i.course===c.course).map(i=>({day:i.day,kind:i.kind})),ses=d.sessions.filter(s=>s.tt===c.tt&&s.course===c.course),
   sec=(d.sections.find(x=>x.tt===c.tt&&x.c===c.course)||{}).n||0,rule=d.rules.find(r=>r.course_code===c.course),
   a=attCalc({items,sessions:ses,rec:sid=>recs.get(sid),code:user.code,sec,rule,term:d.term||{},today});
  return `<div class="card"><div class="bar" style="margin:0"><b>${esc(c.course)} - ${esc(names[c.course]||'')}</b>${sec?`<span class="chip">سكشن ${sec}</span>`:''}${a.warn?`<span class="chip" style="background:#f4c7c3">إنذار: نسبة حضورك أقل من ${rule?rule.warn_pct:75}%</span>`:''}</div>
  <p>الحضور: <b>${a.attended}</b> من <b>${a.expected}</b> ${a.pct!==null?`— النسبة <b>${a.pct}%</b>`:''}</p><div style="background:#e8ebf5;border-radius:6px;height:10px"><div style="width:${a.pct||0}%;background:${a.warn?'#c44':'var(--gold)'};height:10px;border-radius:6px"></div></div>
  ${rule&&rule.add_to_grades&&a.grade!==null?`<p>درجة الحضور: <b>${a.grade}</b>${+rule.grade_max?` من ${rule.grade_max}`:''}</p>`:''}
  ${a.absent.length?`<p style="font-size:13px">أيام الغياب: ${esc(a.absent.join('، '))}</p>`:''}</div>`}).join('');
 $('#main').innerHTML=`<h2>حضوري</h2>${cards||'<div class="card">لا توجد مواد في جدول معتمد لمرحلتك حتى الآن.</div>'}`}
addPage({k:'s_att',t:'حضوري',a:'s',o:5,f:sAtt});
