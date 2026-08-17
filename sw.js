const CACHE='my-travel-v4';
const ASSETS=['./manifest.webmanifest','./icon.svg','./fix.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(async r=>{
      let html=await r.text();
      html=html.replace('</body>','<script src="./fix.js"></script><script>if(typeof renderAll==="function"){renderAll();setupCloud().catch(console.error)}</script></body>');
      return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});
