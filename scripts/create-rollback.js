const { execSync } = require('child_process');

function sh(cmd) {
  try { return execSync(cmd, { stdio: 'pipe' }).toString('utf8').trim(); } catch (e) { return null; }
}

function nowTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `rollback-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function main() {
  const inside = sh('git rev-parse --is-inside-work-tree');
  if (!inside) {
    sh('git init');
  }
  sh('git add -A');
  const msg = `chore: 自动回撤点`;
  const author = 'Trae User <user@example.com>';
  sh(`GIT_AUTHOR_NAME="Trae User" GIT_AUTHOR_EMAIL="user@example.com" GIT_COMMITTER_NAME="Trae User" GIT_COMMITTER_EMAIL="user@example.com" git commit -m "${msg}"`);
  const tag = nowTag();
  sh(`git tag -a ${tag} -m "回撤点"`);
  const last = sh('git log -n 1 --oneline');
  console.log(last || 'no commit');
  console.log(tag);
}

main();