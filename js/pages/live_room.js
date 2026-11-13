/* ===== غرفة البث (المحاضر): بث الفيديو والصوت ومشاركة الشاشة عبر Jitsi، كود الدخول، المدة، السبورة، التسجيل ===== */
let lvApi=null,lvTimer=null,lvPoll=null,lvS=null,lvDead=0,lvSkew=0;
function jitsiLoad(){return new Promise((res,rej)=>{if(window.JitsiMeetExternalAPI)return res();
 const s=document.createElement('script');s.src=`https://${CFG.jitsi}/external_api.js`;s.onload=res;s.onerror=()=>rej(Error('تعذر الاتصال بخادم البث: '+CFG.jitsi+'. راجع إعداد CFG.jitsi'));document.head.appendChild(s)})}
const lvCopy=c=>{(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>alert('تم نسخ الكود: '+c),()=>prompt('انسخ الكود:',c))};
const lvCopyLink=c=>{const u=location.origin+location.pathname+'?live='+c;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>alert('تم نسخ رابط الدخول'),()=>prompt('انسخ الرابط:',u))};
const lvFmt=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600);return (h?String(h).padStart(2,'0')+':':'')+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

async function lvEnter(id){
 const s=lvL.find(x=>x.id===id);lvS=s;lvDead=new Date(s.ends_at).getTime();lvSkew=new Date(s.now).getTime()-Date.now();
 $('#main').innerHTML=`<div class="bar"><button class="btn ghost" onclick="lvLeave()">← خروج من الغرفة</button><b>${esc(s.title)}</b><span class="timer" id="lvt">--:--</span><span id="rs"></span></div>
 <div class="card"><div class="bar" style="margin:0"><span>كود الدخول للطلاب:</span><span id="lvc" style="font-size:26px;letter-spacing:5px;font-weight:800;color:var(--navy)">${esc(s.code)}</span><button class="mini" onclick="lvCopy('${esc(s.code)}')">نسخ الكود</button><button class="mini" onclick="lvCopyLink('${esc(s.code)}')">نسخ رابط الدخول</button><button class="mini" onclick="lvExtend(15)">+15 دقيقة</button><button class="mini red" onclick="lvEnd()">إنهاء البث</button><b id="lvj"></b></div></div>
 <div class="bar"><button class="btn gold" id="rb" onclick="recToggle()">⏺ بدء تسجيل الشاشة</button><button class="btn ghost" onclick="openBoard()">🖍 فتح السبورة البيضاء</button><small>للمشاركة: من شريط البث اضغط «مشاركة الشاشة» ثم اختر الشاشة أو النافذة (مثلًا نافذة السبورة).</small></div>
 <div id="lvm" style="height:70vh;background:#000;border-radius:8px"></div>`;
 try{await jitsiLoad()}catch(e){return err(e)}
 const wb=CFG.whiteboard?{whiteboard:{enabled:true,collabServerBaseUrl:CFG.whiteboard}}:{};
 lvApi=new JitsiMeetExternalAPI(CFG.jitsi,{roomName:s.room,parentNode:$('#lvm'),width:'100%',height:'100%',userInfo:{displayName:user.name+' (المحاضر)'},
  configOverwrite:{prejoinConfig:{enabled:false},disableInviteFunctions:true,subject:s.title,toolbarButtons:['microphone','camera','desktop','chat','raisehand','participants-pane','tileview','fullscreen','mute-everybody','settings','hangup',...(CFG.whiteboard?['whiteboard']:[])],...wb}});
 lvApi.addListener('readyToClose',()=>lvLeave());
 const tick=()=>{const rem=(lvDead-(Date.now()+lvSkew))/1000,t=$('#lvt');if(t)t.textContent=lvFmt(rem);if(rem<=0){clearInterval(lvTimer);alert('انتهت المدة المحددة للبث.');lvEnd(true)}};
 lvTimer=setInterval(tick,1000);tick();
 const who=async()=>{try{const l=await rpc('live_joins',{p_token:T(),p_id:s.id}),e=$('#lvj');if(e)e.textContent='دخل '+l.length+' طالب'}catch{}};
 who();lvPoll=setInterval(who,15000)}
async function lvExtend(m){try{const r=await rpc('extend_live',{p_token:T(),p_id:lvS.id,p_minutes:m});lvDead=new Date(r.ends_at).getTime();lvSkew=0;alert('تم تمديد البث '+m+' دقيقة')}catch(e){err(e)}}
async function lvEnd(auto){
 if(!auto&&!confirm('إنهاء البث للجميع؟'))return;
 try{await rpc('end_live',{p_token:T(),p_id:lvS.id})}catch(e){if(!auto)err(e)}
 lvLeave(true)}
function lvCleanup(){clearInterval(lvTimer);clearInterval(lvPoll);if(typeof recStop==='function'&&window.recState)recStop();if(lvApi){try{lvApi.dispose()}catch{}lvApi=null}}
function lvLeave(skipRefresh){
 if(window.recState&&!confirm('التسجيل يعمل الآن. الخروج سيوقفه ويحفظ الملف. متابعة؟'))return;
 lvCleanup();pgLive()}
function openBoard(){const w=window.open('whiteboard.html','sms_board','width=1100,height=720');if(!w)alert('اسمح بالنوافذ المنبثقة لفتح السبورة.')}
