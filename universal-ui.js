/* My Travel universal form editors v15 */
(() => {
  const $=id=>document.getElementById(id);
  const sortItems=a=>[...(a||[])].sort((x,y)=>(x.time||'99:99').localeCompare(y.time||'99:99'));
  let ctx={};

  function ensureModal(){
    if($('universalModal'))return;
    const m=document.createElement('div');m.id='universalModal';m.className='modal';
    m.innerHTML=`<div class="modalbox" style="width:min(760px,100%)"><div class="row between"><h2 id="uTitle">編輯</h2><button class="btn alt" onclick="closeUniversalModal()">✕</button></div><div id="uBody" class="modalgrid" style="margin-top:14px"></div><div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn alt" onclick="closeUniversalModal()">取消</button><button class="btn" id="uSave">儲存</button></div></div>`;
    m.addEventListener('click',e=>{if(e.target===m)closeUniversalModal()});document.body.appendChild(m);
  }
  function field(id,label,type='text',value='',opts=[]){
    if(type==='select')return `<div><label>${label}</label><select id="${id}">${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></div>`;
    return `<div><label>${label}</label><input id="${id}" type="${type}" value="${String(value??'').replace(/"/g,'&quot;')}"></div>`;
  }
  function open(title,html,onSave){ensureModal();$('uTitle').textContent=title;$('uBody').innerHTML=html;$('uSave').onclick=onSave;$('universalModal').classList.add('show')}
  window.closeUniversalModal=()=>{$('universalModal')?.classList.remove('show');ctx={}};

  // itinerary
  window.editItineraryItem=function(id){const item=(trip().itinerary[curDate]||[]).find(x=>x.id===id);if(!item)return;ctx={kind:'item',id};open('編輯行程',field('uTime','時間','time',item.time||'10:00')+field('uName','行程名稱','text',item.title)+field('uType','類型','select',item.type||'景點',['景點','餐廳','交通','住宿','購物','滑雪','其他'])+`<div class="full">${field('uNote','備註','text',item.note||'')}</div>`+field('uLat','緯度','number',item.lat??'')+field('uLng','經度','number',item.lng??''),()=>{const arr=trip().itinerary[curDate]||[],i=arr.find(x=>x.id===id);if(!i)return;const name=$('uName').value.trim();if(!name)return alert('請輸入行程名稱');i.time=$('uTime').value||'10:00';i.title=name;i.type=$('uType').value;i.note=$('uNote').value.trim();const lat=parseFloat($('uLat').value),lng=parseFloat($('uLng').value);i.lat=Number.isFinite(lat)?lat:null;i.lng=Number.isFinite(lng)?lng:null;trip().itinerary[curDate]=sortItems(arr);closeUniversalModal();save()})};

  // date add/edit
  window.addTripDate=function(){const t=trip();const val=t.dayOrder?.[t.dayOrder.length-1]||t.end;open('新增日期',field('uDate','日期','date',val),()=>{const d=$('uDate').value;if(!d)return;if(!t.dayOrder)t.dayOrder=[];if(t.dayOrder.includes(d))return alert('這個日期已存在');t.dayOrder.push(d);t.dayOrder.sort();t.itinerary[d]=[];t.start=t.dayOrder[0];t.end=t.dayOrder[t.dayOrder.length-1];curDate=d;closeUniversalModal();save()})};
  window.editTripDate=function(){const t=trip(),old=curDate;open('編輯日期',field('uDate','日期','date',old),()=>{const d=$('uDate').value;if(!d||d===old)return closeUniversalModal();if(t.dayOrder.includes(d))return alert('這個日期已存在');t.itinerary[d]=t.itinerary[old]||[];delete t.itinerary[old];t.dayOrder=t.dayOrder.map(x=>x===old?d:x).sort();t.start=t.dayOrder[0];t.end=t.dayOrder[t.dayOrder.length-1];curDate=d;closeUniversalModal();save()})};

  // checklist/shopping
  function editSimple(kind,tid,id){const t=state.trips.find(x=>x.id===tid);const list=kind==='check'?t?.checks:t?.shops;const i=list?.find(x=>x.id===id);if(!i)return;open(kind==='check'?'編輯行前項目':'編輯購物項目',`<div class="full">${field('uName','名稱','text',i.name)}</div>`,()=>{const v=$('uName').value.trim();if(!v)return alert('請輸入名稱');i.name=v;closeUniversalModal();save()})}
  window.editCheck=(tid,id)=>editSimple('check',tid,id);window.editShop=(tid,id)=>editSimple('shop',tid,id);

  // expense
  window.editExpense=function(id){const e=state.expenses.find(x=>x.id===id);if(!e)return;open('編輯支出',field('uDate','日期','date',e.date)+field('uType','分類','select',e.cat,['餐飲','交通','住宿','購物','票券','其他'])+`<div class="full">${field('uName','項目','text',e.name)}</div>`+field('uAmount','JPY 金額','number',e.amount),()=>{const n=parseFloat($('uAmount').value);if(!Number.isFinite(n)||n<=0)return alert('金額格式不正確');e.date=$('uDate').value;e.cat=$('uType').value;e.name=$('uName').value.trim()||e.name;e.amount=n;closeUniversalModal();save()})};

  // flights
  function flightEditor(index=null){const t=trip(),f=index===null?{dir:'去程',date:curDate,route:'',time:''}:t.flights[index];open(index===null?'新增航班':'編輯航班',field('uDir','航班類型','select',f.dir||'去程',['去程','回程','轉機','其他'])+field('uDate','日期','date',f.date||curDate)+`<div class="full">${field('uRoute','航線','text',f.route||'')}</div>`+`<div class="full">${field('uNote','時間／備註','text',f.time||'')}</div>`,()=>{const obj={dir:$('uDir').value,date:$('uDate').value,route:$('uRoute').value.trim(),time:$('uNote').value.trim()};if(index===null)t.flights.push(obj);else t.flights[index]=obj;closeUniversalModal();save()})}
  window.addFlight=()=>flightEditor(null);window.editFlight=i=>flightEditor(i);

  // hotels
  function hotelEditor(index=null){const t=trip(),h=index===null?{name:'',from:t.start,to:t.end,note:''}:t.hotels[index];open(index===null?'新增住宿':'編輯住宿',`<div class="full">${field('uName','住宿名稱','text',h.name||'')}</div>`+field('uFrom','入住日期','date',h.from||t.start)+field('uTo','退房日期','date',h.to||t.end)+`<div class="full">${field('uNote','備註','text',h.note||'')}</div>`,()=>{const name=$('uName').value.trim();if(!name)return alert('請輸入住宿名稱');const obj={name,from:$('uFrom').value,to:$('uTo').value,note:$('uNote').value.trim()};if(index===null)t.hotels.push(obj);else t.hotels[index]=obj;closeUniversalModal();save()})}
  window.addHotel=()=>hotelEditor(null);window.editHotel=i=>hotelEditor(i);

  ensureModal();
})();