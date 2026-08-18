/* My Travel personal shopping list v2 - authenticated user ownership */
(()=>{
 window.state=state;const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const me=()=>window.myTravelCurrentProfile?.()||null,uid=()=>me()?.user_id||'',name=()=>me()?.display_name||'';
 const person=()=> (state.people||[]).find(p=>p.user_id===uid())||(state.people||[]).find(p=>p.name===name());
 const member=t=>{const p=person();return !!p&&(t.memberIds||[]).includes(p.id)};
 function tFor(sel){const t=(state.trips||[]).find(x=>x.id===$(sel)?.value);return t&&member(t)?t:null}
 function migrate(){for(const t of state.trips||[])for(const i of t.shops||[]){if(!i.owner_user_id){if(i.user_id)i.owner_user_id=i.user_id;else if(i.ownerName){const p=(state.people||[]).find(x=>x.name===i.ownerName);if(p?.user_id)i.owner_user_id=p.user_id}}}}
 const mine=i=>!!uid()&&(i.owner_user_id?i.owner_user_id===uid():i.ownerName===name());
 function hint(){const more=$('more');if(!more)return;let n=$('personalListHint');if(!n){n=document.createElement('div');n.id='personalListHint';n.className='note good';more.querySelector('.grid.g2')?.before(n)}n.innerHTML=name()?`👤 目前登入：<b>${esc(name())}</b>。待辦與購物清單皆為個人資料。`:'⚠️ 請先登入。'}
 window.renderShops=function(){migrate();const rows=$('shopRows');if(!rows)return;const t=tFor('shopTripSelect');hint();if(!t){rows.innerHTML='<div class="empty">目前沒有可查看的旅行購物清單</div>';return}const list=(t.shops||[]).filter(mine);rows.innerHTML=list.length?list.map(i=>`<div class="check ${i.done?'done':''}"><input type="checkbox" ${i.done?'checked':''} onchange="toggleMyShop('${t.id}','${i.id}',this.checked)"><span style="flex:1">${esc(i.name)}</span><button class="btn sm alt" onclick="editMyShop('${t.id}','${i.id}')">編輯</button><button class="btn sm red" onclick="deleteMyShop('${t.id}','${i.id}')">刪除</button></div>`).join(''):'<div class="empty">你在這趟旅行還沒有購物項目</div>'};
 function getMine(tid,id){migrate();const t=(state.trips||[]).find(x=>x.id===tid),i=t?.shops?.find(x=>x.id===id);return t&&member(t)&&i&&mine(i)?{t,i}:null}
 window.addShop=function(){const n=String($('shopInput')?.value||'').trim();if(!n||!uid())return;const t=tFor('shopTripSelect');if(!t)return alert('你沒有這趟旅行的權限');t.shops=t.shops||[];t.shops.push({id:crypto.randomUUID(),name:n,done:false,owner_user_id:uid(),ownerName:name()});$('shopInput').value='';save();renderShops()};
 window.toggleMyShop=function(tid,id,done){const x=getMine(tid,id);if(!x)return;x.i.done=!!done;save();renderShops()};
 window.deleteMyShop=function(tid,id){const x=getMine(tid,id);if(!x)return alert('你沒有權限刪除這個購物項目');if(!confirm(`刪除「${x.i.name}」？`))return;x.t.shops=x.t.shops.filter(i=>i.id!==id);save();renderShops()};
 window.editMyShop=function(tid,id){const x=getMine(tid,id);if(!x)return alert('你沒有權限修改這個購物項目');const v=prompt('修改購物項目',x.i.name);if(v===null)return;const n=v.trim();if(!n)return;x.i.name=n;save();renderShops()};
 window.addEventListener('mytravel-auth-changed',()=>setTimeout(()=>{migrate();hint();try{renderShops()}catch(_){}},400));window.addEventListener('mytravel-cloud-applied',()=>setTimeout(()=>{migrate();try{renderShops()}catch(_){}},100));
 const start=()=>setTimeout(()=>{migrate();hint();try{renderShops()}catch(_){}},900);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();