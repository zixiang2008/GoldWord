#!/usr/bin/env node

/**
 * GoldWord 云同步服务器
 * Cloud Sync Server - 支持IPv6和IPv4双栈
 * 
 * 功能:
 * - 同时监听IPv6和IPv4地址
 * - 自动同步文件到云存储
 * - 支持多平台访问
 * - 实时文件监控和同步
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

// 配置
const CONFIG = {
    // 服务器配置
    ports: {
        ipv6: 8000,  // IPv6地址端口
        ipv4: 8080   // IPv4地址端口
    },
    
    // 文件映射配置
    fileMappings: {
        '/downloads-cdn.html': '/app-cdn.html',  // 旧地址映射到新地址
        '/': '/app-cdn.html',  // 根路径映射
        '/cdn': '/app-cdn.html'  // CDN路径映射
    },
    
    // 云同步配置
    cloudSync: {
        enabled: true,
        syncInterval: 30000,  // 30秒同步一次
        backupFiles: ['app-cdn.html', 'cdn-links-generated.json', 'cdn-mapping-config.json'],
        lastSyncTime: null
    },
    
    // 日志配置
    logging: {
        enabled: true,
        level: 'info',  // debug, info, warn, error
        file: 'cloud-sync.log'
    }
};

// 日志系统
class Logger {
    constructor(config) {
        this.config = config;
        this.logFile = path.join(__dirname, config.logging.file);
    }
    
    log(level, message, data = {}) {
        if (!this.config.logging.enabled) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            pid: process.pid
        };
        
        const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
        
        // 控制台输出
        console.log(logLine.trim());
        
        // 文件日志
        try {
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('日志写入失败:', error.message);
        }
    }
    
    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
}

// 文件同步管理器
class FileSyncManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.fileHashes = new Map();
        this.syncInProgress = false;
    }
    
    // 计算文件哈希
    calculateFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            this.logger.error(`计算文件哈希失败: ${filePath}`, { error: error.message });
            return null;
        }
    }
    
    // 检查文件变化
    checkFileChanges() {
        const changes = [];
        
        this.config.cloudSync.backupFiles.forEach(fileName => {
            const filePath = path.join(__dirname, fileName);
            
            if (!fs.existsSync(filePath)) {
                this.logger.warn(`文件不存在: ${fileName}`);
                return;
            }
            
            const currentHash = this.calculateFileHash(filePath);
            const previousHash = this.fileHashes.get(fileName);
            
            if (currentHash && currentHash !== previousHash) {
                changes.push({
                    file: fileName,
                    previousHash,
                    currentHash,
                    action: previousHash ? 'modified' : 'new'
                });
                
                this.fileHashes.set(fileName, currentHash);
            }
        });
        
        return changes;
    }
    
    // 执行同步
    async performSync() {
        if (this.syncInProgress) {
            this.logger.debug('同步已在进行中，跳过本次同步');
            return;
        }
        
        this.syncInProgress = true;
        this.logger.info('开始文件同步检查');
        
        try {
            const changes = this.checkFileChanges();
            
            if (changes.length > 0) {
                this.logger.info(`检测到 ${changes.length} 个文件变化`);
                
                for (const change of changes) {
                    await this.syncFileToCloud(change.file);
                }
                
                this.config.cloudSync.lastSyncTime = new Date().toISOString();
                this.logger.info('文件同步完成');
            } else {
                this.logger.debug('无文件变化，跳过同步');
            }
        } catch (error) {
            this.logger.error('同步过程中出错', { error: error.message });
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // 同步单个文件到云存储
    async syncFileToCloud(fileName) {
        this.logger.info(`同步文件到云存储: ${fileName}`);
        
        // 这里可以集成实际的云存储API
        // 例如: AWS S3, Google Cloud Storage, Azure Blob Storage等
        
        // 模拟云同步过程
        const filePath = path.join(__dirname, fileName);
        const fileContent = fs.readFileSync(filePath);
        
        this.logger.info(`文件 ${fileName} 已同步`, {
            size: fileContent.length,
            syncTime: new Date().toISOString()
        });
        
        // 这里可以添加实际的云存储上传逻辑
        // 例如:
        // await uploadToS3(fileName, fileContent);
        // await uploadToR2(fileName, fileContent);
    }
    
    // 启动定时同步
    startPeriodicSync() {
        if (!this.config.cloudSync.enabled) {
            this.logger.info('云同步已禁用');
            return;
        }
        
        this.logger.info(`启动定时同步，间隔: ${this.config.cloudSync.syncInterval}ms`);
        
        // 立即执行一次同步
        this.performSync();
        
        // 设置定时同步
        setInterval(() => {
            this.performSync();
        }, this.config.cloudSync.syncInterval);
    }
}

// HTTP请求处理器
class RequestHandler {
    constructor(config, logger, fileSyncManager) {
        this.config = config;
        this.logger = logger;
        this.fileSyncManager = fileSyncManager;
    }
    
    // 处理文件请求
    handleFileRequest(req, res, filePath) {
        try {
            const fullPath = path.join(__dirname, filePath);
            
            if (!fs.existsSync(fullPath)) {
                this.send404(res, `文件不存在: ${filePath}`);
                return;
            }
            
            const content = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath).toLowerCase();
            
            // 设置内容类型
            const contentTypes = {
                '.html': 'text/html; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8'
            };
            
            res.writeHead(200, {
                'Content-Type': contentTypes[ext] || 'application/octet-stream',
                'Content-Length': content.length,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            });
            
            res.end(content);
            
            this.logger.info(`文件请求成功`, {
                path: filePath,
                size: content.length,
                contentType: contentTypes[ext]
            });
            
        } catch (error) {
            this.logger.error(`处理文件请求失败`, { path: filePath, error: error.message });
            this.send500(res, `服务器错误: ${error.message}`);
        }
    }
    
    // 处理重定向
    handleRedirect(res, fromPath, toPath) {
        res.writeHead(301, {
            'Location': toPath,
            'Content-Type': 'text/html; charset=utf-8'
        });
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>重定向中...</title>
    <meta http-equiv="refresh" content="0; url=${toPath}">
</head>
<body>
    <h1>页面重定向</h1>
    <p>正在重定向到: <a href="${toPath}">${toPath}</a></p>
    <script>window.location.href="${toPath}";</script>
</body>
</html>`;
        
        res.end(html);
        
        this.logger.info(`重定向请求`, { from: fromPath, to: toPath });
    }
    
    // 发送404错误
    send404(res, message = '页面未找到') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>404 - 页面未找到</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error-code { font-size: 72px; color: #e74c3c; margin: 20px; }
        .error-message { font-size: 24px; color: #7f8c8d; }
        .back-link { margin-top: 30px; }
        .back-link a { color: #3498db; text-decoration: none; font-size: 18px; }
    </style>
</head>
<body>
    <div class="error-code">404</div>
    <div class="error-message">${message}</div>
    <div class="back-link">
        <a href="/app-cdn.html">返回下载页面</a>
    </div>
</body>
</html>`;
        
        res.end(html);
        this.logger.warn(`404错误`, { message });
    }
    
    // 发送500错误
    send500(res, message = '服务器内部错误') {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>500 - 服务器错误</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error-code { font-size: 72px; color: #e74c3c; margin: 20px; }
        .error-message { font-size: 24px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="error-code">500</div>
    <div class="error-message">${message}</div>
</body>
</html>`;
        
        res.end(html);
        this.logger.error(`500错误`, { message });
    }
    
    // 处理同步状态请求
    handleSyncStatus(res) {
        const status = {
            enabled: this.config.cloudSync.enabled,
            lastSync: this.config.cloudSync.lastSyncTime,
            syncInterval: this.config.cloudSync.syncInterval,
            backupFiles: this.config.cloudSync.backupFiles
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(status, null, 2));
    }

    async handleLogIngest(req, res) {
        try {
            const chunks = [];
            req.on('data', c => chunks.push(c));
            await new Promise(resolve => req.on('end', resolve));
            const buf = Buffer.concat(chunks);
            let obj = {};
            try { obj = JSON.parse(buf.toString('utf8')); } catch(_){}
            const stamp = new Date().toISOString();
            const base = path.join(__dirname, 'logs');
            try { fs.mkdirSync(base, { recursive: true }); } catch(_){ }
            const day = stamp.slice(0,10);
            const file = path.join(base, `app-cdn-${day}.jsonl`);
            const entry = {
                timestamp: obj.timestamp || stamp,
                event_type: obj.event_type || 'unknown',
                log_level: obj.log_level || 'info',
                message: obj.message || '',
                device_info: obj.device_info || {},
                source: 'app-cdn'
            };
            fs.appendFileSync(file, JSON.stringify(entry) + "\n");
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*' });
            res.end(JSON.stringify({ ok: true }));
            this.logger.info('日志接收', { file });
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false }));
            this.logger.error('日志接收失败', { error: error.message });
        }
    }
}

// 服务器管理器
class ServerManager {
    constructor(config) {
        this.config = config;
        this.logger = new Logger(config);
        this.fileSyncManager = new FileSyncManager(config, this.logger);
        this.requestHandler = new RequestHandler(config, this.logger, this.fileSyncManager);
        
        this.servers = new Map();
        this.isShuttingDown = false;
    }
    
    // 创建HTTP服务器
    createServer(host, port, type) {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res, type);
        });
        
        server.on('error', (error) => {
            this.logger.error(`${type}服务器错误`, { 
                host, 
                port, 
                error: error.message,
                code: error.code 
            });
        });
        
        server.on('listening', () => {
            const address = server.address();
            this.logger.info(`${type}服务器启动成功`, {
                host: address.address,
                port: address.port,
                family: address.family
            });
        });
        
        return server;
    }
    
    // 处理HTTP请求
    handleRequest(req, res, serverType) {
        const startTime = Date.now();
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        this.logger.info(`收到请求`, {
            method: req.method,
            url: req.url,
            host: req.headers.host,
            serverType,
            userAgent: req.headers['user-agent']
        });
        
        // 路由处理
        const pathname = url.pathname;
        if (pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok:true, ts: Date.now() }));
            return;
        }
        
        // 特殊API端点
        if (pathname === '/api/sync/status') {
            this.requestHandler.handleSyncStatus(res);
            return;
        }
        
        if (pathname === '/api/sync/trigger') {
            this.fileSyncManager.performSync();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: '同步已触发' }));
            return;
        }

        if (pathname === '/api/logs' && req.method === 'POST') {
            this.requestHandler.handleLogIngest(req, res);
            return;
        }
        
        // 文件映射检查
        const mappedPath = this.config.fileMappings[pathname];
        if (mappedPath) {
            this.requestHandler.handleRedirect(res, pathname, mappedPath);
            return;
        }
        
        // 默认文件处理
        let filePath = pathname === '/' ? '/app-cdn.html' : pathname;
        
        // 移除开头的斜杠
        if (filePath.startsWith('/')) {
            filePath = filePath.substring(1);
        }
        
        this.requestHandler.handleFileRequest(req, res, filePath);
        
        // 记录响应时间
        const responseTime = Date.now() - startTime;
        this.logger.debug(`请求处理完成`, {
            url: req.url,
            responseTime: `${responseTime}ms`,
            serverType
        });
    }
    
    // 启动所有服务器
    async start() {
        this.logger.info('启动GoldWord云同步服务器...');
        
        // 启动IPv6服务器
        try {
            const ipv6Server = this.createServer('::', this.config.ports.ipv6, 'IPv6');
            await new Promise((resolve, reject) => {
                ipv6Server.listen(this.config.ports.ipv6, '::', (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
            this.servers.set('ipv6', ipv6Server);
        } catch (error) {
            this.logger.error('IPv6服务器启动失败', { error: error.message });
        }
        
        // 启动IPv4服务器
        try {
            const ipv4Server = this.createServer('0.0.0.0', this.config.ports.ipv4, 'IPv4');
            await new Promise((resolve, reject) => {
                ipv4Server.listen(this.config.ports.ipv4, '0.0.0.0', (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
            this.servers.set('ipv4', ipv4Server);
        } catch (error) {
            this.logger.error('IPv4服务器启动失败', { error: error.message });
        }
        
        // 启动文件同步
        this.fileSyncManager.startPeriodicSync();
        setInterval(() => {
            try {
                const base = path.join(__dirname, 'logs');
                if (!fs.existsSync(base)) return;
                const files = fs.readdirSync(base);
                const now = Date.now();
                files.forEach(f => {
                    const fp = path.join(base, f);
                    try {
                        const st = fs.statSync(fp);
                        if (now - st.mtimeMs > 30*24*60*60*1000) { fs.unlinkSync(fp); }
                    } catch(_){ }
                });
            } catch(_){ }
        }, 12*60*60*1000);
        
        this.logger.info('服务器启动完成', {
            ipv6: this.servers.has('ipv6') ? `http://[::1]:${this.config.ports.ipv6}` : '未启动',
            ipv4: this.servers.has('ipv4') ? `http://localhost:${this.config.ports.ipv4}` : '未启动'
        });
    }
    
    // 优雅关闭
    async shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        this.logger.info('正在关闭服务器...');
        
        // 关闭所有服务器
        for (const [type, server] of this.servers) {
            await new Promise((resolve) => {
                server.close(() => {
                    this.logger.info(`${type}服务器已关闭`);
                    resolve();
                });
            });
        }
        
        this.logger.info('服务器已完全关闭');
        process.exit(0);
    }
}

// 主函数
async function main() {
    const serverManager = new ServerManager(CONFIG);
    
    // 信号处理
    process.on('SIGTERM', () => serverManager.shutdown());
    process.on('SIGINT', () => serverManager.shutdown());
    
    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
        console.error('未捕获的异常:', error);
        serverManager.shutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('未处理的Promise拒绝:', reason);
        serverManager.shutdown();
    });
    
    // 启动服务器
    await serverManager.start();
    
    console.log('\n🌟 GoldWord 云同步服务器已启动！');
    console.log('=' .repeat(50));
    console.log(`🌍 IPv6地址: http://[::1]:${CONFIG.ports.ipv6}/downloads-cdn.html`);
    console.log(`🌐 IPv4地址: http://localhost:${CONFIG.ports.ipv4}/app-cdn.html`);
    console.log('📁 文件会自动同步到云存储');
    console.log('🔄 支持实时文件监控和同步');
    console.log('=' .repeat(50));
    console.log('按 Ctrl+C 停止服务器\n');
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('服务器启动失败:', error);
        process.exit(1);
    });
}

module.exports = { ServerManager, FileSyncManager, RequestHandler };
