# GoldWord 🪙

![Logo](www/icons/icon-192x192.png)

[![Version](https://img.shields.io/badge/version-1.2.0-007aff)](#)
[![PWA](https://img.shields.io/badge/PWA-ready-blue)](#)
[![Platforms](https://img.shields.io/badge/platforms-Web%20%7C%20PWA-brightgreen)](#)
[![State](https://img.shields.io/badge/state-offline%20first-success)](#)
[![Deploy](https://img.shields.io/badge/deploy-Netlify%20%7C%20Any%20Static%20Host-00C7B7)](#)

> **English version: [README.en.md](README.en.md) / 中文版（本页）**

## 每一个记住的单词，都是一枚金币。

GoldWord 是一个**离线优先**的轻量英语单词学习与复习应用：纯静态、无需后端、数据全部保存在本地。
它把背单词变成"积累财富"——每一轮记忆循环，都让你的词汇金库更充实。

全新 **v1.2.0** 将"个人中心"改为**单页布局**：所有设置集中在一页展示，宽度占屏幕 80%，词库管理支持多卡片响应式并排，并带有章节快捷跳转与滚动高亮。

---

## 截图

| 桌面主页 | 个人中心（单页 / 顶部） |
| --- | --- |
| ![主页桌面](www/docs/screenshots/home-desktop.png) | ![设置面板顶部](www/docs/screenshots/settings-top-desktop.png) |

| 词库管理（响应式并排） | GPT 设置 |
| --- | --- |
| ![词库管理](www/docs/screenshots/settings-words-desktop.png) | ![GPT 设置](www/docs/screenshots/settings-gpt-desktop.png) |

| 移动端主页 | 移动端个人中心 |
| --- | --- |
| ![主页移动端](www/docs/screenshots/home-mobile.png) | ![设置面板移动端](www/docs/screenshots/settings-mobile.png) |

> 截图位于 `www/docs/screenshots/`，随每次版本发布重新生成。

---

## 功能特性

- **单词卡片学习**：翻面 / 下一张 / 朗读 / 记住 / 不记得 / 自动播放，支持键盘快捷键。
- **八维记忆字段**：单词、中文解释、音标、词性、记忆要点、联想、主要用法/定义、简述、固定搭配、例句。
- **词库导入**：支持 `JSON`、`CSV`、`XLSX/XLS`、`TXT`（浏览器内解析，无上传）；支持 **GPT 提取单词**（从粘贴文本中自动识别英文单词）。
- **词库导出与备份**：导出当前词库、一键恢复原始词库、清空词库。
- **学习统计**：总词数、复习进度、严格覆盖率；登录后可查看近 30 天 / 近 24 小时学习、总进度、今日目标。
- **GPT 增强**：选择内置模型或自定义 `Base URL / Model / API Key`，生成/增强单词学习内容，可"仅使用 GPT"关闭本地兜底。
- **自定义 Prompt**：卡片显示项与 Prompt 一一对应，可导入/复制/启用全部自定义 Prompt 模板。
- **语音测试**：内置 TTS 语音朗读测试。
- **多语言界面**：中文 / English / ภาษาไทย / 日本語 / Español。
- **用户系统**：4 位 PIN 注册 / 登录，数据按用户隔离；含隐藏管理员账号（用户管理：新建、改密、删除、拉黑）。
- **离线可用**：PWA + Service Worker，首次加载后断网可学（GPT 网络功能除外）。
- **版本自检**：顶栏"代码版本"+状态栏 `vX.Y.Z`，点击可查看本地 / 最新 / macOS 版本详情。

---

## 完整架构说明

### 总体设计

GoldWord 是**纯前端静态应用（零后端）**，全部逻辑在浏览器内完成。数据只落在本地：

```txt
┌──────────────────────────────────────────────────────────────┐
│                          浏览器 (PWA)                        │
│                                                              │
│  ┌────────────┐   ┌────────────┐   ┌──────────────────────┐  │
│  │  index.html │   │  ui.js     │   │  app.js              │  │
│  │  (单页外壳)  │──▶│ (界面/交互) │──▶│ (学习流程编排)         │  │
│  └────────────┘   └────────────┘   └──────────────────────┘  │
│        │                                  │                  │
│        ▼                                  ▼                  │
│  ┌──────────────── 业务模块 ─────────────┐                  │
│  │ storage.js  本地存储适配器(SA)          │                  │
│  │ db.js       数据存取/统计/用户/GPT配置   │                  │
│  │ word-schema.js   单词记录结构            │                  │
│  │ word-enhancement-service.js  GPT增强   │                  │
│  │ built-in-words.js / local-dictionary   │                  │
│  │ built-in-models.js  内置 GPT 模型预设    │                  │
│  │ visit-backup.js      学习记录导出       │                  │
│  └────────────────────────────────────────┘                  │
│        │                                                      │
│        ├──────────────▶  IndexedDB / localStorage（本地数据）    │
│        ├──────────────▶  i18n.js（多语言，localStorage 保存）    │
│        └──────────────▶  version.js（版本自检与展示）            │
└──────────────────────────────────────────────────────────────┘
        │
        └── (可选) 联网时 → GPT API（Base URL 由用户配置）
```

### 目录结构（`www/` 为唯一发布源）

```txt
GoldWord
├── www/                        # 唯一 Web 发布源（单源收敛）
│   ├── index.html              # 单页应用外壳：卡片区 + 菜单栏 + 个人中心 + 登录/注册覆盖层
│   ├── ui.js                   # 界面初始化、事件绑定、卡片动画、个人中心交互、多语言应用
│   ├── app.js                  # 应用启动、学习流程、导入解析、SW 注册、GPT 设置
│   ├── storage.js              # SA 本地存储适配器（localStorage 读写封装）
│   ├── db.js                   # 词库/学习记录/用户/统计 + GPT 配置（gpt_config__<userId>）
│   ├── word-schema.js          # 单词记录字段/默认值/校验
│   ├── word-enhancement-service.js # GPT 单词增强与字段 Prompt 服务
│   ├── built-in-words.js       # 内置词库（首次使用示例数据）
│   ├── built-in-models.js      # 内置 GPT 模型预设（自动填充 API 地址/模型名）
│   ├── local-dictionary.json   # 本地词典回退数据
│   ├── i18n.js                 # 界面文案字典与语言切换
│   ├── language-system.json    # 多语言系统元数据（zh/en 等多区域）
│   ├── visit-backup.js         # 学习记录/访问数据导出备份
│   ├── version.js              # 版本解析与展示（读取 version.json/latest.json）
│   ├── version.json            # 本地当前版本（v1.2.0）
│   ├── downloads/latest.json   # 最新版本广播（供其他站点/入口读取）
│   ├── docs/
│   │   ├── version-mac.json    # macOS 打包版本元数据
│   │   └── screenshots/        # 本 README 使用的页面截图
│   ├── api-settings-guide.html # API 设置指导页（独立文档页）
│   ├── service-worker.js       # PWA 离线缓存
│   ├── manifest.json           # PWA manifest（图标/主题/独立窗口）
│   └── icons/                  # 应用图标（svg/png）
├── netlify.toml                # Netlify 构建配置（发布 www/ 内容）
└── README.md / README.en.md    # 中文 / 英文文档
```

### 数据流（一次学习循环）

1. `app.js` 启动 → 从 `db.js` 读取当前用户词库 → `ui.js` 渲染第一张卡片。
2. 点"翻面"→ 显示八维字段；点"记住/不记得"→ `db.js` 更新学习标记与统计。
3. 点"朗读"→ 系统 TTS；点"自动播放"→ 定时循环。
4. 点"个人中心"→ 打开设置面板（单页，章节可快捷跳转）。
5. 设置面板内可导入/导出/清空词库、配置 GPT、测试语音、查看统计。

### 存储设计（全部本地）

| 存储键 | 说明 | 位置 |
| --- | --- | --- |
| `gk_users` | 用户表（id/name/password） | localStorage |
| `gk_current_user` | 当前登录用户 | localStorage |
| `gpt_config__<userId>` | 每个用户的 GPT 配置 | localStorage |
| `appLanguage` | 界面语言 | localStorage |
| 词库/学习记录/统计 | 按需持久化（SA 适配器） | localStorage/IndexedDB |

### 多语言机制

- 语言代码：`zh-CN` / `en-US`（界面语言按钮提供 中文 / English / ภาษาไทย / 日本語 / Español）。
- 文案字典集中在 `i18n.js` 与 `language-system.json`，通过 `data-i18n` 键值渲染。
- 切换后写入 `localStorage.appLanguage`，刷新生效。

---

## 快速开始（本地预览）

```bash
# 方案一：使用静态服务器（推荐，保证 PWA/SW 正常工作）
cd www
python -m http.server 8000        # 或 python3，Windows 也可
# 打开 http://localhost:8000/

# 方案二：任意静态托管服务（Netlify Drop、GitHub Pages、Vercel 等）直接部署 www/
```

---

## 设置说明（个人中心 · v1.2.0 单页布局）

> 打开方式：页面底部菜单栏点 **个人中心**。面板宽度为屏幕 80%，移动端自动缩为 94%。
> 单页内所有章节全部可见，顶部"章节快捷跳转"可平滑滚动并高亮当前章节。

### 1. 我的账户
- **注册 / 登录**（未登录时）：账号支持中文/英文/邮箱；注册使用 4 位 PIN，登录用 PIN 或管理员密码。
- **用户信息**（登录后）：近 30 天学习、近 24 小时学习、总进度、今日目标。
- **管理员面板**（仅管理员，见下）。
- **界面语言**：顶部"个人中心 ▾"下拉菜单切换 中文 / English / ภาษาไทย / 日本語 / Español。

### 2. 词库管理
- **导入文件**：选择 `JSON/CSV/XLSX/XLS/TXT` 文件（浏览器本地解析）。
- **下载标准模板**：下载推荐 JSON 模板。
- **导入 JSON / 在线批量导入**：粘贴"英文逗号间隔"的单词列表；或点击 **GPT 提取单词** 让 GPT 从文本中识别并生成英文逗号列表。
- **从文本导入**：解析带字段标签（中文/音标/词性/定义/搭配/助记等）的文本。
- **导出管理**：导出当前词库、清空词库、恢复原始词库。

### 3. 数据统计
- 总词数、复习进度、严格覆盖率（桌面为自适应多列展示）。

### 4. 语音测试
- 点击"测试语音"验证系统 TTS 是否可用。

### 5. GPT 设置
- **选择内置模型**：从下拉框选择模型 → 自动填充 API 地址与模型名。
- **自定义**：`Base URL`、`Model`、`API Key`（仅保存在本机）。
- **保存 / 测试**：保存到 `gpt_config__<userId>`；测试做最小连通性检查。
- **仅使用 GPT**：勾选后禁用本地兜底。
- **GPT 增强 / 导出学习记录**：快捷操作与访问数据导出备份。
- **卡片显示项 Prompt 配置**：单词/中文/音标/词性/记忆/联想/定义/简述/搭配/例句 各字段可配置 Prompt；支持"导入系统 Prompt 模板 / 启用自定义 Prompt / 复制所有 Prompt / 导入所有 Prompt"。

### 管理员账号
- 管理员为**隐藏账号**（`caishen`），界面不提示：需使用与账号绑定的特殊密码登录。
- 登录后"我的账户"显示管理员面板：查看用户、新增/更新用户、修改密码、删除与拉黑。
- 删除用户时同步清理其 `gpt_config__<userId>` 配置。

---

## 部署

### Netlify（已配置）
仓库已内置 `netlify.toml`，构建命令为 `cp -r www/. .`，发布目录为 `.`：

```bash
npx netlify-cli deploy --prod --dir=www
```

### GitHub Pages / 任意静态托管
- 把 `www/` 内容发布到站点根目录即可（本项目也可推送 `gh-pages` 分支）。
- 站内版本自检依赖 `version.json` 与 `downloads/latest.json`，请随发布一并更新。

---

## 版本管理

- 采用语义化版本 `vX.Y.Z`：`version.json` 与 `downloads/latest.json` 同步更新。
- 状态栏与顶栏"代码版本"由 `version.js` 动态读取并展示。

### 版本历史

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| **1.2.0** | 2026-09 | 个人中心重构为单页布局（屏幕宽度 80%）；词库管理多卡片响应式并排；章节快捷跳转 + 滚动高亮；数据统计自适应分栏 |
| 1.1.0 | 2026-09 | 版本显示重构（状态栏 `vX.Y.Z` + 顶栏代码版本 + 详情弹层）；`www/` 单源收敛；内置词库/模板等资源复位 |
| 1.0.x | 2025 | 单词学习、导入导出、GPT 配置、多语言、登录/统计、离线 PWA 等基础能力 |

---

## 开发

- 直接编辑 `www/` 下文件即可，无需构建步骤。
- 本地预览：`cd www && python -m http.server 8000`。
- 修改版本：编辑 `www/version.json` 与 `www/downloads/latest.json`。
- 更新截图：浏览器打开后截图保存到 `www/docs/screenshots/`。

---

## 常见问题

- **导入后统计不刷新**：重新打开"个人中心"查看。
- **离线时 GPT 不可用**：属预期行为，本地学习不受影响。
- **语言切换后个别文案未变**：请刷新页面。
- **管理员面板不显示**：请以管理员账号（隐藏账号 caishen）重新登录。

## 安全说明

- API Key 仅保存在本机 `localStorage`，请勿提交到仓库。
- 仓库不包含任何证书 / 私钥 / 密钥。