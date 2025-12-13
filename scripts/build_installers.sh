#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$ROOT_DIR/www/version.json" | head -n1)"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="$ROOT_DIR/releases/$VERSION/installers"
LOG="$OUT_DIR/build_${STAMP}.log"
rm -rf "$OUT_DIR"; mkdir -p "$OUT_DIR"
exec > >(tee -a "$LOG") 2>&1

echo "version=$VERSION stamp=$STAMP"

MAC_DIR="$OUT_DIR/macOS"
WIN_DIR="$OUT_DIR/windows"
LIN_DIR="$OUT_DIR/linux"
mkdir -p "$MAC_DIR" "$WIN_DIR" "$LIN_DIR"

echo "[macOS] build app"
bash "$ROOT_DIR/mac/build_app.sh"
cp -R "$ROOT_DIR/dist/GoldWord.app" "$MAC_DIR/GoldWord.app"
MAC_APP_ZIP="$MAC_DIR/GoldWord_v${VERSION}_macOS_universal.app.zip"
ditto -c -k --keepParent "$MAC_DIR/GoldWord.app" "$MAC_APP_ZIP"
shasum -a 256 "$MAC_APP_ZIP" > "$MAC_DIR/GoldWord_v${VERSION}_macOS_universal.app.zip.sha256.txt"

if [ -n "${SIGNING_IDENTITY:-}" ]; then
  bash "$ROOT_DIR/mac/sign_and_notarize.sh" || true
  codesign -dv --verbose=4 "$ROOT_DIR/dist/GoldWord.app" > "$MAC_DIR/codesign_display.txt" 2>&1 || true
  codesign --verify --deep --strict "$ROOT_DIR/dist/GoldWord.app" > "$MAC_DIR/codesign_verify.txt" 2>&1 || true
  spctl --assess --type execute -vv "$ROOT_DIR/dist/GoldWord.app" > "$MAC_DIR/spctl_assess.txt" 2>&1 || true
  APP_PATH="$ROOT_DIR/dist/GoldWord.app" SIGNING_IDENTITY="$SIGNING_IDENTITY" bash "$ROOT_DIR/scripts/export_cert_chain.sh" "$MAC_DIR/cert_chain.pem" "$MAC_DIR/cert_chain.json" || true
fi

echo "[Windows] portable zip"
WIN_STAGING="$WIN_DIR/GoldWord-win-portable"
mkdir -p "$WIN_STAGING/Resources"
rsync -a "$ROOT_DIR/www/" "$WIN_STAGING/Resources/"
cat > "$WIN_STAGING/start.bat" <<BAT
@echo off
start "" "%~dp0Resources\\index.html"
BAT
cat > "$WIN_STAGING/README.txt" <<TXT
GoldWord Portable for Windows v$VERSION
Run start.bat to open the application in your default browser.
TXT
WIN_ZIP="$WIN_DIR/GoldWord_v${VERSION}_Windows_portable.zip"
(cd "$WIN_DIR" && zip -r "$(basename "$WIN_ZIP")" "$(basename "$WIN_STAGING")" >/dev/null)
shasum -a 256 "$WIN_ZIP" > "$WIN_DIR/GoldWord_v${VERSION}_Windows_portable.zip.sha256.txt"

echo "[Linux] portable tar.gz"
LIN_STAGING="$LIN_DIR/goldword-linux-portable"
mkdir -p "$LIN_STAGING/Resources"
rsync -a "$ROOT_DIR/www/" "$LIN_STAGING/Resources/"
cat > "$LIN_STAGING/start.sh" <<'SH'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
xdg-open "$DIR/Resources/index.html" >/dev/null 2>&1 || open "$DIR/Resources/index.html" >/dev/null 2>&1 || true
SH
chmod +x "$LIN_STAGING/start.sh"
LIN_TGZ="$LIN_DIR/goldword_v${VERSION}_linux_portable.tar.gz"
(cd "$LIN_DIR" && tar -czf "$(basename "$LIN_TGZ")" "$(basename "$LIN_STAGING")")
shasum -a 256 "$LIN_TGZ" > "$LIN_DIR/goldword_v${VERSION}_linux_portable.tar.gz.sha256.txt"

echo "[GPG] optional signing"
if command -v gpg >/dev/null 2>&1 && [ -n "${GPG_KEY_ID:-}" ]; then
  EXTRA_GPG=""
  if [ -n "${GPG_PASSPHRASE:-}" ]; then EXTRA_GPG="--pinentry-mode loopback --passphrase $GPG_PASSPHRASE"; fi
  gpg --batch --yes --armor $EXTRA_GPG --local-user "$GPG_KEY_ID" --output "$MAC_APP_ZIP.asc" --sign "$MAC_APP_ZIP" || true
  gpg --batch --yes --armor $EXTRA_GPG --local-user "$GPG_KEY_ID" --output "$WIN_ZIP.asc" --sign "$WIN_ZIP" || true
  gpg --batch --yes --armor $EXTRA_GPG --local-user "$GPG_KEY_ID" --output "$LIN_TGZ.asc" --sign "$LIN_TGZ" || true
