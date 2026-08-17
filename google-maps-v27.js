/* My Travel Google Maps links v27 */
(() => {
  const $=id=>document.getElementById(id);
  function gmSearchUrl(q){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
  function itemQuery(item){
    if(Number.isFinite(Number(item?.lat))&&Number.isFinite(Number(item?.lng)))return `${item.lat},${item.lng}`;
    return [item?.title,item?.address,typeof trip==='function'?trip()?.name:''].filter(Boolean).join(' ');
  }
  window.openGoogleMapsSearch=function(q){q=(q||'').trim();if(!q)return alert('請先輸入地點名稱');window.open(gmSearchUrl(q),'_blank','noopener,noreferrer')};
  window.openGoogleMapsForItem=function(id){const arr=typeof trip==='function'?(trip()?.itinerary?.[curDate]||[]):[];const item=arr.find(x=>x.id===id);if(!item)return;window.open(gmSearchUrl(itemQuery(item)),'_blank','noopener,noreferrer')};

  function decorateEditor(){
    const input=$('editPlaceSearch');if(!input)return;
    let btn=$('editGoogleMapsSearchBtn');if(!btn){btn=document.createElement('button');btn.id='editGoogleMapsSearchBtn';btn.type='button';btn.className='btn alt';btn.textContent='Google Maps';btn.onclick=()=>openGoogleMapsSearch([input.value,typeof trip==='function'?trip()?.name:''].filter(Boolean).join(' '));input.parentElement?.appendChild(btn)}
  }
  function decorateTimeline(){
    const arr=typeof trip==='function'?(trip()?.itinerary?.[curDate]||[]):[];
    const rows=[...document.querySelectorAll('#timeline .item')];
    rows.forEach((row,i)=>{const item=arr[i];if(!item||row.querySelector('.gmaps-item-btn'))return;const actions=row.querySelector('.row');if(!actions)return;const b=document.createElement('button');b.type='button';b.className='btn sm alt gmaps-item-btn';b.textContent='Google Maps';b.onclick=()=>openGoogleMapsForItem(item.id);actions.prepend(b)})
  }
  function decorateMapCard(){
    const map=$('map');const card=map?.closest('.card');if(!card)return;let b=$('openTripGoogleMaps');if(b)return;b=document.createElement('button');b.id='openTripGoogleMaps';b.className='btn sm alt';b.style.marginBottom='10px';b.textContent='在 Google Maps 開啟';b.onclick=()=>{const t=typeof trip==='function'?trip():null;const q=t?.name||((t?.center||[]).join(','));openGoogleMapsSearch(q)};const h=card.querySelector('h3');h?.insertAdjacentElement('afterend',b)
  }
  function run(){decorateEditor();decorateTimeline();decorateMapCard()}
  const oldEdit=window.editItineraryItem;if(oldEdit&&!oldEdit.__gmaps27){const w=function(){const r=oldEdit.apply(this,arguments);setTimeout(decorateEditor,0);return r};w.__gmaps27=true;window.editItineraryItem=w}
  const oldRender=window.renderItinerary;if(oldRender&&!oldRender.__gmaps27){const w=function(){const r=oldRender.apply(this,arguments);setTimeout(()=>{decorateTimeline();decorateMapCard()},0);return r};w.__gmaps27=true;window.renderItinerary=w}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(run,400));setTimeout(run,600);setInterval(run,1500);
})();