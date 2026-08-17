/* My Travel organizer v10 */
(() => {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function findCardByTitle(title){
    return [...document.querySelectorAll('.card')].find(c=>[...c.querySelectorAll('h2,h3')].some(h=>h.textContent.trim()===title));
  }

  function prepareItineraryWorkspace(){
    const itinerary=$('itinerary');
    const layout=itinerary?.querySelector('.itlayout');
    if(!itinerary||!layout||$('tripTools')) return;

    const tools=document.createElement('div');
    tools.id='tripTools';
    tools.className='grid g2';
    tools.style.marginTop='16px';
    layout.insertAdjacentElement('afterend',tools);

    const checkCard=findCardByTitle('行前清單');
    const shopCard=findCardByTitle('購物清單');
    const bookingCard=findCardByTitle('航班／住宿');
    [bookingCard,checkCard,shopCard].filter(Boolean).forEach(c=>tools.appendChild(c));

    // These sections are now controlled by the main itinerary trip selector.
    const checkSel=$('checkTripSelect'), shopSel=$('shopTripSelect');
    if(checkSel) checkSel.closest('.row')?.querySelector('select')?.style.setProperty('display','none');
    if(shopSel) shopSel.closest('.row')?.querySelector('select')?.style.setProperty('display','none');

    // Keep More focused on safety + cloud sync.
    const more=$('more');
    const grid=more?.querySelector('.grid.g2');
    if(grid && !grid.children.length) grid.remove();
  }

  function syncHiddenTripSelectors(){
    ['checkTripSelect','shopTripSelect'].forEach(id=>{const e=$(id);if(e)e.value=curTrip});
  }

  function bookingHtml(){
    const t=trip();
    const flights=t.flights||[], hotels=t.hotels||[];
    return `
      <div class="row between" style="margin-bottom:10px"><b>航班</b><button class="btn sm" onclick="addFlight()">＋新增航班</button></div>
      ${flights.length?flights.map((f,i)=>`<div class="setting"><div class="row between"><div><b>${esc(f.dir||'航班')}</b> · ${esc(f.date||'')}<div>${esc(f.route||'')}</div><div class="muted">${esc(f.time||'')}</div></div><div class="row"><button class="btn sm alt" onclick="editFlight(${i})">編輯</button><button class="btn sm red" onclick="deleteFlight(${i})">刪除</button></div></div></div>`).join(''):'<div class="empty">尚未新增航班</div>'}
      <div class="row between" style="margin:18px 0 10px"><b>住宿</b><button class="btn sm" onclick="addHotel()">＋新增住宿</button></div>
      ${hotels.length?hotels.map((h,i)=>`<div class="setting"><div class="row between"><div><b>${esc(h.name||'住宿')}</b><div>${esc(h.from||'')} ～ ${esc(h.to||'')}</div><div class="muted">${esc(h.note||'')}</div></div><div class="row"><button class="btn sm alt" onclick="editHotel(${i})">編輯</button><button class="btn sm red" onclick="deleteHotel(${i})">刪除</button></div></div></div>`).join(''):'<div class="empty">尚未新增住宿</div>'}`;
  }

  window.renderBookingManager=function(){
    const box=$('bookingInfo'); if(box) box.innerHTML=bookingHtml();
  };

  function askFlight(existing={}){
    const dir=prompt('航班類型（例如：去程／回程）',existing.dir||'去程'); if(dir===null)return null;
    const date=prompt('日期 YYYY-MM-DD',existing.date||trip().start); if(date===null)return null;
    const route=prompt('航線（例如：台灣 → 宮古島）',existing.route||''); if(route===null)return null;
    const time=prompt('時間／備註（例如：13:00 抵達）',existing.time||''); if(time===null)return null;
    return {dir:dir.trim()||'航班',date:date.trim(),route:route.trim(),time:time.trim()};
  }
  window.addFlight=function(){const f=askFlight();if(!f)return;trip().flights.push(f);save()};
  window.editFlight=function(i){const f=askFlight(trip().flights[i]);if(!f)return;trip().flights[i]=f;save()};
  window.deleteFlight=function(i){const f=trip().flights[i];if(!f)return;if(!confirm(`刪除「${f.dir||'航班'} ${f.route||''}」？`))return;trip().flights.splice(i,1);save()};

  function askHotel(existing={}){
    const name=prompt('住宿名稱',existing.name||'');if(name===null)return null;
    const from=prompt('入住日期 YYYY-MM-DD',existing.from||trip().start);if(from===null)return null;
    const to=prompt('退房日期 YYYY-MM-DD',existing.to||trip().end);if(to===null)return null;
    const note=prompt('備註',existing.note||'');if(note===null)return null;
    return {name:name.trim()||'住宿',from:from.trim(),to:to.trim(),note:note.trim()};
  }
  window.addHotel=function(){const h=askHotel();if(!h)return;trip().hotels.push(h);save()};
  window.editHotel=function(i){const h=askHotel(trip().hotels[i]);if(!h)return;trip().hotels[i]=h;save()};
  window.deleteHotel=function(i){const h=trip().hotels[i];if(!h)return;if(!confirm(`刪除住宿「${h.name}」？`))return;trip().hotels.splice(i,1);save()};

  // Wrap render functions so moved cards always follow the selected trip.
  const oldRenderItinerary=window.renderItinerary;
  window.renderItinerary=function(){
    syncHiddenTripSelectors();
    oldRenderItinerary();
    syncHiddenTripSelectors();
    try{renderChecks()}catch(e){}
    try{renderShops()}catch(e){}
    renderBookingManager();
  };

  const oldRenderMore=window.renderMore;
  window.renderMore=function(){
    syncHiddenTripSelectors();
    oldRenderMore();
    syncHiddenTripSelectors();
    renderBookingManager();
  };

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      prepareItineraryWorkspace();
      syncHiddenTripSelectors();
      try{renderAll()}catch(e){console.error('organizer render',e)}
    },150);
  });
})();