window.authHeaders=function(){try{const t=(window.getToken?window.getToken():localStorage.getItem('mitra_token'))||'';return t?{'Authorization':'Bearer '+t}:{}}catch(_){return {}}};
