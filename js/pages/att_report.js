/* ===== الغياب: النسب والتقارير (حضور كل طالب، الإنذارات، درجة الحضور، تذكير بالأيام التي لم يُؤخذ فيها غياب) ===== */
let rpSel='',rpRows=[],rpCols=[];
async function aRepView(){
 const combos=[...new Map(aMine().map(i=>[i.tt_id+'|'+i.course_code,i])).values()];
 if(!combos.length){$('#ab').innerHTML='<div class="note">لا توجد مواد مسكّنة لك في جدول معتمد.</div>';return}
 if(!combos.some(c=>c.tt_id+'|'+c.course_code===rpSel))rpSel=combos[0].tt_id+'|'+combos[0].course_code;
 const[t0,course]=rpSel.split('|'),tid=+t0,tt=ttList.find(t=>t.id===tid);let d;
 try{d=await rpc('att_load',{p_token:T(),p_tt:tid,p_course:course})}catch(e){return err(e)}
 const items=ttItems.filter(i=>i.tt_id===tid&&i.course_code===course&&i.day).map(i=>({day:i.day,kind:i.kind})),recs=new Map(d.records.map(r=>[r.s+'|'+r.c,r.p])),secOf={};d.sections.forEach(x=>secOf[x.c]=x.n);
 const today=ymd(new Date());let first=null;
 rpRows=aRoster(tt).map(s=>{const a=attCalc({items,sessions:d.sessions,rec:(sid,c)=>recs.get(sid+'|'+c),code:s.code,sec:secOf[s.code]||0,rule:d.rule,term:aTerm,today});if(!first)first=a;
  return {code:s.code,name:s.name,sec:secOf[s.code]||'',att:a.expected?`${a.attended} / ${a.expected}`:'',pct:a.pct===null?'':a.pct,grade:a.grade===null?'':a.grade,warn:a.warn?'إنذار':'',absent:a.absent.length}});
 rpCols=[['code','الكود'],['name','الاسم'],['sec','السكشن'],['att','الحضور / المتوقع'],['pct','النسبة %'],['grade','درجة الحضور'],['warn','إنذار'],['absent','أيام الغياب']];
 const nw=rpRows.filter(r=>r.warn).length;
 $('#ab').innerHTML=`<div class="card"><div class="bar" style="margin:0"><label>المادة والمرحلة <select onchange="rpSel=this.value;aRepView()">${combos.map(c=>{const t=ttList.find(x=>x.id===c.tt_id);return `<option value="${c.tt_id}|${esc(c.course_code)}" ${c.tt_id+'|'+c.course_code===rpSel?'selected':''}>${esc(c.course_code)} - ${esc(nm(c.course_code))} (${esc([t.department,t.track,t.year,t.level].filter(Boolean).join(' / '))})</option>`}).join('')}</select></label><button class="btn ghost" onclick="exportModal(rpRows,rpCols,'attendance','تقرير الحضور')">تحميل (Excel / PDF)</button></div></div>
 <div class="card"><b>${rpRows.length}</b> طالب — عدد الإنذارات <b>${nw}</b> — حد الإنذار ${d.rule?d.rule.warn_pct:75}% — درجة الحضور: ${d.rule&&d.rule.grade_mode!=='none'?(d.rule.add_to_grades?'تُضاف لدرجات المادة':'لا تُضاف لدرجات المادة'):'غير مفعّلة'}${first&&first.termTotal?` — إجمالي أيام التيرم المجدولة ${first.termTotal}`:''}${!aTerm.start?'<br><small>حدّد فترة التيرم من تبويب القواعد ليظهر تذكير الأيام التي لم يُؤخذ فيها غياب.</small>':''}</div>
 ${first&&first.untaken.length?`<div class="note"><b>أيام مجدولة لم يُؤخذ فيها غياب (لا تُحتسب حتى تُؤخذ):</b> ${esc(first.untaken.join('، '))}</div>`:''}
 <div class="tw"><table><thead><tr>${rpCols.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rpRows.slice(0,400).map(r=>`<tr>${rpCols.map(c=>`<td ${c[0]==='warn'&&r.warn?'style="color:#a32;font-weight:800"':''}>${esc(r[c[0]])}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="8">لا يوجد طلاب.</td></tr>'}</tbody></table></div>`}
