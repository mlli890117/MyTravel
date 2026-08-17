/* My Travel checklist reminders v1 */
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad=n=>String(n).padStart(2,'0');
  const toLocalInput=v=>{if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return'';return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
  const reminderText=v=>{if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})};

  function normalizeChecks(){
    (state.trips||[]).forEach(t=>(t.checks||[]).forEach(i=>{
      if(!('remindAt' in i))i.remindAt=null;
      if(!('notifiedAt' in i))i.notifiedAt=null;
    }));
  }

  async function enableNotifications(){
    if(!('Notification' in window))return alert('這個瀏覽器不支援系統通知');
    if(!window.isSecureContext)return alert('系統通知需要 HTTPS');
    const p=await Notification.requestPermission();
    if(p==='granted'){
      await showDeviceNotification('My Travel 通知已開啟',{body:'之後行前清單到提醒時間時，會顯示裝置通知。',tag:'mytravel-test'});
      renderNotificationStatus();
    }else alert(p==='denied'?'你已拒絕通知權限，可到瀏覽器／系統設定重新開啟。':'尚未允許通知。');
  }
  window.enableTravelNotifications=enableNotifications;

  async function showDeviceNotification(title,options={}){
    if(!('Notification' in window)||Notification.permission!=='granted')return false;
    try{
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.ready;
        await reg.showNotification(title,{icon:'./icon.svg',badge:'./icon.svg',...options});
      }else new Notification(title,options);
      return true;
    }catch(e){console.warn('notification failed',e);return false}
  }

  function renderNotificationStatus(){
    let box=$('travelNotificationStatus');
    if(!box){
      const checkCard=$('checkRows')?.closest('.card');
      if(!checkCard)return;
      box=document.createElement('div');box.id='travelNotificationStatus';box.className='setting';box.style.marginBottom='10px';
      const inputRow=$('checkInput')?.closest('.row');
      if(inputRow)inputRow.before(box);
    }
    const supported='Notification' in window;
    const p=supported?Notification.permission:'unsupported';
    const text=p==='granted'?'✅ 裝置通知已開啟':p==='denied'?'⚠️ 裝置通知已被拒絕':p==='default'?'🔔 尚未開啟裝置通知':'此瀏覽器不支援裝置通知';
    box.innerHTML=`<div class="row between"><div><b>${text}</b><div class="muted">提醒時間到時，網頁開啟期間會跳出提醒。</div></div>${p!=='granted'&&supported?'<button class="btn sm" onclick="enableTravelNotifications()">開啟通知</button>':''}</div>`;
  }

  window.renderChecks=function(){
    normalizeChecks();
    const t=state.trips.find(x=>x.id===$('checkTripSelect')?.value)||trip();
    const rows=$('checkRows');if(!rows)return;
    rows.innerHTML=(t.checks||[]).map(i=>`<div class="check ${i.done?'done':''}" style="align-items:flex-start"><input type="checkbox" ${i.done?'checked':''} onchange="toggleCheck('${t.id}','${i.id}')"><div style="flex:1"><span>${esc(i.name)}</span>${i.remindAt?`<div class="muted">🔔 ${esc(reminderText(i.remindAt))}</div>`:''}</div><div class="row"><button class="btn sm alt" onclick="editCheckReminder('${t.id}','${i.id}')">${i.remindAt?'提醒':'＋提醒'}</button><button class="btn sm alt" onclick="editCheckName('${t.id}','${i.id}')">編輯</button><button class="btn sm red" onclick="deleteCheckItem('${t.id}','${i.id}')">刪除</button></div></div>`).join('');
    renderNotificationStatus();
  };

  window.addCheck=function(){
    const n=$('checkInput').value.trim();if(!n)return;
    const t=state.trips.find(x=>x.id===$('checkTripSelect').value)||trip();
    t.checks.push({id:crypto.randomUUID(),name:n,done:false,remindAt:null,notifiedAt:null});
    $('checkInput').value='';save();
  };
  window.editCheckName=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;const n=prompt('修改待辦內容',i.name);if(n===null||!n.trim())return;i.name=n.trim();save()};
  window.deleteCheckItem=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;if(!confirm(`刪除「${i.name}」？`))return;t.checks=t.checks.filter(x=>x.id!==id);save()};
  window.editCheckReminder=function(tid,id){
    const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;
    const v=prompt('提醒日期時間\n格式：YYYY-MM-DDTHH:mm\n留空可取消提醒',toLocalInput(i.remindAt));
    if(v===null)return;
    if(!v.trim()){i.remindAt=null;i.notifiedAt=null;save();return}
    const d=new Date(v);if(Number.isNaN(d.getTime()))return alert('提醒時間格式不正確');
    i.remindAt=d.toISOString();i.notifiedAt=null;save();
  };

  async function checkDueReminders(){
    normalizeChecks();const now=Date.now();let changed=false;
    for(const t of state.trips||[])for(const i of t.checks||[]){
      if(i.done||!i.remindAt||i.notifiedAt)continue;
      const due=new Date(i.remindAt).getTime();if(Number.isNaN(due)||due>now)continue;
      const body=`${t.emoji||'✈️'} ${t.name}｜${i.name}`;
      // In-page alert plus OS notification. Avoid blocking alert(); use a small toast.
      showToast(`🔔 行前提醒：${body}`);
      await showDeviceNotification('My Travel 行前提醒',{body,tag:`check-${t.id}-${i.id}`,data:{url:location.href}});
      i.notifiedAt=new Date().toISOString();changed=true;
    }
    if(changed){localStorage.setItem(LS,JSON.stringify(state));if(typeof pushCloud==='function'&&sb)pushCloud();renderChecks()}
  }

  function showToast(text){
    let n=document.createElement('div');n.textContent=text;n.style.cssText='position:fixed;right:18px;top:18px;z-index:99999;max-width:380px;background:#0f172a;color:white;padding:14px 16px;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.25);font-weight:700';document.body.appendChild(n);setTimeout(()=>n.remove(),8000);
  }

  normalizeChecks();
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{try{renderChecks()}catch(e){};checkDueReminders()},300)});
  window.addEventListener('focus',checkDueReminders);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkDueReminders()});
  setInterval(checkDueReminders,30000);
})();