const fs = require('fs');
const path = require('path');

const root = process.cwd();
const www = path.join(root, 'www');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function copy(src, dest){ fs.copyFileSync(src, dest); }
function cpdir(srcDir, destDir){ ensureDir(destDir); for(const f of fs.readdirSync(srcDir)){ const s = path.join(srcDir, f); const d = path.join(destDir, f); const stat = fs.statSync(s); if(stat.isDirectory()){ cpdir(s, d); } else { copy(s, d); } } }

ensureDir(www);

const files = [
  'index.html',
  'app.js',
  'ui.js',
  'db.js',
  'storage.js',
  'word-enhancement-service.js',
  'word-schema.js',
  'built-in-models.js',
  'eight-dimensional-memory.css',
  'eight-dimensional-memory.js',
  'manifest.json',
  'service-worker.js'
];

for(const f of files){
  const src = path.join(root, f);
  if(fs.existsSync(src)) copy(src, path.join(www, f));
}

cpdir(path.join(root, 'icons'), path.join(www, 'icons'));