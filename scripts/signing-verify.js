const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findApksigner() {
  const envPath = process.env.APKSIGNER;
  if (envPath) return envPath;
  const candidates = [];
  if (process.env.ANDROID_HOME) {
    const base = process.env.ANDROID_HOME;
    candidates.push(...globApksigner(path.join(base, 'build-tools')));
  }
  candidates.push(...globApksigner(path.join(process.env.HOME || '', 'Library/Android/sdk/build-tools')));
  for (const c of candidates) {
    try { execSync(`${c} --version`, { stdio: 'ignore' }); return c; } catch (_) {}
  }
  return 'apksigner';
}

function globApksigner(dir) {
  try {
    return fs.readdirSync(dir).map(v => path.join(dir, v, 'apksigner')).filter(p => fs.existsSync(p));
  } catch (_) { return []; }
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

const apkPath = process.argv[2];
if (!apkPath) {
  console.error('Usage: node scripts/signing-verify.js <apkPath>');
  process.exit(1);
}

const apksigner = findApksigner();
let verifyOut = '';
try {
  verifyOut = run(`"${apksigner}" verify --verbose --print-certs "${apkPath}" 2>&1`);
} catch (e) {
  verifyOut = e.stdout ? e.stdout.toString() : String(e);
}

function parseSchemes(text) {
  const v1 = /Verified using v1/gi.test(text);
  const v2 = /Verified using v2/gi.test(text);
  const v3 = /Verified using v3/gi.test(text);
  return { v1, v2, v3 };
}

function getKeystoreReport() {
  const ks = process.env.ANDROID_KEYSTORE_PATH || 'android/app/release.keystore';
  const alias = process.env.ANDROID_KEYSTORE_ALIAS || '';
  const sp = process.env.ANDROID_KEYSTORE_STORE_PASSWORD || '';
  const kp = process.env.ANDROID_KEYSTORE_KEY_PASSWORD || '';
  try {
    const out = run(`keytool -list -v -keystore "${ks}" -alias "${alias}" -storepass "${sp}" -keypass "${kp}"`);
    const md5 = out.match(/MD5: (.*)/);
    const sha1 = out.match(/SHA1: (.*)/);
    const sha256 = out.match(/SHA256: (.*)/);
    return {
      keystore: ks,
      alias,
      md5: md5 ? md5[1].trim() : null,
      sha1: sha1 ? sha1[1].trim() : null,
      sha256: sha256 ? sha256[1].trim() : null
    };
  } catch (_) {
    return { keystore: ks, alias, md5: null, sha1: null, sha256: null };
  }
}

const report = {
  timestamp: new Date().toISOString(),
  apk: path.basename(apkPath),
  schemes: parseSchemes(verifyOut),
  apksignerOutput: verifyOut,
  keystore: getKeystoreReport()
};

fs.writeFileSync('signing-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
