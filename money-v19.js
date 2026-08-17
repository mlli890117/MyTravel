/* My Travel per-trip multi-currency accounting + split bills v21 */
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let moneyTripId=null;

  const currencyInfo={
    JPY:{symbol:'¥',name:'日圓'}, KRW:{symbol:'₩',name:'韓元'}, SGD:{symbol:'S$',name:'新加坡幣'},
    TWD:{symbol:'NT$',name:'新台幣'}, USD:{symbol:'US$',name:'美元'}, EUR:{symbol:'€',name:'歐元'},
    GBP:{symbol:'£',name:'英鎊'}, AUD:{symbol:'A$',name:'澳幣'}, NZD:{symbol:'NZ$',name:'紐西蘭幣'},
    THB:{symbol:'฿',name:'泰銖'}, MYR:{symbol:'RM',name:'馬來西亞令吉'}, PHP:{symbol:'₱',name:'菲律賓披索'},
    VND:{symbol:'₫',name:'越南盾'}, HKD:{symbol:'HK$',name:'港幣'}, CAD:{symbol:'C$',name:'加拿大幣'}, ISK:{symbol:'kr',name:'冰島克朗'}
  };

  function currencyForTrip(t){
    const s=`${t?.name||''} ${t?.theme||''}`.toLowerCase();
    if(/新加坡|singapore/.test(s))return 'SGD';
    if(/韓國|首爾|釜山|濟州|korea|seoul|busan|jeju/.test(s))return 'KRW';
    if(/日本|東京|北海道|札幌|宮古|沖繩|大阪|京都|福岡|仙台|名古屋|japan|tokyo|sapporo|okinawa|osaka|kyoto/.test(s))return 'JPY';
    if(/台灣|taiwan|台北|taipei/.test(s))return 'TWD';
    if(/泰國|曼谷|清邁|thailand|bangkok/.test(s))return 'THB';
    if(/馬來西亞|吉隆坡|malaysia|kuala lumpur/.test(s))return 'MYR';
    if(/菲律賓|馬尼拉|philippines|manila/.test(s))return 'PHP';
    if(/越南|河內|胡志明|vietnam|hanoi/.test(s))return 'VND';
    if(/香港|hong kong/.test(s))return 'HKD';
    if(/冰島|iceland|reykjavik/.test(s))return 'ISK';
    if(/澳洲|australia|sydney|melbourne/.test(s))return 'AUD';
    if(/紐西蘭|new zealand|auckland/.test(s))return 'NZD';
    if(/加拿大|canada/.test(s))return 'CAD';
    if(/英國|united kingdom|london/.test(s))return 'GBP';
    if(/法國|德國|義大利|西班牙|france|germany|italy|spain|paris|berlin|rome|madrid|barcelona/.test(s))return 'EUR';
    if(/美國|usa|united states|new york|los angeles/.test(s))return 'USD';
    return 'JPY';
  }
  function curTrip(){return state.trips.find(t=>t.id===moneyTripId)||trip()}
  function info(code){return currencyInfo[code]||{symbol:code+' ',name:code}}
  function fmtMoney(n,code){const i=info(code);return i.symbol+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:code==='TWD'?0:2})}
  function getRate(code){if(code==='TWD')return 1;state.fxRates=state.fxRates||{};return Number(state.fxRates[code]?.rate || (code==='JPY'?state.rate:0))||0}
  function ensurePeople(t){if(!Array.isArray(t.people))t.people=[];return t.people}
  function personName(t,id){return ensurePeople(t).find(p=>p.id===id)?.name||'未指定'}

  function ensureMoneySelector(){
    const page=$('money'); if(!page)return;
    let box=$('moneyTripBar');
    if(!box){
      box=document.createElement('div');box.id='moneyTripBar';box.className='card';box.style.marginBottom='16px';
      box.innerHTML=`<div class="row between"><div><h2 style="margin:0">旅行帳本</h2><div class="muted" id="moneyTripMeta"></div></div><select id="moneyTripSelect" style="width:min(260px,45vw)"></select></div>`;
      page.insertBefore(box,page.firstChild);
      $('moneyTripSelect').addEventListener('change',async e=>{moneyTripId=e.target.value;await refreshTripFx(false);renderMoney()});
    }
    const sel=$('moneyTripSelect');sel.innerHTML=state.trips.map(t=>`<option value="${t.id}">${esc(t.emoji||'✈️')} ${esc(t.name)}</option>`).join('');
    if(!moneyTripId||!state.trips.some(t=>t.id===moneyTripId))moneyTripId=(typeof curTrip==='function'&&curTrip())?.id||state.trips[0].id;
    sel.value=moneyTripId;
  }

  function ensurePeoplePanel(){
    const page=$('money'),bar=$('moneyTripBar');if(!page||!bar)return;
    let panel=$('moneyPeoplePanel');
    if(!panel){
      panel=document.createElement('div');panel.id='moneyPeoplePanel';panel.className='card';panel.style.marginBottom='16px';
      panel.innerHTML=`<div class="row between"><div><h2 style="margin:0">旅伴與分帳</h2><div class="muted">目前以所有旅伴平均分攤每一筆支出</div></div><div class="row"><button class="btn alt" onclick="openPersonModal()">＋新增人員</button><button class="btn" onclick="showSettlement()">結算</button></div></div><div id="moneyPeopleList" class="row" style="margin-top:12px;flex-wrap:wrap"></div>`;
      bar.after(panel);
    }
  }

  function ensureExpensePayer(){
    const form=$('eDate')?.closest('.form');if(!form)return;
    form.classList.add('expense-form-v21');
    let payer=$('ePayer');
    if(!payer){payer=document.createElement('select');payer.id='ePayer';payer.setAttribute('aria-label','付款人');$('eAmount').before(payer)}
    if(!$('money-v21-style')){
      const st=document.createElement('style');st.id='money-v21-style';st.textContent=`
        .expense-form-v21{grid-template-columns:repeat(5,minmax(0,1fr))!important}
        .person-chip{display:flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff}
        .person-chip button{border:0;background:transparent;color:#b42318;cursor:pointer;font-weight:800;padding:0}
        .settle-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:12px;margin-top:8px}
        @media(max-width:900px){.expense-form-v21{grid-template-columns:1fr!important}#moneyPeoplePanel>.row.between{align-items:flex-start;flex-direction:column}#moneyPeoplePanel>.row.between>.row{width:100%}#moneyPeoplePanel>.row.between>.row .btn{flex:1}}
      `;document.head.appendChild(st)
    }
  }

  function renderPeople(){
    const t=curTrip(),people=ensurePeople(t),list=$('moneyPeopleList'),payer=$('ePayer');if(!list||!payer)return;
    list.innerHTML=people.length?people.map(p=>`<div class="person-chip"><span>👤 ${esc(p.name)}</span><button title="刪除" onclick="deletePerson('${p.id}')">×</button></div>`).join(''):'<span class="muted">尚未新增旅伴。新增後即可記錄誰付款並進行結算。</span>';
    const old=payer.value;payer.innerHTML='<option value="">誰付款？</option>'+people.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');if(people.some(p=>p.id===old))payer.value=old;
  }

  function ensureSplitModal(){
    if($('splitModal'))return;
    const m=document.createElement('div');m.id='splitModal';m.className='modal';m.innerHTML=`<div class="modalbox" style="width:min(680px,100%)"><div class="row between"><h2 id="splitTitle">結算</h2><button class="btn alt" onclick="closeSplitModal()">✕</button></div><div id="splitBody" style="margin-top:14px"></div><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" onclick="closeSplitModal()">完成</button></div></div>`;m.addEventListener('click',e=>{if(e.target===m)closeSplitModal()});document.body.appendChild(m)
  }
  window.closeSplitModal=()=>{$('splitModal')?.classList.remove('show')};

  window.openPersonModal=function(){
    if(typeof window.closeUniversalModal!=='function'||!$('universalModal')){
      const name=prompt('人員名稱');if(name?.trim())addPersonName(name.trim());return;
    }
    $('uTitle').textContent='新增旅伴';$('uBody').innerHTML='<div class="full"><label>姓名／暱稱</label><input id="newPersonName" placeholder="例如：Din、女友"></div>';$('uSave').onclick=()=>{const n=$('newPersonName').value.trim();if(!n)return alert('請輸入名稱');addPersonName(n);closeUniversalModal()};$('universalModal').classList.add('show');setTimeout(()=>$('newPersonName')?.focus(),50)
  };
  function addPersonName(name){const t=curTrip(),people=ensurePeople(t);if(people.some(p=>p.name.trim().toLowerCase()===name.toLowerCase()))return alert('這個人員已存在');people.push({id:crypto.randomUUID(),name});save();setTimeout(renderMoney,0)}
  window.deletePerson=function(id){const t=curTrip(),p=ensurePeople(t).find(x=>x.id===id);if(!p)return;const used=state.expenses.some(e=>e.tripId===t.id&&e.payerId===id);if(used)return alert(`「${p.name}」已有付款紀錄，請先修改那些支出的付款人再刪除。`);if(!confirm(`刪除旅伴「${p.name}」？`))return;t.people=t.people.filter(x=>x.id!==id);save();setTimeout(renderMoney,0)};

  async function refreshTripFx(force=false){
    const t=curTrip(),code=currencyForTrip(t);state.fxRates=state.fxRates||{};
    const today=new Date().toISOString().slice(0,10),old=state.fxRates[code];
    if(code==='TWD'){state.fxRates.TWD={rate:1,date:today};return 1}
    if(!force&&old?.date===today&&old?.rate)return old.rate;
    try{
      const r=await fetch(`https://api.frankfurter.dev/v2/rate/${code}/TWD`,{cache:'no-store'});if(!r.ok)throw new Error('FX '+r.status);
      const d=await r.json(),rate=Number(d.rate);if(!Number.isFinite(rate))throw new Error('Invalid FX');
      state.fxRates[code]={rate,date:d.date||today};if(code==='JPY')state.rate=rate;localStorage.setItem(LS,JSON.stringify(state));if(sb)pushCloud();return rate;
    }catch(e){console.warn('trip fx failed',e);return getRate(code)}
  }
  window.refreshTripFx=async function(force=true){await refreshTripFx(force);renderMoney()};
  window.refreshDailyFx=async function(){await refreshTripFx(true);renderMoney()};

  window.renderMoney=function(){
    ensureMoneySelector();ensurePeoplePanel();ensureExpensePayer();ensureSplitModal();
    const t=curTrip(),code=currencyForTrip(t),ci=info(code),rate=getRate(code),people=ensurePeople(t);
    const list=state.expenses.filter(e=>e.tripId===t.id);let sum=0;list.forEach(e=>{if(!e.currency)e.currency=code;sum+=Number(e.amount)||0});

    const cards=[...$('money').querySelectorAll(':scope > .grid.g4 > .card')];
    if(cards[0]){cards[0].querySelector('.muted').textContent=`總支出 ${code}`;$('sumJPY').textContent=fmtMoney(sum,code)}
    if(cards[1]){cards[1].querySelector('.muted').textContent='約合 TWD';$('sumTWD').textContent=fmtMoney(rate?sum*rate:0,'TWD')}
    $('sumCount').textContent=list.length;
    if(cards[3]){cards[3].querySelector('.muted').textContent=`${code} → TWD 換算匯率`;$('rate').value=rate||'';$('rate').disabled=true;let st=cards[3].querySelector('#fxStatus');if(!st){st=document.createElement('div');st.id='fxStatus';cards[3].appendChild(st)}st.innerHTML=`<div class="muted" style="margin-top:8px">每日網路參考匯率${state.fxRates?.[code]?.date?' · '+state.fxRates[code].date:''}</div><button class="btn sm alt" style="margin-top:6px" onclick="refreshTripFx(true)">↻ 更新匯率</button>`}

    $('moneyTripMeta').textContent=`${t.name} · ${t.start} ～ ${t.end} · 使用 ${code}（${ci.name}）`;
    $('eDate').min=t.start;$('eDate').max=t.end;if(!$('eDate').value||$('eDate').value<t.start||$('eDate').value>t.end)$('eDate').value=t.start;$('eAmount').placeholder=`${code} 金額`;
    renderPeople();

    const table=$('expenseRows')?.closest('table');if(table)table.querySelector('thead').innerHTML=`<tr><th>日期</th><th>分類</th><th>項目</th><th>付款人</th><th>${code}</th><th>TWD</th><th></th></tr>`;
    $('expenseRows').innerHTML=list.map(e=>{const ec=e.currency||code,er=getRate(ec)||rate;return `<tr><td>${esc(e.date)}</td><td>${esc(e.cat)}</td><td>${esc(e.name)}</td><td>${esc(personName(t,e.payerId))}</td><td>${fmtMoney(e.amount,ec)}</td><td>${fmtMoney((Number(e.amount)||0)*er,'TWD')}</td><td><div class="row"><button class="btn sm alt" onclick="editSplitExpense('${e.id}')">編輯</button><button class="btn sm red" onclick="delExpense('${e.id}')">刪除</button></div></td></tr>`}).join('');
  };

  window.addExpense=function(){
    ensureMoneySelector();const t=curTrip(),code=currencyForTrip(t),n=$('eName').value.trim(),a=parseFloat($('eAmount').value),payerId=$('ePayer').value;
    if(!n||!Number.isFinite(a)||a<=0)return alert('請輸入支出名稱與金額');if(!ensurePeople(t).length)return alert('請先新增旅伴');if(!payerId)return alert('請選擇誰付款');
    state.expenses.push({id:crypto.randomUUID(),tripId:t.id,date:$('eDate').value,cat:$('eCat').value,name:n,amount:a,currency:code,payerId});$('eName').value='';$('eAmount').value='';save();setTimeout(()=>renderMoney(),0)
  };

  window.editSplitExpense=function(id){
    const t=curTrip(),e=state.expenses.find(x=>x.id===id);if(!e)return;ensurePeople(t);
    if(!$('universalModal'))return;
    $('uTitle').textContent='編輯支出';$('uBody').innerHTML=`<div><label>日期</label><input id="seDate" type="date" value="${esc(e.date)}"></div><div><label>分類</label><select id="seCat">${['餐飲','交通','住宿','購物','票券','其他'].map(x=>`<option ${x===e.cat?'selected':''}>${x}</option>`).join('')}</select></div><div class="full"><label>項目</label><input id="seName" value="${esc(e.name)}"></div><div><label>金額</label><input id="seAmount" type="number" value="${e.amount}"></div><div><label>付款人</label><select id="sePayer">${t.people.map(p=>`<option value="${p.id}" ${p.id===e.payerId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`;
    $('uSave').onclick=()=>{const a=parseFloat($('seAmount').value);if(!Number.isFinite(a)||a<=0)return alert('金額格式不正確');e.date=$('seDate').value;e.cat=$('seCat').value;e.name=$('seName').value.trim()||e.name;e.amount=a;e.payerId=$('sePayer').value;closeUniversalModal();save();setTimeout(renderMoney,0)};$('universalModal').classList.add('show')
  };

  window.showSettlement=function(){
    const t=curTrip(),people=ensurePeople(t),code=currencyForTrip(t),rate=getRate(code),list=state.expenses.filter(e=>e.tripId===t.id);
    if(people.length<2)return alert('至少需要 2 位旅伴才能結算');if(!list.length)return alert('目前沒有支出可以結算');
    const valid=list.filter(e=>people.some(p=>p.id===e.payerId));const missing=list.length-valid.length;
    const bal=Object.fromEntries(people.map(p=>[p.id,0]));
    valid.forEach(e=>{const amount=Number(e.amount)||0,share=amount/people.length;bal[e.payerId]+=amount;people.forEach(p=>bal[p.id]-=share)});
    const creditors=people.map(p=>({id:p.id,name:p.name,amt:bal[p.id]})).filter(x=>x.amt>0.005).sort((a,b)=>b.amt-a.amt);
    const debtors=people.map(p=>({id:p.id,name:p.name,amt:-bal[p.id]})).filter(x=>x.amt>0.005).sort((a,b)=>b.amt-a.amt);
    const transfers=[];let i=0,j=0;while(i<debtors.length&&j<creditors.length){const a=Math.min(debtors[i].amt,creditors[j].amt);if(a>0.005)transfers.push({from:debtors[i].name,to:creditors[j].name,amount:a});debtors[i].amt-=a;creditors[j].amt-=a;if(debtors[i].amt<0.005)i++;if(creditors[j].amt<0.005)j++}
    $('splitTitle').textContent=`${t.name} · 結算`;
    $('splitBody').innerHTML=`<div class="note good">平均分攤：${people.length} 人 · 已納入 ${valid.length} 筆支出${missing?`；另有 ${missing} 筆尚未指定付款人，未納入結算。`:''}</div>${transfers.length?transfers.map(x=>`<div class="settle-row"><div><b>${esc(x.from)}</b><span class="muted"> 要給 </span><b>${esc(x.to)}</b></div><div style="text-align:right"><b>${fmtMoney(x.amount,code)}</b>${rate&&code!=='TWD'?`<div class="muted">約 ${fmtMoney(x.amount*rate,'TWD')}</div>`:''}</div></div>`).join(''):'<div class="empty">目前已經結清，不需要互相轉帳 🎉</div>'}`;$('splitModal').classList.add('show')
  };

  document.querySelectorAll('[data-page="money"]').forEach(b=>b.addEventListener('click',()=>{moneyTripId=(typeof curTrip==='string'?curTrip:null)||window.curTrip||null;setTimeout(async()=>{ensureMoneySelector();await refreshTripFx(false);renderMoney()},80)}));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(async()=>{ensureMoneySelector();await refreshTripFx(false);renderMoney()},400));
})();