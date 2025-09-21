
// Helpers
const LS_HISTORY = 'mitra_dvi_history';
const LS_PROFILE = 'mitra_profile';

function loadHistory(){
  try{ return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); }catch(_){ return []; }
}
function saveHistory(arr){ localStorage.setItem(LS_HISTORY, JSON.stringify(arr)); }
function loadProfile(){ try{ return JSON.parse(localStorage.getItem(LS_PROFILE) || '{}'); }catch(_){ return {}; } }
function saveProfile(p){ localStorage.setItem(LS_PROFILE, JSON.stringify(p)); }

function drawChart(canvas, dataPoints){
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle = 'rgba(11,27,43,0.08)'; ctx.lineWidth = 1;
  for(let y=0;y<=5;y++){ const yy=(H-20)*y/5+10; ctx.beginPath(); ctx.moveTo(10,yy); ctx.lineTo(W-10,yy); ctx.stroke(); }
  if(!dataPoints.length) return;
  const xs = dataPoints.map((_,i)=> i/(dataPoints.length-1||1));
  const ys = dataPoints.map(d=> Math.max(0, Math.min(1, (d.dvi-300)/600)));
  ctx.beginPath();
  for(let i=0;i<xs.length;i++){ const x=10+xs[i]*(W-20), y=(H-20)-ys[i]*(H-20)+10; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
  ctx.strokeStyle='#3461ff'; ctx.lineWidth=2; ctx.stroke();
  const grad = ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'rgba(52,97,255,0.25)'); grad.addColorStop(1,'rgba(52,97,255,0.02)');
  ctx.lineTo(W-10,H-10); ctx.lineTo(10,H-10); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.fillStyle='#3461ff';
  for(let i=0;i<xs.length;i++){ const x=10+xs[i]*(W-20), y=(H-20)-ys[i]*(H-20)+10; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); }
}

function computeBadges(history){
  const maxDvi = history.reduce((m,d)=> Math.max(m,d.dvi), 0);
  const badges = [];
  if(maxDvi >= 600) badges.push('Fair 600+');
  if(maxDvi >= 680) badges.push('Good 680+');
  if(maxDvi >= 760) badges.push('Excellent 760+');
  if(history.length >= 5) badges.push('Consistent Tracker');
  if(maxDvi >= 800) badges.push('Top Performer 800+');
  return badges;
}

function renderProfile(){
  const p = loadProfile();
  document.getElementById('pName').textContent = p.name || 'You';
  document.getElementById('pMeta').textContent = p.field ? `Student • ${p.field}` : 'Student • Field';
  document.getElementById('nameInput').value = p.name || '';
  document.getElementById('fieldInput').value = p.field || '';
  document.getElementById('bioInput').value = p.bio || '';
}

document.getElementById('saveProfile').onclick = ()=>{
  const p = loadProfile();
  p.name = document.getElementById('nameInput').value.trim() || 'You';
  p.field = document.getElementById('fieldInput').value.trim();
  p.bio = document.getElementById('bioInput').value.trim();
  saveProfile(p);
  renderProfile();
};

function render(){
  const history = loadHistory();
  drawChart(document.getElementById('dviChart'), history);
  const badges = computeBadges(history);
  document.getElementById('badges').innerHTML = badges.map(b=>`<span class="badge-chip">${b}</span>`).join('') || '<span class="tip">No badges yet — pull your DVI from the Feed.</span>';
  renderProfile();
}

window.addEventListener('resize', ()=>render());
render();