fi

echo "[Manifest]"
cat > "$OUT_DIR/manifest.json" <<JSON
{
  "version": "$VERSION",
  "timestamp": "$STAMP",
  "installers": {
    "macOS": {
      "app": "installers/macOS/GoldWord.app",
      "zip": "installers/macOS/GoldWord_v${VERSION}_macOS_universal.app.zip",
      "checksum": "installers/macOS/GoldWord_v${VERSION}_macOS_universal.app.zip.sha256.txt",
      "codesign_display": "installers/macOS/codesign_display.txt",
      "codesign_verify": "installers/macOS/codesign_verify.txt",
      "spctl": "installers/macOS/spctl_assess.txt"
      ,"cert_chain_pem": "installers/macOS/cert_chain.pem"
      ,"cert_chain_json": "installers/macOS/cert_chain.json"
    },
    "windows": {
      "zip": "installers/windows/GoldWord_v${VERSION}_Windows_portable.zip",
      "checksum": "installers/windows/GoldWord_v${VERSION}_Windows_portable.zip.sha256.txt"
    },
    "linux": {
      "tgz": "installers/linux/goldword_v${VERSION}_linux_portable.tar.gz",
      "checksum": "installers/linux/goldword_v${VERSION}_linux_portable.tar.gz.sha256.txt"
    }
  }
}
JSON

echo "[Report]"
REPORT="$OUT_DIR/signing_report.txt"
{
  echo "GoldWord v$VERSION installers"
  echo "macOS zip sha256: $(awk '{print $1}' "$MAC_DIR/GoldWord_v${VERSION}_macOS_universal.app.zip.sha256.txt")"
  echo "windows zip sha256: $(awk '{print $1}' "$WIN_DIR/GoldWord_v${VERSION}_Windows_portable.zip.sha256.txt")"
  echo "linux tgz sha256: $(awk '{print $1}' "$LIN_DIR/goldword_v${VERSION}_linux_portable.tar.gz.sha256.txt")"
} > "$REPORT"

DOWNLOADS_ROOT="$ROOT_DIR/downloads"
DEST_DIR="$DOWNLOADS_ROOT/$VERSION"
mkdir -p "$DOWNLOADS_ROOT"
for d in "$DOWNLOADS_ROOT"/*; do
  bn="$(basename "$d")"
  if [ -d "$d" ] && [[ "$bn" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && [ "$bn" != "$VERSION" ]; then
    rm -rf "$d"
  fi
done
rm -rf "$DEST_DIR"; mkdir -p "$DEST_DIR"
cp -f "$MAC_APP_ZIP" "$DEST_DIR/"
cp -f "$MAC_DIR/GoldWord_v${VERSION}_macOS_universal.app.zip.sha256.txt" "$DEST_DIR/"
[ -f "$MAC_DIR/cert_chain.pem" ] && cp -f "$MAC_DIR/cert_chain.pem" "$DEST_DIR/"
[ -f "$MAC_DIR/cert_chain.json" ] && cp -f "$MAC_DIR/cert_chain.json" "$DEST_DIR/"
[ -f "$MAC_DIR/codesign_display.txt" ] && cp -f "$MAC_DIR/codesign_display.txt" "$DEST_DIR/"
[ -f "$MAC_DIR/codesign_verify.txt" ] && cp -f "$MAC_DIR/codesign_verify.txt" "$DEST_DIR/"
[ -f "$MAC_DIR/spctl_assess.txt" ] && cp -f "$MAC_DIR/spctl_assess.txt" "$DEST_DIR/"
cp -f "$WIN_ZIP" "$DEST_DIR/"
cp -f "$WIN_DIR/GoldWord_v${VERSION}_Windows_portable.zip.sha256.txt" "$DEST_DIR/"
cp -f "$LIN_TGZ" "$DEST_DIR/"
cp -f "$LIN_DIR/goldword_v${VERSION}_linux_portable.tar.gz.sha256.txt" "$DEST_DIR/"
cp -f "$OUT_DIR/manifest.json" "$DEST_DIR/"
cp -f "$REPORT" "$DEST_DIR/"
rm -rf "$OUT_DIR"; ln -s "$DEST_DIR" "$OUT_DIR"
echo "done: $DEST_DIR"
