/* My Travel effective permission UI v1 */
(()=>{
 const has=k=>window.myTravelHasPermission?.(k)===true,admin=()=>window.myTravelIsSuperAdmin?.()===true,uid=()=>window.myTravelCurrentProfile?.()?.user_id||'',own=r=>admin()||r?.created_by===uid()||r?.owner_user_id===uid();
 const t=()=>typeof trip==='function'?trip():(state.trips||[]).find(x=>x.id===curTrip);
 function toggle(el,on){if(el)el.style.display=on?'':'none'}
 function apply(){
  document.querySelectorAll('.addtrip').forEach(x=>toggle(x,has('trip.add')));
  const ct=t();document.querySelectorAll('[onclick^="openTripEditor("]').forEach(b=>{const m=b.getAttribute('onclick')?.match(/openTripEditor\(['\"]?([^'\")]+)?/),r=m?.[1]?state.trips.find(x=>String(x.id)===m[1]):null;toggle(b,!r?has('trip.add'):own(r)&&has('trip.change_own'))});
  document.querySelectorAll('[onclick^="deleteTrip("]').forEach(b=>{const m=b.getAttribute('onclick')?.match(/deleteTrip\(['\"]?([^'\")]+)/),r=m?.[1]?state.trips.find(x=>String(x.id)===m[1]):null;toggle(b,!!r&&own(r)&&has('trip.delete_own'))});
  document.querySelectorAll('[onclick="toggleAdd(true)"],#itinerary .btn').forEach(b=>{if(b.textContent?.includes('新增'))toggle(b,has('itinerary.add'))});
  for(const b of document.querySelectorAll('[onclick^="editItineraryItem("]')){const id=(b.getAttribute('onclick')||'').match(/\((?:'|")?([^'"\)]+)/)?.[1],r=Object.values(ct?.itinerary||{}).flat().find(x=>String(x.id)===String(id));toggle(b,!!r&&own(r)&&has('itinerary.change_own'))}
  for(const b of document.querySelectorAll('[onclick^="delItem("]')){const id=(b.getAttribute('onclick')||'').match(/\((?:'|")?([^'"\)]+)/)?.[1],r=Object.values(ct?.itinerary||{}).flat().find(x=>String(x.id)===String(id));toggle(b,!!r&&own(r)&&has('itinerary.delete_own'))}
  const eAdd=document.querySelector('[onclick="addExpense()"]');toggle(eAdd,has('expense.add'));const cAdd=document.querySelector('[onclick="addCheck()"]');toggle(cAdd,has('check.add'));const sAdd=document.querySelector('[onclick="addShop()"]');toggle(sAdd,has('shop.add'));
 }
 window.myTravelApplyPermissionUI=apply;for(const e of ['mytravel-v2-loaded','mytravel-permissions-loaded','mytravel-crud-permission-ready'])window.addEventListener(e,()=>setTimeout(apply,30));const mo=new MutationObserver(()=>requestAnimationFrame(apply));document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}));setTimeout(apply,2600);
})();