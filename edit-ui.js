/* My Travel form-style itinerary editor v13 */
(() => {
  const $=id=>document.getElementById(id);
  let editingId=null;

  function ensureModal(){
    if($('itemEditModal'))return;
    const modal=document.createElement('div');
    modal.id='itemEditModal';
    modal.className='modal';
    modal.innerHTML=`<div class="modalbox" style="width:min(720px,100%)">
      <div class="row between"><h2>編輯行程</h2><button class="btn alt" type="button" onclick="closeItemEditor()">✕</button></div>
      <div class="form" style="margin-top:14px">
        <div><div class="mut