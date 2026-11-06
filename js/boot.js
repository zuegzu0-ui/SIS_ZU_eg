/* ===== البدء ===== */
(async()=>{try{const g=await rpc('get_logos',{});logos={u:(g&&g.logo_u)||'',c:(g&&g.logo_c)||''}}catch{}
 user&&user.token?home():login()})();
