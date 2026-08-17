window.renderAll=function(){
  state=normalizeState(state);
  localStorage.setItem(LS,JSON.stringify(state));
  [
    ['syncSelects',syncSelects],
    ['renderHome',renderHome],
    ['renderItinerary',renderItinerary],
    ['renderMoney',renderMoney],
    ['renderMore',renderMore]
  ].forEach(([name,fn])=>{
    try{ fn(); }
    catch(e){ console.error(name+' failed',e); }
  });
};
