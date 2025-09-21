
const $ = (sel)=>document.querySelector(sel);
const byId = (id)=>document.getElementById(id);
function setGauge01(v01){
  const path = byId('needle'); if(!path) return;
  const length = 157; const clamped = Math.max(0, Math.min(1, v01));
  path.style.strokeDashoffset = String(length * (1 - clamped));
}
async function mitraPredict(payload){
  const res = await fetch(window.MEMETRICS_API,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  return await res.json();
}
