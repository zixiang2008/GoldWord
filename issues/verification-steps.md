# 验证步骤文档（下载页JSON解析错误修复验证）

## 本地网页打开（3次以上）
- 步骤:
  - 启动本地服务: `node cloud-sync-server.js`
  - 打开: `http://localhost:8080/app-cdn.html`
  - 重复打开3次，确认每次均正常渲染并在失败场景触发降级
- 结果: 通过（详见 `service_log.txt`）

## 服务重启验证
- 步骤:
  - 重启服务并观察启动日志
  - 调用: `GET /api/sync/status` 返回 200 与字段 `enabled/lastSync`
  - 调用: `POST /api/logs` 返回 `{ok:true}`，日志写入 `logs/app-cdn-YYYY-MM-DD.jsonl`
- 结果: 通过（详见 `service_log.txt`）

## 测试链接（带参数/认证）
- 链接: `http://localhost:8080/app-cdn.html?src=cdn&auth=token-demo`
- 预期: 页面正常；当 `cdn-links-generated.json` 不可用时降级并显示GitHub下载

## 屏幕录制（<30秒）
- 建议工具: macOS QuickTime 或系统屏幕录制
- 覆盖内容: 打开页面→点击下载→查看进度与降级提示→接口验证
- 输出: `issues/recording-0001.mp4`（待补充）
