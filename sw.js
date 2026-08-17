const CACHE='my-travel-v5';
const ASSETS=['./manifest.webmanifest','./icon.svg','./fix.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
      let html=await r.text();
      const marker="<script>\nconst LS='myTravel_v1'";
      if(html.includes(marker)){
        html=html.replace(marker,"<script src='./fix.js'></script>\n"+marker);
      }else if(!html.includes("./fix.js")){
        html=html.replace('</head>',"<script src='./fix.js'></script></head>");
      }
      return new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});
