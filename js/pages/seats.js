/* ===== أرقام الجلوس: إنشاء لمرحلة، إظهار/إخفاء للطلاب، تحميل Excel/PDF، وتحديث بيانات الطالب تلقائيًا ===== */
let seF={},seOrd='name',seStart=1001,sePre='',seVis='false';
const seGroup=()=>gStu.filter(s=>stScope(s,seF));
const seSorted=()=>seGroup().sort((a,b)=>seOrd==='code'?String(a.code).localeCompare(String(b.code),undefined,{numeric:true}):(a.name||'').localeCompare(b.name||'','ar'));
const seNo=i=>sePre+(seStart+i);

function seatView(){const w=W();
 $('#gb').innerHTML=`<div class="note">اختر المرحلة (الكلية، القسم، الشعبة، الفرقة، المستوى)، ثم أنشئ أرقام الجلوس. يتحدّث رقم الجلوس في بيانات الطالب تلقائيًا، وتتحكم في إظهاره للطلاب أو إخفائه.</div>
 <div class="card"><div id="sc"></div><div class="bar" style="margin:12px 0 0">
 <label>يبدأ من <input type="number" value="${seStart}" style="width:100px" onchange="seStart=+this.value||1;seRows()"></label>
 <label>بادئة (اختياري) <input value="${esc(sePre)}" style="width:90px" oninput="sePre=this.value;seRows()"></label>
 <label>الترتيب <select onchange="seOrd=this.value;seRows()"><option value="name" ${seOrd==='name'?'selected':''}>أبجديًا بالاسم</option><option value="code" ${seOrd==='code'?'selected':''}>بالكود</option></select></label>
 ${w?`<label>الظهور <select onchange="seVis=this.value"><option value="false" ${seVis==='false'?'selected':''}>مخفي عن الطلاب</option><option value="true" ${seVis==='true'?'selected':''}>يظهر للطلاب</option></select></label><button class="btn gold" onclick="seGen()">إنشاء وحفظ أرقام الجلوس</button>`:''}</div>
 <div class="bar" style="margin:8px 0 0">${w?'<button class="btn ghost" onclick="seVisAll(true)">إظهار الأرقام الحالية للطلاب</button><button class="btn ghost" onclick="seVisAll(false)">إخفاؤها</button><button class="btn red" onclick="seClear()">مسح الأرقام</button>':''}<button class="btn ghost" onclick="seExport()">تحميل (Excel / PDF)</button><b id="sn"></b></div></div>
 <div class="tw"><table><thead><tr><th>الكود</th><th>الاسم</th><th>الفرقة</th><th>المستوى</th><th>رقم الجلوس الحالي</th><th>الظهور</th><th>الرقم الجديد (معاينة)</th></tr></thead><tbody id="st"></tbody></table></div>`;
 seF.depts=seF.depts||{};scopePicker('sc',seF,{year:true,level:true,cb:seRows});seRows()}
function seRows(){const l=seSorted();$('#sn').textContent=l.length+' طالب';
 $('#st').innerHTML=l.slice(0,300).map((s,i)=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td>${esc(s.year)}</td><td>${esc(s.level)}</td><td>${esc(s.seat_no)}</td><td>${s.seat_no?(s.seat_visible?'ظاهر':'مخفي'):''}</td><td>${esc(seNo(i))}</td></tr>`).join('')||'<tr><td colspan="7">لا يوجد طلاب. حدّد المرحلة.</td></tr>'}
async function seReload(){gStu=await db.list('students');seatView()}
async function seGen(){
 if(!seF.college||!Object.keys(seF.depts||{}).length||!seF.year)return alert('حدد الكلية وقسمًا واحدًا على الأقل والفرقة قبل الإنشاء.');
 const l=seSorted();if(!l.length)return alert('لا يوجد طلاب في هذه المرحلة.');
 const codes=new Set(l.map(s=>s.code)),rows=l.map((s,i)=>({code:s.code,seat_no:seNo(i)})),mine=new Set(rows.map(r=>r.seat_no));
 if(gStu.some(s=>!codes.has(s.code)&&s.seat_no&&mine.has(s.seat_no)))return alert('بعض الأرقام مستخدمة لطلاب آخرين. غيّر رقم البداية أو أضف بادئة.');
 if(!confirm(`إنشاء أرقام جلوس لـ ${l.length} طالب من ${seNo(0)} إلى ${seNo(l.length-1)}؟ (تُستبدل الأرقام الحالية لهم)`))return;
 try{await rpc('set_seats',{p_token:T(),p_rows:rows,p_visible:seVis==='true'});await seReload();alert('تم إنشاء أرقام الجلوس وتحديث بيانات الطلاب')}catch(e){err(e)}}
async function seVisAll(on){const codes=seGroup().filter(s=>s.seat_no).map(s=>s.code);if(!codes.length)return alert('لا توجد أرقام جلوس لهذه المرحلة.');
 try{await rpc('set_seats_visible',{p_token:T(),p_codes:codes,p_visible:on});await seReload()}catch(e){err(e)}}
async function seClear(){const l=seGroup().filter(s=>s.seat_no);if(!l.length)return alert('لا توجد أرقام لمسحها.');if(!confirm('مسح أرقام الجلوس لـ '+l.length+' طالب؟'))return;
 try{await rpc('set_seats',{p_token:T(),p_rows:l.map(s=>({code:s.code,seat_no:null})),p_visible:false});await seReload()}catch(e){err(e)}}
function seExport(){const l=seSorted().filter(s=>s.seat_no);if(!l.length)return alert('لا توجد أرقام جلوس لهذه المرحلة لتحميلها.');
 exportModal(l.sort((a,b)=>String(a.seat_no).localeCompare(String(b.seat_no),undefined,{numeric:true})),[['name','الاسم'],['code','الكود'],['college','الكلية'],['department','القسم'],['track','الشعبة'],['year','الفرقة'],['level','المستوى'],['seat_no','رقم الجلوس']],'seat_numbers','أرقام الجلوس')}
