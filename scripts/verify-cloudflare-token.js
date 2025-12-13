#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

function verifyToken(token){
  return new Promise((resolve,reject)=>{
    const opts = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: '/client/v4/user/tokens/verify',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'GoldWord-Token-Verify'
      }
    };
    const req = https.request(opts, (res)=>{
      let data = '';
      res.on('data', c=> data += c);
      res.on('end', ()=>{
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch(_){ resolve({ statusCode: res.statusCode, raw: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main(){
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if(!token){
    console.error('No CLOUDFLARE_API_TOKEN provided. Export it before running.');
    process.exitCode = 1;
    return;
  }
  try{
    const res = await verifyToken(token);
    const report = {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      result: res.body || res.raw || null
    };
    const out = path.join(process.cwd(), 'cloudflare-token-verification.json');
    fs.writeFileSync(out, JSON.stringify(report, null, 2));
    console.log('Verification written to', out);
    if (res.statusCode !== 200 || !(res.body && res.body.success)) {
      console.error('Token verification failed or insufficient permissions.');
      process.exitCode = 2;
    }
  } catch (e) {
    console.error('Verification error:', e.message);
    process.exitCode = 3;
  }
}
main();
