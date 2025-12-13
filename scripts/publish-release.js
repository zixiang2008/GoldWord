const fs = require('fs');
const path = require('path');
const https = require('https');

const OWNER = 'zixiang2008';
const REPO = 'GoldWord';
const VERSION = process.argv[2] || '1.0.3';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!TOKEN) {
  console.error('Missing GITHUB_TOKEN');
  process.exit(1);
}

function req(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      method,
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      headers: Object.assign({
        'User-Agent': 'goldword-release-script',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }, headers)
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString('utf8');
        if ((res.headers['content-type'] || '').includes('application/json')) {
          try { resolve({ status: res.statusCode, json: JSON.parse(text), headers: res.headers }); }
          catch (_) { resolve({ status: res.statusCode, text, headers: res.headers }); }
        } else {
          resolve({ status: res.statusCode, buffer: buf, text, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getReleaseByTag(tag) {
  const r = await req('GET', `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${encodeURIComponent(tag)}`);
  if (r.status === 200) return r.json;
  return null;
}

async function createRelease(tag, name, targetCommitish = 'main') {
  const body = JSON.stringify({ tag_name: tag, name, target_commitish: targetCommitish, draft: false, prerelease: false });
  const r = await req('POST', `https://api.github.com/repos/${OWNER}/${REPO}/releases`, { 'Content-Type': 'application/json' }, body);
  if (r.status >= 200 && r.status < 300) return r.json;
  throw new Error(`createRelease failed: ${r.status} ${r.text || ''}`);
}

function contentTypeByExt(name) {
  const n = name.toLowerCase();
  if (n.endsWith('.apk')) return 'application/vnd.android.package-archive';
  if (n.endsWith('.ipa')) return 'application/octet-stream';
  if (n.endsWith('.dmg')) return 'application/x-apple-diskimage';
  if (n.endsWith('.zip')) return 'application/zip';
  if (n.endsWith('.exe')) return 'application/vnd.microsoft.portable-executable';
  return 'application/octet-stream';
}

async function uploadAsset(releaseId, filePath, fileName) {
  const stat = fs.statSync(filePath);
  const ct = contentTypeByExt(fileName);
  const url = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`;
  const r = await req('POST', url, { 'Content-Type': ct, 'Content-Length': stat.size }, fs.readFileSync(filePath));
  if (r.status >= 200 && r.status < 300) return r.json;
  if (r.status === 422) { return null; }
  throw new Error(`uploadAsset failed: ${r.status} ${r.text || ''}`);
}

async function listAssets(releaseId) {
  const r = await req('GET', `https://api.github.com/repos/${OWNER}/${REPO}/releases/${releaseId}/assets`);
  if (r.status === 200) return r.json || [];
  return [];
}

async function deleteAsset(assetId) {
  const r = await req('DELETE', `https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${assetId}`);
  return r.status === 204;
}

async function main() {
  const tag = `v${VERSION}`;
  let rel = await getReleaseByTag(tag);
  if (!rel) rel = await createRelease(tag, `GoldWord ${VERSION}`, 'main');
  const dir = path.join(process.cwd(), 'downloads', VERSION);
  const files = fs.readdirSync(dir).filter(f => f !== 'index.json');
  for (const f of files) {
    const fp = path.join(dir, f);
    let up = await uploadAsset(rel.id, fp, f);
    if (!up) {
      const assets = await listAssets(rel.id);
      const existing = (assets || []).find(a => a && a.name === f);
      if (existing) {
        await deleteAsset(existing.id);
        up = await uploadAsset(rel.id, fp, f);
      }
    }
    console.log(`uploaded: ${f}`);
  }
  console.log('done');
}

main().catch(e => { console.error(String(e && e.message ? e.message : e)); process.exit(1); });