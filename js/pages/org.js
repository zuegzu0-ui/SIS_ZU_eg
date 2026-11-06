/* ===== الهيكل التنظيمي ===== */
let selCol=null;
async function reloadOrg(){orgs=await db.list('org');pgOrg()}
function oAdd(k,p){ask('إضافة '+LBL[k],'',async n=>{try{const r=await db.save('org',{kind:k,name:n,parent_id:p},'id',null);if(k==='college')selCol=r.row.id;await reloadOrg()}catch(e){err(e)}})}
function oRen(id){const o=orgs.find(x=>x.id===id);ask('تعديل الاسم',o.name,async n=>{try{await db.save('org',{name:n},'id',id);await reloadOrg()}catch(e){err(e)}})}
async function oDel(id){if(!confirm('سيتم حذف هذا العنصر وكل ما تحته. متابعة؟'))return;try{await db.del('org','id',id);await reloadOrg()}catch(e){err(e)}}
async function oDefaults(c){if(!confirm('سيتم إنشاء الفرق (الأولى إلى الرابعة) ومستويان لكل فرقة. متابعة؟'))return;
 try{for(let i=0;i<4;i++){const y=(await db.save('org',{kind:'year',name:YR[i],parent_id:c},'id',null)).row;for(let j=1;j<=2;j++)await db.save('org',{kind:'level',name:'المستوى '+(2*i+j),parent_id:y.id},'id',null)}}catch(e){err(e)}await reloadOrg()}
function pgOrg(){
 const cols=orgs.filter(o=>o.kind==='college'),w=W();
 if(!cols.find(c=>c.id===selCol))selCol=cols[0]&&cols[0].id;
 const c=cols.find(x=>x.id===selCol),kid=(k,p)=>orgs.filter(o=>o.kind===k&&o.parent_id===p);
 const act=o=>w?`<button class="mini" onclick="oRen(${o.id})">تعديل</button><button class="mini red" onclick="oDel(${o.id})">حذف</button>`:'';
 const chip=t=>`<span class="chip">${esc(t.name)}${w?`<button class="x" title="تعديل" onclick="oRen(${t.id})">✎</button><button class="x" title="حذف" onclick="oDel(${t.id})">×</button>`:''}</span>`;
 let h=`<h2>الهيكل التنظيمي</h2><div class="note">ابدأ بإضافة الكلية، ثم اختر الكلية لإضافة أقسامها (وشعبة أو أكثر لكل قسم) وفرقها ومستوياتها. هذه القوائم هي التي تظهر في بقية النظام.</div><div class="bar">`+cols.map(x=>`<button class="btn ${x.id===selCol?'gold':'ghost'}" onclick="selCol=${x.id};pgOrg()">${esc(x.name)}</button>`).join('')+(w?`<button class="btn" onclick="oAdd('college',null)">+ كلية جديدة</button>`:'')+`</div>`;
 if(!c){$('#main').innerHTML=h+'<div class="card">لا توجد كليات بعد.</div>';return}
 h+=`<div class="card"><b>الكلية: ${esc(c.name)}</b> ${act(c)}</div><div class="two"><div class="card"><b>الأقسام والشعب</b>`
  +kid('department',c.id).map(d=>`<div class="node"><div>${esc(d.name)} ${act(d)}</div><div class="chips">${kid('track',d.id).map(chip).join('')}${w?`<button class="mini" onclick="oAdd('track',${d.id})">+ شعبة</button>`:''}</div></div>`).join('')
  +(w?`<button class="btn ghost" onclick="oAdd('department',${c.id})">+ قسم</button>`:'')
  +`</div><div class="card"><b>الفرق والمستويات</b>`
  +kid('year',c.id).map(y=>`<div class="node"><div>${esc(y.name)} ${act(y)}</div><div class="chips">${kid('level',y.id).map(chip).join('')}${w?`<button class="mini" onclick="oAdd('level',${y.id})">+ مستوى</button>`:''}</div></div>`).join('')
  +(w?`<button class="btn ghost" onclick="oAdd('year',${c.id})">+ فرقة</button> <button class="btn ghost" onclick="oDefaults(${c.id})">إنشاء 4 فرق و8 مستويات تلقائيًا</button>`:'')+`</div></div>`;
 $('#main').innerHTML=h}


addPage({k:'org',t:'الهيكل التنظيمي',a:'w',o:10,f:pgOrg});
