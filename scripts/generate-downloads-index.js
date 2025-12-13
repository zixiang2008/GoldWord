const fs = require('fs');
const path = require('path');

const version = process.argv[2] || '1.0.3';
const root = process.cwd();
const dir = path.join(root, 'downloads', version);

function listFiles() {
  try { return fs.readdirSync(dir); } catch (_) { return []; }
}

function classify(file) {
  const f = file.toLowerCase();
  if (f.endsWith('.apk')) {
    if (f.includes('pad')) return 'android-pad';
    if (f.includes('phone')) return 'android-phone';
    return 'android';
  }
  if (f.endsWith('.exe')) return 'win';
  if (f.endsWith('.ipa')) return 'ipad';
  if (f.endsWith('.dmg')) return 'mac';
  if (f.endsWith('.zip')) {
    if (f.includes('win')) return 'win';
    return 'mac';
  }
  return null;
}

function buildIndex(files) {
  const items = [];
  files.forEach((file) => {
    const type = classify(file);
    if (!type) return;
    const fp = path.join(dir, file);
    let size = null;
    let mtime = null;
    try {
      const st = fs.statSync(fp);
      size = st.size;
      mtime = st.mtime.toISOString();
    } catch (_) {}
    items.push({ type, name: file, url: `downloads/${version}/${file}`, size, mtime });
  });
  const index = { version, date: new Date().toISOString(), items };
  return index;
}

function writeIndex(index) {
  const target = path.join(dir, 'index.json');
  fs.writeFileSync(target, JSON.stringify(index, null, 2));
  return target;
}

const files = listFiles();
const index = buildIndex(files);
const out = writeIndex(index);
console.log(out);