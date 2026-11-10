/* ===== جدولي: جدول الطالب حسب المواد المسجّل بها، والمواد المحجوبة تظهر بسببها ومكان المتطلب في الجداول ===== */
async function sSched(){
 let p;try{p=await rpc('my_plan',{p_token:T()})}catch(e){return err(e)}
 const s=p.student,stage=c=>c.year===s.year&&c.level===s.level,enr=p.courses.filter(c=>c.status==='enrolled');
 const show=enr.length?enr:p.courses.filter(c=>stage(c)&&c.status==='available'),locked=p.courses.filter(c=>stage(c)&&c.status==='locked');
 const codes=[...new Set([...show.map(c=>c.course),...locked.map(c=>c.course),...locked.flatMap(c=>c.missing)])];
 let items=[];if(codes.length)try{items=await rpc('my_schedule',{p_token:T(),p_courses:codes})}catch(e){return err(e)}
 const info={};p.courses.forEach(c=>info[c.course]=c);
 const pick=code=>{const c=info[code],own=c?items.filter(i=>i.course===code&&i.year===c.year&&i.level===c.level):[];return own.length?own:items.filter(i=>i.course===code)};
 const by={};show.forEach(c=>pick(c.course).forEach(i=>(by[i.day]=by[i.day]||[]).push({...i,name:c.name})));
 const noSlot=show.filter(c=>!pick(c.course).length);
 const where=code=>{const l=pick(code);return l.length?l.map(i=>`${i.day} ${hm(i.start)}-${hm(i.end)} (${esc([i.department,i.track,i.year,i.level].filter(Boolean).join(' / '))})`).join('، '):'لا موعد في جدول معتمد حاليًا'};
 $('#main').innerHTML=`<h2>جدولي</h2>${enr.length?'':'<div class="note">لا يوجد تسجيل لهذا التيرم بعد، فيظهر جدول مواد مرحلتك المتاحة لك.</div>'}
 <div class="tw"><table><tbody>${DAYS.filter(d=>by[d]).map(d=>`<tr><th style="width:90px">${d}</th><td>${by[d].sort((a,b)=>toMin(hm(a.start))-toMin(hm(b.start))).map(i=>`<span class="chip" title="${esc(i.staff)}">${hm(i.start)}-${hm(i.end)} ${esc(i.name)} (${i.kind==='practical'?'عملي':'محاضرة'})${i.room?' — '+esc(i.room):''}${i.staff?' — '+esc(i.staff):''}</span>`).join(' ')}</td></tr>`).join('')||'<tr><td>لا توجد مواد بمواعيد في جدول معتمد حتى الآن.</td></tr>'}</tbody></table></div>
 ${noSlot.length?`<div class="note">مواد مسجّلة بلا موعد في جدول معتمد: ${esc(noSlot.map(c=>c.name).join('، '))}</div>`:''}
 ${locked.length?`<h3>مواد محجوب منها</h3><div class="tw"><table><thead><tr><th>المادة</th><th>المتطلب الذي لم تجتزه</th><th>موعد المتطلب في الجداول</th></tr></thead><tbody>${locked.map(c=>`<tr><td>${esc(c.course)} - ${esc(c.name)}</td><td>${c.missing.map(m=>esc(m+' - '+((info[m]||{}).name||''))).join('<br>')}</td><td>${c.missing.map(m=>where(m)).join('<br>')}</td></tr>`).join('')}</tbody></table></div>`:''}`}
addPage({k:'s_sched',t:'جدولي',a:'s',o:1.4,f:sSched});
