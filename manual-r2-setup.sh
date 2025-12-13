#!/bin/bash

# R2存储桶手动配置脚本
# 由于API权限限制，此脚本提供手动配置步骤

echo "🚀 GoldWord R2存储桶手动配置指南"
echo "=================================="
echo ""
echo "由于API权限限制，需要手动完成以下步骤："
echo ""

echo "1️⃣ 创建R2存储桶："
echo "   - 访问: https://dash.cloudflare.com/"
echo "   - 点击左侧菜单: R2 »
echo "   - 点击: 创建存储桶"
echo "   - 名称: goldword-downloads"
echo "   - 地区: 选择最近的地区"
echo "   - 点击: 创建"
echo ""

echo "2️⃣ 上传文件到R2："
echo "   - 进入刚创建的存储桶"
echo "   - 点击: 上传"
echo "   - 选择版本文件夹 1.0.2 1.0.3"
echo "   - 保持文件夹结构上传"
echo ""

echo "3️⃣ 创建Worker："
echo "   - 访问: https://dash.cloudflare.com/workers"
echo "   - 点击: 创建服务"
echo "   - 选择: 创建Worker"
echo "   - 名称: goldword-r2-worker"
echo "   - 点击: 部署"
echo ""

echo "4️⃣ 配置Worker代码："
echo "   - 点击: 快速编辑"
echo "   - 替换为 index.js 中的代码"
echo "   - 点击: 保存并部署"
echo ""

echo "5️⃣ 绑定R2存储桶："
echo "   - 在Worker设置中，点击: 设置"
echo "   - 滚动到: R2存储桶绑定"
echo "   - 点击: 添加绑定"
echo "   - 变量名: GOLDWORD_DOWNLOADS"
echo "   - 存储桶: goldword-downloads"
echo "   - 点击: 保存"
echo ""

echo "6️⃣ 配置自定义域："
echo "   - 在Worker触发器中，点击: 添加域"
echo "   - 输入: caishen.us.kg"
echo "   - 路径: /*"
echo "   - 点击: 添加域"
echo ""

echo "7️⃣ 验证配置："
echo "   - 访问: https://caishen.us.kg/1.0.3/goldword-mac-1.0.3.dmg"
echo "   - 应该能正常下载文件"
echo ""

echo "📋 需要上传的文件列表："
find ./downloads -name "*.dmg" -o -name "*.zip" -o -name "*.apk" -o -name "*.ipa" -o -name "*.exe" | sort

echo ""
echo "完成以上步骤后，运行验证脚本："
echo "node verify-cdn-links.js"