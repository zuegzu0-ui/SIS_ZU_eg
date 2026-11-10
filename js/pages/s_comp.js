/* ===== شكاوى وتظلمات: جهة الطالب (شكوى لمادة تصل لدكتورها ومعيدها، وتظلم للمرشد الأكاديمي) ===== */
let scTab='c';
const GK={result:'تظلم من نتيجة',registration:'تظلم من تسجيل مادة',other:'أخرى'};
async function sComp(){
 let courses=[];try{courses=(await rpc('my_plan',{p_token:T()})).courses}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>الشكاوى والتظلمات</h2><div class="tabs"><button class="${scTab==='c'?'on':''}" onclick="scTab='c';sComp()">شكوى في مادة</button><button class="${scTab==='g'?'on':''}" onclick="scTab='g';sComp()">تظلم للمرشد الأكاديمي</button></div><div id="sb2"></div>`;
 scTab==='g'?sGrv(courses):sCmp(courses)}
const cOpts=cs=>cs.map(c=>`<option value="${esc(c.course)}">${esc(c.course)} - ${esc(c.name)}</option>`).join('');
async function sCmp(cs){let l=[];try{l=await rpc('my_complaints',{p_token:T()})}catch(e){return err(e)}
 $('#sb2').innerHTML=`<div class="card"><div class="grid"><label>المادة<select id="cc3"><option value="">اختر...</option>${cOpts(cs)}</select></label></div><label style="display:block;margin-top:8px">نص الشكوى<textarea id="cb3" rows="3" style="width:100%" maxlength="2000"></textarea></label><p><button class="btn gold" onclick="sCmpSend()">إرسال الشكوى</button></p></div><div class="tw"><table><thead><tr><th>التاريخ</th><th>المادة</th><th>الشكوى</th><th>الرد</th><th>الحالة</th></tr></thead><tbody>${l.map(x=>`<tr><td class="nw">${fdate(x.created_at)}</td><td>${esc(x.course_code)}</td><td>${esc(x.body)}</td><td>${esc(x.reply)}</td><td>${esc(x.status)}</td></tr>`).join('')||'<tr><td colspan="5">لم ترسل شكاوى.</td></tr>'}</tbody></table></div>`}
async function sCmpSend(){const c=$('#cc3').value,b=$('#cb3').value.trim();if(!c||!b)return alert('اختر المادة واكتب الشكوى.');
 try{await rpc('send_complaint',{p_token:T(),p_course:c,p_body:b});sComp()}catch(e){err(e)}}
async function sGrv(cs){let d;try{d=await rpc('my_grievances',{p_token:T()})}catch(e){return err(e)}
 $('#sb2').innerHTML=`<div class="note">مرشدك الأكاديمي: <b>${esc(d.advisor||'لم يُعيَّن بعد')}</b>. يصله تظلمك ويرد عليه.</div><div class="card"><div class="grid"><label>نوع التظلم<select id="gk">${Object.entries(GK).map(([k,t])=>`<option value="${k}">${t}</option>`).join('')}</select></label><label>المادة (اختياري)<select id="gc"><option value="">—</option>${cOpts(cs)}</select></label></div><label style="display:block;margin-top:8px">نص التظلم<textarea id="gb3" rows="3" style="width:100%" maxlength="2000"></textarea></label><p><button class="btn gold" onclick="sGrvSend()">إرسال التظلم</button></p></div><div class="tw"><table><thead><tr><th>التاريخ</th><th>النوع</th><th>المادة</th><th>التظلم</th><th>الرد</th></tr></thead><tbody>${d.rows.map(x=>`<tr><td class="nw">${fdate(x.created_at)}</td><td>${GK[x.kind]||''}</td><td>${esc(x.course_code)}</td><td>${esc(x.body)}</td><td>${esc(x.reply)||(x.status==='new'?'بانتظار الرد':'')}</td></tr>`).join('')||'<tr><td colspan="5">لم ترسل تظلمات.</td></tr>'}</tbody></table></div>`}
async function sGrvSend(){const b=$('#gb3').value.trim();if(!b)return alert('اكتب نص التظلم.');
 try{await rpc('send_grievance',{p_token:T(),p_kind:$('#gk').value,p_course:$('#gc').value,p_body:b});sComp()}catch(e){err(e)}}
addPage({k:'s_comp',t:'الشكاوى والتظلمات',a:'s',o:7,f:sComp});
