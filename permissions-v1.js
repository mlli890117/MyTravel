/* My Travel permission + creator ownership frontend v2 */
(()=>{
 const sb=()=>window.myTravelAuth, profile=()=>window.myTravelCurrentProfile?.()||null, uid=()=>profile()?.user_id||'', admin=()=>window.myTravelIsSuperAdmin?.()===true;
 let permissions=new Set(),loading=false;
 async function load(){if(loading||!sb()||!uid())return;loading=true;try{const [direct,groups]=await Promise.all([sb().from('user_permissions').select('permission_key').eq('user_id',uid()),sb().from('user_permission_groups').select('group_id,permission_group_permissions(permission_key)').eq('user_id',uid())]);if(direct.error)throw direct.error;if(groups.error)throw groups.error;permissions=new Set((direct.data||[]).map(x=>x.permission_key));for(const g of groups.data||[])for(const p of g.permission_group_permissions||[])permissions.add(p.permission_key);window.myTravelPermissions=permissions;window.dispatchEvent(new Event('mytravel-permissions-loaded'));apply()}catch(e){console.warn('permission load',e)}finally{loading=false}}
 function has(key){return admin()||permissions.has(key)}
 function own(row){return admin()||row?.created_by===uid()||row?.owner_user_id===uid()}
 window.myTravelHasPermission=has;window.myTravelCanEditOwned=(row,key)=>admin()||(own(row)&&has(key));window.myTravelReloadPermissions=load;
 function apply(){document.querySelectorAll('.addtrip').forEach(x=>x.style.display=has('trip.add')?'':'none');const add=[...document.querySelectorAll('#itinerary button')].find(b=>b.textContent?.includes('新增'));if(add)add.style.display=has('itinerary.add')?'':'none';window.myTravelApplyPermissionUI?.()}
 window.addEventListener('mytravel-auth-changed',()=>setTimeout(load,250));window.addEventListener('mytravel-permissions-updated',()=>setTimeout(load,80));window.addEventListener('mytravel-v2-loaded',apply);setTimeout(load,1000);
})();