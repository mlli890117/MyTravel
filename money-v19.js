/* My Travel per-trip multi-currency accounting v19 */
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
  function fmtMoney(n,code){const i=info(code);return i.symbol+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:code==='TWD'?0:2})}
  function getRate(code){if(code==='TWD')return 1;state.fxRates=state.fxRates||{};return Number(state.fxRates[code]?.rate || (code==='JPY'?state.rate:0))||0}

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
    if(!moneyTripId||!state.trips.some(t=>t.id===moneyTripId))moneyTripId=curTrip?.id||state.trips[0].id;
    sel.value=moneyTripId;
  }

  async function refreshTripFx(force=false){
    const t=curTrip(),code=currencyForTrip(t);state.fxRates=state.fxRates||{};
    const today=new Date().toISOString().slice(0,10),old=state.fxRates[code];
    if(code==='TWD'){state.fxRates.TWD={rate:1,date:today};return 1}
    if(!force&&old?.date===today&&old?.rate)return old.rate;
    try{
      const r=await fetch(`https://api.frankfurter.dev/v2/rate/${code}/TWD`,{cache:'no-store'});if(!r.ok)throw new Error('FX '+r.status);
      const d=await r.json(),rate=Number(d.rate);if(!Number.isFinite(rate))throw new Error('Invalid FX');
      state.fxRates[code]={rate,date:d.date||today};
      if(code==='JPY')state.rate=rate;
      localStorage.setItem(LS,JSON.stringify(state));if(sb)pushCloud();return rate;
    }catch(e){console.warn('trip fx failed',e);return getRate(code)}
  }
  window.refreshTripFx=async function(force=true){await refreshTripFx(force);renderMoney()};
  window.refreshDailyFx=async function(){await refreshTripFx(true);renderMoney()};

  window.renderMoney=function(){
    ensureMoneySelector();const t=curTrip(),code=currencyForTrip(t),ci=info(code),rate=getRate(code);
    const list=state.expenses.filter(e=>e.tripId===t.id);
    let sum=0;
    list.forEach(e=>{if(!e.currency)e.currency=code;sum+=Number(e.amount)||0});

    const cards=[...$('money').querySelectorAll(':scope > .grid.g4 > .card')];
    if(cards[0]){cards[0].querySelector('.muted').textContent=`總支出 ${code}`;$('sumJPY').textContent=fmtMoney(sum,code)}
    if(cards[1]){cards[1].querySelector('.muted').textContent='約合 TWD';$('sumTWD').textContent=fmtMoney(rate?sum*rate:0,'TWD')}
    $('sumCount').textContent=list.length;
    if(cards[3]){
      cards[3].querySelector('.muted').textContent=`${code} → TWD 換算匯率`;
      $('rate').value=rate||'';$('rate').disabled=true;
      let st=cards[3].querySelector('#fxStatus');if(!st){st=document.createElement('div');st.id='fxStatus';cards[3].appendChild(st)}
      st.innerHTML=`<div class="muted" style="margin-top:8px">每日網路參考匯率${state.fxRates?.[code]?.date?' · '+state.fxRates[code].date:''}</div><button class="btn sm alt" style="margin-top:6px" onclick="refreshTripFx(true)">↻ 更新匯率</button>`;
    }

    $('moneyTripMeta').textContent=`${t.name} · ${t.start} ～ ${t.end} · 使用 ${code}（${ci.name}）`;
    $('eDate').min=t.start;$('eDate').max=t.end;
    if(!$('eDate').value||$('eDate').value<t.start||$('eDate').value>t.end)$('eDate').value=t.start;
    $('eAmount').placeholder=`${code} 金額`;

    $('expenseRows').innerHTML=list.map(e=>{
      const ec=e.currency||code,er=getRate(ec)||rate;
      return `<tr><td>${esc(t.name)}</td><td>${esc(e.date)}</td><td>${esc(e.cat)}</td><td>${esc(e.name)}</td><td>${fmtMoney(e.amount,ec)}</td><td>${fmtMoney((Number(e.amount)||0)*er,'TWD')}</td><td><div class="row"><button class="btn sm alt" onclick="editExpense('${e.id}')">編輯</button><button class="btn sm red" onclick="delExpense('${e.id}')">刪除</button></div></td></tr>`;
    }).join('');
    const th=[...$('money').querySelectorAll('table thead th')];if(th[4])th[4].textContent=code;if(th[5])th[5].textContent='TWD';
  };

  window.addExpense=function(){
    ensureMoneySelector();const t=curTrip(),code=currencyForTrip(t),n=$('eName').value.trim(),a=parseFloat($('eAmount').value);
    if(!n||!Number.isFinite(a)||a<=0)return alert('請輸入支出名稱與金額');
    state.expenses.push({id:crypto.randomUUID(),tripId:t.id,date:$('eDate').value,cat:$('eCat').value,name:n,amount:a,currency:code});
    $('eName').value='';$('eAmount').value='';save();setTimeout(()=>renderMoney(),0);
  };

  // Keep selected travel when entering the Money page from the currently active itinerary.
  document.querySelectorAll('[data-page="money"]').forEach(b=>b.addEventListener('click',()=>{moneyTripId=curTrip;setTimeout(async()=>{ensureMoneySelector();await refreshTripFx(false);renderMoney()},80)}));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(async()=>{ensureMoneySelector();await refreshTripFx(false);renderMoney()},400));
})();