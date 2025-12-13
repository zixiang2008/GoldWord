# CI Android SDK 安装与签名验证方案

## 触发条件
- 推送标签：`v*.*.*`
- 手动触发：`workflow_dispatch`

## 环境与依赖
- 运行环境：`macos-latest`
- Java：`actions/setup-java@v4`，`Zulu JDK 17`
- Android SDK：命令行工具（cmdline-tools latest）
- 构建组件：`platform-tools`、`build-tools;34.0.0`、`platforms;android-34`

## 环境变量
- `ANDROID_SDK_ROOT`、`ANDROID_HOME`：SDK 安装路径（流水线内设定）
- 可选签名密钥（建议使用仓库 Secrets）：
  - `ANDROID_KEYSTORE_BASE64`：Base64 编码的 `release.keystore`
  - `ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`

## 构建与验证
1. 构建 Android 产物：`./android/gradlew assembleRelease` 与 `bundleRelease`
2. 验证 APK 签名：`apksigner verify --verbose --print-certs`
   - 校验 `V1` 与 `V2` 必须为 `true`；`V3` 可选
3. 验证 AAB：`jarsigner -verify -verbose -certs`

## 报告生成
- 脚本：`scripts/apksign_report.py`
- 输出：`downloads/<version>/apksign_report.json` 与 `apksign_report.html`
- 内容：签名方案状态、证书指纹、Subject/Issuer、有效期与算法等关键字段
- 失败处理：若 `V1/V2` 任一失败则终止 CI 并标红日志

## 归档与日志
- CI 产物归档：`actions/upload-artifact@v4` 上传 `downloads/*`
- 关键日志：`apksigner` 输出、JSON/HTML 报告、Gradle 构建日志

## 维护建议
- 固化 `build-tools` 与 `platforms` 版本，必要时升级
- 将正式发布密钥放入仓库 Secrets，流水线中解码使用
- 在发布分支与标签上统一执行验证，保证稳定性与一致性

