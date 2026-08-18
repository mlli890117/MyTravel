/* My Travel per-person trip access guard v1 */
(()=>{
 const $=id=>document.getElementById(id);
 const who=()=>window.myTravelPersonName?.()||localStorage.getItem('myTravel_person_name')||'';
 function allowedTrips(){const n=who();return (window.state?.trips||[]).filter(t=>!n||window.myTravelParticipates?.(t,n));}
 function ensureEmpty(id,anchor,msg){let e=$(id);if(!e){e=document.createElement('div');e.id=id;e.className='card empty';e.style.marginTop='16px';anchor?.parentElement?.insertBefore(e,anchor.nextSibling)}e.textContent=msg;return e}
 function clearEmpty(id){$(id)?.remove()}
 function syncSelect(id){const s=$(id);if(!s)return null;const allowed=allowedTrips();const ids=new Set(allowed.map(t=>t.id));for(const o of [...s.options])o.hidden=!ids.has(o.value);if(!ids.has(s.value)){const first=[...s.options].find(o=>ids.has(o.value));if(first){s.value=first.value;s.dispatchEvent(new Event('change',{bubbles:true}))}else s.value=''}return allowed}
 function enforceItinerary(){const page=$('itinerary');if(!page)return;const allowed=syncSelect('tripSelect');const layout=page.querySelector('.itlayout'),head=page.querySelector('.card');if(!allowed?.length){if(layout)layout.style.display='none';$('dayTabs')&&( $('dayTabs').innerHTML='' );$('tripTitle')&&( $('tripTitle').textContent='沒有可查看的旅行' );$('tripRange')&&( $('tripRange').textContent=`目前身分「${who()||'未設定'}」沒有參加任何旅行` );ensureEmpty('noAllowedTripItinerary',head,'這個帳號目前沒有參加任何旅行，因此不顯示行程內容。');return}clearEmpty('noAllowedTripItinerary');if(layout)layout.style.display='grid';const current=window.state?.trips?.find(t=>t.id===$('tripSelect')?.value);if(current&&who()&&!window.myTravelParticipates?.(current,who())){$('tripSelect').value=allowed[0].id;$('tripSelect').dispatchEvent(new Event('change',{bubbles:true}))}}
 function enforceMap(){const page=$('mapPage');if(!page)return;const allowed=syncSelect('mapTripSelect');const card=page.querySelector('.card');if(!allowed?.length){$('bigMap')&&($('bigMap').style.display='none');ensureEmpty('noAllowedTripMap',card,'目前沒有你參加的旅行，因此不顯示旅行地圖。')}else{clearEmpty('noAllowedTripMap');$('bigMap')&&($('bigMap').style.display='block')}}
 function enforceLists(){for(const id of ['checkTripSelect','shopTripSelect'])syncSelect(id)}
 function enforceAll(){try{enforceItinerary();enforceMap();enforceLists()}catch(e){console.warn('trip access guard',e)}}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;setTimeout(enforceAll,60)},true);
 window.addEventListener('mytravel-person-changed',()=>setTimeout(enforceAll,80));
 window.addEventListener('mytravel-travelers-updated',()=>setTimeout(enforceAll,80));
 document.addEventListener('change',e=>{if(['tripSelect','mapTripSelect','checkTripSelect','shopTripSelect'].includes(e.target?.id))setTimeout(enforceAll,40)});
 setInterval(enforceAll,2000);
 setTimeout(enforceAll,1400);
})();