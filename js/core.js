/* ===== الإعدادات ===== */
/* مفتاح anon آمن هنا: لا يملك صلاحية على الجداول، ويصل فقط إلى دوال البوابة gw */
const CFG={url:'https://yvpriubgmahlpeovfifo.supabase.co/rest/v1',key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cHJpdWJnbWFobHBlb3ZmaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4ODkwMTEsImV4cCI6MjEwOTQ2NTAxMX0.c2u1oAoODgBxIfYL5WFfGHVgNVtJ41oyfdXKdtNtTe4'};
CFG.jitsi='meet.jit.si';   /* نطاق خادم البث Jitsi (راجع LIVE_SETUP.md) */
CFG.whiteboard='';        /* اختياري: خادم سبورة Jitsi المدمجة */
const L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const S=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let user=L('user',null);if(user&&!user.token){user=null;localStorage.removeItem('user')}
let orgs=[],logos={u:'',c:''},cur='org';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const err=e=>alert('تعذر تنفيذ العملية: '+(e&&e.message||e));
const rpc=async(fn,args)=>{
 const r=await fetch(`${CFG.url}/rpc/${fn}`,{method:'POST',headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key,'Content-Type':'application/json','Content-Profile':'gw','Accept-Profile':'gw'},body:JSON.stringify(args)});
 const j=await r.json().catch(()=>null);
 if(r.status===406)throw Error('المخطط gw غير مفعّل في Supabase. شغّل gw.sql (آخره أمر الإتاحة)');
 if(!r.ok){const m=(j&&j.message)||'تعذر الاتصال بالخادم';
  if(/unauthorized/.test(m)&&user){localStorage.removeItem('user');user=null;login('انتهت الجلسة، سجّل الدخول مرة أخرى')}
  throw Error(m==='forbidden'?'ليست لديك صلاحية لهذه العملية':m)}
 return j};
const T=()=>user&&user.token;
const db={
 list:t=>rpc('list_rows',{p_token:T(),p_table:t}),
 save:(t,row,pk,old)=>rpc('save_row',{p_token:T(),p_table:t,p_row:row,p_pk:pk,p_old:old==null?null:String(old)}),
 del:(t,pk,v)=>rpc('remove_row',{p_token:T(),p_table:t,p_pk:pk,p_val:String(v)}),
 bulk:async(fn,rows)=>{let n=0;for(let i=0;i<rows.length;i+=1000){n+=(await rpc(fn,{p_token:T(),p_rows:rows.slice(i,i+1000)})).count}return n}
};
const ROLE={admin:'مدير',employee:'موظف',doctor:'عضو هيئة تدريس',assistant:'معيد',student:'طالب'};
const W=()=>user&&['admin','employee'].includes(user.role);
const YR=['الأولى','الثانية','الثالثة','الرابعة'];
const LBL={college:'كلية',department:'قسم',track:'شعبة',year:'فرقة',level:'مستوى'};
const LB={college:'الكلية',department:'القسم',track:'الشعبة',year:'الفرقة',level:'المستوى'};
const SF=['college','department','track','year','level'];

