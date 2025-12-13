const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function sh(cmd) { try { return execSync(cmd, { stdio: 'pipe' }).toString('utf8').trim(); } catch (e) { return ''; } }
function ts() { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function slug(s){ return String(s||'update').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

function ensureBackupsDir() { const dir = path.join(process.cwd(), '.backups'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); return dir; }

function createArchive(name){ const dir = ensureBackupsDir(); const out = path.join(dir, name); try { sh(`tar -czf ${out} .`); console.log('created', out); return out; } catch (e) { console.error('archive failed', e.message || e); return null; } }

function main(){ const desc = process.argv.slice(2).join(' ') || 'update'; const name = `feature-rollback-${slug(desc)}-${ts()}.tar.gz`; createArchive(name); const tag = `feature-rollback-${ts()}-${slug(desc)}`; sh(`git tag -a ${tag} -m "feature rollback: ${desc}"`); console.log('tag', tag); }

main();