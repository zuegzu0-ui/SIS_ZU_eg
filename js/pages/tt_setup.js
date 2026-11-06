/* ===== الجداول: المباني والقاعات (أيام الدراسة، ساعات اليوم، قاعات المحاضرات والسكاشن) ===== */
let bsel=null;
const RK={lecture:'قاعة محاضرات',section:'قاعة سكاشن / معمل'};

function ttSetupView(){const w=W();
 if(!ttBld.find(b=>b.id===bsel))bsel=ttBld[0]&&ttBld[0].id;
 const b=ttBld.find(x=>x.id===bsel),rooms=ttRooms.filter(r=>r.building_id===bsel);
 $('#tb0').innerHTML=`<div class="note">حدّد المباني وأيام الدراسة وساعة بداية ونهاية اليوم لكل مبنى، ثم قاعات المحاضرات وقاعات السكاشن. تُستخدم في إنشاء الجداول وكشف التعارض.</div><div class="bar">`
  +ttBld.map(x=>`<button class="btn ${x.id===bsel?'gold':'ghost'}" onclick="bsel=${x.id};ttSetupView()">${esc(x.name)}</button>`).join('')
  +(w?`<button class="btn" onclick="bldForm()">+ مبنى جديد</button>`:'')+`</div>`
  +(b?`<div class="card"><b>${esc(b.name)}</b> — الأيام: ${esc(b.days)} — من ${hm(b.start_time)} إلى ${hm(b.end_time)} ${w?`<button class="mini" onclick="bldForm(${b.id})">تعديل</button><button class="mini red" onclick="bldDel(${b.id})">حذف</button>`:''}</div>
  ${w?`<div class="bar"><button class="btn gold" onclick="roomForm()">+ قاعة</button></div>`:''}
  <div class="tw"><table><thead><tr><th>القاعة</th><th>النوع</th><th>السعة</th>${w?'<th></th>':''}</tr></thead><tbody>${rooms.map(r=>`<tr><td>${esc(r.name)}</td><td>${RK[r.kind]||''}</td><td>${esc(r.capacity)}</td>${w?`<td class="nw"><button class="mini" onclick="roomForm(${r.id})">تعديل</button><button class="mini red" onclick="roomDel(${r.id})">حذف</button></td>`:''}</tr>`).join('')||'<tr><td colspan="4">لا توجد قاعات.</td></tr>'}</tbody></table></div>`:'<div class="card">لا توجد مبانٍ بعد.</div>')}

function bldForm(id){
 const b=id?ttBld.find(x=>x.id===id):{days:'الأحد,الاثنين,الثلاثاء,الأربعاء,الخميس',start_time:'08:00',end_time:'16:00'},ds=(b.days||'').split(',');
 const d=modal(`<h2>${id?'تعديل مبنى':'إضافة مبنى'}</h2><div class="grid"><label>اسم المبنى<input id="bn" value="${esc(b.name)}"></label><div></div><label>بداية اليوم<input id="bs" type="time" value="${hm(b.start_time)}"></label><label>نهاية اليوم<input id="be" type="time" value="${hm(b.end_time)}"></label></div><p><b>أيام الدراسة</b></p><div class="chips">${DAYS.map(x=>`<label class="chip"><input type="checkbox" value="${x}" ${ds.includes(x)?'checked':''}> ${x}</label>`).join('')}</div><div class="bar" style="margin:14px 0 0"><button class="btn gold" id="sv">حفظ</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 d.querySelector('#sv').onclick=async()=>{const name=d.querySelector('#bn').value.trim(),s=d.querySelector('#bs').value,e=d.querySelector('#be').value,days=DAYS.filter(x=>d.querySelector(`input[value="${x}"]`).checked);
  if(!name||!days.length||!s||!e)return alert('الاسم والأيام وساعات اليوم مطلوبة.');
  if(toMin(s)>=toMin(e))return alert('نهاية اليوم يجب أن تكون بعد بدايته.');
  try{const r=await db.save('buildings',{name,days:days.join(','),start_time:s,end_time:e},'id',id||null);if(!id)bsel=r.row.id;d.remove();pgTT()}catch(e2){err(e2)}}}
async function bldDel(id){if(!confirm('حذف المبنى وكل قاعاته؟ (الجداول المرتبطة به تبقى دون مبنى)'))return;try{await db.del('buildings','id',id);pgTT()}catch(e){err(e)}}

function roomForm(id){const cur=id?ttRooms.find(r=>r.id===id):{kind:'lecture'};
 form(id?'تعديل قاعة':'إضافة قاعة',[['name','اسم/رقم القاعة'],['kind','النوع','sel',Object.entries(RK)],['capacity','السعة (عدد الطلاب)','number']],cur,{isNew:!id},
  async(row,d)=>{if(!row.name)return alert('اسم القاعة مطلوب');if(!id)row.building_id=bsel;await db.save('rooms',row,'id',id||null);d.remove();pgTT()})}
async function roomDel(id){if(!confirm('حذف القاعة؟'))return;try{await db.del('rooms','id',id);pgTT()}catch(e){err(e)}}
