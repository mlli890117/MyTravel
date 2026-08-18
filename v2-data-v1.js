/* My Travel V2 data adapter - RLS protected reads */
(()=>{
 const sb=()=>window.myTravelAuth;
 const uid=()=>window.myTravelCurrentProfile?.()?.user_id||'';
 const clone=x=>JSON.parse(JSON.stringify(x));
 let loading=false;
 async function publicUsers(){try{const {data,error}=await sb().functions.invoke('admin-users',{body:{action:'list_public'}});if(error)throw error;return data?.users||[]}catch(e){console.warn('v2 users',e);return[]}}
 function personMap(users){const old=Array.isArray(state.people)?state.people:[],out=[];for(const u of users){let p=old.find(x=>x.user_id===u.user_id);if(!p)p={id:crypto.randomUUID()};p.user_id=u.user_id;p.name=u.display_name;out.push(p)}return out}
 async function loadV2(){if(loading||!uid()||!sb())return;loading=true;try{
   const [uRes,tRes,mRes,cRes,sRes,iRes,pRes,eRes]=await Promise.all([
     publicUsers(),
     sb().from('trips_v2').select('*').order('start_date'),
     sb().from('trip_members_v2').select('*'),
     sb().from('trip_checks_v2').select('*'),
     sb().from('trip_shops_v2').select('*'),
     sb().from('trip_itinerary_v2').select('*').order('trip_date').order('item_time'),
     sb().from('itinerary_participants_v2').select('*'),
     sb().from('trip_expenses_v2').select('*').order('expense_date')
   ]);
   for(const r of [tRes,mRes,cRes,sRes,iRes,pRes,eRes])if(r.error)throw r.error;
   const users=uRes,people=personMap(users),byUser=id=>people.find(p=>p.user_id===id),members=mRes.data||[],checks=cRes.data||[],shops=sRes.data||[],items=iRes.data||[],parts=pRes.data||[];
   const trips=(tRes.data||[]).map(row=>{
     const base=clone(row.data||{}),memberRows=members.filter(m=>m.trip_id===row.id),memberPeople=memberRows.map(m=>byUser(m.user_id)).filter(Boolean);
     const itinerary={};for(const item of items.filter(i=>i.trip_id===row.id)){const d=item.trip_date;itinerary[d]=itinerary[d]||[];const pp=parts.filter(p=>p.itinerary_id===item.id).map(p=>byUser(p.user_id)?.id).filter(Boolean);itinerary[d].push({id:item.id,time:item.item_time?String(item.item_time).slice(0,5):'',type:item.type||'',title:item.title,note:item.note||'',address:item.address||'',lat:item.lat,lng:item.lng,participantIds:pp,...(item.data||{})})}
     const dayOrder=Array.isArray(base.dayOrder)?base.dayOrder:Object.keys(itinerary).sort();for(const d of dayOrder)itinerary[d]=itinerary[d]||[];
     return {...base,id:row.id,name:row.name,emoji:row.emoji||base.emoji||'✈️',theme:row.theme||base.theme||'',start:row.start_date,end:row.end_date,owner_user_id:row.owner_user_id,memberIds:memberPeople.map(p=>p.id),people:memberPeople.map(p=>({id:p.id,user_id:p.user_id,name:p.name})),checks:checks.filter(c=>c.trip_id===row.id).map(c=>({id:c.id,name:c.name,done:c.done,remindAt:c.remind_at,notifiedAt:c.notified_at,lastNotifiedAt:c.last_notified_at,owner_user_id:c.owner_user_id,ownerName:byUser(c.owner_user_id)?.name||''})),shops:shops.filter(s=>s.trip_id===row.id).map(s=>({id:s.id,name:s.name,done:s.done,owner_user_id:s.owner_user_id,ownerName:byUser(s.owner_user_id)?.name||''})),itinerary,dayOrder};
   });
   const expenses=(eRes.data||[]).map(e=>({id:e.id,tripId:e.trip_id,date:e.expense_date,cat:e.category,name:e.name,amount:Number(e.amount),currency:e.currency,scope:e.scope,created_by:e.created_by}));
   state.people=people;state.trips=trips;state.expenses=expenses;window.state=state;
   if(trips.length&&!trips.some(t=>t.id===curTrip)){curTrip=trips[0].id;curDate=trips[0].start}
   if(!trips.length){curTrip='';curDate=''}
   try{localStorage.setItem('myTravel_v2_snapshot',JSON.stringify({at:new Date().toISOString(),state}))}catch(_){ }
   window.dispatchEvent(new Event('mytravel-v2-loaded'));try{renderAll?.()}catch(_){try{renderHome?.();syncSelects?.();renderItinerary?.();renderMore?.();renderMoney?.()}catch(e){console.warn(e)}}
 }catch(e){console.error('V2 load failed',e);const s=document.getElementById('syncStatus');if(s)s.textContent='V2 載入失敗'}finally{loading=false}}
 window.myTravelLoadV2=loadV2;
 window.addEventListener('mytravel-auth-changed',()=>setTimeout(loadV2,250));
 window.addEventListener('mytravel-users-updated',()=>setTimeout(loadV2,150));
 window.addEventListener('mytravel-cloud-applied',()=>setTimeout(loadV2,80));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(loadV2,50)});
 setTimeout(loadV2,1200);
})();