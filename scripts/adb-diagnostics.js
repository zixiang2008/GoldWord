const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) { return execSync(cmd, { encoding: 'utf8' }); }

function tryRun(cmd) {
  try { return run(cmd); } catch (e) { return ''; }
}

function now() { return new Date().toISOString(); }

function collectDeviceInfo(adb) {
  const brand = tryRun(`"${adb}" shell getprop ro.product.brand`).trim();
  const model = tryRun(`"${adb}" shell getprop ro.product.model`).trim();
  const sdk = tryRun(`"${adb}" shell getprop ro.build.version.sdk`).trim();
  const release = tryRun(`"${adb}" shell getprop ro.build.version.release`).trim();
  const abi = tryRun(`"${adb}" shell getprop ro.product.cpu.abi`).trim();
  const abis = tryRun(`"${adb}" shell getprop ro.product.cpu.abilist`).trim();
  const density = tryRun(`"${adb}" shell wm density`).trim();
  const size = tryRun(`"${adb}" shell wm size`).trim();
  return { brand, model, sdk, release, abi, abis, density, size };
}

function captureLogcat(outputPath, durationSec = 20) {
  const filters = ['ActivityManager', 'PackageManager'];
  const out = fs.createWriteStream(outputPath);
  const proc = spawn('adb', ['logcat']);
  proc.stdout.on('data', (buf) => {
    const line = buf.toString();
    if (filters.some(f => line.includes(f))) out.write(line);
  });
  proc.stderr.on('data', (buf) => out.write(buf.toString()));
  setTimeout(() => { try { proc.kill(); } catch (_) {} }, durationSec * 1000);
  return new Promise((resolve) => proc.on('close', resolve));
}

async function main() {
  const apk = process.argv[2];
  if (!apk) {
    console.error('Usage: node scripts/adb-diagnostics.js <apkPath>');
    process.exit(1);
  }
  const start = now();
  const adb = findAdb();
  const device = collectDeviceInfo(adb);
  const logPath = path.join(process.cwd(), 'adb-install-log.txt');
  // Clear previous logs and start capture
  tryRun(`"${adb}" logcat -c`);
  tryRun(`"${adb}" logcat -c`);
  const installMethod = 'adb';
  let installResult = '';
  const devs = listDevices(adb);
  if (devs.connected.length > 0) {
    try { installResult = run(`"${adb}" install -r "${apk}"`); }
    catch (e) { installResult = (e.stdout || e.stderr || '').toString(); }
    try { await captureLogcat(logPath, 10); } catch (_) {}
  } else {
    installResult = 'no device connected';
    try { fs.writeFileSync(logPath, 'no device connected\n'); } catch (_) {}
  }
  const end = now();
  const report = { timestamp: { start, end }, device, install: { method: installMethod, result: installResult }, logs: { path: logPath }, adb: { path: adb, devices: devs.connected } };
  fs.writeFileSync('adb-diagnostics.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main();
function findAdb() {
  if (process.env.ADB) return process.env.ADB;
  const home = process.env.HOME || '';
  const candidates = [
    `${home}/Library/Android/sdk/platform-tools/adb`,
    `${home}/Android/Sdk/platform-tools/adb`,
    `${process.env.ANDROID_HOME || ''}/platform-tools/adb`
  ].filter(Boolean);
  for (const p of candidates) {
    try { execSync(`"${p}" version`, { stdio: 'ignore' }); return p; } catch (_) {}
  }
  return 'adb';
}

function listDevices(adb) {
  try {
    const out = execSync(`"${adb}" devices`, { encoding: 'utf8' });
    const lines = out.split('\n').slice(1).map(l => l.trim()).filter(Boolean);
    const connected = lines.filter(l => /\bdevice\b$/.test(l)).map(l => l.split('\t')[0]);
    return { raw: out, connected };
  } catch (e) { return { raw: String(e), connected: [] }; }
}
