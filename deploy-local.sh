#!/bin/bash

echo "🚀 GoldWord-V1 本地部署脚本"
echo "=================================="

# 检查端口是否被占用
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ 端口 $PORT 已被占用，尝试端口 8081..."
    PORT=8081
fi

# 创建部署目录
DEPLOY_DIR="deploy-public"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "📁 创建部署目录..."
    mkdir -p "$DEPLOY_DIR"
fi

# 复制核心文件
echo "📂 复制项目文件..."
cp index.html app.js ui.js db.js storage.js word-enhancement-service.js word-schema.js built-in-models.js eight-dimensional-memory.css eight-dimensional-memory.js manifest.json service-worker.js "$DEPLOY_DIR/"
cp -r icons/ "$DEPLOY_DIR/"
cp github-downloads.html easy-download.html "$DEPLOY_DIR/"
cp language-system/language-system-complete-updated.js "$DEPLOY_DIR/"

# 创建简单的HTTP服务器
echo "🔧 启动本地服务器..."
cd "$DEPLOY_DIR"

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    echo "✅ 使用Python3启动服务器"
    python3 -m http.server $PORT &
    SERVER_PID=$!
elif command -v python &> /dev/null; then
    echo "✅ 使用Python2启动服务器"
    python -m SimpleHTTPServer $PORT &
    SERVER_PID=$!
elif command -v node &> /dev/null; then
    echo "✅ 使用Node.js启动服务器"
    npx http-server -p $PORT -o &
    SERVER_PID=$!
else
    echo "❌ 没有找到可用的HTTP服务器，请安装Python或Node.js"
    exit 1
fi

echo ""
echo "🎉 部署成功！"
echo "=============="
echo "📱 主应用: http://localhost:$PORT/index.html"
echo "📥 下载页面: http://localhost:$PORT/github-downloads.html"
echo "🔗 简单下载: http://localhost:$PORT/easy-download.html"
echo ""
echo "⚡ 服务器进程ID: $SERVER_PID"
echo "🛑 停止服务器: kill $SERVER_PID"
echo ""
echo "按 Ctrl+C 停止服务器"