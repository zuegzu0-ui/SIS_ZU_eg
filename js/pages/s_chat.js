/* ===== مجموعات الدردشة: جهة الطالب (المحرك المشترك في chat.js) ===== */
let sgL=[];
async function sChat(){
 chatStop();ch=null;
 try{sgL=await rpc('my_chat_groups',{p_token:T()})}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>مجموعات الدردشة</h2><div class="tw"><table><thead><tr><th>المجموعة</th><th>المادة</th><th>المنشئ</th><th></th></tr></thead><tbody>${sgL.map(g=>`<tr><td>${esc(g.name)}</td><td>${esc(g.course_code)}</td><td>${esc(g.created_by_name)}</td><td><button class="mini" onclick="sChatOpen(${g.id})">دخول</button></td></tr>`).join('')||'<tr><td colspan="4">لا توجد مجموعات لمرحلتك حتى الآن.</td></tr>'}</tbody></table></div>`}
function sChatOpen(id){const g=sgL.find(x=>x.id===id);
 chatMount({title:g.name+' — '+g.course_code,back:sChat,del:false,me:m=>m.student_code===user.code,
  fetch:a=>rpc('student_chat_messages',{p_token:T(),p_group:id,p_after:a}),
  post:(b,l,r)=>rpc('student_post_chat',{p_token:T(),p_group:id,p_body:b,p_link:l,p_reply_to:r})})}
addPage({k:'s_chat',t:'الدردشة',a:'s',o:3,f:sChat});
