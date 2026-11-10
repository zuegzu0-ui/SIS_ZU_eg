/* ===== المالية والحجب: الصفحة الرئيسية + أنواع المصروفات + عرض السجل المالي (مشترك مع الطالب) =====
   الملفات المرتبطة: fin_blocks.js (الحجب اليدوي) · fin_pay.js (السداد ورفع الحجب وسجل المدفوعات) */
let finTab='types',ftL=[];
const STABS=[['s_reg','تسجيل المواد'],['s_sched','جدولي'],['s_exams','اختباراتي'],['s_chat','الدردشة'],['s_content','المحتوى'],['s_att','حضوري'],['s_plan','سجل الطالب'],['s_comp','الشكاوى والتظلمات']];
const PM={cash:'كاش',instapay:'انستا باي',card:'بطاقة بنكية'},BK={financial:'مالي',administrative:'إداري',disciplinary:'تأديبي',other:'أخرى'};
const tabName=k=>k==='*'?'كل التبويبات (ما عدا حسابي)':(STABS.find(t=>t[0]===k)||[k,k])[1];
const tabsTxt=a=>(a||['*']).map(tabName).join('، ');
const tabsHtml=sel=>{const all=!sel||sel.includes('*');
 return `<label class="chip"><input type="checkbox" data-all ${all?'checked':''} onchange="this.closest('.box,#fb').querySelectorAll('input[data-t]').forEach(i=>i.disabled=this.checked)"> كل التبويبات (ما عدا بيانات الطالب «حسابي»)</label><div class="chips">${STABS.map(([k,t])=>`<label class="chip"><input type="checkbox" data-t="${k}" ${!all&&sel.includes(k)?'checked':''} ${all?'disabled':''}> ${t}</label>`).join('')}</div>`};
const tabsRead=root=>root.querySelector('input[data-all]').checked?['*']:[...root.querySelectorAll('input[data-t]:checked')].map(i=>i.dataset.t);
const money=n=>(+n).toLocaleString('ar-EG',{maximumFractionDigits:2});

/* السجل المالي للطالب (للإدارة وللطالب) */
function finHtml(f){
 return `${f.locks.length?`<div class="note" style="background:#f4c7c3;border-color:#a32"><b>الحجب الحالي على الطالب:</b><br>${f.locks.map(l=>'• '+esc(l.reason)+' — يغلق: '+esc(tabsTxt(l.tabs))).join('<br>')}</div>`:'<div class="note">لا يوجد أي حجب على الطالب.</div>'}
 <h3>المصروفات</h3><div class="tw"><table><thead><tr><th>البند</th><th>المبلغ</th><th>المدفوع</th><th>المتبقي</th><th>الاستحقاق</th><th>الحالة</th></tr></thead><tbody>${f.fees.map(x=>`<tr><td>${esc(x.name)}</td><td>${money(x.amount)}</td><td>${money(x.paid)}</td><td>${money(x.amount-x.paid)}</td><td>${esc(x.due_date||'فوري')}</td><td>${x.amount-x.paid<=0?'<span class="chip">مسدد</span>':'غير مسدد'}</td></tr>`).join('')}${f.blocks.filter(b=>b.kind==='financial').map(b=>`<tr><td>${esc(b.reason)} (حجب مالي)</td><td>${money(b.amount)}</td><td>${money(b.paid)}</td><td>${money(b.amount-b.paid)}</td><td>—</td><td>${b.status==='lifted'?'<span class="chip">مسدد/مرفوع</span>':'غير مسدد'}</td></tr>`).join('')||''}${(f.fees.length+f.blocks.filter(b=>b.kind==='financial').length)?'':'<tr><td colspan="6">لا توجد مصروفات.</td></tr>'}</tbody></table></div>
 ${f.blocks.filter(b=>b.kind!=='financial').length?`<h3>الحجب الإداري</h3><div class="tw"><table><thead><tr><th>النوع</th><th>السبب</th><th>الحالة</th></tr></thead><tbody>${f.blocks.filter(b=>b.kind!=='financial').map(b=>`<tr><td>${BK[b.kind]}</td><td>${esc(b.reason)}</td><td>${b.status==='active'?'<b style="color:#a32">فعّال</b>':'مرفوع'+(b.lifted_note?' — '+esc(b.lifted_note):'')}</td></tr>`).join('')}</tbody></table></div>`:''}
 <h3>المدفوعات</h3><div class="tw"><table><thead><tr><th>التاريخ</th><th>البند</th><th>طريقة الدفع</th><th>كود الدفع</th><th>المبلغ</th></tr></thead><tbody>${f.payments.map(p=>`<tr><td class="nw">${fdate(p.created_at)}</td><td>${esc(p.item)}</td><td>${PM[p.method]||''}</td><td>${esc(p.code)}</td><td>${money(p.amount)}</td></tr>`).join('')||'<tr><td colspan="5">لا توجد مدفوعات.</td></tr>'}</tbody></table></div>`}

