const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function sh(cmd) { try { return execSync(cmd, { stdio: 'pipe' }).toString('utf8').trim(); } catch (e) { return ''; } }

function hasChanges() { const s = sh('git status --porcelain'); return !!s && s.length > 0; }
function lastCommitSeconds() { const t = sh('git log -1 --format=%ct'); return t ? parseInt(t, 10) : 0; }

function ensureBackupsDir() { const dir = path.join(process.cwd(), '.backups'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); return dir; }
function ts() { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function archiveName(prefix='auto-rollback'){ return `${prefix}-${ts()}.tar.gz`; }

function createArchive(prefix){ const dir = ensureBackupsDir(); const name = archiveName(prefix); const out = path.join(dir, name); try { sh(`tar -czf ${out} .`); console.log('created', out); return out; } catch (e) { console.error('archive failed', e.message || e); return null; } }

function maybeRollback(){ const now = Math.floor(Date.now()/1000); const last = lastCommitSeconds(); const elapsed = now - (last || 0); if (elapsed >= 1800 || process.argv.includes('--force')) { if (hasChanges()) { createArchive('auto-rollback'); } } }

function main(){ if (process.argv.includes('--once')) { maybeRollback(); return; } console.log('auto rollback daemon disabled'); }

main();
