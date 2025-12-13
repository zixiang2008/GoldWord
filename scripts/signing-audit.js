const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apkPath = process.argv[2];
if (!apkPath) {
  console.error('Usage: node scripts/signing-audit.js <apkPath>');
  process.exit(1);
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

function listLibs() {
  try {
    const out = run(`unzip -l "${apkPath}"`);
    const libs = out.split('\n').filter(l => /\slib\//.test(l)).map(l => l.trim());
    const abi = { arm64: libs.some(l => l.includes('lib/arm64-v8a/')), arm: libs.some(l => l.includes('lib/armeabi-v7a/')), x86: libs.some(l => l.includes('lib/x86/')), x86_64: libs.some(l => l.includes('lib/x86_64/')) };
    return { libs, abi };
  } catch (_) {
    return { libs: [], abi: {} };
  }
}

function readGradleSdk() {
  try {
    const v = fs.readFileSync(path.join('android', 'variables.gradle'), 'utf8');
    const min = v.match(/minSdkVersion\s*=\s*(\d+)/);
    const target = v.match(/targetSdkVersion\s*=\s*(\d+)/);
    return { minSdkVersion: min ? Number(min[1]) : null, targetSdkVersion: target ? Number(target[1]) : null };
  } catch (_) { return { minSdkVersion: null, targetSdkVersion: null }; }
}

function listPermissions() {
  try {
    const manifest = fs.readFileSync(path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
    const perms = Array.from(manifest.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)).map(m => m[1]);
    return perms;
  } catch (_) { return []; }
}

const abiInfo = listLibs();
const sdkInfo = readGradleSdk();
const perms = listPermissions();

const highRisk = ['android.permission.READ_SMS', 'android.permission.RECORD_AUDIO', 'android.permission.READ_CALL_LOG', 'android.permission.WRITE_SETTINGS'];
const flagged = perms.filter(p => highRisk.includes(p));

const report = { timestamp: new Date().toISOString(), apk: path.basename(apkPath), sdk: sdkInfo, abi: abiInfo.abi, permissions: perms, highRisk: flagged };
fs.writeFileSync('signing-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
