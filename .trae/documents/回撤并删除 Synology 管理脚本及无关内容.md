## 清理范围
- 目标：删除与当前项目无关的 Synology 管理脚本与相关痕迹，确保仓库专注于 GoldWord。
- 已发现的无关项：
  - `~/Desktop/ai_projects/GoldWord/synology_manager.py`
  - 终端会话：`/Users/elvis/Desktop/ai_projects/SynologyDaokeManager`（空闲，无运行任务）

## 执行步骤
1. 关闭无关终端会话
- 关闭位于 `SynologyDaokeManager` 的空闲终端（不会影响当前服务）。

2. 删除非项目文件
- 删除 `~/Desktop/ai_projects/GoldWord/synology_manager.py`
- 可选：如确认不再需要，删除目录 `~/Desktop/ai_projects/SynologyDaokeManager/`（该目录不属于当前项目）

3. 验证项目不受影响
- 保持正在运行的本地网页 `http://localhost:8000/index.html` 与 Mock GPT `http://127.0.0.1:8001` 不变
- 访问首页与测试 GPT 设置，确认清理后功能正常

## 交付
- 清理报告：列出已删除的文件/目录
- 保留当前项目服务与文档，不做其它变更

## 风险与回滚
- 删除前不做额外改动；如意外删除，将从系统回收站或备份恢复（若适用）

## 确认点
- 是否同时删除外部目录 `SynologyDaokeManager/`？
- 若有其它与 Synology 相关的文件需要一并移除，请告诉我路径