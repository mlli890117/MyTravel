/* My Travel planner v11 */
(() => {
  const byId=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad=n=>String(n).padStart(2,'0');
  const dateLabel=d=>{const x=new Date(d+'T12:00:00');return `${x.getMonth()+1}/${x.getDate()}（${'日一二三四五六'[x.getDay()]}）`};
  const timeValue=t=>{if(!/^\d{1,2}:\d{2}$/.test(t||''