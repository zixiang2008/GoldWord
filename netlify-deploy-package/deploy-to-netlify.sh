#!/bin/bash

# Netlify快速部署脚本
# 用于快速上传文件到Netlify

echo "🚀 开始Netlify部署..."

# 检查文件是否存在
echo "📋 检查部署文件..."
for file in app-cdn.html 404.html _redirects netlify.toml cdn-links-generated.json cdn-mapping-config.json; do
  if [ -f "$file" ]; then
    echo "✅ $file 存在"
  else
    echo "❌ $file 缺失"
  fi
done

echo ""
echo "📦 部署包已准备完成！"
echo "下一步:"
echo "1. 访问 https://app.netlify.com"
echo "2. 找到 caishen.us.kg 站点"
echo "3. 拖拽所有文件到部署区域"
echo ""
echo "验证URL:"
echo "- https://caishen.us.kg/app-cdn.html"
echo "- https://caishen.us.kg/downloads-cdn.html"
echo ""
echo "部署时间: $(date)"
