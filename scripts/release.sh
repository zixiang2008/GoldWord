#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$ROOT_DIR/www/version.json" | head -n1)"
STAMP="$(date +%Y%m%d_%H%M%S)"
RELEASE_DIR="$ROOT_DIR/releases/$VERSION"
LOG_FILE="$RELEASE_DIR/release_${STAMP}.log"
mkdir -p "$RELEASE_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "version=$VERSION stamp=$STAMP"
GIT_HASH="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
GIT_TAG="v$VERSION"

mkdir -p "$RELEASE_DIR/artifacts" "$RELEASE_DIR/meta"

echo "[1] Build macOS app"
bash "$ROOT_DIR/mac/build_app.sh"
cp -R "$ROOT_DIR/dist/GoldWord.app" "$RELEASE_DIR/artifacts/GoldWord.app"
ditto -c -k --keepParent "$RELEASE_DIR/artifacts/GoldWord.app" "$RELEASE_DIR/artifacts/GoldWord.app.zip"

echo "[2] Package web assets"
ditto -c -k --keepParent "$ROOT_DIR/www" "$RELEASE_DIR/artifacts/web_www.zip"

echo "[3] Sign macOS app if identity provided"
if [ -n "${SIGNING_IDENTITY:-}" ] && [ -z "${DRY_RUN:-}" ]; then
  bash "$ROOT_DIR/mac/sign_and_notarize.sh" || true
  codesign -dv --verbose=4 "$ROOT_DIR/dist/GoldWord.app" > "$RELEASE_DIR/meta/codesign_display.txt" 2>&1 || true
  codesign --verify --deep --strict "$ROOT_DIR/dist/GoldWord.app" > "$RELEASE_DIR/meta/codesign_verify.txt" 2>&1 || true
  spctl --assess --type execute -vv "$ROOT_DIR/dist/GoldWord.app" > "$RELEASE_DIR/meta/spctl_assess.txt" 2>&1 || true
fi

echo "[4] Checksums"
shasum -a 256 "$RELEASE_DIR/artifacts/web_www.zip" > "$RELEASE_DIR/meta/checksum_web_sha256.txt"
shasum -a 256 "$RELEASE_DIR/artifacts/GoldWord.app.zip" > "$RELEASE_DIR/meta/checksum_macapp_zip_sha256.txt"

echo "[5] Manifest"
cat > "$RELEASE_DIR/meta/manifest.json" <<JSON
{
  "version": "$VERSION",
  "git": {"hash": "$GIT_HASH", "tag": "$GIT_TAG"},
  "timestamp": "$STAMP",
  "artifacts": {
    "web_zip": "artifacts/web_www.zip",
    "mac_app": "artifacts/GoldWord.app",
    "mac_app_zip": "artifacts/GoldWord.app.zip"
  }
}
JSON

echo "[6] Release notes & changelog"
RN="$ROOT_DIR/docs/release-notes-v$VERSION.md"
CH="$ROOT_DIR/docs/CHANGELOG.md"
cat > "$RN" <<MD
# GoldWord v$VERSION 发布说明

- 恢复调试页面布局与功能
- 版本号显示与详情点击
- 移除悬浮语言选择器模块
- i18n 文案绑定与按钮优化
- macOS .app 构建与签名脚本完善

生成时间：$STAMP
Git 提交：$GIT_HASH
MD

{ [ -f "$CH" ] && echo "" >> "$CH"; } || true
echo "## v$VERSION ($STAMP)" >> "$CH"
echo "- 恢复调试页、版本显示、移除语言选择器、发布脚本" >> "$CH"

echo "[7] Git tag (optional)"
if git rev-parse --git-dir >/dev/null 2>&1; then
  git tag -f "$GIT_TAG" "$GIT_HASH" || true
fi

echo "[8] Snapshot & rollback point"
BACKUP_DIR="$ROOT_DIR/downloads/backups/$STAMP"
mkdir -p "$BACKUP_DIR"
ditto -c -k --keepParent "$ROOT_DIR/www" "$BACKUP_DIR/www_${VERSION}.zip"
ditto -c -k --keepParent "$ROOT_DIR/mac" "$BACKUP_DIR/mac_${VERSION}.zip"
ditto -c -k --keepParent "$ROOT_DIR/docs" "$BACKUP_DIR/docs_${VERSION}.zip"
cat > "$BACKUP_DIR/rollback.json" <<JSON
{"version":"$VERSION","git_hash":"$GIT_HASH","release_dir":"$RELEASE_DIR","created_at":"$STAMP"}
JSON
echo "$STAMP" > "$ROOT_DIR/downloads/backups/CURRENT"

echo "[9] Installers build and downloads sync"
bash "$ROOT_DIR/scripts/build_installers.sh"

echo "Done: $RELEASE_DIR"
