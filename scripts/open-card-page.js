#!/usr/bin/env node
const {execSync,spawn} = require('child_process');
const os = require('os');
const fs = require('fs');
function sh(cmd){ try{ return execSync(cmd,{stdio:'pipe'}).toString('utf8'); }catch(e){ return e.message; } }
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function ensureServer(){
  try{ const code = sh('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health').trim(); if(code==='200') return; }catch(_){ }
  try{ spawn('node',['cloud-sync-server.js'],{stdio:'ignore',detached:true}).unref(); }catch(_){ }
  for(let i=0;i<10;i++){ await wait(300); try{ const c=sh('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health').trim(); if(c==='200') return; }catch(_){ } }
}
function openUrl(url){
  const p = process.platform;
  try{
    if(p==='darwin') execSync(`open "${url}"`);
    else if(p==='win32') execSync(`start "" "${url}"`,{shell:'cmd.exe'});
    else execSync(`xdg-open "${url}"`);
    return true;
  }catch(e){ fs.writeFileSync('open_card_page.log', e.message+'
'); return false; }
}
async function main(){
  const token = process.env.GW_AUTH_TOKEN || 'token-demo';
  await ensureServer();
  const url = `http://localhost:8080/app-cdn.html?auth=${encodeURIComponent(token)}`;
  const ok = openUrl(url);
  console.log(JSON.stringify({opened:ok,url},null,2));
}
main();
