# 项目签名与发布自动化规则（GoldWord）

## 版本与目录规范
- 版本号来源：从 `www/version.json` 读取，格式必须为 `major.minor.patch`（示例：`1.0.6`）。
- 安装文件统一目录：`downloads/<version>/`，所有产物采用扁平存放，不创建子目录；保持原始文件名。
- 路径映射：`releases/<version>/installers` 必须作为符号链接，指向 `downloads/<version>/`。
- 清理规则：生成新版本前，自动清理 `downloads/` 下其他语义化版本目录，保留当前版本与 `downloads/backups/`（回撤点）。

## 签名身份与安全
- 必备环境变量：`SIGNING_IDENTITY`（示例：`Developer ID Application: <Your Name> (<TeamID>)`）。
- 可选环境变量：`APPLE_ID`、`APP_SPECIFIC_PASSWORD`、`TEAM_ID`（用于公证）；`GPG_KEY_ID`（用于 GPG 签名）。
- 签名密钥安全：密钥与口令仅存储于系统钥匙串与环境变量，禁止写入代码库与日志；不输出密钥明文。

## 证书链生成与空文件处理
- 证书链导出：
  - 使用 `scripts/export_cert_chain.sh` 读取 `SIGNING_IDENTITY` 并生成：
    - `cert_chain.pem`（PEM 格式证书链）
    - `cert_chain.json`（从 `codesign -dv` 解析的 Authority 列表）
  - 存放路径：与安装文件相同目录 `downloads/<version>/`。
- 空证书链处理（`cert_chain.pem` 为 0B）：
  - 自动重试导出：校验并重新尝试导出，优先使用登录钥匙串；验证 `SIGNING_IDENTITY` 是否有效。
  - 若仍失败：生成明确错误报告并中止发布流程；保留构建日志与回撤点，可安全回滚。

## 签名与报告规范
- macOS 签名：`mac/sign_and_notarize.sh` 使用 `codesign --options runtime --timestamp`；如配置公证，执行 `notarytool submit --wait` 与 `stapler staple`。
- 验证输出（全部写入 `downloads/<version>/`）：
  - `codesign_display.txt`（`codesign -dv --verbose=4`）
  - `codesign_verify.txt`（`codesign --verify --deep --strict`）
  - `spctl_assess.txt`（`spctl --assess -vv`）
- 校验文件：为每个安装包生成 `*.sha256.txt`，文件名与包名对应。
- 报告与清单：
  - `signing_report.txt`（含各安装包 SHA256 摘要）
  - `manifest.json`（版本、时间戳、产物与校验文件路径、证书链文件路径）
- 时间戳：所有报告与日志文件均附带 `YYYYMMDD_HHMMSS` 时间戳。

## 自动化流程
- 一键发布：`scripts/release.sh`
  - 构建 macOS `.app`、打包 Web 资源、生成回撤点与快照。
  - 自动调用 `scripts/build_installers.sh`：构建三平台安装包、签名与证书链导出、校验与报告、复制到 `downloads/<version>/`、清理旧版本、创建符号链接映射。
  - 发布日志写入：`releases/<version>/meta/release_<timestamp>.log` 与 `releases/<version>/installers/build_<timestamp>.log`。
- 构建安装包：`scripts/build_installers.sh`
  - 产物：
    - macOS：`GoldWord_v<version>_macOS_universal.app.zip`
    - Windows：`GoldWord_v<version>_Windows_portable.zip`
    - Linux：`goldword_v<version>_linux_portable.tar.gz`
  - 报告：`signing_report.txt`、`manifest.json`、`*.sha256.txt`；证书链与签名验证文件与安装包同目录。

## 异常处理与回滚
- 配置无效：
  - 当 `SIGNING_IDENTITY` 无效或证书链导出失败，立即输出明确错误信息，停止发布；不继续分发。
- 回撤点：
  - 路径：`downloads/backups/<timestamp>/`；包含 `www_<version>.zip`、`mac_<version>.zip`、`docs_<version>.zip`、`rollback.json`。
  - 快速回滚标记：`downloads/backups/CURRENT` 指向最新回撤点；解压对应快照即可恢复。
- 变更历史：
  - 所有配置与执行日志保存在发布目录内（`meta/` 与 `installers/` 日志）；作为审计与追溯依据。

## 运行要求
- 不得在任何构建或发布日志中记录密钥明文或敏感凭据。
- 所有安装文件与报告必须位于 `downloads/<version>/`，名称与时间戳符合规范。
- 发布流程完成后自动执行签名验证与证书链生成；若证书链为空，执行重试逻辑并在失败时中止。
