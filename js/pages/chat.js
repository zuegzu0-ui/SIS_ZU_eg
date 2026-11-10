/* ===== مجموعات الدردشة: جهة الدكتور/المعيد + محرك الدردشة المشترك مع صفحة الطالب (s_chat.js) =====
   تظهر المجموعة تلقائيًا لطلاب المرحلة المحددة (كلية/أقسام/شعب/فرقة/مستوى). كل رسالة تحمل اسم المرسل وكوده. */
let chG=[],ch=null;
const stageOf=code=>{const ok=i=>i.course_code===code&&exTT.some(t=>t.id===i.tt_id&&t.status==='approved'),it=exTI.find(i=>ok(i)&&i.staff_id===user.id)||exTI.find(ok);return it&&exTT.find(x=>x.id===it.tt_id)};
async function chLoad(){[crs,exTT,exTI]=await Promise.all([db.list('courses'),db.list('timetables'),db.list('tt_items')])}

/* نموذج مشترك (مجموعة دردشة / مجلد محتوى): الاسم + المادة + نطاق المرحلة */
function courseScopeForm(title,nameLbl,cur,onSave){
 const v={college:cur.college,depts:dsOf(cur),year:cur.year||undefined,level:cur.level||undefined,course_code:cur.course_code||''};
 const d=modal(`<h2>${title}</h2><div class="grid"><label>${nameLbl}<input id="fn" value="${esc(cur.name)}"></label><label>المادة<select id="fc"><option value="">اختر...</option>${myCourses().map(c=>`<option value="${esc(c.code)}" ${v.course_code===c.code?'selected':''}>${esc(c.code)} - ${esc(c.name)}</option>`).join('')}</select></label></div><div id="fs" style="margin-top:10px"></div><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="sv">حفظ</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 scopePicker('fs',v,{year:true,level:true});
 d.querySelector('#fc').onchange=e=>{v.course_code=e.target.value;const t=!cur.id&&!v.college&&stageOf(v.course_code);
  if(t){v.college=t.college;v.depts=t.department?{[t.department]:t.track?[t.track]:[]}:{};v.year=t.year;v.level=t.level;scopePicker('fs',v,{year:true,level:true})}};
 d.querySelector('#sv').onclick=async()=>{const name=d.querySelector('#fn').value.trim();
  if(!name||!v.course_code||!v.college)return alert('الاسم والمادة والكلية مطلوبة.');
  try{await onSave({id:cur.id||null,name,course_code:v.course_code,college:v.college,dscope:v.depts||{},year:v.year||null,level:v.level||null});d.remove()}catch(e){err(e)}}}

/* قائمة المجموعات */
async function pgChat(){
 chatStop();ch=null;
 try{await chLoad();chG=await rpc('list_chat_groups',{p_token:T()})}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>مجموعات الدردشة</h2><div class="note">أنشئ مجموعة لمادتك وللمرحلة (قسم أو أكثر وشعبة أو أكثر). تظهر تلقائيًا للطلاب، فيرسلون استفساراتهم وترد عليهم، ويمكن الرد على رسالة محددة وإرفاق روابط. يظهر اسم وكود كل طالب مع رسالته.</div><div class="bar"><button class="btn gold" onclick="chNew()">+ مجموعة جديدة</button></div><div class="tw"><table><thead><tr><th>المجموعة</th><th>المادة</th><th>المرحلة</th><th>الرسائل</th><th></th></tr></thead><tbody>${chG.map(g=>`<tr><td>${esc(g.name)}</td><td>${esc(g.course_code)} - ${esc(nm(g.course_code))}</td><td>${esc([g.college,dsText(dsOf(g)),g.year,g.level].filter(Boolean).join(' / '))}</td><td>${g.messages}</td><td class="nw"><button class="mini" onclick="chOpen(${g.id})">فتح</button><button class="mini" onclick="chEdit(${g.id})">تعديل</button><button class="mini red" onclick="chDel(${g.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="5">لا توجد مجموعات.</td></tr>'}</tbody></table></div>`}
function chNew(){if(!myCourses().length)return alert('لا توجد مواد مسكّنة لك في جدول معتمد. اطلب من الإدارة اعتماد الجدول وتسكينك على المادة.');
 courseScopeForm('مجموعة دردشة جديدة','اسم المجموعة',{},async r=>{await rpc('save_chat_group',{p_token:T(),p_row:r});pgChat()})}
function chEdit(id){courseScopeForm('تعديل المجموعة','اسم المجموعة',chG.find(g=>g.id===id),async r=>{await rpc('save_chat_group',{p_token:T(),p_row:r});pgChat()})}
async function chDel(id){if(!confirm('حذف المجموعة وكل رسائلها؟'))return;try{await rpc('delete_chat_group',{p_token:T(),p_id:id});pgChat()}catch(e){err(e)}}
function chOpen(id){const g=chG.find(x=>x.id===id);
 chatMount({title:g.name+' — '+g.course_code,back:pgChat,del:true,me:m=>m.staff_id===user.id,
  fetch:a=>rpc('chat_messages',{p_token:T(),p_group:id,p_after:a}),
  post:(b,l,r)=>rpc('post_chat',{p_token:T(),p_group:id,p_body:b,p_link:l,p_reply_to:r})})}

/* ===== محرك الدردشة (مشترك): تحديث دوري كل 4 ثوانٍ ===== */
function chatStop(){if(ch&&ch.timer)clearInterval(ch.timer)}
function chatBack(){chatStop();const b=ch.cfg.back;ch=null;b()}
function chatMount(cfg){
 chatStop();ch={cfg,msgs:[],last:0,reply:null,timer:null,busy:false,drawn:false};
 $('#main').innerHTML=`<div class="bar"><button class="btn ghost" onclick="chatBack()">← رجوع</button><b>${esc(cfg.title)}</b></div><div id="cm" class="chatbox"></div><div id="cr"></div><div class="card"><textarea id="ci" rows="2" style="width:100%" maxlength="2000" placeholder="اكتب رسالتك... (Enter للإرسال، Shift+Enter لسطر جديد)"></textarea><div class="bar" style="margin:8px 0 0"><input id="cl" placeholder="رابط مرفق (اختياري) https://..." style="flex:1"><button class="btn gold" onclick="chatSend()">إرسال</button></div></div>`;
 $('#ci').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();chatSend()}};
 chatPoll();ch.timer=setInterval(chatPoll,4000)}
