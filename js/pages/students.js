/* ===== الطلاب ===== */
const SC=[['name','الاسم'],['code','الكود'],['email','الإيميل'],['national_id','الرقم القومي'],['college','الكلية'],['department','القسم'],['track','الشعبة'],['year','الفرقة'],['level','المستوى']];
const SMAP={'الاسم':'name','الكود':'code','الايميل':'email','الرقمالقومي':'national_id','الكليه':'college','القسم':'department','الشعبه':'track','الفرقه':'year','المستوي':'level'};
let stu=[],sf={},sq='';
async function pgStudents(){
 try{stu=await db.list('students')}catch(e){return err(e)}
 const w=W();
 $('#main').innerHTML=`<h2>إدارة الطلاب</h2><div class="card"><div id="fc" class="grid5"></div><div class="bar" style="margin:12px 0 0"><input placeholder="بحث بالاسم أو الكود أو الرقم القومي..." value="${esc(sq)}" oninput="sq=this.value;stRows()" style="flex:1;min-width:200px"><button class="btn ghost" onclick="stExport()">تحميل (Excel / PDF)</button>`
  +(w?`<button class="btn gold" onclick="stForm()">+ طالب جديد</button><label class="btn ghost">رفع/تحديث من Excel<input type="file" hidden accept=".xlsx,.xls,.csv" onchange="stUp(this)"></label><button class="btn ghost" onclick="tplX('students_template.xlsx',['الاسم','الكود','الإيميل','الرقم القومي','الكلية','القسم','الشعبة','الفرقة','المستوى'])">تحميل القالب</button>`:'')
  +`<b id="cnt"></b></div></div><div class="tw"><table><thead><tr>${SC.map(c=>`<th>${c[1]}</th>`).join('')}${w?'<th></th>':''}</tr></thead><tbody id="tb"></tbody></table></div>`;
 casc('fc',SF,sf,stRows,'الكل');stRows()}
const stFilt=()=>stu.filter(s=>SF.every(f=>!sf[f]||s[f]===sf[f])&&(!sq||[s.name,s.code,s.national_id,s.email].join(' ').includes(sq)));
function stRows(){const r=stFilt(),w=W();$('#cnt').textContent=r.length+' طالب'+(r.length>200?' (يعرض أول 200)':'');
 $('#tb').innerHTML=r.slice(0,200).map(s=>`<tr>${SC.map(c=>`<td>${esc(s[c[0]])}</td>`).join('')}${w?`<td class="nw"><button class="mini" onclick="stForm('${esc(s.code)}')">تعديل</button><button class="mini" onclick="stPw('${esc(s.code)}')">إعادة كلمة المرور</button><button class="mini red" onclick="stDel('${esc(s.code)}')">حذف</button></td>`:''}</tr>`).join('')||`<tr><td colspan="10">لا توجد نتائج.</td></tr>`}
function stExport(){exportModal(stFilt(),SC,'students','بيانات الطلاب')}
function stForm(code){const cur=code?stu.find(s=>s.code===code):{};
 form(code?'تعديل بيانات طالب':'إضافة طالب',[['name','الاسم'],['code','الكود الجامعي','text',null,code?'readonly':''],['email','الإيميل','email'],['national_id','الرقم القومي']],cur,{c:SF,isNew:!code,note:code?'':'سيُنشأ للطالب حساب تلقائيًا: اسم المستخدم وكلمة المرور = الكود الجامعي، ويمكنه تغييرها لاحقًا.'},
  async(row,d)=>{if(!row.name||!row.code)return alert('الاسم والكود مطلوبان');await db.save('students',row,'code',code||null);d.remove();pgStudents()})}
async function stDel(c){if(!confirm('حذف الطالب '+c+'؟'))return;try{await db.del('students','code',c);pgStudents()}catch(e){err(e)}}
async function stPw(c){if(!confirm('إعادة كلمة مرور الطالب إلى كوده الجامعي؟'))return;try{await rpc('reset_student_password',{p_token:T(),p_code:c});alert('تمت إعادة كلمة المرور')}catch(e){err(e)}}
async function stUp(inp){const f=inp.files[0];inp.value='';if(!f)return;
 try{const rows=(await readX(f,SMAP)).filter(r=>r.code);if(!rows.length)return alert('لم يتم العثور على عمود "الكود". تأكد من عناوين الأعمدة (استخدم القالب).');
  const names=new Set(orgs.filter(o=>o.kind==='college').map(o=>o.name)),bad=rows.filter(r=>r.college&&!names.has(r.college)).length;
  if(!confirm(`سيتم إضافة/تحديث ${rows.length} طالب بالكود، وإنشاء حساب لكل طالب جديد (المستخدم وكلمة المرور = الكود).`+(bad?`\nتنبيه: ${bad} سجل كليته غير موجودة في الهيكل.`:'')))return;
  alert('تم: '+await db.bulk('bulk_students',rows)+' سجل');pgStudents()}catch(e){err(e)}}


addPage({k:'students',t:'الطلاب',a:'r',o:20,f:pgStudents});
