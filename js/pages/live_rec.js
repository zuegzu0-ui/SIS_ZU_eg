/* ===== تسجيل الشاشة أثناء البث (على جهاز المحاضر) =====
   يختار المحاضر الشاشة/النافذة/التبويب المراد تسجيله، ويختار مكان حفظ الملف على جهازه (Chrome وEdge). في المتصفحات الأخرى يُحفظ الملف
   في مجلد التنزيلات حسب إعداد المتصفح. الصوت: صوت الشاشة (إن شاركته) + الميكروفون. التسجيل بصيغة WebM ولا يُرفع إلى أي خادم. */
window.recState=null;
async function recToggle(){window.recState?recStop():recStart()}
async function recStart(){
 if(!window.MediaRecorder||!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia)return alert('المتصفح لا يدعم تسجيل الشاشة. استخدم Chrome أو Edge على الحاسوب.');
 let handle=null;const name=`بث-${(lvS&&lvS.title||'جلسة').replace(/[\\/:*?"<>|]/g,' ')}-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.webm`;
 if(window.showSaveFilePicker){try{handle=await showSaveFilePicker({suggestedName:name,types:[{description:'فيديو WebM',accept:{'video/webm':['.webm']}}]})}catch(e){if(e&&e.name==='AbortError')return}}
 let disp;try{disp=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:15},audio:true})}catch{return}
 let mic=null;try{mic=await navigator.mediaDevices.getUserMedia({audio:true})}catch{}
 const ctx=new AudioContext(),dest=ctx.createMediaStreamDestination();
 [disp,mic].forEach(s=>{if(s&&s.getAudioTracks().length)ctx.createMediaStreamSource(new MediaStream(s.getAudioTracks())).connect(dest)});
 const out=new MediaStream([...disp.getVideoTracks(),...dest.stream.getAudioTracks()]),
  mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m)),
  mr=new MediaRecorder(out,{mimeType:mime,videoBitsPerSecond:2500000});
 const writable=handle?await handle.createWritable():null,chunks=[];let q=Promise.resolve();
 mr.ondataavailable=e=>{if(!e.data.size)return;if(writable)q=q.then(()=>writable.write(e.data));else chunks.push(e.data)};
 mr.onstop=async()=>{
  try{if(writable){await q;await writable.close()}else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}}catch(e){alert('تعذر حفظ التسجيل: '+(e.message||e))}
  [disp,mic].forEach(s=>s&&s.getTracks().forEach(t=>t.stop()));try{ctx.close()}catch{}
  clearInterval(window.recTick);window.recState=null;const b=$('#rb');if(b)b.textContent='⏺ بدء تسجيل الشاشة';const r=$('#rs');if(r)r.textContent='';
  alert(handle?'تم حفظ التسجيل في المكان الذي اخترته.':'تم إنهاء التسجيل وتنزيل الملف (راجع مجلد التنزيلات).')};
 disp.getVideoTracks()[0].onended=()=>recStop();
 mr.start(5000);const t0=Date.now();window.recState={mr};
 const b=$('#rb');if(b)b.textContent='⏹ إيقاف التسجيل وحفظه';
 window.recTick=setInterval(()=>{const r=$('#rs');if(r)r.innerHTML=`<span style="color:#c22">● يسجَّل</span> ${lvFmt((Date.now()-t0)/1000)}`},1000)}
function recStop(){const s=window.recState;if(s&&s.mr&&s.mr.state!=='inactive')s.mr.stop()}
