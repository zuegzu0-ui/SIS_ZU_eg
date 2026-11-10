/* ===== سجل الطالب: جهة الطالب (النتائج والتقديرات والمعدل التراكمي والمواد المحجوبة والمتاحة) ===== */
async function sPlan(){
 try{$('#main').innerHTML='<h2>سجل الطالب</h2>'+planHtml(await rpc('my_plan',{p_token:T()}))}catch(e){err(e)}}
addPage({k:'s_plan',t:'سجل الطالب',a:'s',o:6,f:sPlan});
