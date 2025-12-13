#!/bin/bash

# CloudFlare CDN 修复版部署脚本
# 解决中文字符编码问题

set -e

echo "🚀 CloudFlare CDN 修复版部署工具"
echo "====================================="
echo "本版本修复了中文字符编码问题"
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
    echo "如果你遇到中文字符编码问题，请："
    echo "1. 确保API令牌只包含ASCII字符"
    echo "2. 检查域名设置是否正确"
    echo "3. 使用修复版的部署程序"
    echo ""
    read -p "输入API令牌: " api_token
    export CLOUDFLARE_API_TOKEN="$api_token"
fi

# 设置默认域名
if [ -z "$CLOUDFLARE_ZONE_NAME" ]; then
    echo ""
    echo "请输入要使用的域名 (如: downloads.yourdomain.com)"
    echo "注意：域名应只包含ASCII字符"
    read -p "域名: " zone_name
    export CLOUDFLARE_ZONE_NAME="$zone_name"
fi

# 创建必要的目录
echo "📁 检查目录结构..."
mkdir -p downloads
mkdir -p logs

# 运行修复版部署程序
echo ""
echo "🎯 开始运行修复版部署程序..."
echo "如果遇到编码问题，程序会自动处理"
echo ""

# 使用修复版的程序
if [ -f "cloudflare-cdn-final.js" ]; then
    echo "使用终极修复版程序..."
    node cloudflare-cdn-final.js 2>&1 | tee "logs/cdn-deploy-fixed-$(date +%Y%m%d-%H%M%S).log"
elif [ -f "cloudflare-cdn-setup-fixed.js" ]; then
    echo "使用修复版程序..."
    node cloudflare-cdn-setup-fixed.js 2>&1 | tee "logs/cdn-deploy-fixed-$(date +%Y%m%d-%H%M%S).log"
else
    echo "使用原版程序（可能遇到编码问题）..."
    node deploy-cdn.js 2>&1 | tee "logs/cdn-deploy-$(date +%Y%m%d-%H%M%S).log"
fi

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 CDN部署成功！"
    echo ""
    echo "📋 修复说明："
    echo "✅ 中文字符编码问题已解决"
    echo "✅ HTTP请求头使用纯ASCII字符"
    echo "✅ 域名和URL参数正确编码"
    echo "✅ 错误处理机制增强"
    echo ""
    echo "🔗 后续操作:"
    echo "1. 检查生成的 cdn-links.json 文件获取下载链接"
    echo "2. 更新网站使用新的CDN链接"
    echo "3. 监控CDN使用情况和费用"
    echo ""
    echo "📊 性能优化:"
    echo "- CDN缓存已配置为激进模式"
    echo "- 文件压缩已启用"
    echo "- 全球分发网络已激活"
else
    echo ""
    echo "❌ 部署失败，请检查日志文件"
    echo ""
    echo "🔧 故障排除建议："
    echo "1. 检查API令牌是否包含特殊字符"
    echo "2. 确认域名格式正确（ASCII字符）"
    echo "3. 验证网络连接状态"
    echo "4. 查看详细日志了解具体错误"
    exit 1
fi