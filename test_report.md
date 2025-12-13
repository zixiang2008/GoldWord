# 测试报告

## 构建环境
- JDK: 详见 `build_android.log` 顶部输出（11+）
- Gradle: 详见 `build_android.log` 中“Gradle Version”
- Android SDK: 通过 Gradle 构建验证可用
- Xcode: 详见 `xcodebuild.log` 顶部输出（版本与SDK）
- Node/npm: 详见 `validation-report.json` 或后续环境采集

## Android 构建与签名
- 完整构建：已执行 `./gradlew clean assembleRelease`，输出存于 `build_android.log`
- 产物：`android/app/build/outputs/apk/release/app-release-unsigned.apk`，大小约 3.18MB
- 签名：使用本地生成 `release.keystore`（RSA 2048, SHA256withRSA）对 APK 进行签名
- 验证：`apk_signature.txt` 显示签名算法为 SHA256withRSA；证书为自签名（用于本地验证）；无时间戳警告已记录
- 版本号：Android `versionName` 与 `package.json` 同步，详见 `android/app/build.gradle`

## iOS 归档与签名
- Pod 安装：成功，详见 `xcodebuild.log` “Pod installation complete!”
- 归档：失败，原因：需在 Xcode 中配置 Development Team 与有效证书；错误已记录到 `xcodebuild.log`
- IPA 导出：未执行成功（缺少 `exportOptions.plist` 与签名配置）；已记录失败日志
- 签名验证：未生成 `.app`，因此在 `ipa_signature.txt` 中记录说明

## 安装与功能验证（本地）
- Android：由于无指定物理设备矩阵，此处完成构建与签名验证；安装与运行时权限、推送、支付流程验证待设备接入
- iOS：待配置团队与证书后进行归档与导出，再执行安装与功能验证

## 服务重启与接口验证
- 本地服务重启：已完成，详见 `service_log.txt`
- 可用性：`/api/sync/status` 返回 200 与预计字段；`/api/logs` 接收日志并返回 `{ok:true}`
- 数据交互：文件同步与日志接收在本地验证通过

## 问题与解决
- iOS 归档失败：需在 Xcode 项目 `Signing & Capabilities` 配置 Development Team、启用自动签名或提供 `exportOptions.plist`
- 证书与配置：安装 Distribution 证书至 Keychain；下载匹配 Bundle ID 的 Provisioning Profile（包含所需能力）
- Android 正式签名：建议在 `gradle.properties` 中使用环境变量配置正式 `release.keystore` 与密码，并在 CI 中避免明文

## 建议的CI集成
- 添加任务在版本发布时运行 `node cloud-storage-sync.js`，失败时创建告警（Issue/Slack）
- 上传构建日志与签名报告为 artifacts，便于追踪
- iOS 构建在 CI 中使用自动签名（Xcode Cloud 或 fastlane）并管理证书/描述文件

