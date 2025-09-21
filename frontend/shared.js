
const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>document.querySelectorAll(sel);
const byId = (id)=>document.getElementById(id);
window.openModal = (id)=> byId(id).classList.add('show');
window.closeModal = (id)=> byId(id).classList.remove('show');
