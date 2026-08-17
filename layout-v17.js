/* My Travel compact layout v17 */
(() => {
  const $=id=>document.getElementById(id);
  function applyLayout(){
    const tools=$('tripTools'); if(!tools) return;
    tools.style.display='grid';
    tools.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
    tools.style.gap='16px';
    tools.style.alignItems='start';
    tools.style.marginTop='16px';
    [...tools.children].forEach(c=>{c.style.marginTop='0';c.style.minWidth='0'});

    const emergency=$('tripEmergencyCard');
    if(emergency) emergency.style.gridColumn='span 1';

    const cards=[...tools.querySelectorAll('.card')];
    cards.forEach(card=>{
      const title=card.querySelector('h2')?.textContent?.trim()||'';
      if(['航班／住宿','行前清單','購物清單'].includes(title)){
        card.style.maxHeight='420px';
        card.style.overflow='auto';
      }
    });

    if(!document.getElementById('compact-layout-style')){
      const st=document.createElement('style'); st.id='compact-layout-style';
      st.textContent=`
        #tripTools .card{box-shadow:0 8px 24px rgba(15,23,42,.06)}
        #tripTools .setting{padding:10px;margin-top:8px}
        #tripTools .check{padding:7px 0}
        #tripTools .btn.sm{padding:5px 8px}
        #tripEmergencyCard .grid.g2{gap:8px}
        #tripEmergencyCard .setting{margin-top:0}
        @media(max-width:900px){#tripTools{grid-template-columns:1fr!important}}
      `;
      document.head.appendChild(st);
    }
  }
  const oldRenderAll=window.renderAll;
  if(oldRenderAll&&!oldRenderAll.__layout17){
    const wrapped=function(){const r=oldRenderAll.apply(this,arguments);setTimeout(applyLayout,0);return r};wrapped.__layout17=true;window.renderAll=wrapped;
  }
  window.addEventListener('resize',applyLayout);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(applyLayout,300));
  setTimeout(applyLayout,500);
})();