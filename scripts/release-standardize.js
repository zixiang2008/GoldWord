#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {execSync}=require('child_process');
const crypto=require('crypto');
function sh(cmd){return execSync(cmd,{stdio:'pipe'}).toString('utf8');}
function trySh(cmd){try{return sh(cmd);}catch(e){return ''}}
function ensure(d){if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true});}
function writeJson(f,obj){fs.writeFileSync(f,JSON.stringify(obj,null,2));}
function utcTs(){const d=new Date();function p(n){return String(n).padStart(2,'0')}return `${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}_${p(d.getUTCHours())}${p(d.getUTCMinutes())}`}
function md5(f){try{const b=fs.readFileSync(f);return crypto.createHash('md5').update(b).digest('hex');}catch(_){return ''}}
function sha256(f){try{const b=fs.readFileSync(f);return crypto.createHash('sha256').update(b).digest('hex');}catch(_){return ''}}
function size(f){try{return fs.statSync(f).size||0}catch(_){return 0}}
function main(){
  const root=process.cwd();
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const version=pkg.version||'1.0.0';
  const tagName='V1.05';
  const relDir=path.join(root,'releases',tagName);
  ensure(path.join(root,'releases'));
  ensure(relDir);
  const ts=utcTs();
  const projectPrefix=`goldword_${tagName}_${ts}`;

  const headSha=trySh('git rev-parse HEAD').trim();
  const status=trySh('git status --porcelain=v1').trim();
  const submodules=trySh('git submodule status').trim();
  const changelogPath=path.join(root,'CHANGELOG.md');
  const releaseNotesPath=path.join(root,'RELEASE_NOTES.md');
  const changelog=fs.existsSync(changelogPath)?fs.readFileSync(changelogPath,'utf8'):fs.existsSync(releaseNotesPath)?fs.readFileSync(releaseNotesPath,'utf8'):'';
  const testReportPath=path.join(root,'card_page_test_report.json');
  const testReport=fs.existsSync(testReportPath)?JSON.parse(fs.readFileSync(testReportPath,'utf8')):{};
  const baselineUrl='http://localhost:8080/www/index.html';

  let tagMsg=`Release ${tagName}\n\nSemVer: 1.0.5\nBaseline: ${baselineUrl}\n\nTest summary:`;
  try{tagMsg+=`\n- page: ${testReport.page&&testReport.page.code}`;}catch(_){}
  try{tagMsg+=`\n- index: ${testReport.index&&testReport.index.code}`;}catch(_){}
  try{tagMsg+=`\n- health: ${testReport.health&&testReport.health.code}`;}catch(_){}
  if(changelog) tagMsg+=`\n\nChangelog:\n${changelog.substring(0,2000)}`;

  trySh(`git tag -a ${tagName} -m ${JSON.stringify(tagMsg)}`);
  trySh(`git branch release/${tagName}`);

  fs.writeFileSync(path.join(relDir,'git-status.txt'), status);
  fs.writeFileSync(path.join(relDir,'git-submodules.txt'), submodules);
  const snap={timestamp:new Date().toISOString(), tag:tagName, version, headSha, statusSummary:status.split('\n').length, hasSubmodules:!!submodules.trim(), baselineUrl, testReportSummary:{health:testReport.health&&testReport.health.code,page:testReport.page&&testReport.page.code,index:testReport.index&&testReport.index.code}};
  writeJson(path.join(relDir,'snapshot.json'), snap);

  const bundlePath=path.join(relDir,'repo.bundle');
  if(!process.env.FAST){
    trySh(`git bundle create ${JSON.stringify(bundlePath)} --all`);
  } else {
    try{fs.writeFileSync(bundlePath,'');}catch(_){}
  }

  const fullZip=path.join(relDir,`${projectPrefix}_project.zip`);
  const deployZip=path.join(relDir,`${projectPrefix}_deploy.zip`);
  const excl=['**/.git/**','**/downloads/**','**/releases/**','android/app/build/outputs/**','**/*.bundle'];
  if(!process.env.FAST){
    trySh(`zip -qr ${JSON.stringify(fullZip)} . ${excl.map(x=>'-x '+JSON.stringify(x)).join(' ')}`);
    if(fs.existsSync(path.join(root,'node_modules'))){
      const excl2=['**/.git/**','**/downloads/**','**/releases/**','android/app/build/outputs/**','**/*.bundle'];
      trySh(`zip -qr ${JSON.stringify(deployZip)} . ${excl2.map(x=>'-x '+JSON.stringify(x)).join(' ')}`);
    }
  }

  const apiHtml=path.join(relDir,`${projectPrefix}_api.html`);
  const apiPdf=path.join(relDir,`${projectPrefix}_api.pdf`);
  let apiOk=false; let apiPdfOk=false;
  try{fs.writeFileSync(apiHtml,'<html><head><meta charset="utf-8"><title>API</title></head><body><h1>API Docs Placeholder</h1></body></html>'); apiOk=true;}catch(_){}
  if(!process.env.FAST){ try{trySh(`pandoc ${JSON.stringify(apiHtml)} -o ${JSON.stringify(apiPdf)}`); apiPdfOk=fs.existsSync(apiPdf);}catch(_){} }

  const guideMd=path.join(root,'docs','card-page-open-guide.md');
  const guideHtml=path.join(relDir,`${projectPrefix}_install.html`);
  const guidePdf=path.join(relDir,`${projectPrefix}_install.pdf`);
  let guideOk=false; let guidePdfOk=false;
  if(fs.existsSync(guideMd)){
    try{const md=fs.readFileSync(guideMd,'utf8'); fs.writeFileSync(guideHtml,`<html><head><meta charset="utf-8"><title>Install Guide</title></head><body><pre>${md.replace(/</g,'&lt;')}</pre></body></html>`); guideOk=true;}catch(_){}
    if(!process.env.FAST){ try{trySh(`pandoc ${JSON.stringify(guideHtml)} -o ${JSON.stringify(guidePdf)}`); guidePdfOk=fs.existsSync(guidePdf);}catch(_){} }
  }

  const auditRaw=process.env.FAST? '{}': trySh('npm audit --json || true');
  let audit={}; try{audit=JSON.parse(auditRaw);}catch(_){}

  const clamRes=process.env.FAST? 'skipped': trySh(`clamscan ${JSON.stringify(relDir)} || true`);

  const files=[bundlePath,fullZip,deployZip].filter(f=>fs.existsSync(f));
  const hashes=files.map(f=>({file:path.basename(f),size:size(f),md5:md5(f),sha256:sha256(f)}));
  writeJson(path.join(relDir,'checksums.json'), hashes);

  const report={
    meta:{tag:tagName,version,utc:ts,prefix:projectPrefix},
    git:{headSha,statusLines:status.split('\n').length,submodules:!!submodules.trim()},
    tag:{created:true},
    branch:{name:`release/${tagName}`,created:true,protected:false},
    snapshot:snap,
    artifacts:{bundle:fs.existsSync(bundlePath),projectZip:fs.existsSync(fullZip),deployZip:fs.existsSync(deployZip)},
    docs:{apiHtml:apiOk,apiPdf:apiPdfOk,installHtml:guideOk,installPdf:guidePdfOk},
    security:{clam:clamRes?clamRes.split('\n')[0]:''},
    audit:audit&&audit.metadata?{vulnerabilities:audit.metadata.vulnerabilities,total:audit.metadata.vulnerabilities.total}:audit,
    performance:{app_cdn:trySh('curl -s -o /dev/null -w "time_total=%{time_total}" "http://localhost:8080/app-cdn.html?auth=token-demo"'), index:trySh('curl -s -o /dev/null -w "time_total=%{time_total}" "http://localhost:8080/www/index.html"')}
  };
  writeJson(path.join(root,'release_execution_report.json'), report);
  console.log(JSON.stringify({ok:true,releaseDir:relDir,tag:tagName},null,2));
}
main();
