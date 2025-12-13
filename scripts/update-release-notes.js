const fs = require('fs');
const path = require('path');
const https = require('https');

const OWNER = 'zixiang2008';
const REPO = 'GoldWord';
const VERSION = process.argv[2] || '1.0.3';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!TOKEN) { console.error('Missing GITHUB_TOKEN'); process.exit(1); }

function req(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { method, hostname: u.hostname, path: u.pathname + (u.search || ''), headers: Object.assign({ 'User-Agent': 'goldword-release-notes', 'Authorization': `token ${TOKEN}`, 'Accept': 'application/vnd.github+json' }, headers) };
    const r = https.request(opts, res => { const b=[]; res.on('data',d=>b.push(d)); res.on('end',()=>{ const t=Buffer.concat(b).toString('utf8'); try{ resolve({ status: res.statusCode, json: JSON.parse(t) }); }catch(_){ resolve({ status: res.statusCode, text: t }); } }); });
    r.on('error', reject); if (body) r.write(body); r.end();
  });
}

async function getReleaseByTag(tag){ const r = await req('GET', `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${encodeURIComponent(tag)}`); if (r.status===200) return r.json; return null; }
async function updateRelease(id, body){ const p = JSON.stringify({ body }); const r = await req('PATCH', `https://api.github.com/repos/${OWNER}/${REPO}/releases/${id}`, { 'Content-Type': 'application/json' }, p); if (r.status>=200&&r.status<300) return r.json; throw new Error(`update failed: ${r.status}`); }

function fmtSize(bytes){ if(!bytes && bytes!==0) return ''; const u=['B','KB','MB','GB']; let i=0; let v=Number(bytes); while(v>=1024&&i<u.length-1){ v/=1024; i++; } return `${v.toFixed(i?2:0)} ${u[i]}`; }

function buildNotes(ver){
  const idx = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'downloads', ver, 'index.json'), 'utf8'));
  const items = Array.isArray(idx.items)?idx.items:[];
  const byType = t => items.filter(x=>x.type===t);
  const macs = items.filter(x=>x.type==='mac');
  const macApp = macs.find(x=>/\.app\.zip$/i.test(x.name));
  const macDmg = macs.find(x=>/\.dmg$/i.test(x.name));
  const macZip = macs.find(x=>/\.zip$/i.test(x.name) && !/\.app\.zip$/i.test(x.name));
  const pad = byType('android-pad')[0];
  const phone = byType('android-phone')[0];
  const win = byType('win')[0];
  const ipad = byType('ipad')[0];
  const link = n => `https://github.com/${OWNER}/${REPO}/releases/download/v${ver}/${encodeURIComponent(n)}`;

  const lines = [];
  lines.push(`# GoldWord ${ver} 下载与使用指南`);
  lines.push('');
  lines.push('## 下载入口');
  if (macApp) lines.push(`- macOS 安装包.app（${fmtSize(macApp.size)}）：${link(macApp.name)}`);
  if (macDmg) lines.push(`- macOS 安装包（DMG，${fmtSize(macDmg.size)}）：${link(macDmg.name)}`);
  if (pad) lines.push(`- Android 平板版 APK（${fmtSize(pad.size)}）：${link(pad.name)}`);
  if (ipad) lines.push(`- iPad 安装包（IPA，${fmtSize(ipad.size)}）：${link(ipad.name)}`);
  if (win) lines.push(`- Windows 安装包（${fmtSize(win.size)}）：${link(win.name)}`);
  if (phone) lines.push(`- Android 手机版 APK（${fmtSize(phone.size)}）：${link(phone.name)}`);
  if (macZip) lines.push(`- macOS 安装包（ZIP，${fmtSize(macZip.size)}）：${link(macZip.name)}`);
  lines.push('');
  lines.push('## 使用指引');
  lines.push('- macOS 安装包.app：解压得到 `GoldWord.app`，拖入“应用程序”。如提示未知开发者：系统设置→隐私与安全→允许。');
  lines.push('- macOS 安装包（DMG）：打开 DMG，将应用拖入“应用程序”。首次运行参考上方允许步骤。');
  lines.push('- macOS 安装包（ZIP）：解压得到应用或容器，拖入“应用程序”。适合无法挂载 DMG 的环境。');
  lines.push('- Android 平板版 APK：在平板设备安装 APK，设置“允许未知来源”。适配大屏横屏体验。');
  lines.push('- Android 手机版 APK：手机安装 APK，授予语音权限以使用朗读功能。');
  lines.push('- iPad 安装包（IPA）：企业/测试分发：Safari 安装后，设置→通用→设备管理→信任证书。');
  lines.push('- Windows 安装包：下载 EXE 或 ZIP。如被拦截选择“仍要运行/保留”。ZIP 解压后双击运行。');
  lines.push('');
  lines.push('## 说明');
  lines.push('- 本版本为轻量英语词汇学习应用，支持离线，支持导入词库与语音朗读。');
  lines.push('- 更多反馈与建议：在 Issues 提交。');
  lines.push('');
  lines.push(`[快速反馈](https://github.com/${OWNER}/${REPO}/issues)`);
  return lines.join('\n');
}

async function main(){ const tag=`v${VERSION}`; const rel = await getReleaseByTag(tag); if(!rel) throw new Error('release not found'); const body = buildNotes(VERSION); await updateRelease(rel.id, body); console.log('updated notes'); }

main().catch(e=>{ console.error(String(e&&e.message?e.message:e)); process.exit(1); });