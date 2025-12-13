const { execSync } = require('child_process');
const fs = require('fs');

const pepkJar = process.env.PEPK_JAR;
const ks = process.env.ANDROID_KEYSTORE_PATH || 'android/app/release.keystore';
const alias = process.env.ANDROID_KEYSTORE_ALIAS || '';
const sp = process.env.ANDROID_KEYSTORE_STORE_PASSWORD || '';
const out = process.env.PEPK_OUTPUT || 'android/app/upload_key_public.pem';
const pubkey = process.env.GOOGLE_PLAY_PUBKEY;

if (!pepkJar || !pubkey) {
  console.error('PEPK_JAR and GOOGLE_PLAY_PUBKEY must be set.');
  process.exit(1);
}

execSync(`java -jar "${pepkJar}" --keystore "${ks}" --alias "${alias}" --output "${out}" --encryption-key "${pubkey}" --store-pass "${sp}"`, { stdio: 'inherit' });
if (fs.existsSync(out)) console.log(`Exported: ${out}`);