/* ===== أدوات مشتركة ===== */
const img=s=>s?`<img src="${s}" alt="">`:'';
function hdr(){return `<div class="lg">${img(logos.u)}</div><div class="tt"><h1>كلية التربية النوعية - جامعة الزقازيق</h1><small>نظام إدارة الطلاب</small>${user?`<div class="us">${esc(user.name)} (${ROLE[user.role]||''})<button onclick="pwModal()">تغيير كلمة المرور</button><button onclick="logout()">خروج</button></div>`:''}</div><div class="lg">${img(logos.c)}</div>`}
function shell(b){$('#app').innerHTML=`<header id="hd">${hdr()}</header>${b}<footer id="ft">${ftr()}</footer>`}
function modal(html){const d=document.createElement('div');d.className='modal';d.innerHTML=`<div class="box">${html}</div>`;d.onclick=e=>{if(e.target===d)d.remove()};document.body.appendChild(d);return d}
function ask(title,val,cb){const d=modal(`<h2>${title}</h2><input id="ai" style="width:100%" value="${esc(val||'')}"><div class="bar" style="margin:12px 0 0"><button class="btn gold" id="ok">حفظ</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 const i=d.querySelector('#ai');i.focus();const sv=()=>{const v=i.value.trim();if(!v)return;d.remove();cb(v)};d.querySelector('#ok').onclick=sv;i.onkeydown=e=>{if(e.key==='Enter')sv()}}
const NZ=s=>String(s).replace(/\s/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
async function readX(file,map){const wb=XLSX.read(await file.arrayBuffer());const js=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
 return js.map(o=>{const r={};for(const k in o){const f=map[NZ(k)],x=String(o[k]).trim();if(f&&x!=='')r[f]=x}return r})}
function tplX(name,heads){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([heads]),'Sheet1');XLSX.writeFile(wb,name)}
const fdate=x=>x?new Date(x).toLocaleDateString('ar-EG'):'';

/* قوائم منسدلة متسلسلة مبنية على الهيكل */
function opts(f,v){
 if(f==='college')return orgs.filter(o=>o.kind==='college').map(o=>o.name);
 const c=orgs.find(o=>o.kind==='college'&&o.name===v.college);if(!c)return[];
 const ch=(k,p)=>orgs.filter(o=>o.kind===k&&o.parent_id===p.id).map(o=>o.name);
 if(f==='department'||f==='year')return ch(f,c);
 if(f==='track'){const d=orgs.find(o=>o.kind==='department'&&o.parent_id===c.id&&o.name===v.department);return d?ch('track',d):[]}
 if(f==='level'){const y=orgs.find(o=>o.kind==='year'&&o.parent_id===c.id&&o.name===v.year);return y?ch('level',y):[]}
 return[]}
function casc(id,fields,v,cb,any){
 const el=$('#'+id);
 el.innerHTML=fields.map(f=>`<label>${LB[f]}<select data-f="${f}"><option value="">${any||'اختر...'}</option>${opts(f,v).map(o=>`<option ${v[f]===o?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`).join('');
 el.querySelectorAll('select').forEach(s=>s.onchange=()=>{const f=s.dataset.f;v[f]=s.value||undefined;
  ({college:['department','track','year','level'],department:['track'],year:['level']}[f]||[]).forEach(d=>delete v[d]);
  casc(id,fields,v,cb,any);cb&&cb(v)})}

/* نموذج عام: fields=[[key,label,type,options,attrs]] */
function form(title,fields,vals,opt,onSave){
 const v={...vals};
 const d=modal(`<h2>${title}</h2><div class="grid">${fields.map(f=>`<label>${f[1]}${f[2]==='sel'?`<select name="${f[0]}"><option value=""></option>${f[3].map(o=>{o=Array.isArray(o)?o:[o,o];return `<option value="${esc(o[0])}" ${v[f[0]]==o[0]?'selected':''}>${esc(o[1])}</option>`}).join('')}</select>`:`<input name="${f[0]}" type="${f[2]||'text'}" value="${f[2]==='password'?'':esc(v[f[0]])}" ${f[4]||''}>`}</label>`).join('')}</div>${opt.c?'<div id="cc" class="grid" style="margin-top:10px"></div>':''}${opt.sp?'<div id="sp" style="margin-top:10px"></div>':''}${opt.note?`<div class="note" style="margin-top:10px">${opt.note}</div>`:''}<div class="bar" style="margin:14px 0 0"><button class="btn gold" id="sv">حفظ</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إلغاء</button></div>`);
 if(opt.c)casc('cc',opt.c,v,null);
 if(opt.sp){v.depts=dsOf(v);scopePicker('sp',v,opt.sp)}
 d.querySelector('#sv').onclick=async()=>{const row={};
  d.querySelectorAll('[name]').forEach(i=>{const x=i.value.trim();row[i.name]=x===''?null:(i.type==='number'?+x:x)});
  (opt.c||[]).forEach(f=>row[f]=v[f]||null);
  if(opt.sp){row.college=v.college||null;row.dscope=v.depts||{};row.department=Object.keys(row.dscope)[0]||null;row.track=null;if(opt.sp.year)row.year=v.year||null;if(opt.sp.level)row.level=v.level||null}
  if(opt.isNew)Object.keys(row).forEach(k=>row[k]===null&&delete row[k]);
  try{await onSave(row,d)}catch(e){err(e)}};
 return d}

/* تحميل البيانات المفلترة Excel/PDF مع اختيار الحقول */
function exportModal(rows,cols,fname,title){
 const d=modal(`<h2>تحميل البيانات (${rows.length} سجل)</h2><p>اختر الحقول المراد ظهورها:</p><div class="grid">${cols.map((c,i)=>`<label style="flex-direction:row;gap:6px;font-weight:400"><input type="checkbox" checked value="${i}">${c[1]}</label>`).join('')}</div><div class="bar" style="margin:14px 0 0"><button class="btn gold" id="ex">Excel</button><button class="btn" id="px">PDF</button><button class="btn ghost" onclick="this.closest('.modal').remove()">إغلاق</button></div>`);
 const pick=()=>[...d.querySelectorAll('input:checked')].map(i=>cols[+i.value]);
 d.querySelector('#ex').onclick=()=>{const p=pick();if(!p.length)return;
  const ws=XLSX.utils.json_to_sheet(rows.map(r=>Object.fromEntries(p.map(c=>[c[1],r[c[0]]??''])))),wb=XLSX.utils.book_new();
  wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'Data');XLSX.writeFile(wb,fname+'.xlsx')};
 d.querySelector('#px').onclick=()=>{const p=pick();if(!p.length)return;const w=window.open('','_blank');if(!w)return alert('اسمح بالنوافذ المنبثقة ثم أعد المحاولة');
  w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Tahoma,Arial;padding:16px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #888;padding:5px;text-align:right}th{background:#0b1f4b;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}h3{color:#0b1f4b;text-align:center}.h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}img{height:64px}</style></head><body><div class="h">${logos.u?`<img src="${logos.u}">`:'<span></span>'}<h3>كلية التربية النوعية - جامعة الزقازيق<br>${esc(title)}</h3>${logos.c?`<img src="${logos.c}">`:'<span></span>'}</div><table><tr>${p.map(c=>`<th>${c[1]}</th>`).join('')}</tr>${rows.map(r=>`<tr>${p.map(c=>`<td>${esc(r[c[0]])}</td>`).join('')}</tr>`).join('')}</table></body></html>`);
  w.document.close();setTimeout(()=>w.print(),500)}}


/* ===== أدوات الوقت والأيام (مشتركة) ===== */
const DAYS=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
const hm=t=>t?String(t).slice(0,5):'';
const toMin=t=>{if(!t)return null;const[a,b]=String(t).split(':');return +a*60+ +b};
const fromMin=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');

/* ===== نطاق الأقسام والشعب المتعدد (قسم أو أكثر، وشعبة أو أكثر داخل كل قسم) =====
   الشكل المخزَّن: dscope = {"اسم القسم":["شعبة1","شعبة2"], ...} والقائمة الفارغة = كل شعب القسم، والكائن الفارغ = كل الأقسام */
const dsOf=r=>r&&r.dscope&&Object.keys(r.dscope).length?r.dscope:(r&&r.department?{[r.department]:r.track?[r.track]:[]}:{});
const dsMatch=(ds,dept,track)=>{if(!Object.keys(ds||{}).length)return true;if(!(dept in ds))return false;const t=ds[dept]||[];return !t.length||t.includes(track)};
const dsHas=(ds,dept)=>!Object.keys(ds||{}).length||dept in ds;
const dsText=ds=>Object.keys(ds||{}).length?Object.entries(ds).map(([d,t])=>d+(t.length?' ('+t.join('، ')+')':'')).join(' ، '):'كل الأقسام';
const dsOverlap=(a,b)=>{const ka=Object.keys(a||{}),kb=Object.keys(b||{});if(!ka.length||!kb.length)return true;return ka.some(d=>d in b&&(!(a[d]||[]).length||!(b[d]||[]).length||a[d].some(t=>b[d].includes(t))))};
const stScope=(s,v)=>(!v.college||s.college===v.college)&&dsMatch(v.depts||{},s.department,s.track)&&(!v.year||s.year===v.year)&&(!v.level||s.level===v.level);
/* st={college,depts,year,level}. opt={year:true,level:true,cb:fn} */
function scopePicker(id,st,opt={}){
 st.depts=st.depts||{};
 const el=$('#'+id),c=orgs.find(o=>o.kind==='college'&&o.name===st.college),kids=(k,p)=>p?orgs.filter(o=>o.kind===k&&o.parent_id===p.id):[];
 const deps=kids('department',c),y=kids('year',c).find(o=>o.name===st.year);
 const sel=(f,l,list)=>`<label>${l}<select data-f="${f}"><option value="">${f==='college'?'اختر...':'الكل'}</option>${list.map(o=>`<option ${st[f]===o?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
 el.innerHTML=`<div class="grid5">${sel('college','الكلية',orgs.filter(o=>o.kind==='college').map(o=>o.name))}${opt.year?sel('year','الفرقة',kids('year',c).map(o=>o.name)):''}${opt.level?sel('level','المستوى',kids('level',y).map(o=>o.name)):''}</div>
 <div class="card" style="margin:10px 0 0"><b>الأقسام والشعب</b> <small>(اختر قسمًا أو أكثر، وداخل كل قسم شعبة أو أكثر. بدون اختيار = الكل)</small>${deps.map(dp=>{const on=dp.name in st.depts,tr=kids('track',dp);return `<div class="node"><label class="chip"><input type="checkbox" data-d="${esc(dp.name)}" ${on?'checked':''}> ${esc(dp.name)}</label>${on&&tr.length?`<div class="chips">${tr.map(t=>`<label class="chip"><input type="checkbox" data-d="${esc(dp.name)}" data-t="${esc(t.name)}" ${st.depts[dp.name].includes(t.name)?'checked':''}> ${esc(t.name)}</label>`).join('')}</div>`:''}</div>`}).join('')||'<div>اختر الكلية أولًا.</div>'}</div>`;
 el.querySelectorAll('select').forEach(s=>s.onchange=()=>{const f=s.dataset.f;st[f]=s.value||undefined;if(f==='college'){st.depts={};delete st.year;delete st.level}if(f==='year')delete st.level;scopePicker(id,st,opt);opt.cb&&opt.cb(st)});
 el.querySelectorAll('input[data-d]').forEach(i=>i.onchange=()=>{const d=i.dataset.d,t=i.dataset.t;
  if(t===undefined){i.checked?(st.depts[d]=st.depts[d]||[]):delete st.depts[d]}else{const a=st.depts[d];i.checked?a.includes(t)||a.push(t):st.depts[d]=a.filter(x=>x!==t)}
  scopePicker(id,st,opt);opt.cb&&opt.cb(st)})}

/* ===== الفوتر: وسائل التواصل + اسم المبرمج (روابطهما تُضاف من الإعدادات) ===== */
let links={soc:[],dev:[]};
const safeUrl=u=>/^https?:\/\//i.test(String(u||''))?u:'';
const lnk=l=>`<a class="fl" href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">${esc(l.n)}</a>`;
function ftr(){const soc=links.soc.filter(l=>safeUrl(l.u)).map(lnk).join('');
 return `<div class="fs">${soc||'<span class="fm">وسائل التواصل</span>'}</div><div class="fc">© كلية التربية النوعية - جامعة الزقازيق</div><div class="fd">تطوير: <button onclick="devModal()">MHD</button></div>`}
function devModal(){const l=links.dev.filter(x=>safeUrl(x.u));
 modal(`<h2>MHD</h2><p>مطوّر النظام</p><div class="chips">${l.map(lnk).join('')||'<span>لم تُضف روابط التواصل بعد (تُضاف من صفحة الإعدادات).</span>'}</div><div class="bar" style="margin:14px 0 0"><button class="btn ghost" onclick="this.closest('.modal').remove()">إغلاق</button></div>`)}
