/* ===== محرر الجدول: المواد من اللائحة، تسكين المدرسين، التوزيع التلقائي، كشف التعارض، الاعتماد ===== */
const curTT=()=>ttList.find(x=>x.id===ttCur);
const curBld=()=>ttBld.find(x=>x.id===(curTT()||{}).building_id)||{};
const placed=r=>!!(r.day&&r.start_time&&r.end_time);
const KIND={lecture:'محاضرة',practical:'عملي'};

function ttOpen(id){
 ttCur=id;const t=curTT(),b=curBld(),bd=(b.days||t.days||'').split(','),sel=(t.days||'').split(',').filter(d=>bd.includes(d));
 ttx={days:sel.length?sel:bd,start:hm(t.start_time)||hm(b.start_time)||'08:00',gap:t.gap_min??10,rows:ttItems.filter(x=>x.tt_id===id).map(x=>({...x}))};
 if(!ttx.rows.length)ttSync();
 ttEditor()}

/* المواد تظهر تلقائيًا من اللائحة (محاضرة + عملي إن وجد) */
function ttSync(){const t=curTT();
 rcs.filter(x=>x.reg_id===t.reg_id&&x.year===t.year&&x.level===t.level).forEach(x=>{
  const add=k=>{if(!ttx.rows.some(r=>r.course_code===x.course_code&&r.kind===k))ttx.rows.push({tt_id:ttCur,course_code:x.course_code,kind:k,duration_min:k==='practical'?120:Math.max(60,60*(+x.credit_hours||1)),exceptional:false})};
  add('lecture');if(x.has_practical==='نعم')add('practical')})}

/* كشف التعارض: نفس المرحلة، نفس المدرّس أو القاعة في جداول أخرى، خارج ساعات اليوم */
function ttConf(r,i){const m=[];if(!placed(r))return m;
 const s=toMin(r.start_time),e=toMin(r.end_time),b=curBld();
 ttx.rows.forEach((o,j)=>{if(j===i||!placed(o)||o.day!==r.day)return;if(s<toMin(o.end_time)&&toMin(o.start_time)<e)m.push('تداخل مع '+o.course_code+' (نفس المرحلة)')});
 ttItems.forEach(x=>{if(x.tt_id===ttCur||!x.start_time||x.day!==r.day)return;if(s<toMin(x.end_time)&&toMin(x.start_time)<e){
  if(r.staff_id&&x.staff_id===r.staff_id)m.push('المدرّس مشغول في جدول آخر ('+x.course_code+')');
  if(r.room_id&&x.room_id===r.room_id)m.push('القاعة مشغولة في جدول آخر ('+x.course_code+')')}});
 if(b.start_time&&(s<toMin(hm(b.start_time))||e>toMin(hm(b.end_time))))m.push('خارج ساعات اليوم');
 return m}

function ttSet(i,f,v){const r=ttx.rows[i];
 if(f==='staff_id'){r.staff_id=v?+v:null;r.staff_name=v?(ttFac.find(x=>x.id==v)||{}).name:null}
 else if(f==='room_id'){r.room_id=v?+v:null;r.room_name=v?(ttRooms.find(x=>x.id==v)||{}).name:null}
 else if(f==='duration_min'){r.duration_min=+v||60;if(r.start_time)r.end_time=fromMin(toMin(r.start_time)+r.duration_min)}
 else if(f==='start_time'){r.start_time=v||null;r.end_time=v?fromMin(toMin(v)+(+r.duration_min||60)):null}
 else if(f==='end_time'){r.end_time=v||null;if(v&&r.start_time){const d=toMin(v)-toMin(r.start_time);if(d>0)r.duration_min=d}}
 else r[f]=v||null;
 ttEditor()}
function ttDelRow(i){ttx.rows.splice(i,1);ttEditor()}
function ttDay(d,on){on?ttx.days.includes(d)||ttx.days.push(d):ttx.days=ttx.days.filter(x=>x!==d)}

