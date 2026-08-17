const CACHE='my-travel-v12';
const ASSETS=['./manifest.webmanifest','./icon.svg','./app.js?v=8','./enhancements.js?v=9','./planner-v11.js','./notifications-v1.js?v=1'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
     try{
       const ct=r.headers.get('content-type')||'';
       if(ct.includes('text/html')){
         let html=await r.text();
         if(!html.includes('planner-v11.js')) html=html.replace('</body>','<script src="./planner-v11.js?v=11"></script></body>');
         if(!html.includes('notifications-v1.js')) html=html.replace('</body>','<script src="./notifications-v1.js?v=1"></script></body>');
         return new Response(html,{status:r.status,statusText:r.statusText,headers:r.headers});
       }
     }catch(_){ }
     return r;
   }).catch(()=>caches.match('./index.html')));return
 }
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{let c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'./';
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of list){if('focus'in c){await c.focus();try{await c.navigate(target)}catch(_){ }return}}
    if(clients.openWindow)return clients.openWindow(target);
  })());
});