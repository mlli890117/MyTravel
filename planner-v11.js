/* My Travel planner v12 */
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label=d=>{const x=new Date(d+'T12:00:00');return `${x.getMonth()+1}/${x.getDate()}（${'日一二三四五六'[x.getDay()]}）`};
  const sortItems=a=>[...(a||[])].sort((x,y)=>(x.time||'99:99').localeCompare(y.time||'99:99'));
  const sortedDates=t=>[...(t.dayOrder||Object.keys(t.itinerary||{}))].sort();

  function ensureDays(t){
    if(!Array.isArray(t.dayOrder)||!t.dayOrder.length){
      t.dayOrder=[];
      let d=new Date(t.start+'T12:00:00'),e=new Date(t.end+'T12:00:00');
      while(d<=e){t.dayOrder.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
    }
    t.dayOrder=[...new Set(t.dayOrder)].sort();
    t.dayOrder.forEach(d=>{if(!Array.isArray(t.itinerary[d]))t.itinerary[d]=[]});
  }
  state.trips.forEach(ensureDays);

  // ---------- Itinerary / date management ----------
  window.renderItinerary=function(){
    const t=trip(); ensureDays(t);
    if(!t.dayOrder.includes(curDate))curDate=t.dayOrder[0];
    t.itinerary[curDate]=sortItems(t.itinerary[curDate]);

    $('tripTitle').textContent=`${t.emoji||'✈️'} ${t.name}`;
    $('tripRange').textContent=`${t.start} ～ ${t.end} · ${t.theme||''}`;

    $('dayTabs').innerHTML=t.dayOrder.map(d=>`<button class="tab ${d===curDate?'active':''}" onclick="curDate='${d}';renderItinerary()">${label(d)}</button>`).join('')+
      `<button class="tab" style="border-style:dashed" onclick="addTripDate()">＋ 日期</button>`+
      `<button class="tab" onclick="editTripDate()">✎ 編輯日期</button>`+
      `<button class="tab" style="color:#b42318" onclick="deleteTripDate()">− 刪除日期</button>`;

    $('dayTitle').textContent=label(curDate);
    const arr=t.itinerary[curDate]||[];
    $('timeline').innerHTML=arr.length?arr.map(i=>`<div class="item"><div class="time">${esc(i.time||'—')}</div><div><div class="title">${esc(i.title)}</div><div class="meta">${esc(i.type||'')}${i.note?' · '+esc(i.note):''}</div></div><div class="row"><button class="btn sm alt" onclick="editItineraryItem('${i.id}')">編輯</button><button class="btn sm red" onclick="delItem('${i.id}')">刪除</button></div></div>`).join(''):'<div class="empty">這天還沒有行程</div>';

    try{renderMap()}catch(e){console.warn(e)}
    try{maybeFetchNearby(false)}catch(e){}
    syncTripTools();
  };

  window.addTripDate=function(){
    const t=trip();ensureDays(t);
    const d=prompt('新增日期（YYYY-MM-DD）',t.dayOrder[t.dayOrder.length-1]);
    if(!d)return;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return alert('日期格式請使用 YYYY-MM-DD');
    if(t.dayOrder.includes(d))return alert('這個日期已存在');
    t.dayOrder.push(d);t.dayOrder.sort();t.itinerary[d]=[];
    t.start=t.dayOrder[0];t.end=t.dayOrder[t.dayOrder.length-1];curDate=d;save();
  };
  window.editTripDate=function(){
    const t=trip();ensureDays(t);
    const old=curDate;
    const d=prompt('修改目前日期（YYYY-MM-DD）',old);
    if(!d||d===old)return;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return alert('日期格式請使用 YYYY-MM-DD');
    if(t.dayOrder.includes(d))return alert('這個日期已存在');
    t.itinerary[d]=t.itinerary[old]||[];delete t.itinerary[old];
    t.dayOrder=t.dayOrder.map(x=>x===old?d:x).sort();
    t.start=t.dayOrder[0];t.end=t.dayOrder[t.dayOrder.length-1];curDate=d;save();
  };
  window.deleteTripDate=function(){
    const t=trip();ensureDays(t);
    if(t.dayOrder.length<=1)return alert('至少要保留一天');
    const n=(t.itinerary[curDate]||[]).length;
    if(!confirm(`確定刪除 ${curDate}？${n?`\n這一天有 ${n} 筆行程，也會一起刪除。`:''}`))return;
    delete t.itinerary[curDate];t.dayOrder=t.dayOrder.filter(d=>d!==curDate);
    t.start=t.dayOrder[0];t.end=t.dayOrder[t.dayOrder.length-1];curDate=t.dayOrder[0];save();
  };

  // Ensure all additions are sorted immediately.
  const oldAddItem=window.addItem;
  window.addItem=function(){oldAddItem();if(trip()?.itinerary?.[curDate]){trip().itinerary[curDate]=sortItems(trip().itinerary[curDate]);localStorage.setItem(LS,JSON.stringify(state));renderItinerary()}};
  const oldAddRec=window.addRec;
  window.addRec=function(r){oldAddRec(r);if(trip()?.itinerary?.[curDate]){trip().itinerary[curDate]=sortItems(trip().itinerary[curDate]);localStorage.setItem(LS,JSON.stringify(state));renderItinerary()}};
  if(window.addLiveRec){const old=window.addLiveRec;window.addLiveRec=function(i){old(i);if(trip()?.itinerary?.[curDate]){trip().itinerary[curDate]=sortItems(trip().itinerary[curDate]);localStorage.setItem(LS,JSON.stringify(state));renderItinerary()}}}

  // ---------- Move trip tools into Itinerary ----------
  function cardByHeading(text){return [...document.querySelectorAll('#more .card')].find(c=>[...c.querySelectorAll('h2')].some(h=>h.textContent.trim()===text))}
  function setupTripTools(){
    if($('tripTools'))return;
    const itinerary=$('itinerary'),layout=itinerary?.querySelector('.itlayout');if(!layout)return;
    const tools=document.createElement('div');tools.id='tripTools';tools.className='grid g2';tools.style.marginTop='16px';layout.after(tools);
    ['航班／住宿','行前清單','購物清單'].forEach(h=>{const c=cardByHeading(h);if(c)tools.appendChild(c)});
    ['checkTripSelect','shopTripSelect'].forEach(id=>{const e=$(id);if(e)e.style.display='none'});
  }
  function syncTripTools(){
    ['checkTripSelect','shopTripSelect'].forEach(id=>{const e=$(id);if(e)e.value=curTrip});
    try{renderChecks()}catch(e){}
    try{renderShops()}catch(e){}
    renderBookings();
  }

  // ---------- Flight / hotel CRUD ----------
  function renderBookings(){
    const box=$('bookingInfo');if(!box)return;const t=trip();
    box.innerHTML=`<div class="row between"><b>航班</b><button class="btn sm" onclick="addFlight()">＋新增</button></div>`+
      ((t.flights||[]).map((f,i)=>`<div class="setting"><div class="row between"><div><b>${esc(f.dir||'航班')}</b> · ${esc(f.date||'')}<div>${esc(f.route||'')}</div><div class="muted">${esc(f.time||'')}</div></div><div class="row"><button class="btn sm alt" onclick="editFlight(${i})">編輯</button><button class="btn sm red" onclick="deleteFlight(${i})">刪除</button></div></div></div>`).join('')||'<div class="empty">尚未新增航班</div>')+
      `<div class="row between" style="margin-top:18px"><b>住宿</b><button class="btn sm" onclick="addHotel()">＋新增</button></div>`+
      ((t.hotels||[]).map((h,i)=>`<div class="setting"><div class="row between"><div><b>${esc(h.name||'住宿')}</b><div>${esc(h.from||'')} ～ ${esc(h.to||'')}</div><div class="muted">${esc(h.note||'')}</div></div><div class="row"><button class="btn sm alt" onclick="editHotel(${i})">編輯</button><button class="btn sm red" onclick="deleteHotel(${i})">刪除</button></div></div></div>`).join('')||'<div class="empty">尚未新增住宿</div>');
  }
  function askFlight(f={}){const dir=prompt('航班類型',f.dir||'去程');if(dir===null)return;const date=prompt('日期 YYYY-MM-DD',f.date||curDate);if(date===null)return;const route=prompt('航線',f.route||'');if(route===null)return;const time=prompt('時間／備註',f.time||'');if(time===null)return;return{dir,date,route,time}}
  window.addFlight=()=>{const f=askFlight();if(f){trip().flights.push(f);save()}};
  window.editFlight=i=>{const f=askFlight(trip().flights[i]);if(f){trip().flights[i]=f;save()}};
  window.deleteFlight=i=>{if(confirm('確定刪除此航班？')){trip().flights.splice(i,1);save()}};
  function askHotel(h={}){const name=prompt('住宿名稱',h.name||'');if(name===null)return;const from=prompt('入住日期',h.from||trip().start);if(from===null)return;const to=prompt('退房日期',h.to||trip().end);if(to===null)return;const note=prompt('備註',h.note||'');if(note===null)return;return{name,from,to,note}}
  window.addHotel=()=>{const h=askHotel();if(h){trip().hotels.push(h);save()}};
  window.editHotel=i=>{const h=askHotel(trip().hotels[i]);if(h){trip().hotels[i]=h;save()}};
  window.deleteHotel=i=>{if(confirm('確定刪除此住宿？')){trip().hotels.splice(i,1);save()}};

  // ---------- Dynamic emergency contacts ----------
  const emergency={
    jp:{name:'日本',police:'110',fire:'119',ambulance:'119',extra:'JNTO 旅客熱線 050-3816-2787'},
    tw:{name:'台灣',police:'110',fire:'119',ambulance:'119',extra:'旅外國人急難救助 0800-024-111'},
    kr:{name:'韓國',police:'112',fire:'119',ambulance:'119',extra:'旅遊諮詢 1330'},
    us:{name:'美國',police:'911',fire:'911',ambulance:'911',extra:''},
    gb:{name:'英國',police:'999 / 112',fire:'999 / 112',ambulance:'999 / 112',extra:''},
    fr:{name:'法國',police:'17',fire:'18',ambulance:'15 / 112',extra:''},
    de:{name:'德國',police:'110',fire:'112',ambulance:'112',extra:''},
    it:{name:'義大利',police:'112',fire:'115 / 112',ambulance:'118 / 112',extra:''},
    es:{name:'西班牙',police:'112',fire:'112',ambulance:'112',extra:''},
    au:{name:'澳洲',police:'000',fire:'000',ambulance:'000',extra:''},
    nz:{name:'紐西蘭',police:'111',fire:'111',ambulance:'111',extra:''},
    is:{name:'冰島',police:'112',fire:'112',ambulance:'112',extra:''},
    sg:{name:'新加坡',police:'999',fire:'995',ambulance:'995',extra:''},
    th:{name:'泰國',police:'191',fire:'199',ambulance:'1669',extra:'觀光警察 1155'}
  };
  let emergencyCache={};
  async function updateEmergency(){
    const t=trip();const more=$('more');if(!more)return;
    let card=[...more.querySelectorAll('.card')].find(c=>[...c.querySelectorAll('h2')].some(h=>h.textContent.includes('緊急聯絡')));
    if(!card)return;
    card.querySelector('h2').textContent='緊急聯絡';
    card.innerHTML='<h2>緊急聯絡</h2><div class="muted">正在依目前旅行地點辨識國家…</div>';
    try{
      const key=t.center.join(',');let cc=emergencyCache[key];
      if(!cc){const [lat,lon]=t.center;const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=5&addressdetails=1`,{headers:{'Accept-Language':'zh-TW'}});const j=await r.json();cc=(j.address?.country_code||'').toLowerCase();emergencyCache[key]=cc}
      const e=emergency[cc]||{name:'目前目的地',police:'請查詢當地官方資訊',fire:'請查詢當地官方資訊',ambulance:'請查詢當地官方資訊',extra:''};
      card.innerHTML=`<h2>${esc(e.name)}緊急聯絡</h2><div class="setting"><b>警察 ${esc(e.police)}</b></div><div class="setting"><b>消防 ${esc(e.fire)}</b></div><div class="setting"><b>救護 ${esc(e.ambulance)}</b></div>${e.extra?`<div class="setting"><b>${esc(e.extra)}</b></div>`:''}<div class="muted" style="margin-top:10px">國家依旅行地圖位置自動辨識；緊急號碼請以當地政府最新公告為準。</div>`;
    }catch(e){card.innerHTML='<h2>緊急聯絡</h2><div class="note">目前無法辨識目的地國家，請稍後重新整理。</div>'}
  }

  // When switching trips, keep all trip tools in sync.
  const tripSelect=$('tripSelect');
  if(tripSelect)tripSelect.addEventListener('change',()=>setTimeout(()=>{setupTripTools();syncTripTools();updateEmergency()},0));
  document.querySelectorAll('[data-page="more"]').forEach(b=>b.addEventListener('click',()=>setTimeout(updateEmergency,50)));

  // Override renderAll only to append these modules after the base render.
  const baseRenderAll=window.renderAll;
  window.renderAll=function(){state.trips.forEach(ensureDays);baseRenderAll();setupTripTools();syncTripTools();if($('more')?.classList.contains('active'))updateEmergency()};

  setupTripTools();
  renderItinerary();
  syncTripTools();
})();