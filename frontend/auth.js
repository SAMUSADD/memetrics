
window.MITRA_API = window.MITRA_API || 'http://localhost:8000';
const TOK_KEY = 'mitra_token';
function setToken(t){ localStorage.setItem(TOK_KEY, t||''); }
function getToken(){ try{return localStorage.getItem(TOK_KEY)||'';}catch(_){return '';} }
window.getToken = getToken;

async function apiPost(path, body){
  const headers={'Content-Type':'application/json'};
  const t=getToken(); if(t) headers['Authorization']='Bearer '+t;
  const r=await fetch(window.MITRA_API+path,{method:'POST',headers,body:JSON.stringify(body||{})});
  if(!r.ok){ const j=await r.json().catch(()=>({detail:'Error'})); throw new Error(j.detail||'Error'); }
  return await r.json();
}

document.getElementById('loginBtn').onclick = async ()=>{
  try{
    const email=document.getElementById('loginEmail').value.trim();
    const pw=document.getElementById('loginPw').value;
    const res = await apiPost('/auth/login',{email,password:pw});
    setToken(res.token); alert('Signed in as '+res.name); location.href='index.html';
  }catch(e){ alert(e.message); }
};
document.getElementById('regBtn').onclick = async ()=>{
  try{
    const name=document.getElementById('regName').value.trim();
    const email=document.getElementById('regEmail').value.trim();
    const pw=document.getElementById('regPw').value;
    const res = await apiPost('/auth/register',{name,email,password:pw});
    setToken(res.token); alert('Welcome, '+res.name+'!'); location.href='index.html';
  }catch(e){ alert(e.message); }
};
