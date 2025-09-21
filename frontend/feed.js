
// Simple in-memory store
let posts = [
  {id:1,name:'Emily Chen', dvi:712, grade:'Good', text:'Just completed AWS Certification! 🎉 Eligible for a micro-loan via MeMetrics.',
   likes:3, comments:[], pledges:[], embed:{title:'AWS Certified', body:'€2,000 microloan available'}},
  {id:2,name:'Fatima Noor', dvi:768, grade:'Excellent', text:'Bootcamp done & interview at Revolut 🙏 Thank you sponsors!',
   likes:8, comments:[{by:'Amina',text:'Congrats!'}], pledges:[], embed:{title:'Milestone', body:'Interview Fast-Track: Revolut • Partner'}}
];
let currentPostIdForComment = null;
let currentPostIdForPledge = null;

// Render feed
function render(){
  const feed = document.getElementById('feedList');
  feed.innerHTML = posts.map(p => `
    <article class="post card glass" data-id="${p.id}">
      <div class="who"><div class="avatar"></div>
        <div><div class="name">${p.name}</div>
        <div class="meta">DVI ${p.dvi} • <span class="badge">${p.grade}</span></div></div>
      </div>
      <p class="text">${p.text}</p>
      ${p.embed ? `<div class="embed"><strong>${p.embed.title}</strong><div>${p.embed.body}</div></div>` : ""}
      <div class="actions">
        <button class="ghost likeBtn">💙 Like <span>(${p.likes})</span></button>
        <button class="ghost commentBtn">💬 Comment <span>(${p.comments.length})</span></button>
        <button class="ghost sponsorBtn">💸 Sponsor <span>(${p.pledges.reduce((a,b)=>a+b.amount,0)}€)</span></button>
        <button class="ghost shareBtn">↗ Share</button>
      </div>
      ${p.comments.length ? `<div class="embed"><strong>Comments</strong><div>${p.comments.map(c=>`<div><b>${c.by}:</b> ${c.text}</div>`).join("")}</div></div>` : ""}
    </article>
  `).join('');

  // Wire buttons
  document.querySelectorAll('.likeBtn').forEach(btn=>btn.onclick = (e)=>{
    const el = e.target.closest('.post'); const id = parseInt(el.dataset.id,10);
    const post = posts.find(x=>x.id===id); post.likes++; render();
  });
  document.querySelectorAll('.commentBtn').forEach(btn=>btn.onclick = (e)=>{
    const el = e.target.closest('.post'); currentPostIdForComment = parseInt(el.dataset.id,10);
    openModal('commentModal');
  });
  document.querySelectorAll('.sponsorBtn').forEach(btn=>btn.onclick = (e)=>{
    const el = e.target.closest('.post'); currentPostIdForPledge = parseInt(el.dataset.id,10);
    openModal('sponsorModal');
  });
  document.querySelectorAll('.shareBtn').forEach(btn=>btn.onclick = async (e)=>{
    const el = e.target.closest('.post'); const id = parseInt(el.dataset.id,10);
    const url = location.origin + location.pathname + '#post-'+id;
    try{
      await navigator.clipboard.writeText(url);
      alert('Post link copied!');
    }catch(_){ alert('Link: '+url); }
  });
}
render();

// Composer
document.getElementById('postBtn').onclick = ()=>{
  const t = document.getElementById('composerText').value.trim(); if(!t) return;
  const dvi = parseInt(document.getElementById('youDvi').textContent || "700",10) || 700;
  const grade = dvi>=760?"Excellent": dvi>=680?"Good": dvi>=600?"Fair":"Developing";
  const id = (posts.reduce((m,p)=>Math.max(m,p.id),0)+1);
  posts.unshift({id,name:'You', dvi, grade, text:t, likes:0, comments:[], pledges:[]});
  document.getElementById('composerText').value='';
  render();
};

// Pull DVI from API
document.getElementById('pullDviBtn').onclick = async ()=>{
  try{
    const payload={skills_index:0.62,learning_pace:0.61,certifications:1,project_score:0.55,financial_behavior:0.5,resilience_score:0.62};
    const res = await fetch(window.MEMETRICS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    document.getElementById('youDvi').textContent = data.dvi;
    document.querySelector('.composer .badge').textContent = data.grade;
  }catch(e){ alert('Could not reach API. Is backend running?'); }
};

// Comment modal handlers
document.getElementById('submitComment').onclick = ()=>{
  const text = document.getElementById('commentText').value.trim(); if(!text) return;
  const post = posts.find(x=>x.id===currentPostIdForComment);
  if(post){ post.comments.push({by:'You', text}); }
  document.getElementById('commentText').value = '';
  closeModal('commentModal');
  render();
};

// Sponsor modal handlers
document.getElementById('submitPledge').onclick = ()=>{
  const amount = Math.max(0, parseFloat(document.getElementById('pledgeAmount').value||'0'));
  const note = document.getElementById('pledgeNote').value.trim();
  const post = posts.find(x=>x.id===currentPostIdForPledge);
  if(post && amount){ post.pledges.push({amount, note}); }
  document.getElementById('pledgeAmount').value = '25';
  document.getElementById('pledgeNote').value = '';
  closeModal('sponsorModal');
  render();
};
