/* ===== سجل الدرجات: الصفحة الرئيسية + الاختبارات والدرجات =====
   الملفات المرتبطة: grades_book.js (سجل الدرجات الإجمالي) و seats.js (أرقام الجلوس) */
const AK={exam:'اختبار',midterm:'ميدتيرم',quiz:'كويز',practical:'عملي',final:'نهائي',coursework:'أعمال فصلية'};
let gTab='as',gCur=null,asm=[],gStu=[],gGr={},gDirty={},gq='';
const inScope=(a,s)=>s.college===a.college&&dsMatch(dsOf(a),s.department,s.track)&&s.year===a.year&&s.level===a.level;
const gScope=a=>gStu.filter(s=>inScope(a,s)).sort((x,y)=>(x.name||'').localeCompare(y.name||'','ar'));
const stageTxt=a=>[a.college,dsText(dsOf(a)),a.year,a.level].filter(Boolean).join(' / ');
const gFetch=async ids=>ids.length?rpc('list_grades',{p_token:T(),p_ids:ids}):[];

async function pgGrades(){
 try{[asm,gStu,crs]=await Promise.all([db.list('assessments'),db.list('students'),db.list('courses')])}catch(e){return err(e)}
 if(gCur&&!asm.find(a=>a.id===gCur))gCur=null;
 $('#main').innerHTML=`<h2>سجل الدرجات وأرقام الجلوس</h2><div class="tabs"><button class="${gTab==='as'?'on':''}" onclick="gTab='as';gCur=null;pgGrades()">الاختبارات والدرجات</button><button class="${gTab==='book'?'on':''}" onclick="gTab='book';pgGrades()">سجل الدرجات</button><button class="${gTab==='seats'?'on':''}" onclick="gTab='seats';pgGrades()">أرقام الجلوس</button></div><div id="gb"></div>`;
 gTab==='book'?bookView():gTab==='seats'?seatView():(gCur?gDetail():gList())}

/* قائمة الاختبارات */
function gList(){const w=W();
 $('#gb').innerHTML=`<div class="note">أنشئ الاختبار أو الميدتيرم أو الكويز وحدد المرحلة والمادة، ثم ارفع الدرجات من Excel (الكود + الدرجة) أو أدخلها يدويًا. لا يرى الطالب إلا سجله، وفقط عندما تفعّل الإظهار.</div><div class="bar"><input placeholder="بحث بالاسم أو كود المادة" value="${esc(gq)}" oninput="gq=this.value;gRows()" style="flex:1">${w?'<button class="btn gold" onclick="gForm()">+ اختبار جديد</button>':''}</div><div class="tw"><table><thead><tr><th>الاسم</th><th>النوع</th><th>المادة</th><th>المرحلة</th><th>الدرجة العظمى</th><th>الظهور للطلاب</th><th></th></tr></thead><tbody id="gt"></tbody></table></div>`;gRows()}
