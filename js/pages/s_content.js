/* ===== المحتوى: جهة الطالب (يرى مجلدات مرحلته فقط) ===== */
async function sContent(){
 let l=[];try{l=await rpc('my_content',{p_token:T()})}catch(e){return err(e)}
 $('#main').innerHTML=`<h2>المحتوى</h2>${l.map(f=>`<div class="card"><div class="bar" style="margin:0 0 6px"><b>📁 ${esc(f.name)}</b><span class="chip">${esc(f.course_code)}</span><small>${esc(f.created_by_name)}</small></div>${f.links.map(k=>`<div class="node"><a href="${esc(safeUrl(k.url))}" target="_blank" rel="noopener noreferrer">${esc(k.title)}</a></div>`).join('')||'<small>لا توجد روابط بعد.</small>'}</div>`).join('')||'<div class="card">لا يوجد محتوى لمرحلتك حتى الآن.</div>'}`}
addPage({k:'s_content',t:'المحتوى',a:'s',o:4,f:sContent});
