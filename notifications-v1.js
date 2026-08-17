/* My Travel checklist reminders v3 */
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad=n=>String(n).padStart(2,'0');
  const REPEAT_MS=6*60*60*1000;
  const reminderText=v=>{if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('zh-TW',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})};
  let reminderCtx=null;

  function normalizeChecks(){
    (state.trips||[]).forEach(t=>(t.checks||[]).forEach(i=>{
      if(!('remindAt' in i))i.remindAt=null;
      if(!('notifiedAt' in i))i.notifiedAt=null;
      if(!('lastNotifiedAt' in i))i.lastNotifiedAt=i.notifiedAt||null;
    }));
  }

  function overdueItems(){
    normalizeChecks();const now=Date.now(),out=[];
    for(const t of state.trips||[])for(const i of t.checks||[]){
      const due=i.remindAt?new Date(i.remindAt).getTime():NaN;
      if(!i.done&&Number.isFinite(due)&&due<=now)out.push({trip:t,item:i,due});
    }
    return out.sort((a,b)=>a.due-b.due);
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
      if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,{icon:'./icon.svg',badge:'./icon.svg',...options})}
      else new Notification(title,options);
      return true;
    }catch(e){console.warn('notification failed',e);return false}
  }

  function ensureReminderModal(){
    if($('reminderModal'))return;
    const m=document.createElement('div');m.id='reminderModal';m.className='modal';
    m.innerHTML=`<div class="modalbox" style="width:min(620px,100%)"><div class="row between"><div><h2 style="margin:0">設定行前提醒</h2><div class="muted" style="margin-top:4px">設定完成後，到時間會在網頁及已允許通知的裝置提醒。</div></div><button class="btn alt" type="button" onclick="closeReminderEditor()">✕</button></div><div class="modalgrid" style="margin-top:18px"><div class="full"><label>待辦事項</label><input id="reminderItemName" readonly></div><div><label>提醒日期</label><input id="reminderDate" type="date"></div><div><label>提醒時間</label><input id="reminderTime" type="time" step="60"></div></div><div class="note" style="margin-top:14px">提醒會依你目前裝置的當地時間設定；若逾期仍未完成，重新開啟網站時會再次提醒。</div><div class="row" style="justify-content:space-between;margin-top:18px;flex-wrap:wrap"><button id="removeReminderBtn" class="btn red" type="button" onclick="removeCurrentReminder()">取消提醒</button><div class="row"><button class="btn alt" type="button" onclick="closeReminderEditor()">取消</button><button class="btn" type="button" onclick="saveReminderEditor()">儲存提醒</button></div></div></div>`;
    m.addEventListener('click',e=>{if(e.target===m)closeReminderEditor()});document.body.appendChild(m);
  }

  window.closeReminderEditor=function(){reminderCtx=null;$('reminderModal')?.classList.remove('show')};
  window.editCheckReminder=function(tid,id){
    ensureReminderModal();const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;
    reminderCtx={tid,id};$('reminderItemName').value=i.name||'';let d=i.remindAt?new Date(i.remindAt):null;
    if(!d||Number.isNaN(d.getTime())){d=new Date();d.setMinutes(d.getMinutes()+30);d.setSeconds(0,0)}
    $('reminderDate').value=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;$('reminderTime').value=`${pad(d.getHours())}:${pad(d.getMinutes())}`;$('removeReminderBtn').style.visibility=i.remindAt?'visible':'hidden';$('reminderModal').classList.add('show');
  };
  window.saveReminderEditor=function(){
    if(!reminderCtx)return;const t=state.trips.find(x=>x.id===reminderCtx.tid),i=t?.checks.find(x=>x.id===reminderCtx.id);if(!i)return;
    const date=$('reminderDate').value,time=$('reminderTime').value;if(!date||!time)return alert('請選擇提醒日期與時間');const d=new Date(`${date}T${time}:00`);if(Number.isNaN(d.getTime()))return alert('提醒時間格式不正確');
    i.remindAt=d.toISOString();i.notifiedAt=null;i.lastNotifiedAt=null;closeReminderEditor();save();setTimeout(renderOverdueHome,50);
  };
  window.removeCurrentReminder=function(){if(!reminderCtx)return;const t=state.trips.find(x=>x.id===reminderCtx.tid),i=t?.checks.find(x=>x.id===reminderCtx.id);if(!i)return;i.remindAt=null;i.notifiedAt=null;i.lastNotifiedAt=null;closeReminderEditor();save();setTimeout(renderOverdueHome,50)};

  function renderNotificationStatus(){
    let box=$('travelNotificationStatus');if(!box){const checkCard=$('checkRows')?.closest('.card');if(!checkCard)return;box=document.createElement('div');box.id='travelNotificationStatus';box.className='setting';box.style.marginBottom='10px';const inputRow=$('checkInput')?.closest('.row');if(inputRow)inputRow.before(box)}
    const supported='Notification' in window,p=supported?Notification.permission:'unsupported';const text=p==='granted'?'✅ 裝置通知已開啟':p==='denied'?'⚠️ 裝置通知已被拒絕':p==='default'?'🔔 尚未開啟裝置通知':'此瀏覽器不支援裝置通知';
    box.innerHTML=`<div class="row between"><div><b>${text}</b><div class="muted">逾期未完成時，重新開啟網站也會再次提醒。</div></div>${p!=='granted'&&supported?'<button class="btn sm" onclick="enableTravelNotifications()">開啟通知</button>':''}</div>`;
  }

  window.renderChecks=function(){
    normalizeChecks();const t=state.trips.find(x=>x.id===$('checkTripSelect')?.value)||trip();const rows=$('checkRows');if(!rows)return;
    rows.innerHTML=(t.checks||[]).map(i=>`<div class="check ${i.done?'done':''}" style="align-items:flex-start"><input type="checkbox" ${i.done?'checked':''} onchange="toggleCheck('${t.id}','${i.id}');setTimeout(()=>window.renderOverdueHome&&renderOverdueHome(),50)"><div style="flex:1"><span>${esc(i.name)}</span>${i.remindAt?`<div class="muted">🔔 ${esc(reminderText(i.remindAt))}</div>`:''}</div><div class="row"><button class="btn sm alt" onclick="editCheckReminder('${t.id}','${i.id}')">${i.remindAt?'提醒':'＋提醒'}</button><button class="btn sm alt" onclick="editCheckName('${t.id}','${i.id}')">編輯</button><button class="btn sm red" onclick="deleteCheckItem('${t.id}','${i.id}')">刪除</button></div></div>`).join('');renderNotificationStatus();renderOverdueHome();
  };

  window.addCheck=function(){const n=String($('checkInput')?.value||'').trim();if(!n)return;const t=state.trips.find(x=>x.id===$('checkTripSelect')?.value)||trip();t.checks.push({id:crypto.randomUUID(),name:n,done:false,remindAt:null,notifiedAt:null,lastNotifiedAt:null});$('checkInput').value='';save();setTimeout(renderOverdueHome,50)};
  window.editCheckName=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;const n=prompt('修改待辦內容',i.name);if(n===null||!n.trim())return;i.name=n.trim();save();setTimeout(renderOverdueHome,50)};
  window.deleteCheckItem=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;if(!confirm(`刪除「${i.name}」？`))return;t.checks=t.checks.filter(x=>x.id!==id);save();setTimeout(renderOverdueHome,50)};

  window.completeOverdueCheck=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;i.done=true;save();setTimeout(()=>{renderOverdueHome();try{renderChecks()}catch(e){}},50)};

  function ensureOverdueCard(){
    let card=$('homeOverdueCard');if(card)return card;const home=$('home');if(!home)return null;
    card=document.createElement('div');card.id='homeOverdueCard';card.className='card';card.style.marginTop='18px';
    const cards=$('tripCards');if(cards)home.insertBefore(card,cards);else home.appendChild(card);return card;
  }
  function renderOverdueHome(){
    const card=ensureOverdueCard();if(!card)return;const list=overdueItems();
    if(!list.length){card.style.display='none';return}card.style.display='block';
    card.innerHTML=`<div class="row between"><div><h2 style="margin:0">⚠️ 已過期未完成</h2><div class="muted" style="margin-top:4px">${list.length} 項行前事項已超過提醒時間</div></div><span class="pill">${list.length}</span></div><div style="margin-top:10px">${list.map(x=>`<div class="setting" style="margin-top:8px"><div class="row between" style="align-items:flex-start"><label class="row" style="align-items:flex-start;flex:1;cursor:pointer"><input type="checkbox" style="width:auto;margin-top:3px" onchange="completeOverdueCheck('${x.trip.id}','${x.item.id}')"><div><b>${esc(x.item.name)}</b><div class="muted">${esc(x.trip.emoji||'✈️')} ${esc(x.trip.name)} ・ 原提醒 ${esc(reminderText(x.item.remindAt))}</div></div></label><button class="btn sm alt" onclick="editCheckReminder('${x.trip.id}','${x.item.id}')">修改提醒</button></div></div>`).join('')}</div>`;
  }
  window.renderOverdueHome=renderOverdueHome;

  async function checkDueReminders(forceOnOpen=false){
    normalizeChecks();const now=Date.now();let changed=false;
    for(const {trip:t,item:i,due} of overdueItems()){
      const last=i.lastNotifiedAt?new Date(i.lastNotifiedAt).getTime():0;
      const shouldNotify=forceOnOpen||!last||!Number.isFinite(last)||(now-last>=REPEAT_MS);
      if(!shouldNotify)continue;
      const body=`${t.emoji||'✈️'} ${t.name}｜${i.name}`;showToast(`🔔 行前提醒：${body}`);await showDeviceNotification('My Travel 行前提醒',{body,tag:`check-${t.id}-${i.id}`,data:{url:location.href}});i.notifiedAt=new Date().toISOString();i.lastNotifiedAt=i.notifiedAt;changed=true;
    }
    if(changed){localStorage.setItem(LS,JSON.stringify(state));if(typeof pushCloud==='function'&&sb)pushCloud();try{renderChecks()}catch(e){}}
    renderOverdueHome();
  }

  function showToast(text){const n=document.createElement('div');n.textContent=text;n.style.cssText='position:fixed;right:18px;top:18px;z-index:99999;max-width:380px;background:#0f172a;color:white;padding:14px 16px;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.25);font-weight:700';document.body.appendChild(n);setTimeout(()=>n.remove(),8000)}

  normalizeChecks();ensureReminderModal();
  const start=()=>setTimeout(()=>{try{renderChecks()}catch(e){};renderOverdueHome();checkDueReminders(true)},450);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.addEventListener('pageshow',e=>{if(e.persisted)setTimeout(()=>checkDueReminders(true),250)});
  window.addEventListener('focus',()=>checkDueReminders(false));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkDueReminders(false)});setInterval(()=>checkDueReminders(false),30000);
})();