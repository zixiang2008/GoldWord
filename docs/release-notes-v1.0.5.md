# GoldWord V1.0.5 版本更新说明

- 版本号：**V1.0.5**
- 发布日期：**2025-11-24**

## 新功能

- **Android 自动化签名系统（V1/V2/V3 双签/三签）**
  - 在构建阶段自动启用 `V1(JAR)` 与 `V2/V3(APK Signature)` 签名，兼容旧版系统并保障完整性。
  - 签名配置通过环境变量安全注入，发布/开发密钥可分离管理。
  - 代码位置：`android/app/build.gradle:29-35,37-59`；验证工具：`scripts/signing-verify.js`、`scripts/signing-audit.js`。

- **PEPK 导出与 Google Play App Signing 支持**
  - 提供上传密钥导出脚本，便于 Play 托管签名与密钥分离。
  - 工具脚本：`scripts/export-pepk.js`。

- **多平台打包产物**
  - macOS：生成 `DMG/ZIP/PKG` 安装包（`.pkg` 便于企业分发与静默安装）。
  - Windows：生成 portable `.exe` 安装包。
  - Android：统一并保留最新 `1.0.5` 版本安装包。

- **下载页增强与容错**
  - 当 CDN 索引缺失时，前端自动回退到 GitHub 链接并保持可用性。
  - 增加分块进度与大小校验（详见 `validation-report.json` 的下载页修复条目）。

## 功能优化

- **版本目录与命名规范统一**
  - 将 `downloads/v1.0.5` 规范为 `downloads/1.0.5/`，统一去除 `v` 前缀以匹配历史版本索引。
  - 更新 `downloads/latest.json` 为 `1.0.5`，并完善 `index.json/checksums.json`（与签名后校验值一致）。

- **构建脚本完善**
  - 新增 NPM 脚本：
    - `android:build:release`（Gradle 发行构建）
    - `android:verify:apk`（签名验证并输出报告）
    - `android:audit`（权限与 ABI 审计）
    - `android:export:pepk`（导出上传密钥）
  - 代码位置：`package.json:25-33`。

- **重复文件清理与索引修复**
  - 移除重复的 `phone` APK 与顶层冗余文件，仅保留 `pad` 版本（两者内容一致）。
  - 更新 `cdn-links-generated.json` 的文件清单以避免 404。

## 问题修复

- **下载页 JSON 解析错误修复**
  - 现当 `cdn-links-generated.json` 返回 HTML/404 时，前端不再崩溃，自动回退到 GitHub 下载源。
  - 影响：显著降低下载页不可用概率，提升可用性与稳定性。

- **签名方案合规性修复**
  - 针对 `targetSdkVersion=34` 要求启用 `V2` 及以上签名方案，已在构建与重签流程中强制启用。
  - 验证：`apksigner verify --verbose --print-certs` 显示 `V2/V3=true`。

## 技术细节（可选）

- **架构调整**
  - Gradle 深度集成签名配置，支持 `release/debug/feature` 变体统一启用签名方案。
  - 通过环境变量注入 keystore 信息，避免密钥出现在仓库中。

- **SDK/构建参数**
  - `minSdkVersion=22`、`targetSdkVersion=34`（`android/variables.gradle:2-4`）。
  - `apksigner` 使用 Build-Tools `34.0.0`，工具路径：`~/Library/Android/sdk/build-tools/34.0.0/apksigner`。

- **数据库/接口**
  - 本次版本未涉及数据库结构变更。
  - 未修改对外 API 接口，兼容既有调用方式。

## 升级说明

- **数据迁移**
  - 无需数据迁移，本次升级不影响本地存储结构。

- **兼容性**
  - Android：签名兼容旧版系统（V1）并满足高版本完整性要求（V2/V3）。
  - macOS：已生成 `.pkg/.dmg/.zip`（如需 App Store 分发需后续公证）。
  - Windows：portable `.exe` 可直接运行（生产环境建议代码签名以减少安全提示）。

- **注意事项**
  - 生产发布前，请在 CI 中注入正式 keystore 环境变量并启用签名门禁检查。
  - 如需 Google Play 托管签名，请运行 `android:export:pepk` 并完成后台配置。

## 版本历史

- **V1.0.3（2025-11-21）**
  - 引入多平台包（macOS/Windows/Android）初始版本，发布到 CDN 与 GitHub Releases。
  - 完成下载页基础布局与跳转逻辑。

- **V1.0.2（2025-11-20）**
  - 提供 iOS/iPad 早期测试版（IPA），完善 macOS 压缩与镜像包初版。
  - 补充 Web 资源打包与下载目录结构。
