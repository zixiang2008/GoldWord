# ISSUE-REPORT-0001 / 云端下载页JSON解析错误（中文/English）

- 优先级 Priority: P1
- 严重程度 Severity: Major
- 分类标签 Label: Bug
- 版本 Version: `package.json` 当前版本，同步为 Android `versionName`
- Git Commit: c942d81（短哈希）
- 参考链接 Links: `https://www.caishen.us.kg/app-cdn.html`, `https://github.com/zixiang2008/GoldWord/releases`

## 问题描述 Problem Description
- 中文：访问下载页面时，`cdn-links-generated.json` 返回 HTML（例如 404 页）。前端按 JSON 解析导致错误：`SyntaxError: Unexpected token '<'`。
- English: When visiting the downloads page, `cdn-links-generated.json` returns HTML (e.g., 404 page). The frontend attempts `JSON.parse` and throws `SyntaxError: Unexpected token '<'`.

## 重现步骤 Reproduction Steps
1. 打开 `https://www.caishen.us.kg/app-cdn.html`
2. 在浏览器开发者工具查看网络请求，找到 `cdn-links-generated.json`
3. 如果返回体为 HTML 而非 JSON，页面会抛出解析错误并停止渲染
- 触发条件 Trigger: CDN/站点未部署或无法访问 `cdn-links-generated.json`

## 预期与实际 Expected vs Actual
- 预期 Expected: 页面优雅降级，读取 `release-report.json` 推断版本，至少提供 GitHub 下载链接；同时记录结构化错误日志。
- 实际 Actual: 直接抛出 `SyntaxError`，用户看到“加载失败”，下载列表不可用。

## 环境信息 Environment
- OS: ProductName: macOS ProductVersion: 15.7.3 BuildVersion: 24G416
- Browser: Electron 内置 UA，Chrome/Edge 可复现
- Node: v22.12.0；npm: 10.9.0
- iOS/Xcode: 详见 `xcodebuild.log` 顶部；Android/JDK/Gradle: 详见 `build_android.log` 顶部
- Device: 桌面（macOS），移动端同样受影响

## 错误日志 Error Logs（含时间戳）
```text
[error] 加载失败: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
at https://www.caishen.us.kg/app-cdn.html:255:14
```
- 页面端采集：`app-cdn.html:224–231` 使用 `text()`+`JSON.parse` 捕获并上报 `cdn_links_parse_error`
- 服务器接收：`cloud-sync-server.js:321–356` 写入 JSONL 日志（30 天保留）

## 影响范围与风险 Impact & Risk
- 影响下载入口与安装包获取，直接影响转化与发布流程
- 若无降级与监控，将导致页面不可用且难定位问题

## 修复方案 Fix Plan
- 前端 Frontend：
  - 将 `response.text()` 后再 `JSON.parse`，捕获解析错误并上报结构化日志；失败时降级到 `release-report.json` + GitHub 下载链接。
  - 位置：`app-cdn.html:224–231`, `258–259`, `306–310`。
- 服务端 Server：
  - 增加 `/api/logs` 接口接收结构化日志并以 JSONL 存储（每日滚动），保留策略30天。
  - 位置：`cloud-sync-server.js:321–356`, `471–491`。
- 云端同步 Cloud Sync：
  - 增量+断点续传（批次100条、gzip压缩、最多重试3次），报告包含批次统计。
  - 位置：`cloud-storage-sync.js:356–404`, `440–446`。

## 验证结果 Verification
- 本地页面多次打开通过（≥3次）：`http://localhost:8080/app-cdn.html`
- 服务重启后接口正常：`/api/sync/status` 返回 200；`/api/logs` 返回 `{ok:true}`（详见 `service_log.txt`）
- 测试链接 Test Link：`http://localhost:8080/app-cdn.html?src=cdn&auth=token-demo`
- 屏幕录制：待补充（<30秒）

## 附件 Attachments（≤5, 总大小<10MB）
- `build_android.log`（Android 构建与环境信息）
- `xcodebuild.log`（iOS 构建与归档日志）
- `apk_signature.txt`（Android 签名验证报告）
- `service_log.txt`（服务重启与接口验证日志）
- 参考：`validation-report.json`, `cloud-sync-report.json`

## 代码片段 Code Snippets
```javascript
// app-cdn.html:224–231
cdnLinks = await fetch('cdn-links-generated.json', { cache: 'no-store' })
  .then(async r => {
    if(!r.ok) { throw new Error('links json not ok'); }
    const t = await r.text();
    try { return JSON.parse(t); }
    catch(e){ await postLog({ event_type:'cdn_links_parse_error', log_level:'error', message:String(e&&e.message||e), device_info: deviceInfo() }); throw e; }
  });
```

## 评估 Assessment
- 优先级 Priority: P1（下载入口受影响）
- 严重程度 Severity: Major（有降级但影响显著）
