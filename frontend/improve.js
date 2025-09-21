
function setGauge01(v01){
  const path = document.getElementById('needle'); if(!path) return;
  const length = 157; const clamped = Math.max(0, Math.min(1, v01));
  path.style.strokeDashoffset = String(length * (1 - clamped));
}
function drawSpark(canvas, values){
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(11,27,43,0.08)'; ctx.lineWidth=1;
  ctx.strokeRect(0,0,W,H);
  if(values.length===0) return;
  const xs = values.map((_,i)=> i/(values.length-1 || 1));
  const ys = values.map(v=> (v-300)/600 );
  ctx.beginPath();
  for(let i=0;i<values.length;i++){
    const x = xs[i]*W;
    const y = H - Math.max(0,Math.min(1,ys[i]))*H;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.strokeStyle = '#3461ff'; ctx.lineWidth = 2; ctx.stroke();
}

['skills','learning','projects','finance','resilience'].forEach(id=>{
  const input = document.getElementById(id);
  const label = document.getElementById(id+'V');
  if(input && label){ input.addEventListener('input', ()=> label.textContent = parseFloat(input.value).toFixed(2)); }
});

document.getElementById('simulate').onclick = async ()=>{
  const payload={
    skills_index: parseFloat(document.getElementById('skills').value),
    learning_pace: parseFloat(document.getElementById('learning').value),
    certifications: parseInt(document.getElementById('certs').value||'0',10),
    project_score: parseFloat(document.getElementById('projects').value),
    financial_behavior: parseFloat(document.getElementById('finance').value),
    resilience_score: parseFloat(document.getElementById('resilience').value),
  };
  try{
    const res = await fetch(window.MEMETRICS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    document.getElementById('dviScore').textContent = data.dvi;
    document.getElementById('dviGrade').textContent = data.grade;
    setGauge01((data.dvi-300)/600);
    const drivers = Object.entries(data.drivers).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div><strong>${k}</strong> • ${v}%</div>`).join('');
    document.getElementById('drivers').innerHTML = drivers;
    // build path
    const path = [data.dvi];
    const steps = [['skills_index','skills'],['project_score','projects'],['learning_pace','learning']];
    let base = {...payload};
    for(const [key,slider] of steps){
      base[key] = Math.min(1, base[key]*1.1);
      const r = await fetch(window.MEMETRICS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(base)});
      const d = await r.json();
      path.push(d.dvi);
    }
    drawSpark(document.getElementById('spark'), path);
  }catch(e){ alert('Could not reach API. Is backend running?'); }
};
