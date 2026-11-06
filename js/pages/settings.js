/* ===== الإعدادات ===== */
function pgSet(){const a=user.role==='admin';
 $('#main').innerHTML=`<h2>الإعدادات</h2><div class="card"><b>كلمة المرور</b><p><button class="btn gold" onclick="pwModal()">تغيير كلمة المرور</button></p></div>`
  +(a?`<div class="card"><b>الشعارات</b> <small>(الجامعة على اليمين، الكلية على اليسار)</small><div class="bar" style="margin-top:10px"><label>شعار الجامعة <input type="file" accept="image/*" onchange="logoUp('logo_u',this.files[0])"></label><label>شعار الكلية <input type="file" accept="image/*" onchange="logoUp('logo_c',this.files[0])"></label></div></div>`:'')
  +`<div class="card"><b>الاتصال</b><p style="font-size:13px">متصل عبر بوابة gw. الوصول المباشر للجداول مغلق، وكل عملية يتحقق الخادم من جلستها وصلاحيتها.</p></div>`}
function logoUp(k,f){if(!f)return;const im=new Image();
 im.onload=async()=>{const s=Math.min(1,240/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  try{const data=c.toDataURL('image/png');await rpc('set_setting',{p_token:T(),p_key:k,p_value:data});logos[k==='logo_u'?'u':'c']=data;$('#hd').innerHTML=hdr()}catch(e){err(e)}};
 im.src=URL.createObjectURL(f)}


addPage({k:'settings',t:'الإعدادات',a:'r',o:1000,f:pgSet});
