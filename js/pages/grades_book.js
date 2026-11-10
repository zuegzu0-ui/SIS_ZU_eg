/* ===== سجل الدرجات الإجمالي: كل اختبارات المادة في جدول واحد مع المجموع ===== */
let bf={},bcourse='';
const bAs=()=>asm.filter(a=>(!bf.college||a.college===bf.college)&&(!bf.year||a.year===bf.year)&&(!bf.level||a.level===bf.level)&&(!bf.department||(bf.track?dsMatch(dsOf(a),bf.department,bf.track):dsHas(dsOf(a),bf.department))));

function bookView(){
 $('#gb').innerHTML=`<div class="note">اختر المرحلة ثم المادة لعرض درجات كل اختباراتها في جدول واحد مع المجموع، ثم حمّله Excel أو PDF.</div><div class="card"><div id="bc" class="grid5"></div><div class="bar" style="margin:12px 0 0"><select id="bcs" onchange="bcourse=this.value;bookLoad()"></select></div></div><div id="bt"></div>`;
 casc('bc',SF,bf,()=>{bcourse='';bookFill()},'الكل');bookFill()}
function bookFill(){
 const codes=[...new Set(bAs().map(a=>a.course_code))].sort();
 $('#bcs').innerHTML=`<option value="">اختر المادة...</option>`+codes.map(c=>`<option value="${esc(c)}" ${bcourse===c?'selected':''}>${esc(c)} - ${esc(nm(c))}</option>`).join('');bookLoad()}
async function bookLoad(){
 if(!bcourse){$('#bt').innerHTML='';return}
 const as=bAs().filter(a=>a.course_code===bcourse);let gr=[];
 try{gr=await gFetch(as.map(a=>a.id))}catch(e){return err(e)}
 const g={};gr.forEach(x=>(g[x.c]=g[x.c]||{})[x.a]=+x.s);
 const codes=new Set();as.forEach(a=>gScope(a).forEach(s=>codes.add(s.code)));
 const stus=gStu.filter(s=>codes.has(s.code)).sort((x,y)=>(x.name||'').localeCompare(y.name||'','ar')),totMax=as.reduce((t,a)=>t+ +a.max_score,0);
 const rows=stus.map(s=>{const r={code:s.code,name:s.name};let t=0,any=false;as.forEach(a=>{const v=(g[s.code]||{})[a.id];r['a'+a.id]=v??'';if(v!==undefined){t+=v;any=true}});r.total=any?+t.toFixed(2):'';return r});
 const cols=[['code','الكود'],['name','الاسم'],...as.map(a=>['a'+a.id,`${a.name} (${a.max_score})`]),['total',`المجموع (${totMax})`]];
 window.bookRows=rows;window.bookCols=cols;
 $('#bt').innerHTML=`<div class="bar"><b>${rows.length} طالب — ${as.length} اختبار</b><button class="btn ghost" onclick="exportModal(bookRows,bookCols,'gradebook','سجل الدرجات - '+nm(bcourse))">تحميل (Excel / PDF)</button></div><div class="tw"><table><thead><tr>${cols.map(c=>`<th>${esc(c[1])}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,300).map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c[0]])}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="9">لا توجد بيانات.</td></tr>'}</tbody></table></div>${rows.length>300?'<div class="note">يعرض أول 300 طالب، والتحميل يشمل الجميع.</div>':''}`}
