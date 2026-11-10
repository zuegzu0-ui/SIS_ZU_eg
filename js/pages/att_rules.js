/* ===== الغياب: قواعد الحضور لكل مادة + فترة التيرم ===== */
let arSel='',arRule={};
const arDef=()=>({grade_mode:'none',session_score:0,grade_max:0,bands:[],warn_pct:75,count_mode:'either',add_to_grades:false});
async function aRuleView(){
 const codes=[...new Set(aMine().map(i=>i.course_code))];
 if(!codes.includes(arSel))arSel=codes[0]||'';
 const termCard=exAll()?`<div class="card"><b>فترة التيرم</b> <small>(تُستخدم لحساب الأيام المتوقعة من الجدول)</small><div class="bar" style="margin:8px 0 0"><label>بداية التيرم <input id="ts" type="date" value="${esc(aTerm.start||'')}"></label><label>نهاية التيرم <input id="te" type="date" value="${esc(aTerm.end||'')}"></label><button class="btn gold" onclick="arTerm()">حفظ الفترة</button></div></div>`:`<div class="note">فترة التيرم: ${esc(aTerm.start||'غير محددة')} إلى ${esc(aTerm.end||'غير محددة')} (تحددها الإدارة).</div>`;
 if(!arSel){$('#ab').innerHTML=termCard+'<div class="note">لا توجد مواد مسكّنة لك في جدول معتمد.</div>';return}
 try{arRule={...arDef(),...((await rpc('att_rule_get',{p_token:T(),p_course:arSel}))||{})}}catch(e){return err(e)}
 if(!Array.isArray(arRule.bands))arRule.bands=[];
 $('#ab').innerHTML=termCard+`<div class="card"><label>المادة <select onchange="arSel=this.value;aRuleView()">${codes.map(c=>`<option value="${esc(c)}" ${c===arSel?'selected':''}>${esc(c)} - ${esc(nm(c))}</option>`).join('')}</select></label><div id="rb" style="margin-top:12px"></div></div>`;arDraw()}
function arDraw(){const r=arRule,so=(v,l)=>l.map(([k,t])=>`<option value="${k}" ${String(v)===k?'selected':''}>${t}</option>`).join('');
 $('#rb').innerHTML=`<div class="grid">
 <label>درجة الحضور<select onchange="arRule.grade_mode=this.value;arDraw()">${so(r.grade_mode,[['none','لا تُحتسب درجة'],['per_day','درجة ثابتة لكل يوم حضور'],['bands','حسب شرائح نسبة الحضور']])}</select></label>
 <label>تُضاف درجة الحضور لدرجات المادة؟<select onchange="arRule.add_to_grades=this.value==='true'">${so(r.add_to_grades,[['false','لا'],['true','نعم']])}</select></label>
 ${r.grade_mode!=='none'?`<label>إجمالي درجة الحضور<input type="number" min="0" step="any" value="${r.grade_max}" onchange="arRule.grade_max=+this.value"></label>`:''}
 ${r.grade_mode==='per_day'?`<label>درجة اليوم لكل حضور<input type="number" min="0" step="any" value="${r.session_score}" onchange="arRule.session_score=+this.value"></label>`:''}
 <label>حد الإنذار: نسبة حضور أقل من (%)<input type="number" min="0" max="100" value="${r.warn_pct}" onchange="arRule.warn_pct=+this.value"></label>
 <label>إذا أُخذ غياب المحاضرة والسكشن العملي في اليوم نفسه<select onchange="arRule.count_mode=this.value">${so(r.count_mode,[['either','يُحتسب حضور واحد منهما'],['both','يُحتسب حضور الاثنين']])}</select></label></div>
 ${r.grade_mode==='bands'?`<div class="card" style="margin-top:12px"><b>الشرائح</b> <small>(من نسبة % إلى نسبة % = درجة من إجمالي درجة الحضور)</small>${r.bands.map((b,i)=>`<div class="bar" style="margin:8px 0 0"><label>من % <input type="number" min="0" max="100" style="width:80px" value="${b.from}" onchange="arRule.bands[${i}].from=+this.value"></label><label>إلى % <input type="number" min="0" max="100" style="width:80px" value="${b.to}" onchange="arRule.bands[${i}].to=+this.value"></label><label>الدرجة <input type="number" min="0" step="any" style="width:80px" value="${b.score}" onchange="arRule.bands[${i}].score=+this.value"></label><button class="mini red" onclick="arRule.bands.splice(${i},1);arDraw()">حذف</button></div>`).join('')}<p><button class="btn ghost" onclick="arRule.bands.push({from:0,to:100,score:0});arDraw()">+ شريحة</button></p></div>`:''}
 <p><button class="btn gold" onclick="arSave()">حفظ القواعد</button></p>`}
async function arSave(){const r=arRule;
 if(r.grade_mode==='bands'&&r.bands.some(b=>!(b.from>=0&&b.to>b.from&&b.to<=100)))return alert('كل شريحة تحتاج نسبة بداية أقل من نسبة النهاية (من 0 إلى 100).');
 try{await rpc('att_rule_save',{p_token:T(),p_course:arSel,p_row:{grade_mode:r.grade_mode,session_score:+r.session_score||0,grade_max:+r.grade_max||0,bands:r.bands,warn_pct:+r.warn_pct||0,count_mode:r.count_mode,add_to_grades:!!r.add_to_grades}});alert('تم حفظ القواعد')}catch(e){err(e)}}
async function arTerm(){const s=$('#ts').value,e=$('#te').value;if(s&&e&&s>e)return alert('نهاية التيرم يجب أن تكون بعد بدايته.');
 try{await rpc('set_term',{p_token:T(),p_start:s||'',p_end:e||''});aTerm={start:s||null,end:e||null};alert('تم حفظ فترة التيرم')}catch(er){err(er)}}
