/* My Travel final fixes v16 */
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const geoCache={};
  const emergency={
    jp:{name:'日本',police:'110',fire:'119',ambulance:'119',extra:'JNTO 旅客熱線 050-3816-2787'},
    kr:{name:'韓國',police:'112',fire:'119',ambulance:'119',extra:'韓國旅遊諮詢 1330'},
    sg:{name:'新加坡',police:'999',fire:'995',ambulance:'995',extra:''},
    tw:{name:'台灣',police:'110',fire:'119',ambulance:'119',extra:'外來人士服務專線 1990'},
    th:{name:'泰國',police:'191',fire:'199',ambulance:'1669',extra:'觀光警察 1155'},
    my:{name:'馬來西亞',police:'999',fire:'999',ambulance:'999',extra:''},
    ph:{name:'菲律賓',police:'911',fire:'911',ambulance:'911',extra:''},
    vn:{name:'越南',police:'113',fire:'114',ambulance:'115',extra:''},
    hk:{name:'香港',police:'999',fire:'999',ambulance:'999',extra:''},
    mo:{name:'澳門',police:'999',fire:'999',ambulance:'999',extra:''},
    us:{name:'美國',police:'911',fire:'911',ambulance:'911',extra:''},
    ca:{name:'加拿大',police:'911',fire:'911',ambulance:'911',extra:''},
    gb:{name:'英國',police:'999 / 112',fire:'999 / 112',ambulance:'999 / 112',extra:''},
    fr:{name:'法國',police:'17 / 112',fire:'18 / 112',ambulance:'15 / 112',extra:''},
    de:{name:'德國',police:'110',fire:'112',ambulance:'112',extra:''},
    it:{name:'義大利',police:'112',fire:'112',ambulance:'112',extra:''},
    es:{name:'西班牙',police:'112',fire:'112',ambulance:'112',extra:''},
    is:{name:'冰島',police:'112',fire:'112',ambulance:'112',extra:''},
    au:{name:'澳洲',police:'000',fire:'000',ambulance:'000',extra:''},
    nz:{name:'紐西蘭',police:'111',fire:'111',ambulance:'111',extra:''}
  };

  function guessCountry(t){
    const s=`${t?.name||''} ${t?.theme||''}`.toLowerCase();
    if(/新加坡|singapore/.test(s))return 'sg';
    if(/韓國|首爾|釜山|濟州|korea|seoul|busan|jeju/.test(s))return 'kr';
    if(/日本|東京|北海道|札幌|宮古|沖繩|大阪|京都|福岡|仙台|名古屋|japan|tokyo|sapporo|okinawa|osaka|kyoto/.test(s))return 'jp';
    if(/台灣|taiwan|台北|taipei/.test(s))return 'tw';
    if(/泰國|曼谷|清邁|thailand|bangkok/.test(s))return 'th';
    if(/馬來西亞|吉隆坡|malaysia|kuala lumpur/.test(s))return 'my';
    if(/菲律賓|馬尼拉|philippines|manila/.test(s))return 'ph';
    if(/越南|河內|胡志明|vietnam|hanoi/.test(s))return 'vn';
    if(/香港|hong kong/.test(s))return 'hk';
    if(/澳門|macau|macao/.test(s))return 'mo';
    if(/冰島|iceland|reykjavik/.test(s))return 'is';
    if(/澳洲|australia|sydney|melbourne/.test(s))return 'au';
    if(/紐西蘭|new zealand|auckland/.test(s))return 'nz';
    if(/美國|usa|united states|new york|los angeles/.test(s))return 'us';
    if(/加拿大|canada/.test(s))return 'ca';
    if(/英國|united kingdom|london/.test(s))return 'gb';
    if(/法國|france|paris/.test(s))return 'fr';
    if(/德國|germany|berlin/.test(s))return 'de';
    if(/義大利|italy|rome/.test(s))return 'it';
    if(/西班牙|spain|madrid|barcelona/.test(s))return 'es';
    return '';
  }

  async function geocodeTrip(t,force=false){
    if(!t)return null;
    if(!force&&geoCache[t.id])return geoCache[t.id];
    try{
      const q=encodeURIComponent(t.name||'');
      const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${q}`,{cache:'no-store',headers:{'Accept-Language':'zh-TW'}});
      if(!r.ok)throw new Error('geocode '+r.status);
      const a=await r.json();
      if(a?.[0]){
        const lat=Number(a[0].lat),lon=Number(a[0].lon),cc=(a[0].address?.country_code||'').toLowerCase();
        const g={lat,lon,cc};geoCache[t.id]=g;
        if(Number.isFinite(lat)&&Number.isFinite(lon)){
          const old=t.center||[];
          const isDefault=!old.length||Math.abs((old[0]||0)-35.6762)<0.5&&Math.abs((old[1]||0)-139.6503)<0.5;
          if(force||isDefault){
            t.center=[lat,lon];
            localStorage.setItem(LS,JSON.stringify(state));
            try{map?.setView([lat,lon],10)}catch(e){}
            try{bigMap?.setView([lat,lon],8)}catch(e){}
            if(sb)pushCloud();
          }
        }
        return g;
      }
    }catch(e){console.warn('geocode trip failed',e)}
    return null;
  }

  function findCard(title){return [...document.querySelectorAll('.card')].find(c=>[...c.querySelectorAll('h2')].some(h=>h.textContent.trim()===title))}
  function moveTripTools(){
    const tools=$('tripTools'),itinerary=$('itinerary');if(!tools||!itinerary)return;
    tools.classList.add('grid','g2');tools.style.marginTop='16px';
    ['航班／住宿','行前清單','購物清單'].forEach(title=>{const c=findCard(title);if(c&&c.parentElement!==tools)tools.appendChild(c)});
    ['checkTripSelect','shopTripSelect'].forEach(id=>{const e=$(id);if(e){e.value=curTrip;e.style.display='none'}});
    const more=$('more');const grid=more?.querySelector('.grid.g2');if(grid&&grid.children.length===0)grid.remove();
  }

  function ensureEmergencyCard(){
    moveTripTools();let c=$('tripEmergencyCard');if(c)return c;
    const tools=$('tripTools');if(!tools)return null;
    c=document.createElement('div');c.id='tripEmergencyCard';c.className='card';tools.appendChild(c);return c;
  }
  async function renderEmergency(){
    const t=trip(),card=ensureEmergencyCard();if(!card)return;
    card.innerHTML='<h2>緊急聯絡</h2><div class="muted">正在辨識目的地…</div>';
    let cc=guessCountry(t);const g=await geocodeTrip(t,false);if(g?.cc)cc=g.cc;
    const e=emergency[cc];
    if(!e){card.innerHTML=`<h2>緊急聯絡</h2><div class="note">目前尚未建立「${esc(t.name)}」的緊急電話資料。</div>`;return}
    card.innerHTML=`<div class="row between"><div><h2 style="margin-bottom:4px">${e.name}緊急聯絡</h2><div class="muted">依目前旅行「${esc(t.name)}」自動切換</div></div><span class="pill">${cc.toUpperCase()}</span></div><div class="grid g2" style="margin-top:12px"><div class="setting"><b>👮 警察 ${e.police}</b></div><div class="setting"><b>🚒 消防 ${e.fire}</b></div><div class="setting"><b>🚑 救護 ${e.ambulance}</b></div>${e.extra?`<div class="setting"><b>☎️ ${e.extra}</b></div>`:''}</div><div class="muted" style="margin-top:10px">國家依旅行名稱與地圖位置自動辨識。</div>`;
  }

  function removeLegacyEmergency(){const more=$('more');if(!more)return;[...more.querySelectorAll('.card')].forEach(c=>{const h=c.querySelector('h2');if(h&&h.textContent.includes('緊急聯絡'))c.remove()})}

  const oldSaveTrip=window.saveTrip;
  if(oldSaveTrip){window.saveTrip=function(){const before=new Set(state.trips.map(x=>x.id));oldSaveTrip();setTimeout(async()=>{const t=trip();const isNew=!before.has(t.id);if(isNew||!t.center||Math.abs((t.center[0]||0)-35.6762)<0.5&&Math.abs((t.center[1]||0)-139.6503)<0.5)await geocodeTrip(t,true);moveTripTools();renderEmergency();try{renderItinerary()}catch(e){}},150)}}

  const oldRenderAll=window.renderAll;
  window.renderAll=function(){oldRenderAll();moveTripTools();removeLegacyEmergency();setTimeout(renderEmergency,20)};

  const sel=$('tripSelect');if(sel)sel.addEventListener('change',()=>setTimeout(async()=>{moveTripTools();await geocodeTrip(trip(),false);renderEmergency()},80));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{moveTripTools();removeLegacyEmergency();renderEmergency()},250));
  setTimeout(()=>{moveTripTools();removeLegacyEmergency();renderEmergency()},300);
})();

// Load compact desktop/mobile itinerary layout.
(() => {
  if(document.getElementById('layout-v17-loader')) return;
  const s=document.createElement('script');
  s.id='layout-v17-loader';
  s.src='./layout-v17.js?v=17';
  s.defer=true;
  document.head.appendChild(s);
})();