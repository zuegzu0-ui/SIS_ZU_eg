/* ===== الغياب: تقسيم الطلاب إلى سكاشن (للمواد العملية) ===== */
let secSel=null,secSize=25,secAs={},secD=null;
async function aSecView(){
 const combos=[...new Map(aMine().filter(i=>i.kind==='practical').map(i=>[i.tt_id+'|'+i.course_code,i])).values()];
 if(!combos.length){$('#ab').innerHTML='<div class="note">لا توجد مواد عملية مسكّنة لك في جدول معتمد.</div>';return}
 if(!combos.some(c=>c.tt_id+'|'+c.course_code===secSel))secSel=combos[0].tt_id+'|'+combos[0].course_code;
 const [t0,course]=secSel.split('|'),tid=+t0;
 try{secD=await rpc('att_load',{p_token:T(),p_tt:tid,p_course:course})}catch(e){return err(e)}
 secAs={};secD.sections.forEach(x=>secAs[x.c]=x.n);
 $('#ab').innerHTML=`<div class="note">قسّم طلاب المادة العملية إلى سكاشن تلقائيًا بتحديد العدد المطلوب في كل سكشن، ثم عدّل يدويًا إن أردت، ليسهل عرض طلاب كل سكشن عند أخذ الغياب.</div><div class="card"><div class="bar" style="margin:0"><label>المادة والمرحلة <select onchange="secSel=this.value;aSecView()">${combos.map(c=>{const t=ttList.find(x=>x.id===c.tt_id);return `<option value="${c.tt_id}|${esc(c.course_code)}" ${c.tt_id+'|'+c.course_code===secSel?'selected':''}>${esc(c.course_code)} - ${esc(nm(c.course_code))} (${esc([t.department,t.track,t.year,t.level].filter(Boolean).join(' / '))})</option>`}).join('')}</select></label><label>عدد الطلاب في السكشن <input type="number" min="1" value="${secSize}" style="width:80px" onchange="secSize=Math.max(1,+this.value||25)"></label><button class="btn gold" onclick="secAuto()">تقسيم تلقائي</button><button class="btn" onclick="secSave()">حفظ السكاشن</button></div></div><div id="sb"></div>`;
 secDraw()}
function secRoster(){const[t0]=secSel.split('|');return aRoster(ttList.find(t=>t.id===+t0))}
function secAuto(){secAs={};secRoster().forEach((s,i)=>secAs[s.code]=Math.floor(i/secSize)+1);secDraw()}
function secSet(c,v){if(v)secAs[c]=+v;else delete secAs[c];secDraw()}
function secDraw(){const ros=secRoster(),cnt={};ros.forEach(s=>{if(secAs[s.code])cnt[secAs[s.code]]=(cnt[secAs[s.code]]||0)+1});
 const k=Math.max(1,...Object.keys(cnt).map(Number),Math.ceil(ros.length/secSize)),un=ros.filter(s=>!secAs[s.code]).length;
 $('#sb').innerHTML=`<div class="chips" style="margin-bottom:10px">${Object.entries(cnt).sort((a,b)=>a[0]-b[0]).map(([n,c])=>`<span class="chip">سكشن ${n}: ${c} طالب</span>`).join('')}${un?`<span class="chip" style="background:#f4c7c3">بدون سكشن: ${un}</span>`:''}</div><div class="tw"><table><thead><tr><th>الكود</th><th>الاسم</th><th>السكشن</th></tr></thead><tbody>${ros.slice(0,400).map(s=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td><select onchange="secSet('${esc(s.code)}',this.value)"><option value="">—</option>${Array.from({length:k+1},(_,i)=>i+1).map(n=>`<option value="${n}" ${secAs[s.code]===n?'selected':''}>سكشن ${n}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="3">لا يوجد طلاب في هذه المرحلة.</td></tr>'}</tbody></table></div>`}
async function secSave(){const[t0,course]=secSel.split('|'),rows=Object.entries(secAs).map(([code,n])=>({code,n}));
 try{await rpc('att_sections_save',{p_token:T(),p_tt:+t0,p_course:course,p_rows:rows});alert('تم حفظ السكاشن')}catch(e){err(e)}}
