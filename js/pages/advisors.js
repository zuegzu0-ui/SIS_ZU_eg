/* ===== المرشدون الأكاديميون ===== */
let av={v:{},ratio:25,pick:new Set(),as:{}},fac=[],advs=[],stuAll=[];
async function pgAdv(){
 try{[stuAll,advs,fac]=await Promise.all([db.list('students'),db.list('advisors'),rpc('list_faculty',{p_token:T()})])}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>المرشدون الأكاديميون</h2><div class="card"><div id="ac" class="grid5"></div></div><div id="ab"></div>`;
 casc('ac',SF,av.v,advDraw);advDraw()}
const advList=()=>stuAll.filter(s=>SF.every(f=>!av.v[f]||s[f]===av.v[f]));
function advDraw(){av.as={};av.pick=new Set();const byS={};advs.forEach(a=>byS[a.student_code]=a.staff_id);
 advList().forEach(s=>{if(byS[s.code]){av.as[s.code]=byS[s.code];av.pick.add(byS[s.code])}});advBody()}
function advBody(){
 if(!av.v.college){$('#ab').innerHTML='<div class="note">اختر الكلية (ثم القسم والشعبة والفرقة والمستوى حسب الحاجة) لعرض الطلاب.</div>';return}
 const n=advList().length,sug=Math.max(1,Math.ceil(n/av.ratio)),cand=fac.filter(f=>!f.college||f.college===av.v.college);
 $('#ab').innerHTML=`<div class="card"><b>${n} طالب</b> — عدد الطلاب لكل مرشد <input type="number" min="1" value="${av.ratio}" style="width:80px" onchange="av.ratio=Math.max(1,+this.value||25);advBody()"> — عدد المرشدين المقترح: <b>${sug}</b> <button class="btn ghost" onclick="advSug(${sug})">اختر المقترح تلقائيًا</button></div>
 <div class="card"><b>أعضاء هيئة التدريس (${cand.length})</b><div class="chips">${cand.map(f=>`<label class="chip"><input type="checkbox" ${av.pick.has(f.id)?'checked':''} onchange="advPick(${f.id},this.checked)"> ${esc(f.name)}</label>`).join('')||'لا يوجد أعضاء هيئة تدريس لهذه الكلية. أضفهم من الحسابات والصلاحيات.'}</div>
 <div class="bar" style="margin:12px 0 0"><button class="btn gold" onclick="advAuto()">توزيع تلقائي بالتساوي</button><button class="btn" onclick="advSave()">حفظ التوزيع</button></div></div><div id="ad"></div>`;advTable()}
function advSug(k){const cand=fac.filter(f=>!f.college||f.college===av.v.college);av.pick=new Set(cand.slice(0,k).map(f=>f.id));advBody()}
function advPick(id,on){on?av.pick.add(id):av.pick.delete(id);advTable()}
function advAuto(){const ids=[...av.pick];if(!ids.length)return alert('اختر المرشدين أولًا.');av.as={};advList().sort((a,b)=>a.code.localeCompare(b.code)).forEach((s,i)=>av.as[s.code]=ids[i%ids.length]);advTable()}
function advSet(code,val){if(val)av.as[code]=+val;else delete av.as[code];advCounts()}
function advCounts(){const c={};Object.values(av.as).forEach(i=>c[i]=(c[i]||0)+1);const un=advList().filter(s=>!av.as[s.code]).length;
 $('#acn').innerHTML=Object.entries(c).map(([i,k])=>`<span class="chip">${esc((fac.find(f=>f.id==i)||{}).name)}: ${k} طالب</span>`).join('')+(un?`<span class="chip" style="background:#f4c7c3">بدون مرشد: ${un}</span>`:'')}
function advTable(){const list=advList(),ids=[...new Set([...av.pick,...Object.values(av.as)])],ops=a=>`<option value="">— بدون —</option>`+ids.map(i=>`<option value="${i}" ${a==i?'selected':''}>${esc((fac.find(f=>f.id==i)||{}).name)}</option>`).join('');
 $('#ad').innerHTML=`<div class="chips" id="acn" style="margin-bottom:10px"></div><div class="tw"><table><thead><tr><th>الكود</th><th>الطالب</th><th>الفرقة</th><th>المستوى</th><th>المرشد (يمكن التعديل يدويًا)</th></tr></thead><tbody>${list.slice(0,200).map(s=>`<tr><td>${esc(s.code)}</td><td>${esc(s.name)}</td><td>${esc(s.year)}</td><td>${esc(s.level)}</td><td><select onchange="advSet('${esc(s.code)}',this.value)">${ops(av.as[s.code])}</select></td></tr>`).join('')}</tbody></table></div>${list.length>200?'<div class="note">يعرض أول 200 طالب للتعديل اليدوي، والتوزيع يشمل الجميع.</div>':''}`;advCounts()}
async function advSave(){const list=advList(),rows=list.filter(s=>av.as[s.code]).map(s=>({staff_id:av.as[s.code],staff_name:(fac.find(f=>f.id===av.as[s.code])||{}).name,student_code:s.code,college:s.college,department:s.department,track:s.track,year:s.year,level:s.level})),clear=list.filter(s=>!av.as[s.code]).map(s=>s.code);
 try{for(let i=0;i<Math.max(1,Math.ceil(rows.length/1000));i++)await rpc('save_advisors',{p_token:T(),p_rows:rows.slice(i*1000,i*1000+1000),p_clear:i?[]:clear});advs=await db.list('advisors');alert('تم حفظ التوزيع لـ '+rows.length+' طالب')}catch(e){err(e)}}


addPage({k:'advisors',t:'المرشدون الأكاديميون',a:'w',o:50,f:pgAdv});
