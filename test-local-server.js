#!/usr/bin/env node
/**
 * GoldWord CDN下载页面本地测试服务器
 * 用于验证下载页面功能而无需部署到R2
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const HOST = 'localhost';

// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleString('zh-CN');
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        warning: '\x1b[33m',
        error: '\x1b[31m',
        reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`[${timestamp}] ${color}${message}${colors.reset}`);
}

// 模拟R2存储桶中的文件
const mockFiles = {
    '1.0.3': {
        'GoldWord-1.0.3.dmg': { size: 230290000, type: 'application/x-apple-diskimage' },
        'GoldWord-1.0.3-arm64.dmg': { size: 225960000, type: 'application/x-apple-diskimage' },
        'GoldWord-1.0.3.exe': { size: 8800000, type: 'application/x-msdownload' },
        'GoldWord-1.0.3-arm64.exe': { size: 8500000, type: 'application/x-msdownload' },
        'GoldWord-1.0.3.AppImage': { size: 15000000, type: 'application/x-executable' },
        'GoldWord-1.0.3-arm64.AppImage': { size: 14500000, type: 'application/x-executable' }
    },
    '1.0.2': {
        'GoldWord-1.0.2.dmg': { size: 12770000, type: 'application/x-apple-diskimage' },
        'GoldWord-1.0.2-arm64.dmg': { size: 12500000, type: 'application/x-apple-diskimage' },
        'GoldWord-1.0.2.exe': { size: 8800000, type: 'application/x-msdownload' },
        'GoldWord-1.0.2-arm64.exe': { size: 8500000, type: 'application/x-msdownload' },
        'GoldWord-1.0.2.AppImage': { size: 15000000, type: 'application/x-executable' },
        'GoldWord-1.0.2-arm64.AppImage': { size: 14500000, type: 'application/x-executable' }
    }
};

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取文件信息
function getFileInfo(version, filename) {
    return mockFiles[version]?.[filename] || null;
}

// 生成下载页面HTML
function generateDownloadPage() {
    const currentVersion = '1.0.3';
    const currentDate = new Date().toLocaleDateString('zh-CN');
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>GoldWord 下载中心 - CDN加速 (本地测试)</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 1000px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #2d3748;
            font-size: 2.5em;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .version-info {
            color: #718096;
            font-size: 1.1em;
            margin-bottom: 20px;
        }
        .cdn-notice {
            background: linear-gradient(135deg, #4299e1, #3182ce);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(66, 153, 225, 0.3);
        }
        .cdn-notice h3 {
            margin: 0 0 10px 0;
            font-size: 1.3em;
        }
        .download-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .download-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            border: 1px solid #e2e8f0;
        }
        .download-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .platform-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .platform-icon {
            font-size: 2em;
            margin-right: 15px;
        }
        .platform-title {
            font-size: 1.3em;
            font-weight: 600;
            color: #2d3748;
            margin: 0;
        }
        .file-info {
            color: #718096;
            font-size: 0.9em;
            margin-bottom: 20px;
        }
        .download-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .download-btn {
            flex: 1;
            min-width: 120px;
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            text-align: center;
            font-weight: 500;
            transition: all 0.3s ease;
            cursor: pointer;
            font-size: 0.9em;
        }
        .cdn-btn {
            background: linear-gradient(135deg, #4299e1, #3182ce);
            color: white;
        }
        .cdn-btn:hover {
            background: linear-gradient(135deg, #3182ce, #2b6cb0);
            transform: translateY(-2px);
        }
        .github-btn {
            background: #24292e;
            color: white;
        }
        .github-btn:hover {
            background: #1a1e22;
            transform: translateY(-2px);
        }
        .test-notice {
            background: #fed7d7;
            color: #c53030;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
            border: 1px solid #feb2b2;
        }
        .features {
            background: #f7fafc;
            padding: 25px;
            border-radius: 12px;
            margin-top: 30px;
        }
        .features h3 {
            color: #2d3748;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .feature-list li {
            padding: 8px 0;
            color: #4a5568;
        }
        .feature-list li:before {
            content: "✅";
            margin-right: 8px;
        }
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            .header h1 {
                font-size: 2em;
            }
            .download-grid {
                grid-template-columns: 1fr;
            }
            .download-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 GoldWord 下载中心</h1>
            <div class="version-info">当前版本: ${currentVersion} | 更新时间: ${currentDate}</div>
        </div>
        
        <div class="test-notice">
            <strong>🧪 本地测试模式</strong><br>
            此页面在本地服务器运行，用于测试下载功能。实际部署后将通过CDN加速。
        </div>
        
        <div class="cdn-notice">
            <h3>🌐 CDN全球加速</h3>
            <p>所有下载文件通过CloudFlare CDN全球加速，下载速度提升显著！</p>
        </div>
        
        <div class="download-grid">
            <div class="download-card">
                <div class="platform-header">
                    <div class="platform-icon">🍎</div>
                    <h3 class="platform-title">macOS</h3>
                </div>
                <div class="file-info">支持Intel和Apple Silicon处理器</div>
                <div class="download-buttons">
                    <a href="/1.0.3/GoldWord-1.0.3.dmg" class="download-btn cdn-btn">🚀 CDN下载</a>
                    <a href="https://github.com/zixiang2008/GoldWord/releases/download/v1.0.3/goldword-mac-1.0.3.dmg" class="download-btn github-btn" target="_blank">💾 GitHub</a>
                </div>
            </div>
            
            <div class="download-card">
                <div class="platform-header">
                    <div class="platform-icon">🪟</div>
                    <h3 class="platform-title">Windows</h3>
                </div>
                <div class="file-info">支持x64和ARM64架构</div>
                <div class="download-buttons">
                    <a href="/1.0.3/GoldWord-1.0.3.exe" class="download-btn cdn-btn">🚀 CDN下载</a>
                    <a href="https://github.com/zixiang2008/GoldWord/releases/download/v1.0.3/goldword-win-setup-1.0.3.exe" class="download-btn github-btn" target="_blank">💾 GitHub</a>
                </div>
            </div>
            
            <div class="download-card">
                <div class="platform-header">
                    <div class="platform-icon">🐧</div>
                    <h3 class="platform-title">Linux</h3>
                </div>
                <div class="file-info">AppImage格式，无需安装</div>
                <div class="download-buttons">
                    <a href="/1.0.3/GoldWord-1.0.3.AppImage" class="download-btn cdn-btn">🚀 CDN下载</a>
                    <a href="https://github.com/zixiang2008/GoldWord/releases/download/v1.0.3/GoldWord-1.0.3.AppImage" class="download-btn github-btn" target="_blank">💾 GitHub</a>
                </div>
            </div>
            
            <div class="download-card">
                <div class="platform-header">
                    <div class="platform-icon">🤖</div>
                    <h3 class="platform-title">Android</h3>
                </div>
                <div class="file-info">支持手机和平板设备</div>
                <div class="download-buttons">
                    <a href="/1.0.3/goldword-android-phone-1.0.3.apk" class="download-btn cdn-btn">📱 手机版</a>
                    <a href="/1.0.3/goldword-android-pad-1.0.3.apk" class="download-btn cdn-btn">📱 平板版</a>
                </div>
            </div>
        </div>
        
        <div class="features">
            <h3>✨ 功能特色</h3>
            <ul class="feature-list">
                <li>全球CDN加速，下载更快</li>
                <li>双下载选项，稳定可靠</li>
                <li>响应式设计，完美适配</li>
                <li>文件信息透明展示</li>
                <li>智能平台识别</li>
                <li>安装指引详细</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
}

// 处理下载请求
function handleDownload(req, res, version, filename) {
    const fileInfo = getFileInfo(version, filename);
    
    if (!fileInfo) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('文件未找到');
        return;
    }
    
    log(`📥 模拟下载: ${version}/${filename} (${formatFileSize(fileInfo.size)})`, 'info');
    
    // 模拟文件下载响应
    res.writeHead(200, {
        'Content-Type': fileInfo.type,
        'Content-Length': fileInfo.size,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
    });
    
    // 模拟文件内容（实际环境中这里会传输真实文件）
    const mockContent = Buffer.alloc(Math.min(fileInfo.size, 1024), 0x42); // 1KB模拟数据
    res.end(mockContent);
}

// 创建服务器
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    log(`📡 收到请求: ${req.method} ${pathname}`, 'info');
    
    // 处理根路径和下载页面
    if (pathname === '/' || pathname === '/app-cdn.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(generateDownloadPage());
        return;
    }
    
    // 处理下载请求
    const downloadMatch = pathname.match(/^\/(1\.0\.[23])\/(.+)$/);
    if (downloadMatch && req.method === 'GET') {
        const version = downloadMatch[1];
        const filename = downloadMatch[2];
        handleDownload(req, res, version, filename);
        return;
    }
    
    // 处理重定向到GitHub
    if (pathname.startsWith('/github/')) {
        const githubPath = pathname.replace('/github/', '');
        const githubUrl = `https://github.com/zixiang2008/GoldWord/releases/download/${githubPath}`;
        res.writeHead(302, { 'Location': githubUrl });
        res.end();
        return;
    }
    
    // 404处理
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>404 - 页面未找到</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error-code { font-size: 72px; color: #e53e3e; margin-bottom: 20px; }
        .error-message { font-size: 24px; color: #4a5568; margin-bottom: 30px; }
        .back-link { color: #3182ce; text-decoration: none; font-size: 18px; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="error-code">404</div>
    <div class="error-message">页面未找到</div>
    <a href="/" class="back-link">返回下载页面</a>
</body>
</html>
    `);
});

// 启动服务器
server.listen(PORT, HOST, () => {
    log('🚀 GoldWord CDN下载页面本地测试服务器已启动', 'success');
    log(`📡 服务器地址: http://${HOST}:${PORT}`, 'info');
    log(`🌐 下载页面: http://${HOST}:${PORT}/app-cdn.html`, 'info');
    log(`📁 模拟文件路径:`, 'info');
    log(`   - http://${HOST}:${PORT}/1.0.3/GoldWord-1.0.3.dmg`, 'info');
    log(`   - http://${HOST}:${PORT}/1.0.3/GoldWord-1.0.3.exe`, 'info');
    log(`   - http://${HOST}:${PORT}/1.0.2/GoldWord-1.0.2.dmg`, 'info');
    log('', 'info');
    log('💡 提示: 这是一个本地测试服务器，用于验证下载页面功能', 'warning');
    log('   实际部署后，文件将通过CloudFlare CDN加速提供', 'warning');
    log('   按 Ctrl+C 停止服务器', 'warning');
});

// 优雅关闭
process.on('SIGINT', () => {
    log('\n🛑 正在关闭服务器...', 'warning');
    server.close(() => {
        log('✅ 服务器已关闭', 'success');
        process.exit(0);
    });
});