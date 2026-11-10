/* ===== بداية / إغلاق التيرم: الصفحة الرئيسية (سجل التيرمات + حالة الطالب) =====
   الملفات المرتبطة: term_open.js (بدء التيرم والتسجيل التلقائي) · term_close.js (احتساب النتائج والإغلاق) · term_calc.js (المنطق) · s_plan.js (الطالب) */
let tmList=[],tmOpen=null;
async function pgTerm(){
 try{tmList=await db.list('terms');crs=await db.list('courses')}catch(e){return err(e)}
 tmOpen=tmList.find(t=>t.status==='open');const w=W();
 $('#main').innerHTML=`<h2>بداية وإغلاق التيرم</h2><div class="card">${tmOpen?`<b>التيرم المفتوح: ${esc(tmOpen.name)}</b> (${tmOpen.kind==='summer'?'صيفي':'فصل دراسي'}) — من ${esc(tmOpen.start_date)} إلى ${esc(tmOpen.end_date)}<br>تسجيل المواد للطلاب: <b>${tmOpen.reg_open?'مفتوح':'مغلق'}</b>${w?`<div class="bar" style="margin:10px 0 0"><button class="btn ghost" onclick="tmReg(${!tmOpen.reg_open})">${tmOpen.reg_open?'إغلاق التسجيل':'فتح التسجيل'}</button><button class="btn red" onclick="tcStart()">إغلاق التيرم واحتساب النتائج</button></div>`:''}`:`لا يوجد تيرم مفتوح. ${w?'<button class="btn gold" onclick="toOpen()">بدء تيرم جديد</button>':''}`}</div>
 <h3>سجل التيرمات</h3><div class="tw"><table><thead><tr><th>التيرم</th><th>النوع</th><th>من</th><th>إلى</th><th>الحالة</th><th>الصيفي متاح</th></tr></thead><tbody>${tmList.slice().reverse().map(t=>`<tr><td>${esc(t.name)}</td><td>${t.kind==='summer'?'صيفي':'فصل دراسي'}</td><td>${esc(t.start_date)}</td><td>${esc(t.end_date)}</td><td>${t.status==='open'?'<span class="chip">مفتوح</span>':'مغلق'}</td><td>${t.kind==='regular'&&t.status==='closed'?(t.summer_open?'نعم':'لا'):''}</td></tr>`).join('')||'<tr><td colspan="6">لا توجد تيرمات.</td></tr>'}</tbody></table></div>
 <h3 style="margin-top:20px">حالة طالب (النتائج والمواد المحجوبة والمتاحة)</h3><div class="bar"><input id="tq" placeholder="كود الطالب" onkeydown="if(event.key==='Enter')tmPlan()"><button class="btn ghost" onclick="tmPlan()">عرض</button></div><div id="tp"></div>`}
async function tmReg(o){try{await rpc('set_registration',{p_token:T(),p_term:tmOpen.id,p_open:o});pgTerm()}catch(e){err(e)}}
async function tmPlan(){const c=$('#tq').value.trim();if(!c)return;
 try{$('#tp').innerHTML=planHtml(await rpc('student_plan',{p_token:T(),p_code:c}))}catch(e){err(e)}}
addPage({k:'term',t:'بداية/إغلاق التيرم',a:'r',o:100,f:pgTerm});
