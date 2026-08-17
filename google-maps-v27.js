/* My Travel Google Maps links v33 */
(() => {
  const $=id=>document.getElementById(id);
  function gmSearchUrl(q){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
  function tripContext(){
    const t=typeof trip==='function'?trip():null;if(!t)return'';
    const s=`${t.name||''} ${t.theme||''}`;
    if(/宮古|沖繩|miyako|okinawa/i.test(s))return'宮古島 沖縄 日本';
    if(/北海道|札幌|sapporo|hokkaido/i.test(s))return'北海道 日本';
    if(/東京|tokyo/i.test(s))return'東京 日本';
    if(/大阪|osaka/i.test(s))return'大阪 日本';
    if(/京都|kyoto/i.test(s))return'京都 日本';
    if(/福岡|fukuoka/i.test(s))return'福岡 日本';
    if(/韓國|首爾|釜山|濟州|korea|seoul|busan|jeju/i.test(s))return'韓國';
    if(/新加坡|singapore/i.test(s))return'Singapore';
    return t.name||'';
  }
  function itemQuery(item){return [item?.title,item?.address,tripContext()].filter(Boolean).join(' ')}
  window.openGoogleMapsSearch=function(q){q=(q||'').trim();if(!q)return alert('請先輸入地點名稱');window.open(gmSearchUrl(q),'_blank','noopener,noreferrer')};
  window.openGoogleMapsForItem=function(id){const arr=typeof trip==='function'?(trip()?.itinerary?.[curDate]||[]):[];const item=arr.find(x=>x.id===id);if(!item)return;window.open(gmSearchUrl(itemQuery(item)),'_blank','noopener,noreferrer')};

  function parseSimpleCoords(value){
    const text=String(value||'').trim().replace(/，/g,',');
    const parts=text.split(',').map(x=>x.trim()).filter(Boolean);
    if(parts.length<2)return null;
    const lat=Number(parts[0]),lng=Number(parts[1]);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return null;
    return {lat,lng};
  }
  function fillSimpleCoords(c){
    if(!c)return false;
    const paste=$('editCoordPaste'),lat=$('editItemLat'),lng=$('editItemLng');
    if(paste)paste.value=`${c.lat}, ${c.lng}`;
    if(lat)lat.value=c.lat;
    if(lng)lng.value=c.lng;
    lat?.dispatchEvent(new Event('input',{bubbles:true}));
    lng?.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }

  // Run before the older modal handlers so a valid Google Maps paste can never be rejected.
  document.addEventListener('paste',e=>{
    if(e.target?.id!=='editCoordPaste')return;
    const text=e.clipboardData?.getData('text/plain')||e.clipboardData?.getData('text')||'';
    const c=parseSimpleCoords(text);
    if(!c)return; // keep ordinary paste behavior for invalid/incomplete text
    e.preventDefault();
    e.stopImmediatePropagation();
    fillSimpleCoords(c);
  },true);
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#applyCoordBtn');if(!btn)return;
    const c=parseSimpleCoords($('editCoordPaste')?.value);
    if(!c)return; // let the editor show its normal validation message
    e.preventDefault();
    e.stopImmediatePropagation();
    fillSimpleCoords(c);
  },true);
  document.addEventListener('input',e=>{
    if(e.target?.id!=='editCoordPaste')return;
    const c=parseSimpleCoords(e.target.value);if(c)fillSimpleCoords(c);
  },true);

  function decorateEditor(){
    const input=$('editPlaceSearch');
    if(input){let btn=$('editGoogleMapsSearchBtn');if(!btn){btn=document.createElement('button');btn.id='editGoogleMapsSearchBtn';btn.type='button';btn.className='btn alt';btn.textContent='Google Maps';btn.onclick=()=>openGoogleMapsSearch([input.value,$('editItemAddress')?.value,tripContext()].filter(Boolean).join(' '));input.parentElement?.appendChild(btn)}}
  }
  function decorateTimeline(){
    const arr=typeof trip==='function'?(trip()?.itinerary?.[curDate]||[]):[];const rows=[...document.querySelectorAll('#timeline .item')];
    rows.forEach((row,i)=>{const item=arr[i];if(!item)return;let b=row.querySelector('.gmaps-item-btn');const actions=row.querySelector('.row');if(!actions)return;if(!b){b=document.createElement('button');b.type='button';b.className='btn sm alt gmaps-item-btn';b.textContent='Google Maps';actions.prepend(b)}b.onclick=()=>openGoogleMapsForItem(item.id)})
  }
  function decorateMapCard(){const map=$('map');const card=map?.closest('.card');if(!card)return;let b=$('openTripGoogleMaps');if(b)return;b=document.createElement('button');b.id='openTripGoogleMaps';b.className='btn sm alt';b.style.marginBottom='10px';b.textContent='在 Google Maps 開啟';b.onclick=()=>openGoogleMapsSearch(tripContext());const h=card.querySelector('h3');h?.insertAdjacentElement('afterend',b)}
  function run(){decorateEditor();decorateTimeline();decorateMapCard()}
  const oldEdit=window.editItineraryItem;if(oldEdit&&!oldEdit.__gmaps33){const w=function(){const r=oldEdit.apply(this,arguments);setTimeout(decorateEditor,0);return r};w.__gmaps33=true;window.editItineraryItem=w}
  const oldRender=window.renderItinerary;if(oldRender&&!oldRender.__gmaps33){const w=function(){const r=oldRender.apply(this,arguments);setTimeout(()=>{decorateTimeline();decorateMapCard()},0);return r};w.__gmaps33=true;window.renderItinerary=w}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(run,400));setTimeout(run,600);setInterval(run,1500);
})();