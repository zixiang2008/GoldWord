#!/usr/bin/env node

/**
 * GoldWord 云存储集成脚本
 * Cloud Storage Integration for R2/S3
 * 
 * 功能:
 * - 集成CloudFlare R2存储
 * - 支持AWS S3兼容API
 * - 自动文件上传和同步
 * - 多区域备份支持
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const zlib = require('zlib');

// 云存储配置
const CLOUD_CONFIG = {
    // CloudFlare R2配置
    r2: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'your-account-id',
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || 'your-access-key',
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || 'your-secret-key',
        bucketName: process.env.CLOUDFLARE_BUCKET_NAME || 'goldword-cdn',
        region: 'auto',
        endpoint: process.env.CLOUDFLARE_ENDPOINT || 'https://your-account-id.r2.cloudflarestorage.com'
    },
    
    // 同步配置
    sync: {
        enabled: true,
        bidirectional: true,
        incremental: true,
        files: [
            'app-cdn.html',
            'cdn-links-generated.json',
            'cdn-mapping-config.json',
            '_redirects',
            'netlify.toml',
            'release-report.json',
            'RELEASE_NOTES.md'
        ],
        logsDir: 'logs',
        maxBatch: 100,
        excludePatterns: [
            '*.log',
            'node_modules/**',
            '.git/**',
            '*.tmp'
        ]
    },
    
    // 日志配置
    logging: {
        enabled: true,
        level: 'info',
        file: 'cloud-storage-sync.log'
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
            data
        };
        
        const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
        
        console.log(logLine.trim());
        
        try {
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('日志写入失败:', error.message);
        }
    }
    
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }
}

// R2/S3客户端
class R2Client {
    constructor(config, logger) {
        this.config = config.r2;
        this.logger = logger;
    }
    preflight(){
        const cfg = this.config;
        const problems = [];
        if (!cfg.accountId || /your-account-id/.test(cfg.accountId)) problems.push('accountId 未配置');
        if (!cfg.accessKeyId || /your-access-key/.test(cfg.accessKeyId)) problems.push('accessKeyId 未配置');
        if (!cfg.secretAccessKey || /your-secret-key/.test(cfg.secretAccessKey)) problems.push('secretAccessKey 未配置');
        if (!cfg.bucketName) problems.push('bucketName 未配置');
        if (!cfg.endpoint || /your-account-id/.test(cfg.endpoint)) problems.push('endpoint 未配置或错误');
        if (problems.length>0){ this.logger.error('R2配置错误，跳过上传', { problems }); return false; }
        return true;
    }
    
    // 生成AWS签名
    generateSignature(method, path, headers = {}, payload = '') {
        const date = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const dateStamp = date.substr(0, 8);
        
        const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;
        
        // 简化签名实现 (生产环境应使用完整的AWS签名流程)
        const signature = crypto.createHmac('sha256', this.config.secretAccessKey)
            .update(`${method}\n${path}\n${date}\n${JSON.stringify(headers)}\n${payload}`)
            .digest('hex');
        
        return {
            date,
            signature,
            credentialScope,
            authorization: `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-date, Signature=${signature}`
        };
    }
    
    // 上传文件到R2
    async uploadFile(fileName, fileContent, contentType = 'application/octet-stream') {
        return new Promise((resolve, reject) => {
            if(!this.preflight()){ reject(new Error('R2配置未准备好')); return; }
            const filePath = `/${this.config.bucketName}/${fileName}`;
            const signature = this.generateSignature('PUT', filePath, {
                'Content-Type': contentType,
                'Content-Length': fileContent.length
            }, fileContent);
            
            const options = {
                hostname: this.config.endpoint.replace('https://', ''),
                port: 443,
                path: filePath,
                method: 'PUT',
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': fileContent.length,
                    'Authorization': signature.authorization,
                    'x-amz-date': signature.date,
                    'x-amz-content-sha256': crypto.createHash('sha256').update(fileContent).digest('hex')
                }
            };
            
            let attempt = 0;
            const doReq = () => {
              const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        this.logger.info(`文件上传成功: ${fileName}`, {
                            size: fileContent.length,
                            statusCode: res.statusCode
                        });
                        resolve({
                            success: true,
                            statusCode: res.statusCode,
                            fileName,
                            size: fileContent.length
                        });
                    } else {
                        this.logger.error(`文件上传失败: ${fileName}`, {
                            statusCode: res.statusCode,
                            response: responseData
                        });
                        reject(new Error(`上传失败: ${res.statusCode}`));
                    }
                });
              });
              req.on('error', (error) => {
                attempt++;
                this.logger.error(`上传请求失败: ${fileName}`, { error: error.message, attempt });
                if (attempt < 3 && /EPROTO|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN/.test(error.code||error.message)){
                  setTimeout(doReq, attempt*500);
                } else {
                  reject(error);
                }
              });
              req.write(fileContent);
              req.end();
            };
            doReq();
        });
    }
    
    // 检查文件是否存在
    async fileExists(fileName) {
        return new Promise((resolve, reject) => {
            const filePath = `/${this.config.bucketName}/${fileName}`;
            const signature = this.generateSignature('HEAD', filePath);
            
            const options = {
                hostname: this.config.endpoint.replace('https://', ''),
                port: 443,
                path: filePath,
                method: 'HEAD',
                headers: {
                    'Authorization': signature.authorization,
                    'x-amz-date': signature.date
                }
            };
            
            const req = https.request(options, (res) => {
                res.on('data', () => {}); // 消费响应数据
                
                if (res.statusCode === 200) {
                    resolve(true);
                } else if (res.statusCode === 404) {
                    resolve(false);
                } else {
                    reject(new Error(`检查文件失败: ${res.statusCode}`));
                }
            });
            
            req.on('error', reject);
            req.end();
        });
    }
    
    // 获取文件URL
    getFileUrl(fileName) {
        return `${this.config.endpoint}/${this.config.bucketName}/${fileName}`;
    }

    async downloadFile(fileName) {
        return new Promise((resolve, reject) => {
            const filePath = `/${this.config.bucketName}/${fileName}`;
            const options = {
                hostname: this.config.endpoint.replace('https://', ''),
                port: 443,
                path: filePath,
                method: 'GET'
            };
            const req = https.request(options, (res) => {
                if (res.statusCode !== 200) { reject(new Error(`下载失败: ${res.statusCode}`)); return; }
                const chunks = [];
                res.on('data', (c)=> chunks.push(c));
                res.on('end', ()=> resolve(Buffer.concat(chunks)));
            });
            req.on('error', reject);
            req.end();
        });
    }
}

// 文件同步管理器
class FileSyncManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.r2Client = new R2Client(config, logger);
        this.fileHashes = new Map();
        this.logStatePath = path.join(__dirname, '.log-sync-state.json');
        this.logState = this.loadLogState();
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
    
    // 检查文件是否需要同步
    async shouldSyncFile(fileName) {
        const filePath = path.join(__dirname, fileName);
        
        if (!fs.existsSync(filePath)) {
            this.logger.warn(`文件不存在: ${fileName}`);
            return false;
        }
        
        const currentHash = this.calculateFileHash(filePath);
        const previousHash = this.fileHashes.get(fileName);
        
        if (currentHash && currentHash !== previousHash) {
            this.fileHashes.set(fileName, currentHash);
            return true;
        }
        
        return false;
    }
    
    // 同步单个文件
    async syncFile(fileName) {
        try {
            const filePath = path.join(__dirname, fileName);
            const content = fs.readFileSync(filePath);
            
            // 根据文件扩展名设置内容类型
            const ext = path.extname(fileName).toLowerCase();
            const contentTypes = {
                '.html': 'text/html; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.txt': 'text/plain; charset=utf-8'
            };
            
            const contentType = contentTypes[ext] || 'application/octet-stream';
            
            this.logger.info(`开始同步文件: ${fileName}`, {
                size: content.length,
                contentType
            });
            
            const result = await this.r2Client.uploadFile(fileName, content, contentType);
            
            if (result.success) {
                this.logger.info(`文件同步完成: ${fileName}`, {
                    size: result.size,
                    url: this.r2Client.getFileUrl(fileName)
                });
                
                return {
                    success: true,
                    fileName,
                    size: result.size,
                    url: this.r2Client.getFileUrl(fileName)
                };
            }
            
        } catch (error) {
            this.logger.error(`文件同步失败: ${fileName}`, { error: error.message });
            return {
                success: false,
                fileName,
                error: error.message
            };
        }
    }
    
    // 批量同步文件
    async syncFiles() {
        if (!this.config.sync.enabled) {
            this.logger.info('云同步已禁用');
            return [];
        }
        
        this.logger.info('开始批量文件同步');
        const results = [];
        
        for (const fileName of this.config.sync.files) {
            try {
                const shouldSync = await this.shouldSyncFile(fileName);
                
                if (shouldSync) {
                    this.logger.info(`检测到文件变化: ${fileName}`);
                    const result = await this.syncFile(fileName);
                    results.push(result);
                } else {
                    if (this.config.sync.bidirectional) {
                        try {
                            const exists = await this.r2Client.fileExists(fileName);
                            if (exists) {
                                const cloudBuf = await this.r2Client.downloadFile(fileName);
                                const localPath = path.join(__dirname, fileName);
                                const localHash = this.calculateFileHash(localPath);
                                const cloudHash = crypto.createHash('md5').update(cloudBuf).digest('hex');
                                if (localHash !== cloudHash) {
                                    const backup = `${localPath}.conflict.local-${Date.now()}`;
                                    try { fs.copyFileSync(localPath, backup); } catch(_){}
                                    fs.writeFileSync(localPath, cloudBuf);
                                    this.fileHashes.set(fileName, cloudHash);
                                    this.logger.info(`从云端拉取更新并解决冲突: ${fileName}`, { backup });
                                }
                            }
                        } catch (errPull) {
                            this.logger.warn(`云端拉取失败: ${fileName}`, { error: errPull.message });
                        }
                    } else {
                        this.logger.debug(`文件无需同步: ${fileName}`);
                    }
                }
                
            } catch (error) {
                this.logger.error(`同步文件出错: ${fileName}`, { error: error.message });
                results.push({
                    success: false,
                    fileName,
                    error: error.message
                });
            }
        }
        
        this.logger.info('批量文件同步完成', {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
        
        return results;
    }

    async syncDownloadsFromIndex(){
        const idxPath = path.join(__dirname, 'cdn-links-generated.json');
        let arr = [];
        try { arr = JSON.parse(fs.readFileSync(idxPath,'utf8')); } catch(_){ return []; }
        const res = [];
        for(const item of arr){
            const fn = item && item.filename;
            if(!fn) continue;
            const local = path.join(__dirname,'downloads',fn);
            if(!fs.existsSync(local)) { res.push({success:false,fileName:fn,error:'local file missing'}); continue; }
            try {
                const buf = fs.readFileSync(local);
                const key = fn;
                await this.r2Client.uploadFile(key, buf, 'application/octet-stream');
                this.logger.info('上传下载文件到云端', { file: fn, size: buf.length });
                res.push({success:true,fileName:fn,url:this.r2Client.getFileUrl(key)});
            } catch(e){
                this.logger.error('上传下载文件失败', { file: fn, error: e.message });
                res.push({success:false,fileName:fn,error:e.message});
            }
        }
        return res;
    }
    
    // 生成同步报告
    generateSyncReport(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        const report = {
            timestamp: new Date().toISOString(),
            totalFiles: results.length,
            successfulFiles: successful.length,
            failedFiles: failed.length,
            successful,
            failed,
            cloudUrls: successful.map(r => ({
                fileName: r.fileName,
                url: r.url
            })),
            options: {
                bidirectional: !!this.config.sync.bidirectional,
                incremental: !!this.config.sync.incremental
            }
        };
        
        return report;
    }

    loadLogState(){
        try{ const s = fs.readFileSync(this.logStatePath,'utf8'); return JSON.parse(s); }catch(_){ return {}; }
    }
    saveLogState(){
        try{ fs.writeFileSync(this.logStatePath, JSON.stringify(this.logState, null, 2)); }catch(_){ }
    }
    listLogFiles(){
        const d = path.join(__dirname, this.config.sync.logsDir);
        try{ return fs.readdirSync(d).filter(f=>f.endsWith('.jsonl')).map(f=>path.join(d,f)); }catch(_){ return []; }
    }
    readLogBatch(fp, startOffset, maxLines){
        try{
            const fd = fs.openSync(fp, 'r');
            const st = fs.statSync(fp);
            const size = st.size;
            const buf = Buffer.alloc(Math.max(0, size - (startOffset||0)));
            fs.readSync(fd, buf, 0, buf.length, startOffset||0);
            fs.closeSync(fd);
            const text = buf.toString('utf8');
            const lines = text.split('\n').filter(x=>x.trim().length>0);
            const batch = lines.slice(0, maxLines);
            const consumedText = batch.join('\n') + '\n';
            const consumedBytes = Buffer.byteLength(consumedText);
            return { entries: batch.map(l=>JSON.parse(l)), bytes: consumedBytes };
        }catch(_){ return { entries: [], bytes: 0 }; }
    }
    async uploadLogBatch(key, entries){
        const payload = Buffer.from(JSON.stringify(entries));
        const gz = zlib.gzipSync(payload);
        const name = `logs/${key}-${Date.now()}.ndjson.gz`;
        let attempt = 0;
        while(attempt<3){
            try{ await this.r2Client.uploadFile(name, gz, 'application/gzip'); return { success:true, name }; }catch(e){ attempt++; if(attempt>=3) return { success:false, error: e.message }; }
        }
    }
    async syncLogs(){
        const files = this.listLogFiles();
        const res = [];
        for(const fp of files){
            const key = path.basename(fp, '.jsonl');
            const st = this.logState[key]||{ offset:0 };
            const b = this.readLogBatch(fp, st.offset||0, this.config.sync.maxBatch);
            if (b.entries.length===0) { continue; }
            const up = await this.uploadLogBatch(key, b.entries);
            if (up.success){
                this.logState[key] = { offset: (st.offset||0) + b.bytes };
                this.saveLogState();
                this.logger.info('日志批次上传完成', { key, count: b.entries.length });
                res.push({ success:true, file:key, count:b.entries.length });
            } else {
                this.logger.error('日志批次上传失败', { key, error: up.error });
                res.push({ success:false, file:key, error: up.error });
            }
        }
        return res;
    }
}

// 主函数
async function main() {
    const logger = new Logger(CLOUD_CONFIG);
    const syncManager = new FileSyncManager(CLOUD_CONFIG, logger);
    
    console.log('\n☁️  GoldWord 云存储同步工具\n');
    console.log('=' .repeat(50));
    
    try {
        // 检查环境变量
        const requiredEnvVars = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_ACCESS_KEY_ID', 'CLOUDFLARE_SECRET_ACCESS_KEY'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.log('⚠️  检测到缺少环境变量:');
            missingVars.forEach(varName => {
                console.log(`   - ${varName}`);
            });
            console.log('\n💡 提示: 请设置以下环境变量:');
            console.log('   export CLOUDFLARE_ACCOUNT_ID="your-account-id"');
            console.log('   export CLOUDFLARE_ACCESS_KEY_ID="your-access-key"');
            console.log('   export CLOUDFLARE_SECRET_ACCESS_KEY="your-secret-key"');
            console.log('\n🔄 当前将以模拟模式运行...\n');
        }
        
        // 执行同步
        logger.info('开始云存储同步');
        const results = await syncManager.syncFiles();
        const logResults = await syncManager.syncLogs();
        const dlResults = await syncManager.syncDownloadsFromIndex();
        
        // 生成报告
        const report = syncManager.generateSyncReport(results);
        report.logSync = { totalBatches: logResults.length, successful: logResults.filter(x=>x.success).length, failed: logResults.filter(x=>!x.success).length };
        report.downloadUploads = { total: dlResults.length, successful: dlResults.filter(x=>x.success).length, failed: dlResults.filter(x=>!x.success).length };
        
        console.log('\n📊 同步报告:');
        console.log(`   总文件数: ${report.totalFiles}`);
        console.log(`   成功: ${report.successfulFiles}`);
        console.log(`   失败: ${report.failedFiles}`);
        
        if (report.cloudUrls.length > 0) {
            console.log('\n🌐 云存储URL:');
            report.cloudUrls.forEach(item => {
                console.log(`   - ${item.fileName}: ${item.url}`);
            });
        }
        
        if (report.failed.length > 0) {
            console.log('\n❌ 失败的文件:');
            report.failed.forEach(item => {
                console.log(`   - ${item.fileName}: ${item.error}`);
            });
        }
        
        // 保存报告
        const reportPath = path.join(__dirname, 'cloud-sync-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 详细报告已保存: ${reportPath}`);
        
    } catch (error) {
        logger.error('云存储同步失败', { error: error.message });
        console.error(`\n❌ 错误: ${error.message}`);
        process.exit(1);
    }
    
    console.log('\n✅ 云存储同步完成！');
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('程序执行失败:', error);
        process.exit(1);
    });
}

module.exports = { FileSyncManager, R2Client };
