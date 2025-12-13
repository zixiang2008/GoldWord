#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {execSync}=require('child_process');
const crypto=require('crypto');
function sh(cmd){try{return execSync(cmd,{stdio:'pipe'}).toString('utf8').trim();}catch(e){return ''}}
function ensure(d){if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true});}
function readJSON(f){try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch(_){return null}}
function sizeOf(f){try{const s=fs.statSync(f);return s.size||0;}catch(_){return 0}}
function cp(src,dst){fs.copyFileSync(src,dst)}
function md5Of(f){try{const buf=fs.readFileSync(f);return crypto.createHash('md5').update(buf).digest('hex');}catch(_){return ''}}
function sha256Of(f){try{const buf=fs.readFileSync(f);return crypto.createHash('sha256').update(buf).digest('hex');}catch(_){return ''}}
function main(){
  const root=process.cwd();
  const dist=path.join(root,'dist');
  const dl=path.join(root,'downloads');
  ensure(dl);
  const pkg=readJSON(path.join(root,'package.json'))||{};
  const ver=pkg.version||'1.0.0';
  const verDir=path.join(dl,`v${ver}`);
  ensure(verDir);
  const out=[];
  const macArmDir=path.join(dist,'mac-arm64');
  const appPath=path.join(macArmDir,'GoldWord.app');
  const dmgSrc=path.join(dist,`GoldWord-${ver}-arm64.dmg`);
  const dmgDst=path.join(verDir,`GoldWord-${ver}-mac.dmg`);
  if(fs.existsSync(dmgSrc)){cp(dmgSrc,dmgDst);out.push({filename:path.basename(dmgDst),size:sizeOf(dmgDst)});}
  const macZipSrc=path.join(dist,`GoldWord-${ver}-arm64-mac.zip`);
  const macZipDst=path.join(verDir,`GoldWord-${ver}-mac.zip`);
  if(fs.existsSync(macZipSrc)){cp(macZipSrc,macZipDst);out.push({filename:path.basename(macZipDst),size:sizeOf(macZipDst)});}
  if(fs.existsSync(appPath)){
    const appZipDst=path.join(verDir,`GoldWord-${ver}.app.zip`);
    sh(`cd "${macArmDir}" && zip -qr "${appZipDst}" GoldWord.app`);
    if(fs.existsSync(appZipDst)) out.push({filename:path.basename(appZipDst),size:sizeOf(appZipDst)});
  }
  const winZipSrc=path.join(dist,`GoldWord-${ver}-arm64-win.zip`);
  const winZipDst=path.join(verDir,`GoldWord-${ver}-win.zip`);
  if(fs.existsSync(winZipSrc)){cp(winZipSrc,winZipDst);out.push({filename:path.basename(winZipDst),size:sizeOf(winZipDst)});} 
  const apkSrc=path.join(root,'android','app','build','outputs','apk','release','app-release.apk');
  const apkPhoneDst=path.join(verDir,`goldword-android-phone-${ver}.apk`);
  const apkPadDst=path.join(verDir,`goldword-android-pad-${ver}.apk`);
  if(fs.existsSync(apkSrc)){
    cp(apkSrc,apkPhoneDst);out.push({filename:path.basename(apkPhoneDst),size:sizeOf(apkPhoneDst)});
    cp(apkSrc,apkPadDst);out.push({filename:path.basename(apkPadDst),size:sizeOf(apkPadDst)});
  }
  const checksums = out.map(x=>{const p=path.join(verDir,x.filename);return {filename:x.filename,size:sizeOf(p),md5:md5Of(p),sha256:sha256Of(p)}});
  fs.writeFileSync(path.join(verDir,'checksums.json'), JSON.stringify(checksums,null,2));
  const latestPath=path.join(root,'latest-version.json');
  fs.writeFileSync(latestPath, JSON.stringify({version:ver,dir:`v${ver}`,files:out,timestamp:new Date().toISOString()},null,2));
  const jsonPath=path.join(root,'cdn-links-generated.json');
  fs.writeFileSync(jsonPath,JSON.stringify(out,null,2));
  console.log(JSON.stringify({count:out.length,files:out},null,2));
}
main();
