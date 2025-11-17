## 问题概述

* 现象：本地页面或桌面应用无法正常启动，或页面内的增强（GPT）服务不可用。

* 目标：恢复三项本地服务的可用性：静态网页、Mock GPT 接口、Electron 桌面版，并完成端到端验证。

## 诊断准备

* 目录结构：静态站点位于 `GoldWord/GoldWord`（含 `index.html`、`ui.js`、`db.js` 等）。

* Mock GPT：`mock-gpt-server.py` 提供 `http://127.0.0.1:8001/v1/chat/completions`。

* 桌面应用：Electron 入口在 `GoldWord/GoldWord/desktop/electron/main.js`，开发模式加载 `../../www/index.html`。

* 关键代码：

  * 接口调用拼接：`GoldWord/GoldWord/ui.js:2455-2469`（将 `baseUrl` 规范化为 `.../v1/chat/completions` 并 `fetch`）。

  * GPT 配置存储：`GoldWord/GoldWord/db.js:653-716`（localStorage 键 `gpt_config__<userId>`）。

  * 桌面版载入路径：`GoldWord/GoldWord/desktop/electron/main.js:17-20`（开发/打包切换）。

## 诊断步骤

1. 静态网页资源检查

   * 确认 `GoldWord/GoldWord/index.html` 与关联脚本存在：`storage.js`、`word-schema.js`、`db.js`、`ui.js`、`app.js`。

   * 若缺文件或 404，说明静态服务根目录错误或文件同步未完成。
2. 端口与占用

   * 需空闲端口：网页 `8000` 或任意端口；Mock `8001`。

   * 如占用，改用备用端口：`8080`（网页）、`8002`（Mock）。
3. Mock GPT 接口连通性

   * 预期地址：`http://127.0.0.1:8001/v1/chat/completions`。

   * 若浏览器跨域报错，检查响应头是否含 `Access-Control-Allow-Origin: *`（`mock-gpt-server.py:25-33` 已设置）。
4. 桌面版路径/依赖

   * 开发模式加载 `../../www/index.html`；若路径不符或 `node_modules` 缺失，会导致空白或启动失败。
5. 本地配置丢失

   * 浏览器清缓存或更换浏览器会导致 GPT 设置丢失；需在“个人中心 → GPT 服务设置”重新写入。

## 修复步骤

1. 启动静态网页

   * 切换到站点根：`cd GoldWord/GoldWord`

   * 启动：`python3 -m http.server 8000`（如占用，改 `8080`）

   * 访问：`http://localhost:8000/`
2. 启动 Mock GPT 服务

   * 根目录：`cd /Users/elvis/Desktop/ai_projects/GoldWord`

   * 启动：`python3 mock-gpt-server.py`（如需备用端口：修改为 `8002` 并在前端配置相同端口）

   * 测试：`curl http://127.0.0.1:8001/v1/chat/completions -H 'Content-Type: application/json' -d '{"model":"mock-4o-mini","messages":[{"role":"user","content":"test"}]}'`
3. 配置前端 GPT 设置

   * 页面右下“增强服务状态”为“增强服务未启动”时，打开“个人中心 → GPT 服务设置”。

   * `API 基础地址` 填：`http://127.0.0.1:8001`（前端会自动补 `/v1`）

   * `模型名` 填：`mock-4o-mini`

   * `API 密钥` 留空（Mock 不需要）

   * 点击“保存设置”，再点“测试设置”，预期显示成功并状态灯变绿。
4. 启动桌面版（可选）

   * `cd GoldWord/GoldWord/desktop`

   * 安装依赖：`npm i`

   * 开发启动：`npm run dev`

   * 若空白，检查 `desktop/electron/main.js:17-20` 与 `GoldWord/GoldWord/www/index.html` 是否对应。

## 验证

* 网页：`http://localhost:8000/` 能打开，顶部卡片与按钮正常响应。

* Mock：`curl` 返回 JSON，含 `choices[0].message.content`。

* UI 集成：翻转卡片时右侧“正在查询 GPT 释义...”能变为简述（来源：`ui.js:2319-2325` 与 `fetchGPTBrief`）。

* 状态指示：底部“增强服务进度”从“未启动”变为进度和百分比显示；状态灯变为绿色。

## 常见错误与应对

* 端口占用：改端口并同步页面内 `API 基础地址`。

* 基础地址错误：请填写根地址（不要直接写到 `/v1/chat/completions`）；前端会自动拼接 `/v1/chat/completions`。

* CORS 拒绝：确认请求指向 `127.0.0.1` 或 `localhost`，并使用 `http`；Mock 已开放跨域。

* 本地存储丢失：在“个人中心”重新保存 GPT 设置（`db.js:659-667`）。

* 桌面版空白：确保 `www/index.html` 存在且路径与 `main.js` 对齐；`npm i` 后再启动。

## 后续

* 若你确认使用本地网页 + Mock 方案，我将按上述步骤自动化启动与验证；如需 Electron 桌面版或更换端口，也可一起调整。

