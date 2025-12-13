#!/bin/bash

# CloudFlare CDN 一键部署脚本
# 自动完成CDN配置、文件上传和测试

set -e

echo "🚀 CloudFlare CDN 一键部署工具"
echo "====================================="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

# 检查环境变量
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  未找到 CLOUDFLARE_API_TOKEN 环境变量"
    echo "请设置环境变量: export CLOUDFLARE_API_TOKEN=your_api_token"
    echo ""
    echo "如何获取API令牌:"
    echo "1. 访问 https://dash.cloudflare.com/profile/api-tokens"
    echo "2. 点击 'Create Token'"
    echo "3. 使用 'Custom token'"
    echo "4. 权限设置:"
    echo "   - Zone:Read, Zone:Edit"
    echo "   - Account:Read"
    echo "   - R2:Read, R2:Write"
    echo "5. 包含所有资源"
    echo ""
    read -p "输入API令牌: " api_token
    export CLOUDFLARE_API_TOKEN="$api_token"
fi

# 设置默认域名
if [ -z "$CLOUDFLARE_ZONE_NAME" ]; then
    echo ""
    echo "请输入要使用的域名 (如: downloads.yourdomain.com)"
    read -p "域名: " zone_name
    export CLOUDFLARE_ZONE_NAME="$zone_name"
fi

# 创建必要的目录
echo "📁 检查目录结构..."
mkdir -p downloads
mkdir -p logs

# 安装依赖
echo "📦 安装依赖..."
if [ -f "package-cdn.json" ]; then
    npm install --package-lock-only --package-lock-file=package-cdn-lock.json
fi

# 运行部署脚本
echo ""
echo "🎯 开始部署CDN..."
node deploy-cdn.js 2>&1 | tee "logs/cdn-deploy-$(date +%Y%m%d-%H%M%S).log"

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 CDN部署成功！"
    echo ""
    echo "📋 后续操作:"
    echo "1. 检查生成的 cdn-links.json 文件获取下载链接"
    echo "2. 更新网站使用新的CDN链接"
    echo "3. 监控CDN使用情况和费用"
    echo ""
    echo "📊 监控建议:"
    echo "- 设置CloudFlare Analytics监控"
    echo "- 配置用量告警"
    echo "- 定期检查下载速度"
else
    echo ""
    echo "❌ 部署失败，请检查日志文件"
    exit 1
fi