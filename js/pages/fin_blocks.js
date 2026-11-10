/* ===== المالية: الحجب اليدوي لطالب أو مجموعة طلاب (بالأكواد أو بالمرحلة) وتحديد نوع الحجب وما يُغلق ===== */
let blL=[],blS={depts:{}},blQ='',blMode='codes',blStu=[];
async function blView(){
 try{[blL,blStu]=await Promise.all([rpc('list_blocks',{p_token:T()}),db.list('students')])}catch(e){return err(e)}
 $('#fb').innerHTML=`<div class="card"><b>حجب جديد</b><div class="grid" style="margin-top:8px"><label>حجب<select onchange="blMode=this.value;blView()"><option value="codes" ${blMode==='codes'?'selected':''}>طالب أو عدة طلاب بالكود</option><option value="group" ${blMode==='group'?'selected':''}>مجموعة طلاب (مرحلة)</option></select></label><label>نوع الحجب<select id="bk"><option value="financial">مالي (يُرفع بالسداد)</option><option value="administrative">إداري</option><option value="disciplinary">تأديبي</option><option value="other">أخرى</option></select></label></div>
 ${blMode==='codes'?'<label style="display:block;margin-top:8px">أكواد الطلاب (سطر أو فاصلة بين كل كود)<textarea id="bc" rows="3" style="width:100%"></textarea></label>':'<div id="bsp" style="margin-top:8px"></div>'}
 <div class="grid" style="margin-top:8px"><label>السبب (يظهر للطالب)<input id="br" placeholder="مثال: تأخر سداد المصروفات"></label><label>المبلغ (للحجب المالي)<input id="bm" type="number" min="0" step="any"></label></div>
 <div style="margin-top:8px"><b>ما يُغلق</b><div style="margin-top:6px">${tabsHtml(['*'])}</div></div><p><button class="btn red" onclick="blApply()">تطبيق الحجب</button></p></div>
 <div class="bar"><input placeholder="بحث بالكود أو الاسم أو السبب" value="${esc(blQ)}" oninput="blQ=this.value;blRows()" style="flex:1"><b id="bn"></b></div>
 <div class="tw"><table><thead><tr><th>الطالب</th><th>النوع</th><th>السبب</th><th>المبلغ / المدفوع</th><th>يُغلق</th><th>الحالة</th><th></th></tr></thead><tbody id="bt"></tbody></table></div>`;
 if(blMode==='group'){blS.depts=blS.depts||{};scopePicker('bsp',blS,{year:true,level:true})}
 blRows()}
function blRows(){const r=blL.filter(b=>!blQ||(b.code+' '+b.name+' '+b.reason).includes(blQ));$('#bn').textContent=r.length+' سجل';
 $('#bt').innerHTML=r.slice(0,300).map(b=>`<tr><td>${esc(b.code)} - ${esc(b.name)}</td><td>${BK[b.kind]}</td><td>${esc(b.reason)}</td><td>${b.amount!=null?money(b.paid)+' / '+money(b.amount):'—'}</td><td>${esc(tabsTxt(b.tabs))}</td><td>${b.status==='active'?'<b style="color:#a32">فعّال</b>':'مرفوع'+(b.lifted_note?' — '+esc(b.lifted_note):'')}</td><td>${b.status==='active'?`<button class="mini" onclick="blLift(${b.id})">رفع الحجب</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7">لا توجد حجوب.</td></tr>'}
async function blApply(){
 const kind=$('#bk').value,reason=$('#br').value.trim(),amount=+$('#bm').value||null,tabs=tabsRead($('#fb')),box=$('#fb');
 if(!reason)return alert('سبب الحجب مطلوب.');if(kind==='financial'&&!(amount>0))return alert('المبلغ مطلوب للحجب المالي.');if(!tabs.length)return alert('اختر ما يُغلق.');
 let codes;
 if(blMode==='codes'){codes=[...new Set($('#bc').value.split(/[\s,،;]+/).map(x=>x.trim()).filter(Boolean))];if(!codes.length)return alert('اكتب كودًا واحدًا على الأقل.')}
 else{if(!blS.college||!blS.year)return alert('حدد الكلية والفرقة على الأقل (ويفضّل القسم والمستوى).');codes=blStu.filter(s=>stScope(s,blS)).map(s=>s.code);if(!codes.length)return alert('لا يوجد طلاب في هذه المرحلة.')}
 if(!confirm(`حجب ${codes.length} طالب (${BK[kind]})؟ يُغلق عنهم: ${tabsTxt(tabs)}`))return;
 try{let n=0;for(let i=0;i<codes.length;i+=1000)n+=(await rpc('add_block',{p_token:T(),p_codes:codes.slice(i,i+1000),p_kind:kind,p_reason:reason,p_amount:amount,p_tabs:tabs})).count;
  alert('تم حجب '+n+' طالب'+(n<codes.length?` (${codes.length-n} كود غير موجود)`:''));blView()}catch(e){err(e)}}
function blLift(id){const d=modal(`<h2>رفع الحجب</h2><label style="display:block">ملاحظة (اختياري)<input id="ln" style="width:100%"></label><div class="note" style="margin-top:10px">للحجب المالي يُفضَّل الرفع بالسداد من تبويب «السداد ورفع الحجب» لتظهر العملية في مصروفات الطالب.</div><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="ok">رفع الحجب</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 d.querySelector('#ok').onclick=async()=>{try{await rpc('lift_block',{p_token:T(),p_id:id,p_note:d.querySelector('#ln').value});d.remove();blView()}catch(e){err(e)}}}
