#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {execSync}=require('child_process');
function sh(cmd){try{return execSync(cmd,{stdio:'pipe'}).toString('utf8').trim();}catch(e){return ''}}
function readJSON(f){try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch(_){return null}}
function writeFile(f,txt){fs.writeFileSync(f,txt)}
function getCurrentVersion(){const pkg=readJSON(path.join(process.cwd(),'package.json'));return pkg&&pkg.version||''}
function getPrevTag(){return sh('git describe --tags --abbrev=0')}
function getChangedFiles(from){const range = from? `${from}..HEAD` : '';
  const cmd = from? `git diff --name-only ${range}` : 'git ls-files';
  return sh(cmd).split(/\r?\n/).filter(Boolean)}
function getCommitSummary(from){const range = from? `${from}..HEAD` : 'HEAD~20..HEAD';
  const fmt = '%h %ad %an %s';
  return sh(`git log --pretty=format:"${fmt}" --date=short ${range}`)}
function main(){const now=new Date().toISOString();const curr=getCurrentVersion();const prevTag=getPrevTag();const files=getChangedFiles(prevTag);const commits=getCommitSummary(prevTag);
  const json={timestamp:now, version:{current:curr, previousTag:prevTag}, files, commits};
  const outJson=path.join(process.cwd(),'release-report.json');
  const outMd=path.join(process.cwd(),'RELEASE_NOTES.md');
  fs.writeFileSync(outJson, JSON.stringify(json,null,2));
  const md = [
    `# Release Report ${curr}`,
    `- Time: ${now}`,
    `- Previous Tag: ${prevTag||'N/A'}`,
    `\n## Changed Files`,
    ...(files.length? files.map(f=>`- ${f}`): ['- (none)']),
    `\n## Commits`,
    commits? commits.split(/\r?\n/).map(l=>`- ${l}`): ['- (none)']
  ].join('\n');
  fs.writeFileSync(outMd, md);
  console.log(JSON.stringify({ok:true, outJson, outMd, currentVersion:curr, previousTag:prevTag},null,2));
}
main();
