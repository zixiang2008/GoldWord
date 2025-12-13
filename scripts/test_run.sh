#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$ROOT_DIR/www/version.json" | head -n1)"
OUT_DIR="$ROOT_DIR/downloads/$VERSION"
LOG_DIR="$OUT_DIR/test-logs"
SNAP_DIR="$OUT_DIR/test-snapshots"
REPORT="$OUT_DIR/test-report.txt"
mkdir -p "$LOG_DIR" "$SNAP_DIR"
TS="$(date +%Y%m%d_%H%M%S)"

pass() { echo "[PASS] $1" | tee -a "$LOG_DIR/test_${TS}.log"; }
fail() { echo "[FAIL] $1" | tee -a "$LOG_DIR/test_${TS}.log"; }
info() { echo "[INFO] $1" | tee -a "$LOG_DIR/test_${TS}.log"; }

TOTAL=0; PASSED=0; FAILED=0
check() {
  TOTAL=$((TOTAL+1))
  if eval "$1"; then PASSED=$((PASSED+1)); pass "$2"; else FAILED=$((FAILED+1)); fail "$2"; fi
}

info "Using version: $VERSION"

# Ensure web server reachable
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/index.html || true)
if [ "$HTTP_CODE" != "200" ]; then
  info "Starting local web server"
  (cd "$ROOT_DIR" && nohup python3 -m http.server 8000 -d www >/dev/null 2>&1 &)
  sleep 1
fi

curl -s http://localhost:8000/index.html > "$SNAP_DIR/index.html" || true
curl -s http://localhost:8000/debug.html > "$SNAP_DIR/debug.html" || true
curl -s http://localhost:8000/version.json > "$SNAP_DIR/version.json" || true

# Web index checks
check "test \"$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/index.html)\" = 200" "Index HTTP 200"
check "grep -q 'id=\"appVersion\"' \"$SNAP_DIR/index.html\"" "Index contains appVersion"
check "grep -q 'id=\"flashcard\"' \"$SNAP_DIR/index.html\"" "Index contains flashcard"
check "! grep -q 'id=\"lang-select\"' \"$SNAP_DIR/index.html\"" "Language selector removed"

# Debug page checks
check "test \"$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/debug.html)\" = 200" "Debug HTTP 200"
check "grep -q 'id=\"serviceStatus\"' \"$SNAP_DIR/debug.html\"" "Debug contains serviceStatus"
check "grep -q 'id=\"enhancementTable\"' \"$SNAP_DIR/debug.html\"" "Debug contains enhancementTable"

# Version checks (direct to avoid eval quoting issues)
TOTAL=$((TOTAL+1))
if grep -E -q '"version"[[:space:]]*:[[:space:]]*"'"$VERSION"'"' "$SNAP_DIR/version.json"; then
  PASSED=$((PASSED+1)); pass "version.json has $VERSION";
else
  FAILED=$((FAILED+1)); fail "version.json has $VERSION";
fi

# Mac app checks
APP_DIR="$ROOT_DIR/dist/GoldWord.app"
check "test -d \"$APP_DIR\"" "macOS app exists"
check "plutil -extract CFBundleVersion xml1 -o - \"$APP_DIR/Contents/Info.plist\" 2>/dev/null | grep -q \">$VERSION<\"" "macOS CFBundleVersion=$VERSION"
check "test -d \"$APP_DIR/Contents/Resources\"" "macOS Resources present"

# Android APK checks
APK_DIR="$ROOT_DIR/android/app/build/outputs/apk/release"
APK_FILE=""
if [ -d "$APK_DIR" ]; then APK_FILE=$(ls "$APK_DIR"/*.apk 2>/dev/null | head -n1 || echo ""); fi
if [ -n "$APK_FILE" ]; then
  cp -f "$APK_FILE" "$OUT_DIR/" || true
  info "Copied APK: $(basename \"$APK_FILE\")"
  TOTAL=$((TOTAL+1))
  COPIED_APK="$OUT_DIR/$(basename "$APK_FILE")"
  if [ -f "$COPIED_APK" ] || ls "$OUT_DIR"/*.apk >/dev/null 2>&1; then
    PASSED=$((PASSED+1)); pass "APK copied to downloads";
  else
    FAILED=$((FAILED+1)); fail "APK copied to downloads";
  fi
else
  info "No APK found; build may be unsigned or skipped"
fi

# External page interaction (basic): debug links to index
check "grep -q 'href=\"./index.html\"' \"$SNAP_DIR/debug.html\"" "Debug contains link to index"

# Summarize
{
  echo "Test Timestamp: $TS"
  echo "Version: $VERSION"
  echo "Total: $TOTAL"
  echo "Passed: $PASSED"
  echo "Failed: $FAILED"
  echo "Snapshots: $SNAP_DIR"
} > "$REPORT"

info "Report written: $REPORT"
exit 0
