/* My Travel mobile layout v20 */
(() => {
  function inject(){
    if(document.getElementById('mobile-v20-style')) return;
    const s=document.createElement('style');s.id='mobile-v20-style';s.textContent=`
      html,body{max-width:100%;overflow-x:hidden}
      .app,.main,.page,#itinerary,.itlayout,#tripTools,.card{min-width:0;max-width:100%}
      @media(max-width:900px){
        .main{width:100%;max-width:100%;padding-left:14px!important;padding-right:14px!important;overflow-x:hidden}
        #itinerary>.card:first-child{overflow:hidden}
        #itinerary>.card:first-child>.row.between{display:grid!important;grid-template-columns:1fr;gap:12px;align-items:start}
        #tripSelect{width:100%!important;max-width:100%!important}
        #dayTabs{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;max-width:100%!important;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        #dayTabs::-webkit-scrollbar{display:none}
        #dayTabs .tab{flex:0 0 auto!important;max-width:none!important}
        .itlayout{display:block!important;width:100%!important;max-width:100%!important}
        .itlayout>div,.mapwrap{width:100%!important;max-width:100%!important;min-width:0!important}
        .mapwrap{position:relative!important;margin-top:16px}
        #map,#bigMap{width:100%!important;max-width:100%!important}
        #timeline{width:100%;max-width:100%}
        #timeline .item{grid-template-columns:64px minmax(0,1fr)!important;position:relative;padding-right:12px!important}
        #timeline .item>.row{grid-column:1/-1;justify-content:flex-end!important;margin-top:6px;flex-wrap:wrap}
        #timeline .title,#timeline .meta{min-width:0;overflow-wrap:anywhere;word-break:break-word}
        #recGrid{grid-template-columns:1fr!important;width:100%!important;max-width:100%!important}
        #recGrid .rec{min-width:0;max-width:100%}
        #tripTools{grid-template-columns:1fr!important;width:100%!important;max-width:100%!important}
        #tripTools .card{width:100%!important;max-width:100%!important;overflow:hidden!important;max-height:none!important}
        #tripTools .row{min-width:0;flex-wrap:wrap}
        #tripTools input,#tripTools select{min-width:0;max-width:100%}
        #tripEmergencyCard .grid.g2{grid-template-columns:1fr!important}
        .bottomnav{left:0!important;right:0!important;width:100%!important;max-width:100vw!important}
      }
      @media(max-width:520px){
        .top h1{font-size:26px}
        .card{padding:14px}
        #timeline .item{grid-template-columns:56px minmax(0,1fr)!important;gap:8px}
        #timeline .time{font-size:15px}
        #timeline .title{font-size:16px}
        #timeline .meta{font-size:13px}
        #dayTabs .tab{padding:8px 11px}
      }
    `;document.head.appendChild(s);
  }
  inject();document.addEventListener('DOMContentLoaded',inject);
})();