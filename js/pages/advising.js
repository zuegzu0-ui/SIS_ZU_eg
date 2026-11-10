/* ===== الإرشاد الأكاديمي: جهة المرشد (طلابي المرشد عليهم + تظلمات الإرشاد) ===== */
let avTab='s',avA=[],avG=[];
async function pgAdvising(){
 try{[avA,avG]=await Promise.all([rpc('my_advisees',{p_token:T()}),rpc('list_grievances',{p_token:T()})])}catch(e){return err(e)}
 const nn=avG.filter(g=>g.status==='new').length;
 $('#main').innerHTML=`<h2>الإرشاد الأكاديمي</h2><div class="tabs"><button class="${avTab==='s'?'on':''}" onclick="avTab='s';pgAdvising()">طلابي (${avA.length})</button><button class="${avTab==='g'?'on':''}" onclick="avTab='g';pgAdvising()">تظلمات الإرشاد${nn?` (${nn} جديد)`:''}</button></div><div id="avb"></div>`;
 avTab==='g'?avGr():avSt()}
function avSt(){$('#avb').innerHTML=`<div class="note">الطلاب الذين عُيّنت مرشدًا عليهم من شاشة المرشدين الأكاديميين.</div><div class="tw"><table><thead><tr><th>الكود</th><th>الاسم</th><th>القسم</th><th>الفرقة</th><th>المستوى</th><th>المعدل التراكمي</th><th></th></tr></thead><tbody>${avA.map(s=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td>${esc(s.department)}</td><td>${esc(s.year)}</td><td>${esc(s.level)}</td><td>${s.cgpa??'-'}</td><td><button class="mini" onclick="avPlan('${esc(s.code)}')">حالة الطالب</button></td></tr>`).join('')||'<tr><td colspan="7">لا يوجد طلاب مرشد عليهم.</td></tr>'}</tbody></table></div>`}
async function avPlan(c){try{const p=await rpc('student_plan',{p_token:T(),p_code:c});modal(planHtml(p)+'<div class="bar"><button class="btn ghost" onclick="this.closest(\'.modal\').remove()">إغلاق</button></div>')}catch(e){err(e)}}
function avGr(){$('#avb').innerHTML=`<div class="tw"><table><thead><tr><th>التاريخ</th><th>الطالب</th><th>النوع</th><th>المادة</th><th>التظلم</th><th>الرد</th><th></th></tr></thead><tbody>${avG.map(g=>`<tr><td class="nw">${fdate(g.created_at)}</td><td>${esc(g.student_code)} - ${esc(g.student_name)}</td><td>${GK[g.kind]||''}</td><td>${esc(g.course_code)}</td><td>${esc(g.body)}</td><td>${esc(g.reply)}</td><td><button class="mini" onclick="avReply(${g.id})">${g.reply?'تعديل الرد':'رد'}</button></td></tr>`).join('')||'<tr><td colspan="7">لا توجد تظلمات.</td></tr>'}</tbody></table></div>`}
function avReply(id){const g=avG.find(x=>x.id===id);
 const d=modal(`<h2>الرد على التظلم</h2><div class="note">${esc(g.body)}</div><textarea id="rp" rows="4" style="width:100%">${esc(g.reply||'')}</textarea><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="ok">إرسال الرد</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 d.querySelector('#ok').onclick=async()=>{try{await rpc('reply_grievance',{p_token:T(),p_id:id,p_reply:d.querySelector('#rp').value});d.remove();pgAdvising()}catch(e){err(e)}}}
addPage({k:'advising',t:'الإرشاد الأكاديمي',a:'r',o:55,f:pgAdvising});
