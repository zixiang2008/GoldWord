# Deployment Conventions

## Netlify 部署（GoldWord 线上站点）

| 项目 | 值 |
| --- | --- |
| 站点名 | goldword2 |
| 站点 ID | b15ba00f-cb45-4ae8-89bf-4065a0b69b98 |
| 线上地址 | https://goldword2.netlify.app |
| 账号 | guanglei.chen.elvis@gmail.com |
| Token 环境变量 | `NETLIFY_AUTH_TOKEN`（已存入 Windows User 环境变量，CLI 自动读取） |
| 本地目录 | D:\WebCoding\GoldWord |
| Git 仓库 | https://github.com/zixiang2008/GoldWord |
| 默认分支 | main |

## 部署流程

```bash
# 前提：已推送代码到 main 分支
git -C D:\WebCoding\GoldWord push origin main

# 部署到 Netlify（已链接站点，无需再 --auth）
netlify deploy --prod --no-build --dir=www --message "release vX.Y.Z - 描述"
```

**重要**：
- 使用 `--no-build`，因为 `netlify.toml` 中的 `build.command` 为 Linux 命令 `cp -r www/. .`，在 Windows 上不可用。`--dir=www` 直接上传 www/ 目录即可（功能等价）。
- 若站点未链接，需先：`netlify link --id b15ba00f-cb45-4ae8-89bf-4065a0b69b98`

## 版本发布 checklist

1. 更新 `www/version.json` → `"version": "X.Y.Z"`
2. 更新 `www/downloads/latest.json` → `"latest": "X.Y.Z", "version": "X.Y.Z"`
3. 更新 `www/ui.js`（状态栏文案，如有需要）
4. 若有 UI 改动，重新生成截图存入 `www/docs/screenshots/`
5. 更新 README.md / README.en.md（版本历史表）
6. `git add && git commit && git push`
7. `netlify deploy --prod --no-build --dir=www`

## 本地预览

```bash
cd D:\WebCoding\GoldWord\www
python -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

## 管理员账号

- 管理员为隐藏账号 `caishen`，需要绑定的特殊密码登录（硬编码在 `db.js` 和 `ui.js`）
- 界面无任何提示，登录后可见"管理员：用户管理"面板
