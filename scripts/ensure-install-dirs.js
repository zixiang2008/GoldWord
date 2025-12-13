#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
function ensure(d){if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true});}
function move(src,dst){fs.renameSync(src,dst)}
function list(dir){try{return fs.readdirSync(dir);}catch(_){return []}}
function main(){
  const root=process.cwd();
  const downloads=path.join(root,'downloads');
  const dist=path.join(root,'dist');
  ensure(downloads);
  const moved=[];
  const files=list(dist);
  files.forEach(f=>{
    const lower=f.toLowerCase();
    if(lower.endsWith('.dmg')||lower.endsWith('.zip')){
      const src=path.join(dist,f);
      const dst=path.join(downloads,f.replace('-arm64','').replace('.app.zip','.app.zip'));
      try{ move(src,dst); moved.push({from:src,to:dst}); }catch(_){ }
    }
  });
  const macArm=path.join(dist,'mac-arm64');
  if(fs.existsSync(path.join(macArm,'GoldWord.app'))){
    ensure(path.join(downloads,'apps'));
    const dst=path.join(downloads,'apps','GoldWord.app');
    try{ move(path.join(macArm,'GoldWord.app'), dst); moved.push({from:path.join(macArm,'GoldWord.app'),to:dst}); }catch(_){}
  }
  fs.writeFileSync(path.join(root,'install-dirs-report.json'), JSON.stringify({timestamp:new Date().toISOString(), moved}, null, 2));
  console.log(JSON.stringify({movedCount:moved.length},null,2));
}
main();