/* التوزيع التلقائي: يوزع المواد على الأيام بتوازن ثم يختار أول وقت وقاعة خالية دون تعارض */
function ttAuto(reset){
 const t=curTT(),b=curBld(),rows=ttx.rows,days=DAYS.filter(d=>ttx.days.includes(d));
 if(!days.length)return alert('اختر يومًا واحدًا على الأقل.');
 if(reset)rows.forEach(r=>{r.day=null;r.start_time=null;r.end_time=null;r.room_id=null;r.room_name=null});
 const st=toMin(ttx.start),en=toMin(hm(b.end_time)||'16:00'),gap=+ttx.gap||0,dur=r=>+r.duration_min||60;
 const load={};days.forEach(d=>load[d]=rows.filter(r=>r.day===d).reduce((a,r)=>a+dur(r),0));
 rows.filter(r=>!r.day).sort((a,c)=>dur(c)-dur(a)).forEach(r=>{const d=days.reduce((mn,x)=>load[x]<load[mn]?x:mn,days[0]);r.day=d;load[d]+=dur(r)});
 const others=ttItems.filter(x=>x.tt_id!==ttCur&&x.start_time);let fail=0;
 rows.filter(r=>r.day&&!r.start_time).sort((a,c)=>(a.kind==='lecture'?0:1)-(c.kind==='lecture'?0:1)||dur(c)-dur(a)).forEach(r=>{
  const L=dur(r),tryDays=[r.day,...days.filter(d=>d!==r.day)];let ok=false;
  for(const d of tryDays){
   for(let s=st;s+L<=en&&!ok;s+=5){const e=s+L;
    if(rows.some(o=>o!==r&&o.day===d&&o.start_time&&s<toMin(o.end_time)+gap&&toMin(o.start_time)<e+gap))continue;
    const busy=x=>x.day===d&&x.start_time&&s<toMin(x.end_time)&&toMin(x.start_time)<e;
    if(r.staff_id&&others.some(x=>busy(x)&&x.staff_id===r.staff_id))continue;
    const kind=r.kind==='lecture'?'lecture':'section',cand=r.room_id?ttRooms.filter(x=>x.id===r.room_id):ttRooms.filter(x=>x.building_id===t.building_id&&x.kind===kind);
    let room=null;
    if(cand.length){room=cand.find(c=>!others.some(x=>busy(x)&&x.room_id===c.id)&&!rows.some(o=>o!==r&&busy(o)&&o.room_id===c.id));if(!room)continue}
    r.day=d;r.start_time=fromMin(s);r.end_time=fromMin(e);if(room){r.room_id=room.id;r.room_name=room.name}ok=true}
   if(ok)break}
  if(!ok)fail++});
 ttEditor();if(fail)alert(fail+' بند لم يجد وقتًا خاليًا دون تعارض. زد ساعات اليوم أو الأيام أو القاعات، أو عدّلها يدويًا.')}

