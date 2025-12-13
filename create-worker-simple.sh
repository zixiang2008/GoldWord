#!/bin/bash

echo "🚀 创建新的Worker子域名 - 简化版"
echo "====================================="
echo ""
echo "由于 caishen.us.kg 已被使用，建议使用以下步骤："
echo ""

echo "1️⃣ 创建新的Worker："
echo "   - 访问: https://dash.cloudflare.com/workers"
echo "   - 点击: 创建服务"
echo "   - 选择: 创建Worker"
echo "   - 名称: goldword-downloads"
echo "   - 点击: 部署"
echo ""

echo "2️⃣ 配置Worker代码："
echo "   - 点击: 快速编辑"
echo "   - 复制 index.js 文件中的代码"
echo "   - 点击: 保存并部署"
echo ""

echo "3️⃣ 绑定R2存储桶："
echo "   - 在Worker设置中，点击: 设置"
echo "   - 滚动到: R2存储桶绑定"
echo "   - 点击: 添加绑定"
echo "   - 变量名: GOLDWORD_DOWNLOADS"
echo "   - 存储桶: goldword-downloads"
echo "   - 点击: 保存"
echo ""

echo "4️⃣ 获取Worker子域名："
echo "   - 在Worker触发器中查看自动生成的子域名"
echo "   - 格式: goldword-downloads.{your-account}.workers.dev"
echo ""

echo "5️⃣ 上传文件到R2："
echo "   - 访问: https://dash.cloudflare.com/r2"
echo "   - 进入: goldword-downloads 存储桶"
echo "   - 上传 downloads/ 文件夹中的所有内容"
echo "   - 保持文件夹结构（1.0.2/, 1.0.3/）"
echo ""

echo "6️⃣ 测试Worker："
echo "   - 访问: {your-worker-subdomain}/1.0.3/goldword-mac-1.0.3.dmg"
echo "   - 应该能正常下载文件"
echo ""

echo "📋 替代方案："
echo "   如果Worker配置复杂，可以直接使用GitHub Pages或Netlify"
echo "   作为下载页面的替代方案"
echo ""

echo "✅ 完成后，更新下载页面链接即可！"