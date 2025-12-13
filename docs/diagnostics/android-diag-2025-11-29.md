# Android 诊断与优化报告（Debug/Release，2025-11-29）

## 测试环境
- OS：macOS 15.7.3（arm64）
- Node.js：v22.12.0
- Capacitor：`@capacitor/core@6.2.1`
- ANDROID SDK：Build-Tools 34.0.0；ADB 路径：`~/Library/Android/sdk/platform-tools/adb`
- 设备：未连接（ADB 无可用设备）

## 构建与签名
- Release APK：`downloads/1.0.5/goldword-android-pad-1.0.5.apk`
- Release AAB：`downloads/1.0.5/goldword-android-pad-1.0.5.aab`
- Debug APK：`downloads/1.0.5/goldword-android-pad-1.0.5-debug.apk`
- 签名：V1/V2/V3 均为 true；证书 SHA-256：`461f30ab9461a0b1c5ba4f4f73b93bdca8dde73252102b21a27326424d63abf6`

## 日志采集
- 运行：`npm run android:diag`
- 输出：`android_diag_20251129_012934.log`（早期错误，已修复）、最新版 `android_diag_YYYYMMDD_HHMMSS.log`
- 诊断 JSON：当无设备连接时生成 `adb-diagnostics.json` 会标记 `devices: []`，安装结果：`no device connected`

## 关键日志与分析
- ADB 未在 PATH：早期日志出现 `adb: command not found`；已在诊断脚本中通过自动发现修复（`scripts/adb-diagnostics.js`）
- 设备列表：当前无设备，未能执行安装与 logcat 捕获；建议在真实设备上执行以获取完整 ActivityManager/PackageManager 事件
- 资源与页面：`debug.html` 已打包在 `www/`，`Service Worker` 对导航采用网络优先并在失败时回退缓存，避免空白页
- 清单与网络：已启用 `usesCleartextTraffic` 与 `networkSecurityConfig`，本地 `http://localhost` 访问正常；按钮逻辑含 https→http 回退与预检

## 性能指标（基础版）
- 启动时间：需在真实设备采集（建议在首页 `App.init()` 与首屏渲染完成处添加 `performance.now()` 打点并写入 logcat）
- 内存占用：通过 Android Studio Profiler 采集；当前环境未连接设备
- 资源加载：通过 APK Analyzer 验证资源体积；无 native 库，APK≈3.2MB

## 优化建议
- 页面跳转优化：在 Capacitor 环境中优先直接加载内置 `debug.html`，仅当需要外部服务时再进行网络预检，减少 ERR_HTTP 响应失败误报
- 诊断完备化：在脚本中记录设备信息、安装方法与时间戳（已实现），若无设备则输出提示并跳过 logcat
- 性能打点：在 `www/ui.js` 与首页初始化加入简单打点并写入 `localStorage`，再在 `debug.html` 展示
- 分发建议：发布 AAB 至 Play 内测，通过按设备定向分发降低厂商安装器误报

## 后续操作
- 连接目标测试设备，运行：`npm run android:diag`，并提交以下文件：
  - `adb-diagnostics.json`
  - `adb-install-log.txt`
  - 最新 `android_diag_*.log`
- 收集 API Level、ABI 与安装器来源（系统文件管理器/浏览器/ADB）并标注时间戳，复现并定位兼容性提示来源

## 变更摘要
- `scripts/adb-diagnostics.js`：新增 ADB 自动发现、设备检测与无设备优雅降级；日志与 JSON 报告结构增强
- `AndroidManifest.xml`：启用 `usesCleartextTraffic` 与 `networkSecurityConfig`
- `network_security_config.xml`：允许 `localhost/127.0.0.1` 明文访问
