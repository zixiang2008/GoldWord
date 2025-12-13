#!/usr/bin/env node
const https=require('https');
const http=require('http');
const fs=require('fs');
function req(u){return new Promise((resolve)=>{const mod=u.startsWith('https')?https:http;const r=mod.request(u, (res)=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>resolve({code:res.statusCode,body:b,headers:res.headers}));});r.on('error',e=>resolve({error:e.message}));r.end();});}
async function main(){
  const report={ timestamp:new Date().toISOString() };
  report.health=await req('http://localhost:8080/health');
  const token=process.env.GW_AUTH_TOKEN||'token-demo';
  report.page=await req(`http://localhost:8080/app-cdn.html?auth=${encodeURIComponent(token)}`);
  report.index=await req('http://localhost:8080/cdn-links-generated.json');
  fs.writeFileSync('card_page_test_report.json', JSON.stringify(report,null,2));
  console.log('written card_page_test_report.json');
}
main();
