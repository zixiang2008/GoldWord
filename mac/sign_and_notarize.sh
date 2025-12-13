#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/dist/GoldWord.app"
ZIP_PATH="$ROOT_DIR/dist/GoldWord.app.zip"
IDENTITY="${SIGNING_IDENTITY:-}"
ENTITLEMENTS="$ROOT_DIR/mac/entitlements.plist"

if [ ! -d "$APP_DIR" ]; then echo "App not found: $APP_DIR"; exit 1; fi
if [ -n "${DRY_RUN:-}" ]; then echo "Dry run: skip codesign and notarization"; exit 0; fi
if [ -z "$IDENTITY" ]; then echo "SIGNING_IDENTITY not set"; exit 1; fi

codesign --force --options runtime --entitlements "$ENTITLEMENTS" --timestamp --sign "$IDENTITY" "$APP_DIR" 

ditto -c -k --keepParent "$APP_DIR" "$ZIP_PATH"

if [ -n "${APPLE_ID:-}" ] && [ -n "${APP_SPECIFIC_PASSWORD:-}" ] && [ -n "${TEAM_ID:-}" ]; then
  xcrun notarytool submit "$ZIP_PATH" --apple-id "$APPLE_ID" --password "$APP_SPECIFIC_PASSWORD" --team-id "$TEAM_ID" --wait
  xcrun stapler staple "$APP_DIR"
fi

spctl --assess --type execute -v "$APP_DIR" || true
codesign --verify --deep --strict "$APP_DIR" || true
echo "Signed and (optionally) notarized: $APP_DIR"
