/* ===== البدء ===== */
(async()=>{
 const p=v=>{try{return JSON.parse(v)||[]}catch{return[]}};
 try{const g=await rpc('get_public_settings',{});logos={u:g.logo_u||'',c:g.logo_c||''};links={soc:p(g.social_links),dev:p(g.dev_links)}}
 catch{try{const g=await rpc('get_logos',{});logos={u:(g&&g.logo_u)||'',c:(g&&g.logo_c)||''}}catch{}}
 user&&user.token?home():login()})();
