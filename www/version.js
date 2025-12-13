(async function(){
  function q(id){ return document.getElementById(id); }
  async function getJson(u){ try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error('http '+r.status); return await r.json(); }catch(_){ return null; } }
  async function resolveVersion(){
    const loc=await getJson('version.json');
    if(loc && (loc.version||loc.latest)) return String(loc.version||loc.latest);
    const a=await getJson('downloads/latest.json');
    if(a && (a.latest||a.version)) return String(a.latest||a.version);
    const b=await getJson('docs/version-mac.json');
    if(b && b.version) return String(b.version);
    return '';
  }
  function showOverlay(data){
    const bg=document.createElement('div');
    bg.style.position='fixed'; bg.style.inset='0'; bg.style.background='rgba(0,0,0,0.35)'; bg.style.zIndex='2000';
    const panel=document.createElement('div');
    panel.style.background='#fff'; panel.style.borderRadius='10px'; panel.style.width='min(80vw,520px)'; panel.style.margin='10vh auto'; panel.style.padding='12px'; panel.style.boxShadow='0 10px 30px rgba(0,0,0,0.12)'; panel.style.fontSize='13px'; panel.style.color='#333';
    const pre=document.createElement('pre'); pre.textContent=JSON.stringify(data,null,2); pre.style.whiteSpace='pre-wrap'; pre.style.background='#f7f7f7'; pre.style.border='1px solid #eee'; pre.style.padding='10px';
    const close=document.createElement('button'); close.textContent='关闭'; close.style.margin='8px 0'; close.onclick=function(){ try{ document.body.removeChild(bg);}catch(_){} };
    panel.appendChild(close); panel.appendChild(pre); bg.appendChild(panel); document.body.appendChild(bg);
  }
  async function gatherDetails(){
    const local=await getJson('version.json');
    const latest=await getJson('downloads/latest.json');
    const mac=await getJson('docs/version-mac.json');
    return { local, latest, mac };
  }
  try{
    const vEl=q('appVersion'); if(!vEl) return;
    const v=await resolveVersion(); if(v){ vEl.textContent='v'+v; vEl.style.fontSize='12px'; vEl.style.color='#666666'; vEl.style.whiteSpace='nowrap'; }
    vEl.onclick=async function(){ const d=await gatherDetails(); showOverlay(d); };
  }catch(_){ }
})();
