# Release Report 1.0.5
- Time: 2025-11-24T11:46:37.571Z
- Previous Tag: rollback_1.0.5

## Changed Files
- (none)

## Commits
- (none)
\n## Automation Verification
- Version bumped to `1.0.5` (semver patch)
- Local rollback tag created: `rollback_1.0.5` (push handled by CI)
- Reports generated: `release-report.json`, `RELEASE_NOTES.md`

## APK Build & Validation
- Built unsigned APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- Signed APK: `android/app/build/outputs/apk/release/app-release-signed.apk`
- Manifest check: `versionName=1.0.5`, `applicationId=com.goldword.app`
- Icon resources present across densities (mdpi–xxxhdpi)
- Splash screens present (`drawable-port/*` and `drawable-land/*`)
 
## Installer Packaging (1.0.5)
- macOS: Built `GoldWord-1.0.5-arm64.dmg`, `GoldWord-1.0.5-arm64-mac.zip` and `.pkg` via `pkgbuild/productbuild`
- Windows: Built portable `GoldWord 1.0.5.exe`
- Android: Consolidated APKs, retained `goldword-android-pad-1.0.5.apk` as latest

## Signing Status
- Android: V1 (JAR) signature present (SHA256withRSA). V2/V3 pending (requires `apksigner`)
- macOS: App signed by local identity; notarization skipped
- Windows: Code signing pending (requires `signtool` and certificate)
- iOS: Not built in this run; signing pending (requires Fastlane match and profiles)

## Distribution Indexes
- Updated `downloads/latest.json` to `1.0.5`
- Standardized version directory: `downloads/1.0.5/`
- Generated `downloads/1.0.5/index.json` with checksums
