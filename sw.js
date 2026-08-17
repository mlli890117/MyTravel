const CACHE='my-travel-v15';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./app.js?v=8','./enhancements.js?v=9','./planner-v11.js','./notifications-v1.js?v=1','./pwa-v1.js?v=1'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(ASSETS.map(url=>cache.add(url)))));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
  ]));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(async response=>{
      try{
        const ct=response.headers.get('content-type')||'';
        if(ct.includes('text/html')){
          let html=await response.text();
          if(!html.includes('planner-v11.js'))html=html.replace('</body>','<script src="./planner-v11.js?v=11"></script></body>');
          if(!html.includes('notifications-v1.js'))html=html.replace('</body>','<script src="./notifications-v1.js?v=1"></script></body>');
          if(!html.includes('pwa-v1.js'))html=html.replace('</body>','<script src="./pwa-v1.js?v=1"></script></body>');
          return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
        }
      }catch(_){ }
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(event.request)));
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){data={body:event.data?.text?.()||''}}
  const title=data.title||'My Travel 旅行提醒';
  const options={
    body:data.body||'你有一項旅行待辦需要確認',
    icon:'./icon.svg',
    badge:'./icon.svg',
    tag:data.tag||'my-travel-reminder',
    renotify:true,
    data:{url:data.url||'./index.html'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'./index.html';
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      if('focus' in client){await client.focus();try{await client.navigate(target)}catch(_){ }return;}
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});