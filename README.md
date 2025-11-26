# GoldWord

[![PWA](https://img.shields.io/badge/PWA-ready-blue)](#)
[![Platforms](https://img.shields.io/badge/platforms-Web%20%7C%20Electron%20%7C%20Android%20%7C%20iOS-brightgreen)](#)
[![Deploy](https://img.shields.io/badge/deploy-Netlify%20%7C%20Cloudflare%20Pages%20%7C%20Firebase-00C7B7)](#)
[![State](https://img.shields.io/badge/state-offline%20first-success)](#)

每一个记住的单词，都是一枚金币。

## 🪙 GoldWord — 品牌故事
在这个信息爆炸的时代，语言就是货币。每一个你记住的单词，都是你认知世界的“金币”。GoldWord 的诞生，就像一座属于你的语言金库：它把学习变成积累，把记忆变成投资。每一次你学习、拼写、复习，都像在为自己的未来“铸造金币”。

我们相信：
- 一枚词汇的价值，胜过千言万语。
- 记忆不是死记，而是流动的财富。
- 掌握语言，就掌握通往世界的钥匙。

在 GoldWord，你不会被填鸭，而是被激励。每一枚“金词”代表一次成长，每一轮循环让你更富有。当你的词汇库闪闪发光时，你就真正拥有了——未来之门的金钥匙。

一个轻量的英语单词学习与复习应用，支持本地导入词库、记忆标记、进度统计、离线使用，以及封装为 Android APK 在平板设备（如 vivo Pad3 Pro，Android 15）上运行。

## 功能特性
- 词库导入：支持 `xlsx/xls/csv/docx/纯文本`，可从旧版页面内联数据自动导入。
- 学习与复习：标记已学习、生词、需要复习，自动统计当日与总体进度。
- 卡片体验：正反面卡片，动画与字号适配，大屏横屏体验优化。
- 语音朗读：内置朗读按钮，支持语速与口音选择（依赖系统 TTS）。
- GPT 配置：可保存并测试自定义的 GPT Base URL、模型与 API Key（按用户隔离）。
- 离线支持：Service Worker 缓存静态资源，断网可用（网络功能有限）。
- Android 打包：基于 Capacitor 封装为 APK，已验证在 Android 15 环境稳定运行。

## 技术栈
- 纯前端静态站点：`HTML/CSS/JavaScript`
- 移动封装：`Capacitor`（Android）
- 数据存储：`localStorage`（按用户隔离）

## 目录结构
- 运行目录：`GoldWord/GoldWord/www/`（Capacitor 使用 `www` 作为 Web 资源目录）
- 源码镜像：项目根目录也保留同名文件，发布时以 `www/` 为准。
- Android 工程：`GoldWord/GoldWord/android/`（通过 `npx cap add android` 生成）

```
├── GoldWord/GoldWord/www/
│   ├── index.html
│   ├── app.js        // 应用主逻辑（学习流程、导入、SW 注册、GPT 设置）
│   ├── ui.js         // UI 初始化与事件绑定、字号适配、卡片动画
│   ├── db.js         // 数据存取与统计、用户与 GPT 配置
│   ├── service-worker.js
│   └── icons/
├── GoldWord/GoldWord/android/   // Android 项目（Gradle 构建）
├── GoldWord/GoldWord/README-android.md // Android 打包与签名详细指南
├── GoldWord/GoldWord/capacitor.config.json
└── GoldWord/GoldWord/package.json
```

## 快速开始（Web）
- 本地预览：
  - `cd GoldWord/GoldWord/www && python3 -m http.server 8000` 打开 `http://localhost:8000/`
  - 或直接在浏览器打开 `GoldWord/GoldWord/www/index.html`
- 导入词库：
  - `xlsx/xls/csv`：选择文件后自动解析与规整字段（布尔字段：`studied/needsReview/isNewWord`）
  - `docx`：通过 `mammoth` 提取纯文本并解析
  - 纯文本：支持按词条分段的文本；具体格式见下文
- 学习操作：
  - 按钮：翻面、下一张、朗读、生词、不记得、自动播放、个人中心（统计与设置）
  - 统计：总词数、今日学习、进度%、复习数、生词数

## 文本导入格式
- 每个词条以“词头行”开头（仅字母、空格、短横线），后续若干行作为详情：
  - `中文/翻译：...`
  - `音标/发音：...`（方括号会被去除）
  - `词性：...`
  - `定义：...`
  - `搭配：...`
  - `助记：...`
  - 可选标记：`已学/需要复习/生词`
- 支持分类标签（如罗马序号或主题词），解析后会写入 `category`
- 解析会自动清洗 Emoji 与噪声字符

## GPT 设置
- 在“个人中心”填写并保存：
  - `Base URL`、`Model`、`API Key`
- 不同用户的设置存储在 `localStorage` 的独立键：`gpt_config__{userId}`
- 测试按钮会进行一次最小化的连通性检查（需要网络允许）
- Android 端如需访问 HTTP（明文）接口，需在 `AndroidManifest.xml` 启用 `usesCleartextTraffic` 并配置 `network_security_config`

## 离线与缓存
- `service-worker.js` 缓存静态资源（HTML/CSS/JS/Icon）以支持断网运行
- 首次加载需联网，之后可离线学习；网络相关功能（GPT 测试等）在离线时不可用

## Android 打包
- 完整步骤与故障排查见 `GoldWord/GoldWord/README-android.md`
- 简要流程：
  - `npm install`
  - `npx cap sync android`
  - Android SDK：已在本地配置 `sdk.dir`
  - 构建签名 APK：`cd GoldWord/GoldWord/android && ./gradlew assembleRelease`
  - 产物：`GoldWord/GoldWord/android/app/build/outputs/apk/release/app-release.apk`

## 发布到 GitHub
- 仓库结构：提交 `GoldWord/GoldWord/www` 为 Web 资源，同时可提交 `android/`（如需）。
- 版本管理：采用语义化版本 `vX.Y.Z`（如：`v1.0.0`）。
- Releases：上传构建产物（如 APK/zip）；避免提交任何证书或私钥。

## 开发与构建
- 开发：直接编辑 `GoldWord/GoldWord/www/` 下的文件
- 同步到 Android：`npx cap sync android`
- 预览：
  - `http://localhost:8000/` 或直接打开 `GoldWord/GoldWord/www/index.html`
- 重要脚本：
  - `npm run cap:add:android`（首次添加安卓平台）
  - `npm run cap:sync`（同步 Web 资源到安卓）

## 常见问题
- 明文 HTTP 接口无法访问：检查 `AndroidManifest.xml` 是否设置 `android:usesCleartextTraffic="true"` 与 `network_security_config`
- 构建失败提示 `compileSdk` 不支持：当前使用 `AGP 8.0.0`，稳定在 `compileSdk 34`；待升级支持 `35` 的 AGP 后再切换
- APK 安装失败：使用 `adb install -r` 并在设备上授权 USB 调试；`adb devices` 查看连接状态

## GitHub Releases 自动化
- 建议使用语义化版本标签，例如 `v1.0.3`。推送标签将触发工作流构建并上传产物。
- 示例工作流（在 `.github/workflows/release-upload.yml`）：
```yaml
name: Release Upload
on:
  push:
    tags:
      - 'v*.*.*'
jobs:
  build-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install
        run: npm ci
      - name: Build web archive
        run: |
          cd GoldWord/GoldWord/www
          zip -r goldword-web.zip .
      - name: Upload Release Assets
        uses: softprops/action-gh-release@v2
        with:
          files: |
            GoldWord/GoldWord/www/goldword-web.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
- 如需上传 Android/Electron 等安装包，将构建产物路径追加到 `files:` 清单中即可。

## 证书与 Secrets 准备指南
- macOS 签名与公证（Apple ID 模式）
  - 申请 Developer ID Application 证书（`.p12`），存为 Base64 并配置：`MAC_CSC_LINK`、`MAC_CSC_KEY_PASSWORD`
  - 创建 App 专用密码，配置：`APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD`、`APPLE_TEAM_ID`
- macOS 公证（Apple API Key 模式，可替代 Apple ID）
  - 在 App Store Connect 创建 API Key（生成 `.p8`）
  - 将 `.p8` 内容作为机密配置：`APPLE_API_KEY`，同时设置：`APPLE_API_KEY_ID`、`APPLE_API_ISSUER`
- Windows 代码签名
  - 方案 A（electron-builder 原生）：证书 `.pfx` Base64 放入 `WIN_CSC_LINK`，密码 `WIN_CSC_KEY_PASSWORD`
  - 方案 B（signtool 回退）：证书 `.pfx` Base64 放入 `WIN_SIGTOOL_PFX_B64`，密码 `WIN_SIGTOOL_PFX_PASSWORD`
- 注意：所有证书与密码只放在 GitHub Secrets，不要提交到仓库。

- Linux deb 签名
  - 将私钥导出为 ASCII Armor（或二进制后 Base64），配置：`LINUX_DEB_GPG_KEY_B64`
  - 设置签名 `KEY ID`：`LINUX_DEB_GPG_KEY_ID` 与私钥口令：`LINUX_DEB_GPG_PASSPHRASE`
  - CI 会安装 `dpkg-sig` 并对生成的 `.deb` 执行非交互签名

## English Summary
- What it is: a static PWA vocabulary app with optional GPT enrichment; Electron and Capacitor shells available.
- Key features: import from Excel/CSV/Docx/Text, spaced repetition, speak modes, offline caching, multi-language UI.
- Structure: `index.html`, `app.js`, `ui.js`, `db.js`, `word-enhancement-service.js`, `service-worker.js`.
- Usage:
  - Local preview: `cd GoldWord/GoldWord/www && python3 -m http.server 8000`
  - Configure GPT under Personal Centre, test connectivity, start learning.
- Deployment: Netlify/Cloudflare Pages/Firebase Hosting; publish `GoldWord/GoldWord/www`.
- Security: keep keys locally; do not commit secrets; use HTTPS endpoints.

## Common Issues & Troubleshooting
- macOS notarization timeout/failure
  - Prefer API Key + notarytool; verify `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`
  - Ensure Base64 `.p8` has no extra whitespace; retry on Apple rate limiting
- Certificate password errors (macOS/Windows)
  - Renew credentials and update Secrets; avoid invisible characters
  - Prefer Base64 `.p12/.pfx` in Secrets to avoid filesystem path issues
- Timestamp server unavailable (Windows)
  - Switch to RFC3161 server: `http://timestamp.digicert.com`
  - Use `signtool` fallback step to re-sign
- GPG signing fails (Linux deb)
  - Ensure `pinentry-mode loopback`, correct `KEY ID` and passphrase
  - Verify private key matches maintainer identity
