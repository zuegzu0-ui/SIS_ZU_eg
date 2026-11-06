/* ===== الشكاوى (رد وتصفية فقط) ===== */
let cm=[],cfs='',cfc='',cfq='';
async function pgComp(){try{cm=await db.list('complaints')}catch(e){return err(e)}
 const codes=[...new Set(cm.map(x=>x.course_code).filter(Boolean))].sort();
 $('#main').innerHTML=`<h2>الشكاوى</h2><div class="card"><div class="bar" style="margin:0"><select onchange="cfs=this.value;cRows()"><option value="">كل الحالات</option><option ${cfs==='جديدة'?'selected':''}>جديدة</option><option ${cfs==='تم الرد'?'selected':''}>تم الرد</option></select><select onchange="cfc=this.value;cRows()"><option value="">كل المواد</option>${codes.map(c=>`<option ${cfc===c?'selected':''}>${esc(c)}</option>`).join('')}</select><input placeholder="بحث بكود الطالب أو نص الشكوى" value="${esc(cfq)}" oninput="cfq=this.value;cRows()" style="flex:1"><button class="btn gold" onclick="cReplyAll()">رد على كل الشكاوى المعروضة (غير المُجاب عنها)</button><b id="cn"></b></div></div><div class="tw"><table><thead><tr><th>التاريخ</th><th>كود الطالب</th><th>المادة</th><th>الشكوى</th><th>الرد</th><th>الحالة</th><th></th></tr></thead><tbody id="cb2"></tbody></table></div>`;cRows()}
const cFilt=()=>cm.filter(x=>(!cfs||x.status===cfs)&&(!cfc||x.course_code===cfc)&&(!cfq||((x.student_code||'')+' '+(x.body||'')).includes(cfq)));
function cRows(){const r=cFilt();$('#cn').textContent=r.length+' شكوى';
 $('#cb2').innerHTML=r.slice(0,300).map(x=>`<tr><td class="nw">${fdate(x.created_at)}</td><td>${esc(x.student_code)}</td><td>${esc(x.course_code)}</td><td>${esc(x.body)}</td><td>${esc(x.reply)}</td><td>${esc(x.status)}</td><td><button class="mini" onclick="cReply(${x.id})">${x.reply?'تعديل الرد':'رد'}</button></td></tr>`).join('')||'<tr><td colspan="7">لا توجد شكاوى. تظهر هنا عندما يرسلها الطلاب من بوابتهم.</td></tr>'}
function cDo(ids,title,old){const d=modal(`<h2>${title}</h2><textarea id="rp" rows="5" style="width:100%">${esc(old||'')}</textarea><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="ok">إرسال الرد</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 d.querySelector('#ok').onclick=async()=>{try{await rpc('reply_complaints',{p_token:T(),p_ids:ids,p_reply:d.querySelector('#rp').value});d.remove();pgComp()}catch(e){err(e)}}}
function cReply(id){const x=cm.find(c=>c.id===id);cDo([id],'الرد على الشكوى',x.reply)}
function cReplyAll(){const ids=cFilt().filter(x=>x.status!=='تم الرد').map(x=>x.id);if(!ids.length)return alert('لا توجد شكاوى غير مُجاب عنها ضمن المعروض.');cDo(ids,`رد موحد على ${ids.length} شكوى`)}


addPage({k:'complaints',t:'الشكاوى',a:'r',o:40,f:pgComp});
