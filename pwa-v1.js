/* My Travel PWA shell v1 */
(() => {
  const $=id=>document.getElementById(id);
  let deferredInstallPrompt=null;

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone===true;
  }
  function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}

  async function registerSW(){
    if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
    try{
      const reg=await navigator.serviceWorker.register('./sw.js?v=15',{scope:'./'});
      reg.update().catch(()=>{});
    }catch(e){console.warn('PWA service worker registration failed',e)}
  }

  function ensureHead(){
    const head=document.head;
    const metas=[
      ['apple-mobile-web-app-capable','yes'],
      ['apple-mobile-web-app-status-bar-style','default'],
      ['apple-mobile-web-app-title','My Travel'],
      ['mobile-web-app-capable','yes']
    ];
    metas.forEach(([name,content])=>{if(!head.querySelector(`meta[name="${name}"]`)){const m=document.createElement('meta');m.name=name;m.content=content;head.appendChild(m)}});
  }

  function ensureInstallCard(){
    const more=$('more');if(!more)return;
    let card=$('pwaInstallCard');
    if(!card){
      card=document.createElement('div');card.id='pwaInstallCard';card.className='card';card.style.marginTop='16px';
      const cloud=[...more.querySelectorAll('.card')].find(x=>x.querySelector('h2')?.textContent?.includes('雲端同步'));
      if(cloud)more.insertBefore(card,cloud);else more.appendChild(card);
    }
    const standalone=isStandalone();
    const permission=('Notification' in window)?Notification.permission:'unsupported';
    let action='';
    if(standalone) action='<span class="pill">已安裝</span>';
    else if(deferredInstallPrompt) action='<button class="btn" type="button" onclick="installMyTravelApp()">安裝 App</button>';
    else if(isIOS()) action='<button class="btn alt" type="button" onclick="showIOSInstallHelp()">iPhone 安裝方式</button>';
    else action='<span class="muted">可從瀏覽器選單「安裝應用程式／加入主畫面」</span>';

    const notifyText=permission==='granted'?'已允許':permission==='denied'?'已拒絕':'尚未允許';
    card.innerHTML=`<div class="row between" style="align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin-bottom:5px">📱 App 與通知</h2><div class="muted">將 My Travel 加到主畫面，使用起來更像獨立 App。</div></div>${action}</div>
      <div class="grid g2" style="margin-top:12px"><div class="setting"><b>App 模式</b><div class="muted">${standalone?'✅ 已使用獨立 App 模式':'瀏覽器模式'}</div></div><div class="setting"><b>系統通知</b><div class="muted">${notifyText}</div></div></div>
      ${isIOS()&&!standalone?'<div class="note" style="margin-top:10px">iPhone：Safari → 分享 →「加入主畫面」。加入後請從主畫面的 My Travel 開啟，再允許通知。</div>':''}`;
  }

  window.installMyTravelApp=async function(){
    if(!deferredInstallPrompt)return ensureInstallCard();
    deferredInstallPrompt.prompt();
    try{await deferredInstallPrompt.userChoice}catch(_){ }
    deferredInstallPrompt=null;ensureInstallCard();
  };
  window.showIOSInstallHelp=function(){
    alert('iPhone 安裝方式：\n1. 使用 Safari 開啟 My Travel\n2. 點下方「分享」按鈕\n3. 選擇「加入主畫面」\n4. 從主畫面的 My Travel 圖示重新開啟');
  };

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;ensureInstallCard()});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;ensureInstallCard()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ensureInstallCard()});
  window.addEventListener('focus',ensureInstallCard);

  ensureHead();registerSW();
  const start=()=>setTimeout(ensureInstallCard,400);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();