/* إضافة مادة استثنائية من دليل المواد */
function ttAddExc(){
 const d=modal(`<h2>إضافة مادة استثنائية</h2><div class="grid"><label>المادة (الكود أو الاسم)<input id="xc" list="dlx"><datalist id="dlx">${crs.map(c=>`<option value="${esc(c.code+' - '+c.name)}">`).join('')}</datalist></label><label>النوع<select id="xk"><option value="lecture">محاضرة</option><option value="practical">عملي</option></select></label><label>المدة (دقيقة)<input id="xd" type="number" value="120"></label></div><div class="bar" style="margin:14px 0 0"><button class="btn gold" id="sv">إضافة</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 d.querySelector('#sv').onclick=()=>{const s=d.querySelector('#xc').value.trim(),c=crs.find(x=>s===x.code+' - '+x.name||s===x.code||s===x.name),k=d.querySelector('#xk').value;
  if(!c)return alert('اختر مادة من دليل المواد.');
  if(ttx.rows.some(r=>r.course_code===c.code&&r.kind===k))return alert('هذه المادة مضافة بنفس النوع.');
  ttx.rows.push({tt_id:ttCur,course_code:c.code,kind:k,duration_min:+d.querySelector('#xd').value||60,exceptional:true});d.remove();ttEditor()}}

async function ttSave(silent){
 const items=ttx.rows.map(r=>({course_code:r.course_code,kind:r.kind,staff_id:r.staff_id||null,staff_name:r.staff_name||null,duration_min:+r.duration_min||60,day:r.day||null,start_time:r.start_time||null,end_time:r.end_time||null,room_id:r.room_id||null,room_name:r.room_name||null,exceptional:!!r.exceptional}));
 try{await rpc('save_timetable',{p_token:T(),p_tt:ttCur,p_items:items});
  await db.save('timetables',{days:ttx.days.join(','),start_time:ttx.start,gap_min:+ttx.gap||0},'id',ttCur);
  await ttLoad();ttx.rows=ttItems.filter(x=>x.tt_id===ttCur).map(x=>({...x}));ttEditor();if(!silent)alert('تم حفظ الجدول');return true}
 catch(e){err(e);return false}}
async function ttApprove(on){
 if(on){if(ttx.rows.some(r=>!placed(r)))return alert('يوجد بنود غير موزعة. وزّعها قبل الاعتماد.');if(!confirm('اعتماد الجدول رسميًا؟ لن يمكن تعديله إلا بعد إلغاء الاعتماد.'))return;if(!await ttSave(true))return}
 try{await rpc('set_tt_status',{p_token:T(),p_tt:ttCur,p_status:on?'approved':'draft'});await ttLoad();ttEditor()}catch(e){err(e)}}
function ttExport(){const o=Object.fromEntries(DAYS.map((d,i)=>[d,i]));
 const rows=ttx.rows.filter(placed).sort((a,b)=>o[a.day]-o[b.day]||toMin(a.start_time)-toMin(b.start_time)).map(r=>({day:r.day,time:r.start_time+' - '+r.end_time,code:r.course_code,name:nm(r.course_code),kind:KIND[r.kind],staff:r.staff_name||'',room:r.room_name||''}));
 exportModal(rows,[['day','اليوم'],['time','الوقت'],['code','الكود'],['name','المادة'],['kind','النوع'],['staff','المدرّس'],['room','القاعة']],'timetable','الجدول الدراسي: '+curTT().name)}

function ttEditor(){
 const t=curTT(),b=curBld(),ro=!W()||t.status==='approved',dis=ro?'disabled':'',days=DAYS.filter(d=>(b.days||t.days||'').split(',').includes(d));
 const staffOpts=r=>{const pref=r.kind==='lecture'?'doctor':'assistant',sm=f=>dsMatch(dsOf(f),t.department,t.track)?0:1,l=[...ttFac].sort((a,c)=>sm(a)-sm(c)||(a.role===pref?0:1)-(c.role===pref?0:1)||a.name.localeCompare(c.name,'ar'));
  return `<option value="">—</option>`+l.map(f=>`<option value="${f.id}" ${r.staff_id===f.id?'selected':''}>${esc(f.name)}${f.role==='assistant'?' (معيد)':''}</option>`).join('')};
 const roomOpts=r=>{const k=r.kind==='lecture'?'lecture':'section';return `<option value="">تلقائي</option>`+ttRooms.filter(x=>x.building_id===t.building_id).sort((a,c)=>(a.kind===k?0:1)-(c.kind===k?0:1)).map(x=>`<option value="${x.id}" ${r.room_id===x.id?'selected':''}>${esc(x.name)}</option>`).join('')};
 const dayOpts=r=>`<option value="">—</option>`+days.map(d=>`<option ${r.day===d?'selected':''}>${d}</option>`).join('');
 let conflicts=0;
 const body=ttx.rows.map((r,i)=>{const cf=ttConf(r,i);conflicts+=cf.length;
  return `<tr><td>${esc(r.course_code)}</td><td>${esc(nm(r.course_code))}${r.exceptional?' <span class="chip">استثنائية</span>':''}</td><td>${KIND[r.kind]}</td>
  <td><select ${dis} onchange="ttSet(${i},'staff_id',this.value)">${staffOpts(r)}</select></td>
  <td><input type="number" min="15" step="5" style="width:70px" value="${r.duration_min||''}" ${dis} onchange="ttSet(${i},'duration_min',this.value)"></td>
  <td><select ${dis} onchange="ttSet(${i},'day',this.value)">${dayOpts(r)}</select></td>
  <td><input type="time" ${dis} value="${r.start_time||''}" onchange="ttSet(${i},'start_time',this.value)"></td>
  <td><input type="time" ${dis} value="${r.end_time||''}" onchange="ttSet(${i},'end_time',this.value)"></td>
  <td><select ${dis} onchange="ttSet(${i},'room_id',this.value)">${roomOpts(r)}</select></td>
  <td style="color:#a32;font-size:12px">${cf.join('<br>')}</td><td>${ro?'':`<button class="mini red" onclick="ttDelRow(${i})">×</button>`}</td></tr>`}).join('');
 const by={};ttx.rows.filter(placed).forEach(r=>(by[r.day]=by[r.day]||[]).push(r));
 const week=DAYS.filter(d=>by[d]).map(d=>`<tr><th style="width:90px">${d}</th><td>${by[d].sort((a,c)=>toMin(a.start_time)-toMin(c.start_time)).map(r=>`<span class="chip" title="${esc(r.staff_name)}">${r.start_time}-${r.end_time} ${esc(nm(r.course_code))}${r.kind==='practical'?' (عملي)':''}${r.room_name?' — '+esc(r.room_name):''}</span>`).join(' ')}</td></tr>`).join('');
 $('#tb0').innerHTML=`<div class="bar"><button class="btn ghost" onclick="ttCur=null;pgTT()">← رجوع للجداول</button><b>${esc(t.name)}</b>${t.status==='approved'?'<span class="chip">معتمد</span>':'<span class="chip" style="background:#e3e6f2">مسودة</span>'}</div>
 <div class="note">${esc(t.college)} / ${esc(t.department)} / ${esc(t.track||'كل الشعب')} / ${esc(t.year)} / ${esc(t.level)} — المبنى: ${esc(b.name||'غير محدد')} — ساعات اليوم: ${hm(b.start_time)} إلى ${hm(b.end_time)}${conflicts?` — <b style="color:#a32">تعارضات: ${conflicts}</b>`:''}</div>
 ${ro?'':`<div class="card"><b>إعدادات التوزيع</b><div class="chips">${days.map(d=>`<label class="chip"><input type="checkbox" ${ttx.days.includes(d)?'checked':''} onchange="ttDay('${d}',this.checked)"> ${d}</label>`).join('')}</div>
 <div class="bar" style="margin:10px 0 0"><label>بداية المحاضرات <input type="time" value="${ttx.start}" onchange="ttx.start=this.value"></label><label>الفاصل بين المحاضرات (دقيقة) <input type="number" min="0" step="5" style="width:80px" value="${ttx.gap}" onchange="ttx.gap=+this.value||0"></label></div>
 <div class="bar" style="margin:10px 0 0"><button class="btn gold" onclick="ttAuto(false)">توزيع تلقائي للبنود غير الموزعة</button><button class="btn ghost" onclick="if(confirm('مسح كل الأيام والأوقات وإعادة التوزيع؟'))ttAuto(true)">إعادة التوزيع من الصفر</button><button class="btn ghost" onclick="ttSync();ttEditor()">تحديث المواد من اللائحة</button><button class="btn ghost" onclick="ttAddExc()">+ مادة استثنائية</button></div></div>`}
 <div class="tw"><table><thead><tr><th>الكود</th><th>المادة</th><th>النوع</th><th>المدرّس / المعيد</th><th>المدة</th><th>اليوم</th><th>من</th><th>إلى</th><th>القاعة</th><th>تنبيهات</th><th></th></tr></thead><tbody>${body||'<tr><td colspan="11">لا توجد مواد. تأكد أن اللائحة تحتوي مواد لهذه الفرقة والمستوى.</td></tr>'}</tbody></table></div>
 <div class="card" style="margin-top:12px"><b>الجدول الأسبوعي</b><div class="tw" style="margin-top:8px"><table><tbody>${week||'<tr><td>لم يُوزَّع شيء بعد.</td></tr>'}</tbody></table></div></div>
 <div class="bar">${ro?'':'<button class="btn gold" onclick="ttSave()">حفظ</button>'}${W()?(t.status==='approved'?'<button class="btn red" onclick="ttApprove(false)">إلغاء الاعتماد</button>':'<button class="btn" onclick="ttApprove(true)">حفظ واعتماد الجدول</button>'):''}<button class="btn ghost" onclick="ttExport()">تحميل (Excel / PDF)</button></div>`}