async function chatPoll(){
 if(!ch||ch.busy)return;if(!$('#cm')){chatStop();return}
 ch.busy=true;
 try{const r=await ch.cfg.fetch(ch.last);if(ch&&$('#cm')){if(r.length){r.forEach(m=>ch.msgs.push(m));ch.last=r[r.length-1].id;chatDraw()}else if(!ch.drawn)chatDraw()}}catch(e){}
 if(ch)ch.busy=false}
function chatDraw(){
 const box=$('#cm'),near=!ch.drawn||box.scrollHeight-box.scrollTop-box.clientHeight<80;ch.drawn=true;
 box.innerHTML=ch.msgs.map(m=>`<div class="msg ${ch.cfg.me(m)?'me':''}"><div class="mh"><b>${esc(m.sender_name)}</b>${m.sender_kind==='student'?` <small>(${esc(m.student_code)})</small>`:` <span class="chip">${ROLE[m.staff_role]||'هيئة التدريس'}</span>`} <small>${new Date(m.created_at).toLocaleString('ar-EG')}</small></div>${m.reply_to?`<div class="rq">${esc(m.reply_name||'')}: ${esc(m.reply_body||'رسالة محذوفة')}</div>`:''}<div class="mb">${esc(m.body)}</div>${safeUrl(m.link)?`<a class="fl" style="display:inline-block;margin-top:6px" href="${esc(m.link)}" target="_blank" rel="noopener noreferrer">رابط مرفق</a>`:''}<div class="ma"><button class="mini" onclick="chatReply(${m.id})">رد</button>${ch.cfg.del?`<button class="mini red" onclick="chatDel(${m.id})">حذف</button>`:''}</div></div>`).join('')||'<div class="note">لا توجد رسائل بعد. ابدأ المحادثة.</div>';
 if(near)box.scrollTop=box.scrollHeight}
function chatReply(id){const m=ch.msgs.find(x=>x.id===id);ch.reply=id;
 $('#cr').innerHTML=`<div class="note">رد على ${esc(m.sender_name)}: ${esc(m.body.slice(0,100))} <button class="mini" onclick="ch.reply=null;$('#cr').innerHTML=''">إلغاء</button></div>`;$('#ci').focus()}
async function chatSend(){
 const body=$('#ci').value.trim(),link=$('#cl').value.trim();if(!body)return;
 if(link&&!safeUrl(link))return alert('الرابط يجب أن يبدأ بـ https://');
 try{await ch.cfg.post(body,link||null,ch.reply);$('#ci').value='';$('#cl').value='';ch.reply=null;$('#cr').innerHTML='';await chatPoll()}catch(e){err(e)}}
async function chatDel(id){if(!confirm('حذف هذه الرسالة؟'))return;try{await rpc('delete_chat_message',{p_token:T(),p_id:id});ch.msgs=ch.msgs.filter(m=>m.id!==id);chatDraw()}catch(e){err(e)}}

addPage({k:'chat',t:'مجموعات الدردشة',a:'r',o:85,f:pgChat});
