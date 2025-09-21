
const LS_HISTORY = 'mitra_dvi_history';
function appendHistory(dvi){
  const now = Date.now();
  try{
    const arr = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
    arr.push({ts: now, dvi});
    localStorage.setItem(LS_HISTORY, JSON.stringify(arr.slice(-100)));
  }catch(_){
    localStorage.setItem(LS_HISTORY, JSON.stringify([{ts: now, dvi}]));
  }
}
(function(){
  const btn = document.getElementById('pullDviBtn');
  if(!btn) return;
  btn.addEventListener('click', async (evt)=>{
    // Let the existing handler run first; then try to read DVI from the UI after a short delay
    setTimeout(()=>{
      const dviText = (document.getElementById('youDvi').textContent||'').trim();
      const dvi = parseInt(dviText, 10);
      if(!isNaN(dvi)) { appendHistory(dvi); }
    }, 400);
  }, true);
})();
