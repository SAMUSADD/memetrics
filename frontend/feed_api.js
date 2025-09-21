// API-connected Feed
const API = window.MITRA_API;

async function apiGet(path){ const r = await fetch(API + path); return await r.json(); }
async function apiPost(path, body){ const r = await fetch(API + path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{})}); return await r.json(); }

let posts = [];

function el(t, attrs={}, children=[]) {
  const e=document.createElement(t);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') e.className=v; else if(k==='dataset'){ Object.entries(v).forEach(([kk,vv])=> e.dataset[kk]=vv); }
    else e.setAttribute(k,v);
  });
  children.forEach(c=> e.appendChild(typeof c==='string'? document.createTextNode(c): c));
  return e;
}

async function refreshFeed(){
  posts = await apiGet('/posts');
  render();
}

function render(){
  const feed = document.getElementById('feedList');
  feed.innerHTML = '';
  posts.forEach(p=>{
    const card = el('article', {class:'post card glass', dataset:{id:p.id}});
    const who = el('div',{class:'who'},[el('div',{class:'avatar'}), el('div',{},[el('div',{class:'name'},[document.createTextNode(p.author)]), el('div',{class:'meta'},[document.createTextNode('DVI '+p.dvi+' • '), el('span',{class:'badge'},[document.createTextNode(p.grade)])])])]);
    const text = el('p',{class:'text'},[document.createTextNode(p.text)]);
    const actions = el('div',{class:'actions'});
    const likeBtn = el('button',{class:'ghost'},[document.createTextNode('💙 Like ('+p.likes+')')]);
    likeBtn.onclick = async ()=>{ await apiPost('/posts/'+p.id+'/like'); await refreshFeed(); };
    const commentBtn = el('button',{class:'ghost'},[document.createTextNode('💬 Comment ('+(p.comments?.length||0)+')')]);
    commentBtn.onclick = ()=>{ window.currentPostIdForComment = p.id; openModal('commentModal'); };
    const sponsorBtn = el('button',{class:'ghost'},[document.createTextNode('💸 Sponsor ('+(p.pledge_total||0)+'€)')]);
    sponsorBtn.onclick = ()=>{ window.currentPostIdForPledge = p.id; openModal('sponsorModal'); };
    const shareBtn = el('button',{class:'ghost'},[document.createTextNode('↗ Share')]);
    shareBtn.onclick = async ()=>{
      const url = location.origin + location.pathname + '#post-'+p.id;
      try{ await navigator.clipboard.writeText(url); alert('Post link copied!'); }catch(_){ alert('Link: '+url); }
    };
    actions.append(likeBtn, commentBtn, sponsorBtn, shareBtn);

    const commentsBlock = el('div',{class:'embed'});
    commentsBlock.append(el('strong',{},[document.createTextNode('Comments')]));
    (p.comments||[]).forEach(c=> commentsBlock.append(el('div',{},[el('b',{},[document.createTextNode(c.author+': ')]), document.createTextNode(c.text)]))));
    card.append(who, text, actions);
    if((p.comments||[]).length) card.append(commentsBlock);
    feed.append(card);
  });
}

document.getElementById('postBtn').onclick = async ()=>{
  const t = document.getElementById('composerText').value.trim(); if(!t) return;
  const dviTxt = (document.getElementById('youDvi').textContent||'').trim();
  const dvi = parseInt(dviTxt || '700', 10) || 700;
  const grade = dvi>=760?"Excellent": dvi>=680?"Good": dvi>=600?"Fair":"Developing";
  await apiPost('/posts', {author:'You', text:t, dvi, grade});
  document.getElementById('composerText').value='';
  await refreshFeed();
};

document.getElementById('pullDviBtn').onclick = async ()=>{
  try{
    const payload={skills_index:0.62,learning_pace:0.61,certifications:1,project_score:0.55,financial_behavior:0.5,resilience_score:0.62};
    const res = await fetch(window.MEMETRICS_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    document.getElementById('youDvi').textContent = data.dvi;
    document.querySelector('.composer .badge').textContent = data.grade;
    await apiPost('/history', {user:'you', dvi:data.dvi});
  }catch(e){ alert('Could not reach API. Is backend running?'); }
};

// Modal actions (assumes same HTML modals exist)
document.getElementById('submitComment').onclick = async ()=>{
  const text = document.getElementById('commentText').value.trim(); if(!text) return;
  const pid = window.currentPostIdForComment;
  await apiPost('/posts/'+pid+'/comment', {author:'You', text});
  document.getElementById('commentText').value='';
  closeModal('commentModal');
  await refreshFeed();
};

document.getElementById('submitPledge').onclick = async ()=>{
  const amount = Math.max(0, parseFloat(document.getElementById('pledgeAmount').value||'0'));
  const note = document.getElementById('pledgeNote').value.trim();
  const pid = window.currentPostIdForPledge;
  if(amount){ await apiPost('/posts/'+pid+'/pledge', {author:'You', amount, note}); }
  document.getElementById('pledgeAmount').value='25';
  document.getElementById('pledgeNote').value='';
  closeModal('sponsorModal');
  await refreshFeed();
};

// Initial load
refreshFeed();
