# 项目命名与定期成长规则

## 目录命名
- 统一使用小写 + 短横线（kebab-case），例如：`android/`、`ios/`、`desktop/`、`www/`、`scripts/`、`docs/`、`dist/`
- 禁止空格、中文目录名、超过 30 字符的目录名
- 集合目录与资源目录优先使用单数：如 `icon/`、`script/`，确需集合时可使用复数（保持一致）
- 入口文件保持行业约定：Web `index.html`，Electron `electron/main.js`

## 文件命名
- 组件/类：`PascalCase`，例如：`FlashcardControls.tsx`
- 变量/函数：`snake_case`
- 常量：`UPPER_SNAKE_CASE`
- 静态资源：小写 + 短横线，例如：`icon-192x192.png`

## 结构约定
- 顶层模块：`android/`、`ios/`、`desktop/`、`www/`、`scripts/`、`docs/`、`dist/`
- Web 资源目录：`www/` 作为发布与封装入口（Android、Electron）
- 说明文档集中在 `docs/`，开发指南在 `README.md` 与 `CONTRIBUTING.md`

## 定期成长规则
- 版本管理：语义化版本 `MAJOR.MINOR.PATCH`，至少每周一次维护或功能发布
- 变更记录：每次发布更新 `CHANGELOG.md` 要点摘要
- 归档规范：`dist/archives/goldword-archive-YYYYMMDD-HHMMSS.zip`；Web 快照 `goldword-web-YYYY-MM-DD-snapshot.zip`
- 自动化：保留并执行 `archive`/`archive:watch` 脚本；CI 可上传制品/保留快照

## 提交前校验
- 预提交钩子将检查新提交的目录命名是否符合规则（仅检查本次变更路径）
- 如校验失败，请将目录名改为小写 + 短横线，并避免空格与中文字符

## 例子
- 正确：`scripts/auto-archive.js`、`docs/conventions.md`、`www/service-worker.js`
- 不可取：`My Folder/`、`资源/`、`veryVeryLongDirectoryNameThatExceedsThirtyCharacters/`

## 例外说明
- Android/iOS/Electron 的平台内置目录可能使用框架约定（如 `App/`、`Assets.xcassets/`、`MacOS/`），此类不在校验范围
- 历史遗留的构建产物目录（如 `desktop/dist/` 下的 `.app` 内容）不在校验范围

