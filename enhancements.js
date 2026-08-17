/* My Travel enhancements v9: edit/delete, live nearby POI, daily JPY/TWD */
(() => {
  const liveRecCache = {};
  const liveRecLoading = {};
  const FX_CHECK_KEY = 'myTravel_fx_last_check';

  function escHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function currentTripBySelect(id){return state.trips.find(x=>x.id===document.getElementById(id)?.value)||trip()}

  // ---- Itinerary edit/delete ----
  const originalRenderItinerary = window.renderItinerary;
  window.renderItinerary = function(){
    originalRenderItinerary();
    const arr = trip().itinerary[curDate] || [];
    document.querySelectorAll('#timeline .item').forEach((row,idx)=>{
      const action = row.lastElementChild;
      if(!action || row.querySelector('.edit-itinerary')) return;
      const wrap=document.createElement('div'); wrap.className='row';
      const edit=document.createElement('button'); edit.className='btn sm alt edit-itinerary'; edit.textContent='編輯'; edit.onclick=()=>editItineraryItem(arr[idx]?.id);
      action.parentNode.insertBefore(wrap,action); wrap.appendChild(edit); wrap.appendChild(action);
    });
    installNearbyHeader();
    renderLiveRecommendations();
    maybeFetchNearby(false);
  };

  window.editItineraryItem = function(id){
    const item=(trip().itinerary[curDate]||[]).find(x=>x.id===id); if(!item)return;
    const title=prompt('行程名稱',item.title); if(title===null)return;
    const time=prompt('時間（HH:MM）',item.time||'10:00'); if(time===null)return;
    const type=prompt('類型',item.type||'景點'); if(type===null)return;
    const note=prompt('備註',item.note||''); if(note===null)return;
    item.title=title.trim()||item.title; item.time=time.trim()||item.time; item.type=type.trim()||item.type; item.note=note.trim(); save();
  };

  // ---- Checklist edit/delete ----
  window.renderChecks = function(){
    const t=currentTripBySelect('checkTripSelect'); const el=document.getElementById('checkRows');
    el.innerHTML=t.checks.map(i=>`<div class="check ${i.done?'done':''}"><input type="checkbox" ${i.done?'checked':''} onchange="toggleCheck('${t.id}','${i.id}')"><span style="flex:1">${escHtml(i.name)}</span><button class="btn sm alt" onclick="editCheck('${t.id}','${i.id}')">編輯</button><button class="btn sm red" onclick="deleteCheck('${t.id}','${i.id}')">刪除</button></div>`).join('');
  };
  window.editCheck=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;const v=prompt('編輯行前項目',i.name);if(v===null)return;if(v.trim())i.name=v.trim();save()};
  window.deleteCheck=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.checks.find(x=>x.id===id);if(!i)return;if(!confirm(`刪除「${i.name}」？`))return;t.checks=t.checks.filter(x=>x.id!==id);save()};

  // ---- Shopping edit/delete ----
  window.renderShops = function(){
    const t=currentTripBySelect('shopTripSelect'); const el=document.getElementById('shopRows');
    el.innerHTML=t.shops.map(i=>`<div class="check ${i.done?'done':''}"><input type="checkbox" ${i.done?'checked':''} onchange="toggleShop('${t.id}','${i.id}')"><span style="flex:1">${escHtml(i.name)}</span><button class="btn sm alt" onclick="editShop('${t.id}','${i.id}')">編輯</button><button class="btn sm red" onclick="deleteShop('${t.id}','${i.id}')">刪除</button></div>`).join('');
  };
  window.editShop=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.shops.find(x=>x.id===id);if(!i)return;const v=prompt('編輯購物項目',i.name);if(v===null)return;if(v.trim())i.name=v.trim();save()};
  window.deleteShop=function(tid,id){const t=state.trips.find(x=>x.id===tid),i=t?.shops.find(x=>x.id===id);if(!i)return;if(!confirm(`刪除「${i.name}」？`))return;t.shops=t.shops.filter(x=>x.id!==id);save()};

  // ---- Expense edit/delete + FX status ----
  window.renderMoney = function(){
    let sum=0; const rows=document.getElementById('expenseRows');
    rows.innerHTML=state.expenses.map(e=>{sum+=+e.amount;let t=state.trips.find(x=>x.id===e.tripId);return `<tr><td>${escHtml(t?.name||'')}</td><td>${e.date}</td><td>${escHtml(e.cat)}</td><td>${escHtml(e.name)}</td><td>¥${(+e.amount).toLocaleString()}</td><td>NT$${Math.round(e.amount*state.rate).toLocaleString()}</td><td><div class="row"><button class="btn sm alt" onclick="editExpense('${e.id}')">編輯</button><button class="btn sm red" onclick="delExpense('${e.id}')">刪除</button></div></td></tr>`}).join('');
    document.getElementById('sumJPY').textContent='¥'+sum.toLocaleString(); document.getElementById('sumTWD').textContent='NT$'+Math.round(sum*state.rate).toLocaleString(); document.getElementById('sumCount').textContent=state.expenses.length; document.getElementById('rate').value=state.rate; if(!document.getElementById('eDate').value)document.getElementById('eDate').value=trip().start;
    installFxStatus();
  };
  window.editExpense=function(id){const e=state.expenses.find(x=>x.id===id);if(!e)return;const date=prompt('日期 YYYY-MM-DD',e.date);if(date===null)return;const cat=prompt('分類',e.cat);if(cat===null)return;const name=prompt('項目',e.name);if(name===null)return;const amount=prompt('JPY 金額',e.amount);if(amount===null)return;const n=parseFloat(amount);if(!Number.isFinite(n)||n<=0)return alert('金額格式不正確');e.date=date.trim()||e.date;e.cat=cat.trim()||e.cat;e.name=name.trim()||e.name;e.amount=n;save()};

  function installFxStatus(){
    const rate=document.getElementById('rate'); if(!rate)return; const card=rate.closest('.card'); if(!card)return;
    let box=card.querySelector('#fxStatus'); if(!box){box=document.createElement('div');box.id='fxStatus';box.style.marginTop='7px';card.appendChild(box)}
    box.innerHTML=`<div class="muted">每日網路參考匯率${state.fxDate?` · 資料日 ${state.fxDate}`:''}</div><button class="btn sm alt" style="margin-top:6px" onclick="refreshDailyFx(true)">↻ 更新匯率</button>`;
  }

  window.refreshDailyFx=async function(force=false){
    const today=new Date().toISOString().slice(0,10); if(!force&&localStorage.getItem(FX_CHECK_KEY)===today)return;
    try{
      const r=await fetch('https://api.frankfurter.dev/v2/rate/JPY/TWD',{cache:'no-store'}); if(!r.ok)throw new Error('匯率服務 '+r.status);
      const data=await r.json(); const rate=Number(data.rate); if(!Number.isFinite(rate))throw new Error('匯率資料格式錯誤');
      state.rate=rate; state.fxDate=data.date||today; localStorage.setItem(FX_CHECK_KEY,today); state._updatedAt=new Date().toISOString(); localStorage.setItem(LS,JSON.stringify(state)); renderMoney(); if(sb)pushCloud();
    }catch(e){console.warn('FX update failed',e); if(force)alert('目前無法取得網路匯率，已保留原本匯率。')}
  };

  // ---- Live nearby recommendations via OpenStreetMap Overpass ----
  function installNearbyHeader(){
    const grid=document.getElementById('recGrid'); const head=grid?.closest('.card')?.querySelector('.row.between'); if(!head)return;
    let btn=head.querySelector('#nearbyRefresh'); if(!btn){const right=head.lastElementChild;if(right)right.remove();btn=document.createElement('button');btn.id='nearbyRefresh';btn.className='btn sm alt';btn.onclick=()=>maybeFetchNearby(true);head.appendChild(btn)}
    btn.textContent=liveRecLoading[curTrip]?'搜尋中…':'↻ 網路更新'; btn.disabled=!!liveRecLoading[curTrip];
  }
  function poiType(tags){if(tags.tourism==='viewpoint')return '展望景點';if(tags.tourism==='museum')return '博物館';if(tags.tourism==='attraction')return '景點';if(tags.amenity==='cafe')return '咖啡廳';if(tags.amenity==='restaurant')return '餐廳';return '附近景點'}
  function renderLiveRecommendations(){
    const data=liveRecCache[curTrip]?.items; if(!data?.length)return; const el=document.getElementById('recGrid');
    el.innerHTML=data.map((r,idx)=>`<div class="rec"><b>${escHtml(r.name)}</b><div class="muted">${escHtml(r.note)}</div><div class="row" style="margin-top:7px"><button class="btn sm" onclick="addLiveRec(${idx})">＋加入</button><button class="btn sm alt" onclick="map.setView([${r.lat},${r.lng}],15)">地圖</button></div></div>`).join('');
  }
  window.addLiveRec=function(idx){const r=liveRecCache[curTrip]?.items?.[idx];if(!r)return;trip().itinerary[curDate].push({id:crypto.randomUUID(),time:'10:00',title:r.name,type:r.type,note:r.note,lat:r.lat,lng:r.lng});save()};
  window.maybeFetchNearby=async function(force=false){
    const t=trip(), cached=liveRecCache[t.id]; if(!force&&cached&&Date.now()-cached.time<30*60*1000){renderLiveRecommendations();return} if(liveRecLoading[t.id])return;
    liveRecLoading[t.id]=true;installNearbyHeader();
    try{
      const [lat,lng]=t.center; const q=`[out:json][timeout:20];(nwr(around:10000,${lat},${lng})[tourism~"attraction|viewpoint|museum|gallery"];nwr(around:10000,${lat},${lng})[amenity~"cafe|restaurant"];);out center tags 40;`;
      const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q)}); if(!r.ok)throw new Error('Overpass '+r.status); const data=await r.json();
      const seen=new Set(),items=[]; for(const x of data.elements||[]){const tags=x.tags||{},name=tags['name:zh']||tags['name:ja']||tags.name;if(!name||seen.has(name))continue;const plat=x.lat??x.center?.lat,plng=x.lon??x.center?.lon;if(!Number.isFinite(plat)||!Number.isFinite(plng))continue;seen.add(name);const type=poiType(tags);items.push({name,type,note:`網路即時 POI · ${type}`,lat:plat,lng:plng});if(items.length>=12)break}
      if(items.length)liveRecCache[t.id]={items,time:Date.now()}; renderLiveRecommendations();
    }catch(e){console.warn('Nearby search failed',e);if(force)alert('目前無法取得網路附近推薦，已保留原本推薦。')}finally{liveRecLoading[t.id]=false;installNearbyHeader()}
  };

  window.addEventListener('load',()=>{setTimeout(()=>refreshDailyFx(false),1200);setTimeout(()=>{try{renderAll()}catch(e){}},100)});
})();