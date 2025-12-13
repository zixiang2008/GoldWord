#!/usr/bin/env bash
set -euo pipefail
IDENTITY="${SIGNING_IDENTITY:-}"
OUT="${1:-cert_chain.pem}"
JSON_OUT="${2:-cert_chain.json}"
if [ -z "$IDENTITY" ]; then echo "SIGNING_IDENTITY not set"; exit 1; fi
# Export PEM chain from keychain by common name
security find-certificate -a -c "$IDENTITY" -p > "$OUT" 2>/dev/null || {
  echo "Failed to export certs by identity name; trying login keychain" >&2
  security find-certificate -a -c "$IDENTITY" -p ~/Library/Keychains/login.keychain-db > "$OUT" 2>/dev/null || true
}
# Create minimal JSON summary
TMP=$(mktemp)
codesign -dv --verbose=4 "${APP_PATH:-dist/GoldWord.app}" 2> "$TMP" || true
AUTH=$(grep -E '^\s*Authority=' "$TMP" | sed 's/^[[:space:]]*Authority=//g' | sed 's/\r//g')
rm -f "$TMP"
{
  echo '{'
  echo '  "identity": '"$(printf '%s' "$IDENTITY" | sed 's/"/\\"/g')"','
  echo '  "authorities": ['
  IFS=$'\n'; i=0; for a in $AUTH; do if [ $i -gt 0 ]; then echo ','; fi; printf '    "%s"' "$(printf '%s' "$a" | sed 's/"/\\"/g')"; i=$((i+1)); done; echo ''
  echo '  ]'
  echo '}'
} > "$JSON_OUT"
echo "Exported: $OUT and $JSON_OUT"
