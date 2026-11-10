/* ===== بطاقة تسجيل المواد: المواد المتاحة للطالب فقط (حسب لائحته ومتطلباته) بحدود الساعات ===== */
let rg={d:null,sel:new Set()};
async function sReg(){
 try{rg.d=await rpc('my_reg',{p_token:T()})}catch(e){return err(e)}
 const d=rg.d;rg.sel=new Set([...d.enrolled,...d.courses.filter(c=>c.mandatory).map(c=>c.course)]);
 if(!d.term){$('#main').innerHTML='<h2>تسجيل المواد</h2><div class="card">لا يوجد تيرم مفتوح حاليًا.</div>';return}
 const sum=d.term.kind==='summer';rg.max=sum?(+d.term.summer_max||9):(+(d.limits||{}).max||20);rg.min=sum?0:(+(d.limits||{}).min||12);rg.all=d.courses.reduce((a,c)=>a+c.hours,0);
 $('#main').innerHTML=`<h2>تسجيل المواد</h2><div class="note">${esc(d.term.name)}${sum?' (صيفي)':''} — الحد الأدنى للساعات ${rg.min} والأقصى ${rg.max}. المواد الإجبارية تُسجَّل تلقائيًا ولا يمكن إزالتها، والاختيارية تختار منها ما تشاء ضمن الحد الأقصى. تظهر لك المواد المتاحة فقط؛ المحجوبة بمتطلبات سابقة لا تظهر حتى تجتاز متطلباتها. ${d.term.reg_open?'':'<b style="color:#a32">التسجيل مغلق حاليًا.</b>'}</div><div class="tw"><table><thead><tr><th></th><th>المادة</th><th>الفرقة</th><th>المستوى</th><th>الساعات</th><th>النوع</th></tr></thead><tbody>${d.courses.map(c=>`<tr><td><input type="checkbox" ${rg.sel.has(c.course)?'checked':''} ${d.term.reg_open&&!c.mandatory?'':'disabled'} onchange="rgTog('${esc(c.course)}',this.checked)"></td><td>${esc(c.course)} - ${esc(c.name)}</td><td>${esc(c.year)}</td><td>${esc(c.level)}</td><td>${c.hours}</td><td>${c.mandatory?'<b>إجباري</b>':'اختياري'}${c.retake?' (إعادة)':''}</td></tr>`).join('')||'<tr><td colspan="6">لا توجد مواد متاحة لك.</td></tr>'}</tbody></table></div><div class="bar" style="margin-top:12px"><b id="rgt"></b>${d.term.reg_open?'<button class="btn gold" onclick="rgSave()">حفظ التسجيل</button>':''}</div>`;rgCnt()}
const rgMand=()=>rg.d.courses.filter(c=>c.mandatory).reduce((a,c)=>a+c.hours,0);
function rgHours(){return rg.d.courses.filter(c=>rg.sel.has(c.course)).reduce((a,c)=>a+c.hours,0)}
function rgTog(c,on){on?rg.sel.add(c):rg.sel.delete(c);rgCnt()}
function rgCnt(){const t=rgHours(),bad=(t>rg.max&&t>rgMand())||(t<rg.min&&t<rg.all);$('#rgt').innerHTML=`مجموع الساعات: <span style="color:${bad?'#a32':'inherit'}">${t}</span> من ${rg.min} إلى ${rg.max}${rg.all<rg.min?' (المتاح لك أقل من الحد الأدنى)':''}`}
async function rgSave(){const t=rgHours();
 if(t>rg.max&&t>rgMand())return alert('مجموع الساعات يتجاوز الحد الأقصى ('+rg.max+').');
 if(t<rg.min&&t<rg.all)return alert('مجموع الساعات أقل من الحد الأدنى ('+rg.min+').');
 try{await rpc('my_register',{p_token:T(),p_codes:[...rg.sel]});alert('تم حفظ تسجيلك ('+t+' ساعة)')}catch(e){err(e)}}
addPage({k:'s_reg',t:'تسجيل المواد',a:'s',o:1.2,f:sReg});
