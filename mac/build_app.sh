#!/usr/bin/env bash
set -euo pipefail
APP_NAME="GoldWord"
APP_ID="com.goldword.app"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$ROOT_DIR/www/version.json" | head -n1)"
BUILD_DIR="$ROOT_DIR/mac/build"
DIST_DIR="$ROOT_DIR/dist"
APP_DIR="$DIST_DIR/${APP_NAME}.app"

mkdir -p "$BUILD_DIR" "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"

clang -target x86_64-apple-macos10.15 -o "$BUILD_DIR/launcher_x64" "$ROOT_DIR/mac/launcher.c"
clang -target arm64-apple-macos11 -o "$BUILD_DIR/launcher_arm64" "$ROOT_DIR/mac/launcher.c"
lipo -create -output "$APP_DIR/Contents/MacOS/${APP_NAME}" "$BUILD_DIR/launcher_x64" "$BUILD_DIR/launcher_arm64"
chmod +x "$APP_DIR/Contents/MacOS/${APP_NAME}"

cp "$ROOT_DIR/mac/Info.plist" "$APP_DIR/Contents/Info.plist"

if [ -d "$ROOT_DIR/www" ]; then
  rsync -a "$ROOT_DIR/www/" "$APP_DIR/Contents/Resources/"
fi

ICONSET_DIR="$BUILD_DIR/AppIcon.iconset"
ICNS_PATH="$APP_DIR/Contents/Resources/AppIcon.icns"
mkdir -p "$ICONSET_DIR"
BASE_PNG="$ROOT_DIR/www/icon.png"
if [ -f "$BASE_PNG" ]; then
  sips -z 16 16   "$BASE_PNG" --out "$ICONSET_DIR/icon_16x16.png" >/dev/null
  sips -z 32 32   "$BASE_PNG" --out "$ICONSET_DIR/icon_16x16@2x.png" >/dev/null
  sips -z 32 32   "$BASE_PNG" --out "$ICONSET_DIR/icon_32x32.png" >/dev/null
  sips -z 64 64   "$BASE_PNG" --out "$ICONSET_DIR/icon_32x32@2x.png" >/dev/null
  sips -z 128 128 "$BASE_PNG" --out "$ICONSET_DIR/icon_128x128.png" >/dev/null
  sips -z 256 256 "$BASE_PNG" --out "$ICONSET_DIR/icon_128x128@2x.png" >/dev/null
  sips -z 256 256 "$BASE_PNG" --out "$ICONSET_DIR/icon_256x256.png" >/dev/null
  sips -z 512 512 "$BASE_PNG" --out "$ICONSET_DIR/icon_256x256@2x.png" >/dev/null
  sips -z 512 512 "$BASE_PNG" --out "$ICONSET_DIR/icon_512x512.png" >/dev/null
  sips -z 1024 1024 "$BASE_PNG" --out "$ICONSET_DIR/icon_512x512@2x.png" >/dev/null
  iconutil -c icns "$ICONSET_DIR" -o "$ICNS_PATH" || true
fi

defaults write "$APP_DIR/Contents/Info" CFBundleIdentifier "$APP_ID" >/dev/null 2>&1 || true
plutil -replace CFBundleShortVersionString -string "$VERSION" "$APP_DIR/Contents/Info.plist" || true
plutil -replace CFBundleVersion -string "$VERSION" "$APP_DIR/Contents/Info.plist" || true

echo "Built: $APP_DIR"
