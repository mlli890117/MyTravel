/* My Travel Google Maps links v30 */
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

  function coordInputs(){
    const inputs=[...document.querySelectorAll('input')];
    let lat=$('editItemLat')||$('editLat')||inputs.find(x=>/緯度/.test(x.placeholder||'')||/lat/i.test(x.id||''));
    let lng=$('editItemLng')||$('editLng')||inputs.find(x=>/經度/.test(x.placeholder||'')||/(lng|lon)/i.test(x.id||''));
    return {lat,lng};
  }
  function parseCoords(v){
    const m=String(v||'').trim().match(/(-?\d{1,3}(?:\.\d+)?)\s*[,，]\s*(-?\d{1,3}(?:\.\d+)?)/);
    if(!m)return null;const lat=Number(m[1]),lng=Number(m[2]);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return null;
    return {lat,lng};
  }
  function decorateCoordPaste(){
    const {lat,lng}=coordInputs();if(!lat||!lng)return;
    const host=lat.parentElement?.parentElement||lat.parentElement;if(!host||$('editCoordPaste'))return;
    const wrap=document.createElement('div');wrap.id='editCoordPaste';wrap.style.cssText='margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap';
    const inp=document.createElement('input');inp.type='text';inp.id='editCoordPasteInput';inp.placeholder='貼上 Google Maps 經緯度，例如 24.7828, 125.2951';inp.style.cssText='flex:1;min-width:260px';
    const btn=document.createElement('button');btn.type='button';btn.className='btn alt';btn.textContent='套用經緯度';
    const apply=()=>{const c=parseCoords(inp.value);if(!c)return alert('格式不正確，請貼上「緯度, 經度」，例如 24.7828, 125.2951');lat.value=c.lat;lng.value=c.lng;lat.dispatchEvent(new Event('input',{bubbles:true}));lng.dispatchEvent(new Event('input',{bubbles:true}));inp.value=`${c.lat}, ${c.lng}`};
    btn.onclick=apply;inp.addEventListener('paste',()=>setTimeout(()=>{if(parseCoords(inp.value))apply()},0));
    wrap.append(inp,btn);host.insertAdjacentElement('afterend',wrap);
  }
  function decorateEditor(){
    const input=$('editPlaceSearch');
    if(input){let btn=$('editGoogleMapsSearchBtn');if(!btn){btn=document.createElement('button');btn.id='editGoogleMapsSearchBtn';btn.type='button';btn.className='btn alt';btn.textContent='Google Maps';btn.onclick=()=>openGoogleMapsSearch([input.value,$('editItemAddress')?.value,tripContext()].filter(Boolean).join(' '));input.parentElement?.appendChild(btn)}}
    decorateCoordPaste();
  }
  function decorateTimeline(){
    const arr=typeof trip==='function'?(trip()?.itinerary?.[curDate]||[]):[];const rows=[...document.querySelectorAll('#timeline .item')];
    rows.forEach((row,i)=>{const item=arr[i];if(!item)return;let b=row.querySelector('.gmaps-item-btn');const actions=row.querySelector('.row');if(!actions)return;if(!b){b=document.createElement('button');b.type='button';b.className='btn sm alt gmaps-item-btn';b.textContent='Google Maps';actions.prepend(b)}b.onclick=()=>openGoogleMapsForItem(item.id)})
  }
  function decorateMapCard(){const map=$('map');const card=map?.closest('.card');if(!card)return;let b=$('openTripGoogleMaps');if(b)return;b=document.createElement('button');b.id='openTripGoogleMaps';b.className='btn sm alt';b.style.marginBottom='10px';b.textContent='在 Google Maps 開啟';b.onclick=()=>openGoogleMapsSearch(tripContext());const h=card.querySelector('h3');h?.insertAdjacentElement('afterend',b)}
  function run(){decorateEditor();decorateTimeline();decorateMapCard()}
  const oldEdit=window.editItineraryItem;if(oldEdit&&!oldEdit.__gmaps30){const w=function(){const r=oldEdit.apply(this,arguments);setTimeout(decorateEditor,0);return r};w.__gmaps30=true;window.editItineraryItem=w}
  const oldRender=window.renderItinerary;if(oldRender&&!oldRender.__gmaps30){const w=function(){const r=oldRender.apply(this,arguments);setTimeout(()=>{decorateTimeline();decorateMapCard()},0);return r};w.__gmaps30=true;window.renderItinerary=w}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(run,400));setTimeout(run,600);setInterval(run,1500);
})();