# GoldWord macOS 安装说明

## 系统要求
- macOS 10.15 及以上
- 支持 Apple Silicon (arm64) 与 Intel (x86_64)

## 安装步骤
- 运行构建脚本：`bash mac/build_app.sh`
- 如需签名与公证：设置环境变量并执行：
  - `export SIGNING_IDENTITY="Developer ID Application: <Your Name> (<TeamID>)"`
  - `export APPLE_ID="your@appleid.com"`
  - `export APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"`
  - `export TEAM_ID="XXXXXXXXXX"`
  - `bash mac/sign_and_notarize.sh`
- 双击 `dist/GoldWord.app` 启动应用

## 启动行为
- 应用启动后将打开 `Contents/Resources/index.html` 于默认浏览器

## 故障排查
- 无法打开：执行 `spctl --assess --type execute -v dist/GoldWord.app`
- 图标缺失：在 `www/icon.png` 放置 PNG 图标后重新运行构建脚本
