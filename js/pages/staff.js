/* ===== الحسابات والصلاحيات ===== */
let stf=[];
async function pgStaff(){try{stf=await db.list('staff')}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>الحسابات والصلاحيات</h2><div class="note">مدير: كل الصلاحيات. موظف: إدارة البيانات. عضو هيئة تدريس ومعيد: عرض والرد على الشكاوى حاليًا، وتتسع صلاحياتهم مع الوحدات القادمة. حسابات الطلاب تُنشأ تلقائيًا عند إضافتهم.</div><div class="bar"><button class="btn gold" onclick="stfForm()">+ حساب جديد</button></div><div class="tw"><table><thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>الدور</th><th>الكلية</th><th>القسم</th><th></th></tr></thead><tbody>${stf.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.username)}</td><td>${ROLE[s.role]||esc(s.role)}</td><td>${esc(s.college)}</td><td>${esc(s.department)}</td><td class="nw"><button class="mini" onclick="stfForm(${s.id})">تعديل</button><button class="mini red" onclick="stfDel(${s.id})">حذف</button></td></tr>`).join('')}</tbody></table></div>`}
function stfForm(id){const cur=id?stf.find(s=>s.id===id):{};
 form(id?'تعديل حساب':'حساب جديد',[['name','الاسم'],['username','اسم المستخدم'],['password',id?'كلمة المرور (اتركها فارغة بدون تغيير)':'كلمة المرور','password'],['role','الدور','sel',Object.entries(ROLE).filter(e=>e[0]!=='student')]],cur,{c:['college','department'],isNew:!id,note:'للدكتور أو المعيد: حدد الكلية والقسم التابع لهما.'},
  async(row,d)=>{if(!row.name||!row.username||!row.role)return alert('الاسم واسم المستخدم والدور مطلوبة');await db.save('staff',row,'id',id||null);d.remove();pgStaff()})}
async function stfDel(id){if(!confirm('حذف الحساب؟'))return;try{await db.del('staff','id',id);pgStaff()}catch(e){err(e)}}


addPage({k:'staff',t:'الحسابات والصلاحيات',a:'a',o:900,f:pgStaff});
