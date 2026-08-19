/* My Travel granular CRUD permission guard v1 */
(()=>{
 const has=k=>window.myTravelHasPermission?.(k)===true,admin=()=>window.myTravelIsSuperAdmin?.()===true,uid=()=>window.myTravelCurrentProfile?.()?.user_id||'';
 const own=r=>admin()||r?.created_by===uid()||r?.owner_user_id===uid();
 const deny=msg=>{alert(msg||'你沒有這項操作權限');return false};
 function wrap(name,check,msg){const old=window[name];if(typeof old!=='function'||old._crudGuard)return;const fn=function(...args){try{if(!admin()&&!check(...args))return deny(msg)}catch(e){console.warn('permission guard',name,e);return deny(msg)}return old.apply(this,args)};fn._crudGuard=true;window[name]=fn}
 function tripById(id){return (state.trips||[]).find(x=>String(x.id)===String(id))}
 function currentTrip(){return tripById(typeof curTrip!=='undefined'?curTrip:null)}
 function itineraryById(id){const t=currentTrip();for(const list of Object.values(t?.itinerary||{})){const r=(list||[]).find(x=>String(x.id)===String(id));if(r)return r}return null}
 function expenseById(id){return (currentTrip()?.expenses||[]).find(x=>String(x.id)===String(id))}
 function checkById(tid,id){return tripById(tid)?.checks?.find(x=>String(x.id)===String(id))}
 function shopById(tid,id){return tripById(tid)?.shops?.find(x=>String(x.id)===String(id))}
 function install(){
  wrap('openTripEditor',id=>id?own(tripById(id))&&has('trip.change_own'):has('trip.add'),'你沒有新增或修改此旅程的權限');
  wrap('saveTrip',()=>{const id=document.getElementById('tmId')?.value;return id?own(tripById(id))&&has('trip.change_own'):has('trip.add')},'你沒有儲存此旅程的權限');
  wrap('deleteTrip',id=>own(tripById(id))&&has('trip.delete_own'),'只能刪除自己建立的旅程');
  wrap('addItem',()=>has('itinerary.add'),'你沒有新增行程的權限');wrap('addRec',()=>has('itinerary.add'),'你沒有新增行程的權限');
  wrap('editItineraryItem',id=>own(itineraryById(id))&&has('itinerary.change_own'),'只能修改自己新增的行程');
  wrap('saveItemEditor',()=>{const id=window.__myTravelEditingItemId;return own(itineraryById(id))&&has('itinerary.change_own')},'只能修改自己新增的行程');
  wrap('delItem',id=>own(itineraryById(id))&&has('itinerary.delete_own'),'只能刪除自己新增的行程');
  wrap('addExpense',()=>has('expense.add'),'你沒有新增記帳的權限');wrap('updateExpenseV2',id=>own(expenseById(id))&&has('expense.change_own'),'只能修改自己新增的記帳');wrap('delExpense',id=>own(expenseById(id))&&has('expense.delete_own'),'只能刪除自己新增的記帳');
  wrap('addCheck',()=>has('check.add'),'你沒有新增待辦的權限');wrap('deleteCheckItem',(tid,id)=>own(checkById(tid,id))&&has('check.delete_own'),'只能刪除自己的待辦');wrap('toggleCheck',(tid,id)=>own(checkById(tid,id))&&has('check.change_own'),'只能修改自己的待辦');wrap('completeOverdueCheck',(tid,id)=>own(checkById(tid,id))&&has('check.change_own'),'只能修改自己的待辦');
  wrap('addShop',()=>has('shop.add'),'你沒有新增購物項目的權限');wrap('deleteMyShop',(tid,id)=>own(shopById(tid,id))&&has('shop.delete_own'),'只能刪除自己的購物項目');wrap('deleteShop',(tid,id)=>own(shopById(tid,id))&&has('shop.delete_own'),'只能刪除自己的購物項目');wrap('toggleMyShop',(tid,id)=>own(shopById(tid,id))&&has('shop.change_own'),'只能修改自己的購物項目');wrap('toggleShop',(tid,id)=>own(shopById(tid,id))&&has('shop.change_own'),'只能修改自己的購物項目');
  window.myTravelCrudPermissionReady=true;window.dispatchEvent(new Event('mytravel-crud-permission-ready'));
 }
 function later(){setTimeout(install,100)}window.addEventListener('mytravel-v2-write-ready',later);window.addEventListener('mytravel-permissions-loaded',later);window.addEventListener('mytravel-v2-loaded',later);setTimeout(install,2600);
})();