# 卡片页面打开与授权指引

- 打开地址：`http://localhost:8080/app-cdn.html`
- 授权方式：在URL后追加 `?auth=你的访问码`，或在页面输入访问码后点击“授权并打开”
- 安装目录：统一使用项目根目录下 `downloads/` 存放安装包与索引
- 自动修复：运行 `node scripts/ensure-install-dirs.js` 将输出统一到 `downloads/`
- 跨平台打开：运行 `node scripts/open-card-page.js` 自动启动服务并在默认浏览器打开
- 故障排查：
  - 健康检查：`curl http://localhost:8080/health` 应返回 200
  - 连接拒绝：启动服务或检查防火墙/代理
  - 索引缺失：运行 `node scripts/copy-dist-to-downloads.js`

- 自动化测试：`node scripts/test-card-page.js` 生成 `card_page_test_report.json`
