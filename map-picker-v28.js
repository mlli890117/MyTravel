/* My Travel map point picker v28 */
(() => {
  const $=id=>document.getElementById(id);
  let pickerMap=null,pickerMarker=null;

  function ensurePickerModal(){
    if($('mapPickerModal'))return;
    const m=document.createElement('div');m.id='mapPickerModal';m.className='modal';
    m.innerHTML=`<div class="modalbox" style="width:min(820px,100%)"><div class="row between"><div><h2 style="margin:0">地圖點選定位</h2><div class="muted">在地圖上點一下正確位置，座標會自動帶回行程。</div></div><button class="btn alt" onclick="closeMapPicker()">✕</button></div><div id="mapPickerMap" style="height:480px;border-radius:14px;margin-top:14px"></div><div id="mapPickerCoords" class="note good" style="margin-top:12px">尚未選擇位置</div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn alt" onclick="closeMapPicker()">取消</button><button class="btn" id="mapPickerUseBtn" onclick="useMapPickerPoint()" disabled>使用這個位置</button></div></div>`;
    m.addEventListener('click',e=>{if(e.target===m)closeMapPicker()});document.body.appendChild(m);
  }

  function centerForPicker(){
    const lat=Number($('editItemLat')?.value),lng=Number($('editItemLng')?.value);
    if(Number.isFinite(lat)&&Number.isFinite(lng))return[lat,lng,14];
    const c=typeof trip==='function'?trip()?.center:null;
    if(Array.isArray(c)&&c.length===2)return[Number(c[0]),Number(c[1]),11];
    return[24.805,125.281,10];
  }

  window.openMapPicker=function(){
    ensurePickerModal();$('mapPickerModal').classList.add('show');
    setTimeout(()=>{
      const [lat,lng,z]=centerForPicker();
      if(pickerMap){pickerMap.remove();pickerMap=null;pickerMarker=null}
      pickerMap=L.map('mapPickerMap').setView([lat,lng],z);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(pickerMap);
      const oldLat=Number($('editItemLat')?.value),oldLng=Number($('editItemLng')?.value);
      if(Number.isFinite(oldLat)&&Number.isFinite(oldLng)){pickerMarker=L.marker([oldLat,oldLng]).addTo(pickerMap);$('mapPickerCoords').textContent=`目前位置：${oldLat.toFixed(6)}, ${oldLng.toFixed(6)}`;$('mapPickerUseBtn').disabled=false}
      pickerMap.on('click',e=>{const {lat,lng}=e.latlng;if(pickerMarker)pickerMarker.setLatLng(e.latlng);else pickerMarker=L.marker(e.latlng).addTo(pickerMap);$('mapPickerCoords').textContent=`已選擇：${lat.toFixed(6)}, ${lng.toFixed(6)}`;$('mapPickerUseBtn').dataset.lat=lat;$('mapPickerUseBtn').dataset.lng=lng;$('mapPickerUseBtn').disabled=false});
      pickerMap.invalidateSize();
    },100);
  };
  window.closeMapPicker=function(){$('mapPickerModal')?.classList.remove('show')};
  window.useMapPickerPoint=function(){const b=$('mapPickerUseBtn');const lat=Number(b.dataset.lat || pickerMarker?.getLatLng().lat),lng=Number(b.dataset.lng || pickerMarker?.getLatLng().lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return;$('editItemLat').value=lat.toFixed(6);$('editItemLng').value=lng.toFixed(6);closeMapPicker()};

  function decorateEditor(){
    const search=$('editPlaceSearch');if(!search||$('mapPickerBtn'))return;
    const row=search.parentElement;if(!row)return;
    const b=document.createElement('button');b.id='mapPickerBtn';b.type='button';b.className='btn alt';b.textContent='地圖點選';b.onclick=openMapPicker;row.appendChild(b);
    const hint=document.createElement('div');hint.className='muted';hint.style.marginTop='6px';hint.textContent='搜尋不到時，可直接按「地圖點選」在目前旅遊地區選位置。';row.parentElement.appendChild(hint);
  }

  const oldEdit=window.editItineraryItem;
  if(oldEdit&&!oldEdit.__picker28){const w=function(){const r=oldEdit.apply(this,arguments);setTimeout(decorateEditor,0);return r};w.__picker28=true;window.editItineraryItem=w}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(decorateEditor,500));setInterval(decorateEditor,1200);
})();