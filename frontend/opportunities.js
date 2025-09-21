
const opportunities = [
  {id:1,type:'scholarship',title:'Scholarship • Foundation A', needDvi:680, meta:'DVI ≥ 680 • Europe', desc:'Merit-based scholarship for STEM students. Covers tuition up to €5,000.'},
  {id:2,type:'loan',title:'Micro‑loan • Partner Bank', needDvi:760, meta:'Low APR if DVI ≥ 760', desc:'Short-term micro-loan for course fees. Early repayment discount.'},
  {id:3,type:'job',title:'Internship • Fintech Co.', needDvi:700, meta:'Priority shortlist', desc:'3-month paid internship with mentorship and a job offer track.'},
  {id:4,type:'bootcamp',title:'Cloud Bootcamp', needDvi:0, meta:'+50 DVI on completion', desc:'Industry-led training. Certification voucher included.'},
  {id:5,type:'job',title:'Junior QA • SaaS', needDvi:660, meta:'Remote', desc:'Quality assurance role with training program.'},
];

let activeType = 'all';

function renderOps(){
  const list = document.getElementById('opList');
  const filtered = opportunities.filter(o => activeType==='all' || o.type===activeType);
  list.innerHTML = filtered.map(o=>`
    <div class="card glass op-card" data-id="${o.id}">
      <h3>${o.title}</h3>
      <div class="meta">${o.meta}</div>
      <button class="secondary">View</button>
    </div>
  `).join('');
  document.querySelectorAll('.op-card button').forEach(btn=>btn.onclick = (e)=>{
    const id = parseInt(e.target.closest('.op-card').dataset.id,10);
    const op = opportunities.find(x=>x.id===id);
    document.getElementById('opTitle').textContent = op.title;
    document.getElementById('opMeta').textContent = op.meta + (op.needDvi? ` • Target DVI ${op.needDvi}+` : '');
    document.getElementById('opDesc').textContent = op.desc;
    const action = document.getElementById('opAction');
    action.textContent = op.type==='job' ? 'Submit profile' : op.type==='loan' ? 'Check offer' : 'Apply';
    action.onclick = ()=>{ alert('Submitted interest for: ' + op.title); closeModal('opModal'); };
    openModal('opModal');
  });
}

document.querySelectorAll('.filters .chip').forEach(chip=>{
  chip.onclick = ()=>{
    document.querySelectorAll('.filters .chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    activeType = chip.dataset.type;
    renderOps();
  };
});

renderOps();
