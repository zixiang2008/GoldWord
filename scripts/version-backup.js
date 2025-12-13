#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {execSync}=require('child_process');
function sh(c){try{return execSync(c,{stdio:'pipe'}).toString('utf8').trim();}catch(e){return '';}}
function ensure(dir){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});}
function now(){const d=new Date();const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;}
function readJSON(f){try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch(_){return null;}}
function writeJSON(f,obj){fs.writeFileSync(f,JSON.stringify(obj,null,2));}
function sizeOf(p){try{const s=sh(`du -sk ${p}`);const k=parseInt((s.split('\t')[0]||'0'),10);return isNaN(k)?0:k*1024;}catch(_){return 0;}}
function freeSpace(){try{const s=sh('df -k . | tail -1 | awk "{print $4}"');const k=parseInt(s,10);return isNaN(k)?0:k*1024;}catch(_){return 0;}}
function log(msg){const f=path.join(process.cwd(),'backup-manager.log');fs.appendFileSync(f,`[${new Date().toISOString()}] ${msg}\n`);} 
function getVersion(){const pkg=readJSON(path.join(process.cwd(),'package.json'));return pkg&&pkg.version||'';}
function listBackups(dir){return fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>/^version-rollback-.*\.tar\.gz$/.test(f)).map(f=>({name:f,full:path.join(dir,f),mtime:fs.statSync(path.join(dir,f)).mtime.getTime()})).sort((a,b)=>b.mtime-a.mtime):[];}
function createBackup(ver){const backups=path.join(process.cwd(),'.backups');ensure(backups);const ts=now();const name=`version-rollback-${ver}-${ts}.tar.gz`;const out=path.join(backups,name);const src=path.join(process.cwd(),'www');const include=[
  'index.html','app.js','ui.js','db.js','storage.js','word-enhancement-service.js','word-schema.js','built-in-models.js','eight-dimensional-memory.css','eight-dimensional-memory.js','manifest.json','service-worker.js','icons'
];
const files=include.map(f=>path.join('www',f)).join(' ');
const ok=sh(`tar -czf ${out} ${files}`);
log(`create ${name}`);
return out;
}
function enforceRetention(){const dir=path.join(process.cwd(),'.backups');const list=listBackups(dir);if(list.length>3){for(let i=3;i<list.length;i++){try{fs.unlinkSync(list[i].full);log(`delete ${list[i].name}`);}catch(_){}}}}
function readState(){const f=path.join(process.cwd(),'.backups','state.json');return readJSON(f)||{lastVersion:'',history:[]};}
function writeState(s){const f=path.join(process.cwd(),'.backups','state.json');ensure(path.dirname(f));writeJSON(f,s);} 
function cleanAll(){const dir=path.join(process.cwd(),'.backups');if(fs.existsSync(dir)){const list=fs.readdirSync(dir);for(const n of list){try{fs.unlinkSync(path.join(dir,n));}catch(_){}}try{fs.rmdirSync(dir);}catch(_){}}log('clean all backups');}
function main(){const args=process.argv.slice(2);if(args.includes('--clean-all')){cleanAll();const free=freeSpace();log(`free ${free}`);console.log('cleaned');return;}const simIdx=args.indexOf('--simulate-version');const ver=simIdx>=0?args[simIdx+1]:getVersion();const state=readState();if(state.lastVersion!==ver){const out=createBackup(ver);state.lastVersion=ver;state.history=[{version:ver,file:path.basename(out),ts:Date.now()}].concat(state.history).slice(0,10);writeState(state);enforceRetention();}
const used=sizeOf(path.join(process.cwd(),'.backups'));const free=freeSpace();if(free>0&&free<200*1024*1024){log('warn low free space');}log(`used ${used} free ${free}`);console.log(JSON.stringify({used,free,state},null,2));}
main();
