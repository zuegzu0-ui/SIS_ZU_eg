/* ===== المحتوى: جهة الدكتور/المعيد (مجلدات روابط لكل مادة تظهر لطلاب المرحلة فقط) ===== */
let cfL=[];
async function pgContent(){
 try{await chLoad();cfL=await rpc('list_content',{p_token:T()})}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>المحتوى</h2><div class="note">اختر مادتك وأنشئ مجلدًا، ثم أضف بداخله روابط المحتوى. يظهر المجلد لطلاب المرحلة المحددة فقط (قسم أو أكثر وشعبة أو أكثر).</div><div class="bar"><button class="btn gold" onclick="cfNew()">+ مجلد جديد</button></div>${cfL.map(f=>`<div class="card"><div class="bar" style="margin:0"><b>📁 ${esc(f.name)}</b><span class="chip">${esc(f.course_code)} - ${esc(nm(f.course_code))}</span><small>${esc([f.college,dsText(dsOf(f)),f.year,f.level].filter(Boolean).join(' / '))}</small><button class="mini" onclick="clAdd(${f.id})">+ رابط</button><button class="mini" onclick="cfEdit(${f.id})">تعديل المجلد</button><button class="mini red" onclick="cfDel(${f.id})">حذف المجلد</button></div>${f.links.map(l=>`<div class="node"><a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer">${esc(l.title)}</a> <button class="mini red" onclick="clDel(${l.id})">حذف</button></div>`).join('')||'<div class="node"><small>لا توجد روابط في هذا المجلد.</small></div>'}</div>`).join('')||'<div class="card">لا توجد مجلدات.</div>'}`}
function cfNew(){if(!myCourses().length)return alert('لا توجد مواد مسكّنة لك في جدول معتمد. اطلب من الإدارة اعتماد الجدول وتسكينك على المادة.');
 courseScopeForm('مجلد جديد','اسم المجلد',{},async r=>{await rpc('save_folder',{p_token:T(),p_row:r});pgContent()})}
function cfEdit(id){courseScopeForm('تعديل المجلد','اسم المجلد',cfL.find(f=>f.id===id),async r=>{await rpc('save_folder',{p_token:T(),p_row:r});pgContent()})}
async function cfDel(id){if(!confirm('حذف المجلد وكل روابطه؟'))return;try{await rpc('delete_folder',{p_token:T(),p_id:id});pgContent()}catch(e){err(e)}}
function clAdd(id){form('إضافة رابط محتوى',[['title','عنوان الرابط'],['url','الرابط (https://...)','url']],{},{},async(row,d)=>{
 if(!row.title||!safeUrl(row.url))return alert('العنوان مطلوب، والرابط يجب أن يبدأ بـ https://');
 await rpc('add_link',{p_token:T(),p_folder:id,p_title:row.title,p_url:row.url});d.remove();pgContent()})}
async function clDel(id){if(!confirm('حذف الرابط؟'))return;try{await rpc('delete_link',{p_token:T(),p_id:id});pgContent()}catch(e){err(e)}}

addPage({k:'content',t:'المحتوى',a:'r',o:86,f:pgContent});