function gRows(){const w=W(),r=asm.filter(a=>!gq||(a.name+' '+a.course_code).includes(gq));
 $('#gt').innerHTML=r.map(a=>`<tr><td>${esc(a.name)}</td><td>${AK[a.kind]||''}</td><td>${esc(a.course_code)} - ${esc(nm(a.course_code))}</td><td>${esc(stageTxt(a))}</td><td>${esc(a.max_score)}</td><td>${a.visible?'<span class="chip">ظاهر</span>':'مخفي'}</td><td class="nw"><button class="mini" onclick="gCur=${a.id};gDetail()">فتح / الدرجات</button>${w?`<button class="mini" onclick="gVis(${a.id})">${a.visible?'إخفاء':'إظهار'}</button><button class="mini red" onclick="gDel(${a.id})">حذف</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7">لا توجد اختبارات.</td></tr>'}
function gForm(){
 form('اختبار جديد',[['name','اسم الاختبار'],['kind','النوع','sel',Object.entries(AK)],['course_code','المادة','sel',crs.map(c=>[c.code,c.code+' - '+c.name])],['max_score','الدرجة العظمى','number'],['term','الفصل الدراسي'],['visible','الظهور للطلاب','sel',[['false','مخفي'],['true','يظهر مباشرة']]]],{kind:'exam',max_score:100,visible:'false'},{sp:{year:true,level:true},isNew:true,note:'حدد الكلية والفرقة والمستوى، ثم قسمًا أو أكثر وشعبة أو أكثر داخل كل قسم (بدون اختيار = كل الأقسام). الطلاب المطابقون فقط تُرفع لهم الدرجات.'},
  async(row,d)=>{if(!row.name||!row.course_code||!row.college||!row.year||!row.level||!(row.max_score>0))return alert('الاسم والمادة والمرحلة (كلية/فرقة/مستوى) والدرجة العظمى مطلوبة.');
   try{const ot=(await db.list('terms')).find(x=>x.status==='open');if(ot)row.term_id=ot.id}catch{}
   const r=await db.save('assessments',row,'id',null);d.remove();gCur=r.row.id;pgGrades()})}
async function gVis(id){const a=asm.find(x=>x.id===id);try{await db.save('assessments',{visible:!a.visible},'id',id);pgGrades()}catch(e){err(e)}}
async function gDel(id){if(!confirm('حذف الاختبار وكل درجاته؟'))return;try{await db.del('assessments','id',id);pgGrades()}catch(e){err(e)}}

/* تفاصيل الاختبار: الدرجات */
async function gDetail(){
 const a=asm.find(x=>x.id===gCur),stus=gScope(a),w=W(),max=+a.max_score;
 try{gGr={};(await gFetch([a.id])).forEach(g=>gGr[g.c]=+g.s)}catch(e){return err(e)}
 gDirty={};
 const sc=Object.values(gGr),avg=sc.length?(sc.reduce((x,y)=>x+y,0)/sc.length).toFixed(2):'-',pass=sc.length?Math.round(100*sc.filter(x=>x>=0.6*max).length/sc.length)+'%':'-';
 $('#gb').innerHTML=`<div class="bar"><button class="btn ghost" onclick="gCur=null;pgGrades()">← رجوع</button><b>${esc(a.name)}</b>${a.visible?'<span class="chip">ظاهر للطلاب</span>':'<span class="chip" style="background:#e3e6f2">مخفي</span>'}</div>
 <div class="note">${AK[a.kind]} — ${esc(a.course_code)} - ${esc(nm(a.course_code))} — ${esc(stageTxt(a))} — الدرجة العظمى ${max}</div>
 <div class="card"><b>الإحصاء:</b> رُصدت ${sc.length} من ${stus.length} طالب — المتوسط ${avg} — الأعلى ${sc.length?Math.max(...sc):'-'} — الأدنى ${sc.length?Math.min(...sc):'-'} — نسبة النجاح (60% فأكثر) ${pass}</div>
 <div class="bar">${w?`<label class="btn ghost">رفع الدرجات من Excel<input type="file" hidden accept=".xlsx,.xls,.csv" onchange="gUp(this)"></label><button class="btn ghost" onclick="gTpl()">تحميل قالب بأسماء الطلاب</button><button class="btn gold" onclick="gSave()">حفظ التعديلات</button>`:''}<button class="btn ghost" onclick="gExp()">تحميل الدرجات (Excel / PDF)</button></div>
 <div class="tw"><table><thead><tr><th>الكود</th><th>الاسم</th><th>الدرجة (من ${max})</th></tr></thead><tbody>${stus.map(s=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td><input type="number" min="0" max="${max}" step="any" style="width:100px" ${w?'':'disabled'} value="${gGr[s.code]??''}" onchange="gEdit('${esc(s.code)}',this)"></td></tr>`).join('')||'<tr><td colspan="3">لا يوجد طلاب مطابقون لمرحلة هذا الاختبار.</td></tr>'}</tbody></table></div>`}
function gEdit(code,el){const a=asm.find(x=>x.id===gCur),v=el.value;
 if(v!==''&&(+v<0||+v>+a.max_score)){alert('الدرجة يجب أن تكون بين 0 و '+a.max_score);el.value=gGr[code]??'';return}
 gDirty[code]=v===''?null:+v}
async function gSave(){const rows=Object.entries(gDirty).map(([code,score])=>({code,score}));if(!rows.length)return alert('لا توجد تعديلات.');
 try{await rpc('save_grades',{p_token:T(),p_assessment:gCur,p_rows:rows});alert('تم الحفظ');gDetail()}catch(e){err(e)}}
async function gUp(inp){const f=inp.files[0];inp.value='';if(!f)return;
 try{const rows=(await readX(f,{'كودالطالب':'code','الكود':'code','الدرجه':'score'})).filter(r=>r.code&&r.score!==undefined).map(r=>({code:r.code,score:parseFloat(String(r.score).replace(',','.'))})).filter(r=>!isNaN(r.score));
  if(!rows.length)return alert('لم يتم العثور على عمودي "كود الطالب" و"الدرجة" أو لا توجد درجات. استخدم القالب.');
  if(!confirm(`رفع ${rows.length} درجة؟ تُستبدل الدرجة الموجودة لنفس الطالب.`))return;
  const r=await rpc('save_grades',{p_token:T(),p_assessment:gCur,p_rows:rows});
  alert(`تم حفظ ${r.saved} درجة.`+(r.rejected.length?`\nمرفوضة (كود غير موجود أو درجة خارج المدى): ${r.rejected.join('، ')}`:''));gDetail()}catch(e){err(e)}}
function gTpl(){const a=asm.find(x=>x.id===gCur),wb=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['كود الطالب','اسم الطالب','الدرجة'],...gScope(a).map(s=>[s.code,s.name,gGr[s.code]??''])]),'Sheet1');XLSX.writeFile(wb,'grades_template.xlsx')}
function gExp(){const a=asm.find(x=>x.id===gCur);exportModal(gScope(a).map(s=>({code:s.code,name:s.name,score:gGr[s.code]??''})),[['code','كود الطالب'],['name','الاسم'],['score','الدرجة']],'grades_'+a.id,a.name+' - '+nm(a.course_code))}

addPage({k:'grades',t:'سجل الدرجات وأرقام الجلوس',a:'r',o:70,f:pgGrades});
