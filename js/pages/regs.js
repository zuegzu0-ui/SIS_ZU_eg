/* ===== اللوائح والمواد ===== */
let rt='cat',curReg=null,crs=[],regs=[],rcs=[],cq='';
async function pgRegs(){
 try{[crs,regs,rcs]=await Promise.all([db.list('courses'),db.list('regulations'),db.list('reg_courses')])}catch(e){return err(e)}
 if(curReg&&!regs.find(r=>r.id===curReg))curReg=null;
 $('#main').innerHTML=`<h2>اللوائح والمواد</h2><div class="tabs"><button class="${rt==='cat'?'on':''}" onclick="rt='cat';pgRegs()">1) المواد (الدليل)</button><button class="${rt==='reg'?'on':''}" onclick="rt='reg';pgRegs()">2) اللوائح</button></div><div id="rb"></div>`;
 rt==='cat'?catView():(curReg?regView():regList())}
/* دليل المواد */
function catView(){const w=W();
 $('#rb').innerHTML=`<div class="note">أضف كل المواد أولًا بأكوادها (يدويًا أو برفع Excel)، ثم انتقل إلى اللوائح لإدراجها وضبط ساعاتها ودرجاتها ومتطلباتها.</div><div class="bar"><input placeholder="بحث بالكود أو الاسم" value="${esc(cq)}" oninput="cq=this.value;catRows()" style="flex:1">`
  +(w?`<button class="btn gold" onclick="crsForm()">+ إضافة مادة</button><label class="btn ghost">رفع من Excel<input type="file" hidden accept=".xlsx,.xls,.csv" onchange="crsUp(this)"></label><button class="btn ghost" onclick="tplX('courses_template.xlsx',['كود المادة','اسم المادة'])">تحميل القالب</button>`:'')
  +`<button class="btn ghost" onclick="exportModal(crs,[['code','كود المادة'],['name','اسم المادة']],'courses','دليل المواد')">تحميل</button><b id="cc2"></b></div><div class="tw"><table><thead><tr><th>الكود</th><th>اسم المادة</th><th>عدد اللوائح المدرجة بها</th>${w?'<th></th>':''}</tr></thead><tbody id="cb"></tbody></table></div>`;catRows()}
function catRows(){const r=crs.filter(c=>!cq||(c.code+' '+c.name).includes(cq)),w=W();$('#cc2').textContent=r.length+' مادة';
 $('#cb').innerHTML=r.slice(0,300).map(c=>`<tr><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${rcs.filter(x=>x.course_code===c.code).length}</td>${w?`<td class="nw"><button class="mini" onclick="crsForm(${c.id})">تعديل</button><button class="mini red" onclick="crsDel(${c.id})">حذف</button></td>`:''}</tr>`).join('')||'<tr><td colspan="4">لا توجد مواد.</td></tr>'}
function crsForm(id){const cur=id?crs.find(c=>c.id===id):{};
 form(id?'تعديل مادة':'إضافة مادة',[['code','كود المادة','text',null,id?'readonly':''],['name','اسم المادة']],cur,{isNew:!id},async(row,d)=>{if(!row.code||!row.name)return alert('الكود والاسم مطلوبان');await db.save('courses',row,'id',id||null);d.remove();pgRegs()})}
async function crsDel(id){const c=crs.find(x=>x.id===id);if(rcs.some(x=>x.course_code===c.code))return alert('المادة مدرجة في لائحة. احذفها من اللائحة أولًا.');if(!confirm('حذف المادة؟'))return;try{await db.del('courses','id',id);pgRegs()}catch(e){err(e)}}
async function crsUp(inp){const f=inp.files[0];inp.value='';if(!f)return;
 try{const rows=(await readX(f,{'كودالماده':'code','الكود':'code','اسمالماده':'name','الاسم':'name'})).filter(r=>r.code&&r.name);if(!rows.length)return alert('لم يتم العثور على أعمدة "كود المادة" و"اسم المادة".');
  if(!confirm(`سيتم إضافة/تحديث ${rows.length} مادة. متابعة؟`))return;alert('تم: '+await db.bulk('bulk_courses',rows)+' مادة');pgRegs()}catch(e){err(e)}}
