/* ===== المالية: السداد ورفع الحجب (بحث بكود الطالب، طريقة الدفع، كود دفع لا يتكرر، رفع تلقائي عند اكتمال المبلغ) + سجل المدفوعات ===== */
let payQ='',payF=null,pgL=[],pgQ='';
function payView(){
 $('#fb').innerHTML=`<div class="note">ابحث عن الطالب بكوده، اختر ما يسدده وطريقة الدفع (كاش / انستا باي / بطاقة بنكية) واكتب كود الدفع (لا يمكن تكراره أبدًا) والمبلغ. عند اكتمال مبلغ البند يُرفع الحجب تلقائيًا بمجرد الحفظ، وتظهر العملية في مصروفات الطالب.</div><div class="bar"><input id="pq" placeholder="كود الطالب" value="${esc(payQ)}" onkeydown="if(event.key==='Enter')paySearch()"><button class="btn gold" onclick="paySearch()">بحث</button></div><div id="pb"></div>`;
 if(payQ)paySearch()}
async function paySearch(){const c=$('#pq').value.trim();if(!c)return;payQ=c;
 try{payF=await rpc('fin_student',{p_token:T(),p_code:c})}catch(e){payF=null;$('#pb').innerHTML='';return err(e)}
 const f=payF,open=[...f.fees.filter(x=>x.amount-x.paid>0).map(x=>({k:'fee',id:x.id,t:x.name,rem:x.amount-x.paid})),...f.blocks.filter(b=>b.kind==='financial'&&b.status==='active').map(b=>({k:'block',id:b.id,t:b.reason,rem:b.amount-b.paid}))];
 window.payOpen=open;
 $('#pb').innerHTML=`<div class="card"><b>${esc(f.student.name)}</b> (${esc(f.student.code)}) — ${esc(f.student.year)} / ${esc(f.student.level)}</div>
 ${open.length?`<div class="card"><b>تسجيل عملية سداد</b><div class="grid" style="margin-top:8px"><label>البند<select id="pi" onchange="payFill()">${open.map((o,i)=>`<option value="${i}">${esc(o.t)} — المتبقي ${money(o.rem)}</option>`).join('')}</select></label><label>طريقة الدفع<select id="pm"><option value="cash">كاش</option><option value="instapay">انستا باي</option><option value="card">بطاقة بنكية</option></select></label><label>كود الدفع (لا يتكرر)<input id="pc"></label><label>المبلغ<input id="pa" type="number" min="0" step="any"></label></div><p><button class="btn gold" onclick="paySave()">حفظ العملية</button></p></div>`:'<div class="note">لا توجد مصروفات مستحقة على هذا الطالب.</div>'}
 ${finHtml(f)}`;payFill()}
function payFill(){const s=$('#pi');if(s)$('#pa').value=payOpen[+s.value].rem}
async function paySave(){const o=payOpen[+$('#pi').value],code=$('#pc').value.trim(),amount=+$('#pa').value;
 if(!code)return alert('كود الدفع مطلوب.');if(!(amount>0))return alert('المبلغ غير صالح.');
 if(!confirm(`تسجيل سداد ${money(amount)} للبند «${o.t}»؟`))return;
 try{const r=await rpc('add_payment',{p_token:T(),p_code:payF.student.code,p_kind:o.k,p_item:o.id,p_method:$('#pm').value,p_pay:code,p_amount:amount});
  alert(r.remaining===0?'تم حفظ العملية وسداد البند بالكامل. رُفع الحجب تلقائيًا.':'تم حفظ العملية. المتبقي '+money(r.remaining)+' (يبقى الحجب حتى اكتمال المبلغ).');paySearch()}catch(e){err(e)}}
/* سجل المدفوعات */
async function logView(){
 try{pgL=await rpc('list_payments',{p_token:T()})}catch(e){return err(e)}
 $('#fb').innerHTML=`<div class="bar"><input placeholder="بحث بالكود أو الاسم أو كود الدفع" value="${esc(pgQ)}" oninput="pgQ=this.value;logRows()" style="flex:1"><button class="btn ghost" onclick="logExp()">تحميل (Excel / PDF)</button><b id="pn"></b></div><div class="tw"><table><thead><tr><th>التاريخ</th><th>الطالب</th><th>البند</th><th>الطريقة</th><th>كود الدفع</th><th>المبلغ</th></tr></thead><tbody id="pt"></tbody></table></div>`;logRows()}
const logF=()=>pgL.filter(p=>!pgQ||(p.code+' '+p.name+' '+p.pay_code).includes(pgQ));
function logRows(){const r=logF();$('#pn').textContent=r.length+' عملية — الإجمالي '+money(r.reduce((a,p)=>a+ +p.amount,0));
 $('#pt').innerHTML=r.slice(0,300).map(p=>`<tr><td class="nw">${fdate(p.created_at)}</td><td>${esc(p.code)} - ${esc(p.name)}</td><td>${esc(p.item)}</td><td>${PM[p.method]}</td><td>${esc(p.pay_code)}</td><td>${money(p.amount)}</td></tr>`).join('')||'<tr><td colspan="6">لا توجد مدفوعات.</td></tr>'}
function logExp(){exportModal(logF().map(p=>({...p,method:PM[p.method],date:fdate(p.created_at)})),[['date','التاريخ'],['code','كود الطالب'],['name','الاسم'],['item','البند'],['method','طريقة الدفع'],['pay_code','كود الدفع'],['amount','المبلغ']],'payments','سجل المدفوعات')}
