/* ===== البث المباشر: جهة الطالب (الدخول بكود المحاضر) ===== */
let slApi=null,slTimer=null,slPoll=null,slS=null,slDead=0,slSkew=0;
function slCleanup(){clearInterval(slTimer);clearInterval(slPoll);if(slApi){try{slApi.dispose()}catch{}slApi=null}}
function pgSLive(){
 slCleanup();const pre=new URLSearchParams(location.search).get('live')||'';
 $('#main').innerHTML=`<h2>البث المباشر</h2><div class="note">أدخل كود البث الذي أعطاك إياه المحاضر. الدخول لطلاب المادة المسجّلين فقط. تدخل بالميكروفون والكاميرا مغلقين، ويمكنك المشاركة بالدردشة ورفع اليد.</div><div class="card"><div class="bar" style="margin:0"><input id="jc" placeholder="كود البث" value="${esc(pre)}" maxlength="8" style="text-transform:uppercase;letter-spacing:4px;font-size:20px;width:210px" onkeydown="if(event.key==='Enter')slJoin()"><button class="btn gold" onclick="slJoin()">دخول البث</button></div></div>`}
async function slJoin(){
 const code=$('#jc').value.trim();if(!code)return;
 let r;try{r=await rpc('join_live',{p_token:T(),p_code:code})}catch(e){return err(e)}
 slS=r;slDead=new Date(r.ends_at).getTime();slSkew=new Date(r.now).getTime()-Date.now();
 $('#main').innerHTML=`<div class="bar"><button class="btn ghost" onclick="slLeave()">← خروج من البث</button><b>${esc(r.title)}</b> <small>المحاضر: ${esc(r.host)}</small><span class="timer" id="slt">--:--</span></div><div id="slm" style="height:75vh;background:#000;border-radius:8px"></div>`;
 try{await jitsiLoad()}catch(e){return err(e)}
 slApi=new JitsiMeetExternalAPI(CFG.jitsi,{roomName:r.room,parentNode:$('#slm'),width:'100%',height:'100%',userInfo:{displayName:r.name+' ('+r.code+')'},
  configOverwrite:{prejoinConfig:{enabled:false},startWithAudioMuted:true,startWithVideoMuted:true,disableInviteFunctions:true,subject:r.title,toolbarButtons:['microphone','camera','chat','raisehand','participants-pane','tileview','fullscreen','settings','hangup']}});
 slApi.addListener('readyToClose',()=>slLeave());
 const tick=()=>{const rem=(slDead-(Date.now()+slSkew))/1000,t=$('#slt');if(t)t.textContent=lvFmt(rem);if(rem<=0){alert('انتهى البث.');slLeave()}};
 slTimer=setInterval(tick,1000);tick();
 slPoll=setInterval(async()=>{try{const s=await rpc('live_status',{p_token:T(),p_id:r.id});slDead=new Date(s.ends_at).getTime();slSkew=new Date(s.now).getTime()-Date.now();if(s.ended){alert('أنهى المحاضر البث.');slLeave()}}catch{}},20000)}
function slLeave(){slCleanup();pgSLive()}
addPage({k:'s_live',t:'البث المباشر',a:'s',o:3.5,f:pgSLive});
