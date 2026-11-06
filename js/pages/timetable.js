/* ===== الجداول الدراسية: الصفحة الرئيسية (تبويبات + قائمة الجداول) =====
   الملفات المرتبطة: tt_setup.js (المباني والقاعات) و tt_editor.js (محرر الجدول والتوزيع التلقائي) */
let ttTab='list',ttCur=null,ttList=[],ttItems=[],ttBld=[],ttRooms=[],ttFac=[],ttx={rows:[],days:[],start:'08:00',gap:10};

async function ttLoad(){
 [ttList,ttItems,ttBld,ttRooms,regs,rcs,crs]=await Promise.all([db.list('timetables'),db.list('tt_items'),db.list('buildings'),db.list('rooms'),db.list('regulations'),db.list('reg_courses'),db.list('courses')]);
 ttItems.forEach(x=>{x.start_time=hm(x.start_time)||null;x.end_time=hm(x.end_time)||null});
 try{ttFac=await rpc('list_faculty',{p_token:T()})}catch{ttFac=[]}}

async function pgTT(){
 try{await ttLoad()}catch(e){return err(e)}
 if(ttCur&&!ttList.find(t=>t.id===ttCur))ttCur=null;
 $('#main').innerHTML=`<h2>الجداول الدراسية</h2><div class="tabs"><button class="${ttTab==='list'?'on':''}" onclick="ttTab='list';ttCur=null;pgTT()">الجداول</button><button class="${ttTab==='setup'?'on':''}" onclick="ttTab='setup';pgTT()">المباني والقاعات</button></div><div id="tb0"></div>`;
 ttTab==='setup'?ttSetupView():(ttCur?ttEditor():ttListView())}

function ttListView(){const w=W();
 $('#tb0').innerHTML=(w?`<div class="bar"><button class="btn gold" onclick="ttForm()">+ جدول جديد</button></div>`:'')
  +`<div class="tw"><table><thead><tr><th>الجدول</th><th>الفصل</th><th>الكلية</th><th>القسم</th><th>الشعبة</th><th>الفرقة</th><th>المستوى</th><th>الحالة</th><th>عدد البنود</th><th></th></tr></thead><tbody>`
  +(ttList.map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(t.term)}</td><td>${esc(t.college)}</td><td>${esc(t.department)}</td><td>${esc(t.track)}</td><td>${esc(t.year)}</td><td>${esc(t.level)}</td><td>${t.status==='approved'?'<span class="chip">معتمد</span>':'مسودة'}</td><td>${ttItems.filter(x=>x.tt_id===t.id).length}</td><td class="nw"><button class="mini" onclick="ttOpen(${t.id})">فتح</button>${w&&t.status!=='approved'?`<button class="mini red" onclick="ttDel(${t.id})">حذف</button>`:''}</td></tr>`).join('')||'<tr><td colspan="10">لا توجد جداول. أضف المباني والقاعات أولًا، ثم أنشئ جدولًا لمرحلة دراسية.</td></tr>')+`</tbody></table></div>`}

function ttForm(){
 if(!ttBld.length)return alert('أضف مبنى أولًا من تبويب "المباني والقاعات".');
 const v={};
 const d=modal(`<h2>جدول دراسي جديد</h2><div class="grid"><label>اسم الجدول<input id="tn"></label><label>الفصل الدراسي (مثال: الخريف 2026/2027)<input id="tm"></label></div><div id="tc" class="grid5" style="margin:10px 0"></div><div class="grid"><label>اللائحة<select id="tr"></select></label><label>المبنى<select id="tbd">${ttBld.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label></div><div class="note" style="margin-top:10px">تظهر مواد المرحلة تلقائيًا من اللائحة المختارة، ويمكنك إضافة مواد استثنائية في المحرر.</div><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="sv">إنشاء وفتح المحرر</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 const fillReg=()=>{const l=regs.filter(r=>r.college===v.college&&r.department===v.department&&(!r.track||!v.track||r.track===v.track));
  d.querySelector('#tr').innerHTML=l.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')||'<option value="">لا توجد لائحة مطابقة</option>'};
 casc('tc',SF,v,fillReg);fillReg();
 d.querySelector('#sv').onclick=async()=>{const q=s=>d.querySelector(s).value.trim(),name=q('#tn'),rg=+q('#tr'),b=ttBld.find(x=>x.id===+q('#tbd'));
  if(!name||!v.college||!v.department||!v.year||!v.level||!rg)return alert('اسم الجدول والكلية والقسم والفرقة والمستوى واللائحة مطلوبة.');
  try{const r=await db.save('timetables',{name,term:q('#tm')||null,college:v.college,department:v.department,track:v.track||null,year:v.year,level:v.level,reg_id:rg,building_id:b.id,days:b.days,start_time:hm(b.start_time),gap_min:10},'id',null);
   d.remove();await ttLoad();ttOpen(r.row.id)}catch(e){err(e)}}}

async function ttDel(id){if(!confirm('حذف الجدول وكل بنوده؟'))return;try{await db.del('timetables','id',id);pgTT()}catch(e){err(e)}}

addPage({k:'timetable',t:'الجداول الدراسية',a:'r',o:60,f:pgTT});
