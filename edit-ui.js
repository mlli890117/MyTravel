/* My Travel editor + trip emergency v24 */
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let editingId=null;
  let emergencyCache={};

  async function geocodeAddress(address){
    if(!address?.trim())return null;
    try{
      const q=encodeURIComponent(`${address.trim()} ${trip()?.name||''}`.trim());
      const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${q}`,{cache:'no-store',headers:{'Accept-Language':'zh-TW'}});
      if(!r.ok)throw new Error('geocode '+r.status);
      const a=await r.json();if(!a?.[0])return null;
      const lat=Number(a[0].lat),lng=Number(a[0].lon);
      return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
    }catch(e){console.warn('address geocode failed',e);return null}
  }

  function ensureEditorModal(){
    let old=$('itemEditModal');if(old)old.remove();
    const modal=document.createElement('div');modal.id='itemEditModal';modal.className='modal';
    modal.innerHTML=`<div class="modalbox" style="width:min(760px,100%)">
      <div class="row between"><h2>編輯行程</h2><button class="btn alt" type="button" onclick="closeItemEditor()">✕</button></div>
      <div class="form" style="margin-top:14px">
        <div><div class="muted" style="margin-bottom:5px">時間</div><input id="editItemTime" type="time"></div>
        <div class="wide"><div class="muted" style="margin-bottom:5px">行程名稱</div><input id="editItemTitle" placeholder="景點／餐廳／交通"></div>
        <div><div class="muted" style="margin-bottom:5px">類型</div><select id="editItemType"><option>景點</option><option>餐廳</option><option>交通</option><option>住宿</option><option>購物</option><option>滑雪</option><option>其他</option></select></div>
        <div class="wide"><div class="muted" style="margin-bottom:5px">備註</div><input id="editItemNote" placeholder="備註"></div>
        <div class="full"><div class="muted" style="margin-bottom:5px">地址／地點名稱</div><input id="editItemAddress" placeholder="例如：新千歲機場、札幌站、Watermark Hotel Miyakojima"></div>
        <div><div class="muted" style="margin-bottom:5px">緯度（地址找不到時可手動填）</div><input id="editItemLat" type="number" step="any"></div>
        <div><div class="muted" style="margin-bottom:5px">經度（地址找不到時可手動填）</div><input id="editItemLng" type="number" step="any"></div>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn alt" type="button" onclick="closeItemEditor()">取消</button><button class="btn" type="button" onclick="saveItemEditor()">儲存修改</button></div>
    </div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)closeItemEditor()});document.body.appendChild(modal);
  }

  window.editItineraryItem=function(id){
    ensureEditorModal();const item=(trip().itinerary[curDate]||[]).find(x=>x.id===id);if(!item)return;editingId=id;
    $('editItemTime').value=item.time||'10:00';$('editItemTitle').value=item.title||'';$('editItemType').value=item.type||'景點';$('editItemNote').value=item.note||'';$('editItemAddress').value=item.address||'';$('editItemLat').value=item.lat??'';$('editItemLng').value=item.lng??'';
    $('itemEditModal').classList.add('show');setTimeout(()=>$('editItemTitle')?.focus(),50);
  };
  window.closeItemEditor=function(){editingId=null;$('itemEditModal')?.classList.remove('show')};
  window.saveItemEditor=async function(){
    if(!editingId)return;const arr=trip().itinerary[curDate]||[],item=arr.find(x=>x.id===editingId);if(!item)return;
    const title=$('editItemTitle').value.trim();if(!title)return alert('請輸入行程名稱');
    const address=$('editItemAddress').value.trim();let lat=parseFloat($('editItemLat').value),lng=parseFloat($('editItemLng').value),found=null;
    if(address)found=await geocodeAddress(address);if(found){lat=found.lat;lng=found.lng}
    item.time=$('editItemTime').value||'10:00';item.title=title;item.type=$('editItemType').value;item.note=$('editItemNote').value.trim();item.address=address;item.lat=Number.isFinite(lat)?lat:null;item.lng=Number.isFinite(lng)?lng:null;
    arr.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));closeItemEditor();save();
    if(address&&!found)alert('這個地址目前找不到座標，已保留原本／手動填寫的經緯度。');
  };

  const emergency={jp:{name:'日本',police:'110',fire:'119',ambulance:'119',extras:['JNTO 旅客熱線 050-3816-2787']},kr:{name:'韓國',police:'112',fire:'119',ambulance:'119',extras:['韓國旅遊諮詢 1330']},tw:{name:'台灣',police:'110',fire:'119',ambulance:'119',extras:['外來人士服務專線 1990']},us:{name:'美國',police:'911',fire:'911',ambulance:'911',extras:[]},ca:{name:'加拿大',police:'911',fire:'911',ambulance:'911',extras:[]},gb:{name:'英國',police:'999 / 112',fire:'999 / 112',ambulance:'999 / 112',extras:[]},fr:{name:'法國',police:'17 / 112',fire:'18 / 112',ambulance:'15 / 112',extras:[]},de:{name:'德國',police:'110',fire:'112',ambulance:'112',extras:[]},it:{name:'義大利',police:'112',fire:'112',ambulance:'112',extras:[]},es:{name:'西班牙',police:'112',fire:'112',ambulance:'112',extras:[]},is:{name:'冰島',police:'112',fire:'112',ambulance:'112',extras:[]},au:{name:'澳洲',police:'000',fire:'000',ambulance:'000',extras:[]},nz:{name:'紐西蘭',police:'111',fire:'111',ambulance:'111',extras:[]},sg:{name:'新加坡',police:'999',fire:'995',ambulance:'995',extras:[]},th:{name:'泰國',police:'191',fire:'199',ambulance:'1669',extras:['觀光警察 1155']},my:{name:'馬來西亞',police:'999',fire:'999',ambulance:'999',extras:[]},ph:{name:'菲律賓',police:'911',fire:'911',ambulance:'911',extras:[]},vn:{name:'越南',police:'113',fire:'114',ambulance:'115',extras:[]},hk:{name:'香港',police:'999',fire:'999',ambulance:'999',extras:[]},mo:{name:'澳門',police:'999',fire:'999',ambulance:'999',extras:[]}};
  function removeOldEmergency(){const more=$('more');if(!more)return;[...more.querySelectorAll('.card')].forEach(c=>{const h=c.querySelector('h2');if(h&&h.textContent.includes('緊急聯絡'))c.remove()})}
  function ensureEmergencyCard(){let card=$('tripEmergencyCard');if(card)return card;const itinerary=$('itinerary');if(!itinerary)return null;card=document.createElement('div');card.id='tripEmergencyCard';card.className='card';card.style.marginTop='16px';const tools=$('tripTools');if(tools)tools.appendChild(card);else itinerary.appendChild(card);return card}
  function guessCountryFromText(t){const s=`${t.name||''} ${t.theme||''}`.toLowerCase();if(/日本|東京|北海道|札幌|宮古|沖繩|大阪|京都|福岡|仙台|名古屋|japan|tokyo|sapporo|okinawa|osaka|kyoto/.test(s))return'jp';if(/韓國|首爾|釜山|濟州|korea|seoul|busan|jeju/.test(s))return'kr';if(/新加坡|singapore/.test(s))return'sg';if(/冰島|iceland/.test(s))return'is';if(/台灣|taiwan|taipei|台北/.test(s))return'tw';return''}
  async function countryCodeForTrip(t){const key=(t.center||[]).join(',');if(emergencyCache[key])return emergencyCache[key];let cc=guessCountryFromText(t);try{if(Array.isArray(t.center)&&t.center.length===2){const[lat,lon]=t.center,r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=5&addressdetails=1`,{cache:'no-store'});if(r.ok){const j=await r.json();cc=(j.address?.country_code||cc||'').toLowerCase()}}}catch(e){}emergencyCache[key]=cc||'unknown';return emergencyCache[key]}
  async function renderTripEmergency(){removeOldEmergency();const card=ensureEmergencyCard();if(!card)return;const t=trip();card.innerHTML='<h2>緊急聯絡</h2><div class="muted">正在辨識目前旅行國家…</div>';const cc=await countryCodeForTrip(t),e=emergency[cc];if(!e){card.innerHTML='<h2>緊急聯絡</h2><div class="note">目前尚未建立這個國家的緊急電話資料。</div>';return}card.innerHTML=`<div class="row between"><div><h2>${esc(e.name)}緊急聯絡</h2><div class="muted">依目前選擇的旅行「${esc(t.name)}」自動切換</div></div><span class="pill">${cc.toUpperCase()}</span></div><div class="grid g2" style="margin-top:12px"><div class="setting"><b>👮 警察 ${esc(e.police)}</b></div><div class="setting"><b>🚒 消防 ${esc(e.fire)}</b></div><div class="setting"><b>🚑 救護 ${esc(e.ambulance)}</b></div>${e.extras.map(x=>`<div class="setting"><b>☎️ ${esc(x)}</b></div>`).join('')}</div>`}
  window.refreshTripEmergency=renderTripEmergency;
  function hook(){removeOldEmergency();renderTripEmergency();const sel=$('tripSelect');if(sel&&!sel.dataset.emergencyHook){sel.dataset.emergencyHook='1';sel.addEventListener('change',()=>setTimeout(renderTripEmergency,100))}}
  setTimeout(hook,100);
})();