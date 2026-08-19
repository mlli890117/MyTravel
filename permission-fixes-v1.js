/* My Travel remaining permission fixes v1 */
(()=>{
 const sb=()=>window.myTravelAuth,has=k=>window.myTravelHasPermission?.(k)===true,admin=()=>window.myTravelIsSuperAdmin?.()===true,uid=()=>window.myTravelCurrentProfile?.()?.user_id||'',tripNow=()=>typeof trip==='function'?trip():(state.trips||[]).find(t=>t.id===curTrip);
 function apply(){
  if(!admin()){document.getElementById('permissionAdminCard')?.remove();document.getElementById('paModal')?.remove()}
  const canAddIt=admin()||has('itinerary.add');
  document.querySelectorAll('#itinerary button').forEach(b=>{const txt=(b.textContent||'').trim();if(txt.includes('＋新增')||txt==='＋新增')b.style.display=canAddIt?'':'none'});
  document.querySelectorAll('#recGrid button').forEach(b=>{if((b.textContent||'').includes('加入'))b.style.display=canAddIt?'':'none'});
  const peopleAdd=document.querySelector('#moneyPeoplePanel button[onclick="openPersonModal()"]');if(peopleAdd)peopleAdd.style.display=(admin()||has('expense.add'))?'':'none';
  document.querySelectorAll('#moneyPeopleList .person-chip button').forEach(b=>b.style.display=(admin()||has('expense.change_own'))?'':'none');
 }
 function guard(name,ok,msg){const old=window[name];if(typeof old!=='function'||old._permFix)return;const fn=function(...args){if(!admin()&&!ok(...args)){alert(msg);return}return old.apply(this,args)};fn._permFix=true;window[name]=fn}
 async function persistNearby(i){if(!admin()&&!has('itinerary.add'))return alert('你沒有新增行程的權限');const t=tripNow();if(!t)return alert('目前沒有旅行');const title=String(i?.name||i?.title||'附近推薦').trim();const row={id:crypto.randomUUID(),trip_id:t.id,trip_date:curDate,item_time:i?.time||'10:00',type:i?.type||'景點',title,note:i?.note||i?.category||'',address:i?.address||'',lat:Number.isFinite(+i?.lat)?+i.lat:null,lng:Number.isFinite(+i?.lng)?+i.lng:null,created_by:uid(),data:{source:'nearby'}};const{error}=await sb().from('trip_itinerary_v2').insert(row);if(error)return alert('加入行程失敗：'+error.message);const pids=(t.memberIds||[]).map(id=>(state.people||[]).find(p=>p.id===id)?.user_id).filter(Boolean);if(pids.length)await sb().from('itinerary_participants_v2').insert(pids.map(user_id=>({itinerary_id:row.id,user_id})));await window.myTravelLoadV2?.()}
 function install(){
  guard('openPersonModal',()=>has('expense.add'),'你沒有新增旅伴的權限');
  guard('deletePerson',()=>has('expense.change_own'),'你沒有修改旅伴的權限');
  guard('addRec',()=>has('itinerary.add'),'你沒有新增行程的權限');
  if(typeof window.addLiveRec==='function'&&!window.addLiveRec._v2Persist){const fn=i=>persistNearby(i);fn._v2Persist=true;window.addLiveRec=fn}
  apply()
 }
 for(const ev of ['mytravel-auth-changed','mytravel-permissions-loaded','mytravel-v2-loaded','mytravel-permissions-updated'])window.addEventListener(ev,()=>setTimeout(install,80));
 const mo=new MutationObserver(()=>requestAnimationFrame(apply));document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}));setTimeout(install,2200)
})();