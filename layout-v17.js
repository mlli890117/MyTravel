/* My Travel compact layout v20 */
(() => {
  const $=id=>document.getElementById(id);
  let nearbyExpanded=false;
  function compactNearby(){
    const grid=$('recGrid');if(!grid)return;const card=grid.closest('.card');if(!card)return;const items=[...grid.children];
    items.forEach((el,i)=>{el.style.display=(nearbyExpanded||i<4)?'block':'none'});let more=card.querySelector('#nearbyMoreBtn');
    if(items.length>4){if(!more){more=document.createElement('button');more.id='nearbyMoreBtn';more.className='btn alt';more.style.width='100%';more.style.marginTop='10px';more.onclick=()=>{nearbyExpanded=!nearbyExpanded;compactNearby()};card.appendChild(more)}more.textContent=nearbyExpanded?'收合推薦':`顯示更多（${items.length-4}）`;more.style.display='block'}else if(more)more.style.display='none';
  }
  function applyLayout(){
    const tools=$('tripTools');if(tools){tools.style.display='grid';tools.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';tools.style.gap='16px';tools.style.alignItems='start';tools.style.marginTop='16px';[...tools.children].forEach(c=>{c.style.marginTop='0';c.style.minWidth='0'});const emergency=$('tripEmergencyCard');if(emergency)emergency.style.gridColumn='span 1';[...tools.querySelectorAll('.card')].forEach(card=>{const title=card.querySelector('h2')?.textContent?.trim()||'';if(['航班／住宿','行前清單','購物清單'].includes(title)){card.style.maxHeight='420px';card.style.overflow='auto'}})}
    compactNearby();if(!$('compact-layout-style')){const st=document.createElement('style');st.id='compact-layout-style';st.textContent=`#tripTools .card{box-shadow:0 8px 24px rgba(15,23,42,.06)}#tripTools .setting{padding:10px;margin-top:8px}#tripTools .check{padding:7px 0}#tripTools .btn.sm{padding:5px 8px}#tripEmergencyCard .grid.g2{gap:8px}#tripEmergencyCard .setting{margin-top:0}#recGrid .rec{padding:9px 10px}#recGrid .rec b{font-size:14px}#recGrid .rec .muted{font-size:12px;line-height:1.3}#recGrid .rec .row{margin-top:5px!important}#nearbyMoreBtn{font-size:13px}@media(max-width:900px){#tripTools{grid-template-columns:1fr!important}}`;document.head.appendChild(st)}
  }
  const oldRenderAll=window.renderAll;if(oldRenderAll&&!oldRenderAll.__layout19){const wrapped=function(){const r=oldRenderAll.apply(this,arguments);setTimeout(applyLayout,0);return r};wrapped.__layout19=true;window.renderAll=wrapped}
  const oldNearby=window.renderItinerary;if(oldNearby&&!oldNearby.__layout19){const wrapped=function(){const r=oldNearby.apply(this,arguments);setTimeout(compactNearby,80);return r};wrapped.__layout19=true;window.renderItinerary=wrapped}
  window.addEventListener('resize',applyLayout);document.addEventListener('DOMContentLoaded',()=>setTimeout(applyLayout,300));setTimeout(applyLayout,500);setInterval(compactNearby,1200);
  if(!document.querySelector('script[data-money-v19]')){const s=document.createElement('script');s.src='./money-v19.js?v=19';s.dataset.moneyV19='1';document.body.appendChild(s)}
  if(!document.querySelector('script[data-mobile-v20]')){const s=document.createElement('script');s.src='./mobile-v20.js?v=20';s.dataset.mobileV20='1';document.body.appendChild(s)}
  if(!document.querySelector('script[data-gmaps-v27]')){const s=document.createElement('script');s.src='./google-maps-v27.js?v=27';s.dataset.gmapsV27='1';document.body.appendChild(s)}
})();