async function pgFin(){
 try{ftL=await db.list('fee_types')}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>المالية والحجب</h2><div class="tabs">${[['types','أنواع المصروفات'],['blocks','الحجب'],['pay','السداد ورفع الحجب'],['log','سجل المدفوعات']].map(([k,t])=>`<button class="${finTab===k?'on':''}" onclick="finTab='${k}';pgFin()">${t}</button>`).join('')}</div><div id="fb"></div>`;
 ({types:ftView,blocks:blView,pay:payView,log:logView}[finTab])()}

function ftView(){
 $('#fb').innerHTML=`<div class="note">حدّد نوع المصروفات ومبلغها يدويًا ولأي مرحلة تنطبق (الكلية والفرقة والمستوى، وقسمًا أو أكثر وشعبة أو أكثر)، وما يُغلق على الطالب عند عدم السداد. تنطبق المصروفات تلقائيًا على كل طالب في المرحلة، ويُغلق عنه ما حددت (الافتراضي كل التبويبات ما عدا «حسابي») ويظهر له سبب الغلق، حتى يسدد المبلغ بالكامل من تبويب السداد.</div><div class="bar"><button class="btn gold" onclick="ftForm()">+ نوع مصروفات</button></div><div class="tw"><table><thead><tr><th>النوع</th><th>المبلغ</th><th>المرحلة</th><th>الاستحقاق</th><th>يُغلق عند عدم السداد</th><th>الحالة</th><th></th></tr></thead><tbody>${ftL.map(f=>`<tr><td>${esc(f.name)}</td><td>${money(f.amount)}</td><td>${esc([f.college,dsText(dsOf(f)),f.year,f.level].filter(Boolean).join(' / '))}</td><td>${esc(f.due_date||'فوري')}</td><td>${esc(tabsTxt(f.lock_tabs))}</td><td>${f.active?'فعّال':'موقوف'}</td><td class="nw"><button class="mini" onclick="ftForm(${f.id})">تعديل</button><button class="mini red" onclick="ftDel(${f.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="7">لا توجد أنواع مصروفات.</td></tr>'}</tbody></table></div>`}
function ftForm(id){
 const cur=id?ftL.find(x=>x.id===id):{lock_tabs:['*'],active:true},v={college:cur.college||undefined,depts:dsOf(cur),year:cur.year||undefined,level:cur.level||undefined};
 const d=modal(`<h2>${id?'تعديل نوع مصروفات':'نوع مصروفات جديد'}</h2><div class="grid"><label>نوع المصروفات<input id="fn" value="${esc(cur.name)}" placeholder="مصروفات دراسية - الفصل الأول"></label><label>المبلغ<input id="fa" type="number" min="0" step="any" value="${cur.amount??''}"></label><label>تاريخ الاستحقاق (يبدأ الغلق عنده، وبدونه يبدأ فورًا)<input id="fd" type="date" value="${esc(cur.due_date||'')}"></label><label>الحالة<select id="fs"><option value="true" ${cur.active?'selected':''}>فعّال</option><option value="false" ${cur.active?'':'selected'}>موقوف</option></select></label></div><div id="fsp" style="margin-top:10px"></div><div class="card" style="margin-top:10px"><b>ما يُغلق عند عدم السداد</b><div style="margin-top:6px">${tabsHtml(cur.lock_tabs)}</div></div><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="sv">حفظ</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 scopePicker('fsp',v,{year:true,level:true});
 d.querySelector('#sv').onclick=async()=>{const name=d.querySelector('#fn').value.trim(),amount=+d.querySelector('#fa').value,tabs=tabsRead(d);
  if(!name||!(amount>0))return alert('النوع والمبلغ (أكبر من صفر) مطلوبان.');if(!tabs.length)return alert('اختر ما يُغلق عند عدم السداد.');
  try{await db.save('fee_types',{name,amount,college:v.college||null,dscope:v.depts||{},year:v.year||null,level:v.level||null,due_date:d.querySelector('#fd').value||null,lock_tabs:tabs,active:d.querySelector('#fs').value==='true'},'id',id||null);d.remove();pgFin()}catch(e){err(e)}}}
async function ftDel(id){if(!confirm('حذف نوع المصروفات؟ (لا يُحذف إن وُجدت عليه مدفوعات، أوقفه بدل ذلك)'))return;try{await db.del('fee_types','id',id);pgFin()}catch(e){err(e)}}

addPage({k:'finance',t:'المالية والحجب',a:'w',o:57,f:pgFin});
