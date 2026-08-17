/* My Travel PWA + Web Push registration v4 */
(() => {
  const $=id=>document.getElementById(id);
  const CFG='myTravel_supabase';
  const SUPABASE_URL='https://smgtefydmwoqovhldgvp.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_GFTHhoVfOHP2edTUSRJa3A_hnevKBeH';
  const VAPID_PUBLIC_KEY='BDk-gatnAmKJW-X_OaJz2GeZb5FWNOzt0l6Lf-HDpE2cRZakLVkaSVwxAmjwp9TolooDGcUeNDKgx7ud3MsTQSg';
  let deferredInstallPrompt=null;
  let pushBusy=false;

  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone===true}
  function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
  function platform(){if(isIOS())return 'ios';if(/android/i.test(navigator.userAgent))return 'android';if(/windows/i.test(navigator.userAgent))return 'windows';if(/mac/i.test(navigator.userAgent))return 'macos';return 'web'}
  function base64UrlToUint8Array(v){const p='='.repeat((4-v.length%4)%4),b=(v+p).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(b);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}

  async function registerSW(){
    if(!('serviceWorker' in navigator)||!window.isSecureContext)return null;
    try{const reg=await navigator.serviceWorker.register('./sw.js?v=16',{scope:'./'});reg.update().catch(()=>{});return reg}catch(e){console.warn('PWA service worker registration failed',e);return null}
  }
  async function swRegistration(){return await navigator.serviceWorker.ready}

  function ensureHead(){
    const head=document.head;
    [['apple-mobile-web-app-capable','yes'],['apple-mobile-web-app-status-bar-style','default'],['apple-mobile-web-app-title','My Travel'],['mobile-web-app-capable','yes']].forEach(([name,content])=>{if(!head.querySelector(`meta[name="${name}"]`)){const m=document.createElement('meta');m.name=name;m.content=content;head.appendChild(m)}});
  }

  async function getExistingSubscription(){try{if(!('serviceWorker' in navigator))return null;return await (await swRegistration()).pushManager.getSubscription()}catch(_){return null}}

  async function saveSubscription(sub){
    const json=sub.toJSON();
    const row={
      endpoint:sub.endpoint,
      p256dh:json.keys?.p256dh||'',
      auth:json.keys?.auth||'',
      device_name:isIOS()?'iPhone / iPad':platform(),
      platform:platform(),
      user_agent:navigator.userAgent,
      enabled:true,
      last_seen_at:new Date().toISOString()
    };

    const res=await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`,{
      method:'POST',
      headers:{
        'apikey':SUPABASE_PUBLISHABLE_KEY,
        'Authorization':`Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type':'application/json',
        'Prefer':'resolution=merge-duplicates,return=representation'
      },
      body:JSON.stringify(row)
    });

    if(!res.ok){
      let detail='';
      try{detail=await res.text()}catch(_){ }
      console.error('Push subscription save failed',res.status,detail);
      throw new Error(`Push Subscription 寫入 Supabase 失敗 (${res.status})${detail?`：${detail}`:''}`);
    }

    try{return await res.json()}catch(_){return null}
  }

  async function renderCard(){
    const more=$('more');if(!more)return;
    let card=$('pwaInstallCard');
    if(!card){card=document.createElement('div');card.id='pwaInstallCard';card.className='card';card.style.marginTop='16px';const cloud=[...more.querySelectorAll('.card')].find(x=>x.querySelector('h2')?.textContent?.includes('雲端同步'));if(cloud)more.insertBefore(card,cloud);else more.appendChild(card)}
    const standalone=isStandalone();
    const permission=('Notification' in window)?Notification.permission:'unsupported';
    const sub=permission==='granted'?await getExistingSubscription():null;
    let action='';
    if(standalone)action='<span class="pill">已安裝</span>';else if(deferredInstallPrompt)action='<button class="btn" type="button" onclick="installMyTravelApp()">安裝 App</button>';else if(isIOS())action='<button class="btn alt" type="button" onclick="showIOSInstallHelp()">iPhone 安裝方式</button>';else action='<span class="muted">可從瀏覽器選單安裝／加入主畫面</span>';
    let notifyAction='';
    if(permission==='unsupported')notifyAction='<div class="muted">此瀏覽器不支援系統通知</div>';
    else if(permission==='denied')notifyAction='<div class="note" style="margin-top:10px">通知權限已被拒絕，請到 iPhone「設定 → 通知 → My Travel」重新允許。</div>';
    else if(permission==='granted'&&sub)notifyAction='<div class="good setting" style="margin-top:10px">✅ 此裝置已建立 Push Subscription</div><button class="btn alt" style="margin-top:10px" type="button" onclick="syncMyTravelPush()">↻ 同步此裝置到雲端</button>';
    else notifyAction='<button class="btn" style="margin-top:10px" type="button" onclick="enableMyTravelPush()">🔔 完成裝置註冊</button>';
    const notifyText=permission==='granted'?(sub?'已開啟・此裝置已註冊':'已允許・尚未註冊'):permission==='denied'?'已拒絕':'尚未允許';
    card.innerHTML=`<div class="row between" style="align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin-bottom:5px">📱 App 與通知</h2><div class="muted">將 My Travel 加到主畫面，並讓這台裝置接收旅行提醒。</div></div>${action}</div><div class="grid g2" style="margin-top:12px"><div class="setting"><b>App 模式</b><div class="muted">${standalone?'✅ 已使用獨立 App 模式':'瀏覽器模式'}</div></div><div class="setting"><b>系統通知</b><div class="muted">${notifyText}</div>${notifyAction}</div></div>${isIOS()&&!standalone?'<div class="note" style="margin-top:10px">iPhone：Safari → 分享 →「加入主畫面」。加入後請從主畫面的 My Travel 開啟，再允許通知。</div>':''}`;
  }

  window.syncMyTravelPush=async function(){
    if(pushBusy)return;pushBusy=true;
    try{
      const sub=await getExistingSubscription();
      if(!sub)throw new Error('這台裝置目前沒有 Push Subscription，請重新完成裝置註冊。');
      await saveSubscription(sub);
      alert('此裝置已成功同步到 Supabase。');
    }catch(e){alert(e?.message||String(e))}finally{pushBusy=false}
  };

  window.enableMyTravelPush=async function(){
    if(pushBusy)return;pushBusy=true;
    try{
      if(isIOS()&&!isStandalone())throw new Error('iPhone 必須先「加入主畫面」，再從 My Travel App 開啟通知');
      if(!('Notification' in window)||!('PushManager' in window))throw new Error('這個瀏覽器目前不支援 Web Push');
      const permission=await Notification.requestPermission();
      if(permission!=='granted')throw new Error('你尚未允許 My Travel 傳送通知');
      const reg=await swRegistration();
      let sub=await reg.pushManager.getSubscription();
      if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64UrlToUint8Array(VAPID_PUBLIC_KEY)});
      await saveSubscription(sub);
      try{await reg.showNotification('My Travel 通知已開啟',{body:'這台裝置已完成旅行提醒註冊。',icon:'./icon.svg',badge:'./icon.svg',tag:'push-ready'})}catch(_){ }
      await renderCard();
    }catch(e){alert(e?.message||String(e));await renderCard()}finally{pushBusy=false}
  };

  window.installMyTravelApp=async function(){if(!deferredInstallPrompt)return renderCard();deferredInstallPrompt.prompt();try{await deferredInstallPrompt.userChoice}catch(_){}deferredInstallPrompt=null;renderCard()};
  window.showIOSInstallHelp=function(){alert('iPhone 安裝方式：\n1. 使用 Safari 開啟 My Travel\n2. 點「分享」\n3. 選擇「加入主畫面」\n4. 從主畫面的 My Travel 圖示重新開啟')};
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;renderCard()});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;renderCard()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')renderCard()});
  window.addEventListener('focus',renderCard);
  ensureHead();registerSW();
  const start=()=>setTimeout(renderCard,500);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();