/* قائمة اللوائح */
function regList(){const w=W();
 $('#rb').innerHTML=(w?`<div class="bar"><button class="btn gold" onclick="regForm()">+ لائحة جديدة</button></div>`:'')+`<div class="tw"><table><thead><tr><th>اسم اللائحة</th><th>الكلية</th><th>القسم</th><th>الشعبة</th><th>ساعات التخرج</th><th>عدد المواد</th><th></th></tr></thead><tbody>`
  +(regs.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.college)}</td><td>${esc(r.department)}</td><td>${esc(r.track)}</td><td>${esc(r.grad_hours)}</td><td>${rcs.filter(x=>x.reg_id===r.id).length}</td><td class="nw"><button class="mini" onclick="curReg=${r.id};pgRegs()">فتح وضبط المواد</button>${w?`<button class="mini" onclick="regForm(${r.id})">تعديل</button><button class="mini red" onclick="regDel(${r.id})">حذف</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7">لا توجد لوائح.</td></tr>')+`</tbody></table></div>`}
function regForm(id){const cur=id?regs.find(x=>x.id===id):{min_hours:12,max_hours:20,pass_pct:60,min_component_pct:30};
 form(id?'تعديل لائحة':'لائحة جديدة',[['name','اسم اللائحة'],['grad_hours','إجمالي ساعات التخرج','number'],['min_hours','الحد الأدنى لساعات الفصل','number'],['max_hours','الحد الأقصى لساعات الفصل','number'],['pass_pct','نسبة النجاح %','number'],['min_component_pct','أدنى نسبة في التحريري والعملي %','number']],cur,{c:['college','department','track'],isNew:!id},
  async(row,d)=>{if(!row.name||!row.college||!row.department)return alert('اسم اللائحة والكلية والقسم مطلوبة');await db.save('regulations',row,'id',id||null);d.remove();pgRegs()})}
async function regDel(id){if(!confirm('حذف اللائحة وكل موادها؟'))return;try{await db.del('regulations','id',id);pgRegs()}catch(e){err(e)}}
/* مواد اللائحة */
const nm=c=>(crs.find(x=>x.code===c)||{}).name||'';
function regView(){const r=regs.find(x=>x.id===curReg),w=W();
 const items=rcs.filter(x=>x.reg_id===curReg).sort((a,b)=>(a.year||'').localeCompare(b.year||'','ar')||(a.level||'').localeCompare(b.level||'','ar')||a.course_code.localeCompare(b.course_code));
 const tot=items.reduce((a,x)=>a+(+x.credit_hours||0),0);
 $('#rb').innerHTML=`<div class="bar"><button class="btn ghost" onclick="curReg=null;pgRegs()">← رجوع للوائح</button><b>${esc(r.name)}</b></div><div class="note">${esc(r.college)} / ${esc(r.department)} / ${esc(r.track||'كل الشعب')} — ساعات التخرج المطلوبة: ${r.grad_hours||'-'} — مجموع ساعات المواد المدرجة: ${tot} — حد الفصل: ${r.min_hours||'-'} إلى ${r.max_hours||'-'}</div>`
  +(w?`<div class="bar"><button class="btn gold" onclick="rcForm()">+ إدراج مادة في اللائحة</button></div>`:'')
  +`<div class="tw"><table><thead><tr><th>الكود</th><th>المادة</th><th>الفرقة</th><th>المستوى</th><th>الساعات</th><th>النوع</th><th>عملي</th><th>أعمال/عملي/تحريري</th><th>المتطلبات السابقة</th><th>مرات الإعادة</th>${w?'<th></th>':''}</tr></thead><tbody>`
  +(items.map(x=>`<tr><td>${esc(x.course_code)}</td><td>${esc(nm(x.course_code))}</td><td>${esc(x.year)}</td><td>${esc(x.level)}</td><td>${esc(x.credit_hours)}</td><td>${x.mandatory==='نعم'?'إجبارية':'اختيارية'}</td><td>${esc(x.has_practical)}</td><td>${x.coursework||0} / ${x.practical||0} / ${x.final_exam||0}</td><td>${esc(x.prereq)}</td><td>${esc(x.max_retakes)}</td>${w?`<td class="nw"><button class="mini" onclick="rcForm(${x.id})">تعديل</button><button class="mini red" onclick="rcDel(${x.id})">حذف</button></td>`:''}</tr>`).join('')||'<tr><td colspan="11">لم تُدرج مواد بعد.</td></tr>')+`</tbody></table></div>`}
async function rcDel(id){const x=rcs.find(r=>r.id===id);
 if(rcs.some(o=>o.reg_id===curReg&&o.id!==id&&(o.prereq||'').split(',').includes(x.course_code)))return alert('هذه المادة متطلب سابق لمواد أخرى في اللائحة. أزلها من متطلباتها أولًا.');
 if(!confirm('إزالة المادة من اللائحة؟'))return;try{await db.del('reg_courses','id',id);pgRegs()}catch(e){err(e)}}
function rcForm(id){
 const reg=regs.find(x=>x.id===curReg),cur=id?rcs.find(x=>x.id===id):null,inReg=rcs.filter(x=>x.reg_id===curReg);
 const used=new Set(inReg.map(x=>x.course_code)),avail=crs.filter(c=>!used.has(c.code));
 if(!cur&&!avail.length)return alert('كل مواد الدليل أُدرجت في هذه اللائحة (أو لا توجد مواد). أضف مواد من تبويب المواد.');
 const find=(s,list)=>{s=s.trim();return list.find(c=>s===c.code+' - '+c.name||s===c.code||s===c.name)};
 const others=inReg.filter(x=>!cur||x.id!==cur.id).map(x=>crs.find(c=>c.code===x.course_code)).filter(Boolean);
 const pm={};inReg.forEach(x=>pm[x.course_code]=(x.prereq||'').split(',').filter(Boolean));
 const reach=(a,b,seen=new Set())=>a===b||(!seen.has(a)&&(seen.add(a),(pm[a]||[]).some(p=>reach(p,b,seen))));
 let pre=cur&&cur.prereq?cur.prereq.split(',').filter(Boolean):[];
 const v={college:reg.college,year:cur?cur.year:undefined,level:cur?cur.level:undefined},c0=cur||{credit_hours:3,mandatory:'نعم',has_practical:'لا',coursework:20,practical:0,final_exam:80,max_retakes:2};
 const so=(n,l,a)=>`<select id="${n}">${l.map(o=>`<option ${o===a?'selected':''}>${o}</option>`).join('')}</select>`;
 const d=modal(`<h2>${cur?'تعديل مادة في اللائحة':'إدراج مادة في اللائحة'}</h2><div class="grid">
  <label>المادة (اختر أو اكتب الكود أو الاسم)<input id="rc" list="dl1" value="${cur?esc(cur.course_code+' - '+nm(cur.course_code)):''}" ${cur?'readonly':''}><datalist id="dl1">${avail.map(c=>`<option value="${esc(c.code+' - '+c.name)}">`).join('')}</datalist></label>
  <label>عدد الساعات<input id="rh" type="number" min="0" value="${c0.credit_hours??''}"></label>
  <div id="yl" class="grid" style="grid-column:1/-1"></div>
  <label>نوع المادة<select id="rm"><option value="نعم" ${c0.mandatory==='نعم'?'selected':''}>إجبارية</option><option value="لا" ${c0.mandatory==='لا'?'selected':''}>اختيارية</option></select></label>
  <label>لها جزء عملي؟${so('hp',['نعم','لا'],c0.has_practical)}</label>
  <label>أعمال فصلية<input id="cw" type="number" min="0" value="${c0.coursework??''}"></label>
  <label>عملي/تطبيقي<input id="pr" type="number" min="0" value="${c0.practical??''}"></label>
  <label>تحريري<input id="fe" type="number" min="0" value="${c0.final_exam??''}"></label>
  <label>عدد مرات الإعادة المتاحة<input id="mr" type="number" min="0" value="${c0.max_retakes??''}"></label>
  <label style="grid-column:1/-1">المتطلبات السابقة (المواد المدرجة في اللائحة فقط - اختر أو اكتب الكود/الاسم ثم Enter)<input id="pi" list="dl2" placeholder="${others.length?'ابحث عن مادة...':'لا توجد مواد مدرجة بعد'}"><datalist id="dl2">${others.map(c=>`<option value="${esc(c.code+' - '+c.name)}">`).join('')}</datalist></label>
  <div id="pc" class="chips" style="grid-column:1/-1"></div></div>
  <div class="bar" style="margin:14px 0 0"><button class="btn gold" id="sv">حفظ</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 const q=s=>d.querySelector(s);
 casc('yl',['year','level'],v,null);
 const drawPre=()=>q('#pc').innerHTML=pre.map(c=>`<span class="chip">${esc(c)} - ${esc(nm(c))}<button class="x" data-c="${esc(c)}">×</button></span>`).join('');drawPre();
 q('#pc').onclick=e=>{const b=e.target.closest('button');if(b){pre=pre.filter(x=>x!==b.dataset.c);drawPre()}};
 const addPre=()=>{const i=q('#pi');if(!i.value.trim())return;const c=find(i.value,others);if(!c)return alert('هذه المادة غير مدرجة في اللائحة. أدرجها أولًا ثم اختُرها كمتطلب.');
  const self=cur?cur.course_code:(find(q('#rc').value,avail)||{}).code;
  if(c.code===self)return alert('لا يمكن أن تكون المادة متطلبًا لنفسها');
  if(self&&reach(c.code,self))return alert('هذا الاختيار يسبب حلقة مغلقة في المتطلبات');
  if(!pre.includes(c.code))pre.push(c.code);i.value='';drawPre()};
 q('#pi').onchange=addPre;q('#pi').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addPre()}};
 q('#hp').onchange=()=>{if(q('#hp').value==='نعم'){q('#cw').value=20;q('#pr').value=20;q('#fe').value=60}else{q('#cw').value=20;q('#pr').value=0;q('#fe').value=80}};
 q('#sv').onclick=async()=>{const c=cur?{code:cur.course_code}:find(q('#rc').value,avail);if(!c)return alert('اختر مادة من القائمة');
  const cw=+q('#cw').value||0,pr=+q('#pr').value||0,fe=+q('#fe').value||0;
  if(cw+pr+fe!==100)return alert('مجموع توزيع الدرجات يجب أن يساوي 100 (الحالي '+(cw+pr+fe)+')');
  if(!v.year||!v.level)return alert('اختر الفرقة والمستوى');
  const row={reg_id:curReg,course_code:c.code,year:v.year,level:v.level,credit_hours:+q('#rh').value||0,mandatory:q('#rm').value,has_practical:q('#hp').value,coursework:cw,practical:pr,final_exam:fe,max_retakes:+q('#mr').value||0,prereq:pre.join(',')||null};
  try{await db.save('reg_courses',row,'id',id||null);d.remove();pgRegs()}catch(e){err(e)}}}


addPage({k:'regs',t:'اللوائح والمواد',a:'r',o:30,f:pgRegs});
