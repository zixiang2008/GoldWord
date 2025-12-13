#!/usr/bin/env node

/**
 * GoldWord 云同步管理器
 * Cloud Sync Manager - 完整版
 * 
 * 功能:
 * - 文件同步状态监控
 * - 手动/自动同步控制
 * - 云存储集成管理
 * - 同步报告生成
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    // 同步文件列表
    syncFiles: [
        'app-cdn.html',
        'cdn-links-generated.json', 
        'cdn-mapping-config.json',
        '_redirects',
        'netlify.toml',
        'downloads-cdn.html'
    ],
    
    // 云存储配置 (R2兼容)
    cloudStorage: {
        enabled: true,
        provider: 'r2', // r2, s3, gcs
        bucket: process.env.CLOUD_BUCKET || 'goldword-cdn',
        region: process.env.CLOUD_REGION || 'auto',
        endpoint: process.env.CLOUD_ENDPOINT || '',
        accessKey: process.env.CLOUD_ACCESS_KEY || '',
        secretKey: process.env.CLOUD_SECRET_KEY || '',
        accountId: process.env.CLOUD_ACCOUNT_ID || ''
    },
    
    // 同步设置
    syncSettings: {
        autoSync: false,
        syncInterval: 30000,
        checksumValidation: true,
        compression: true,
        maxRetries: 3
    },
    
    // 日志配置
    logging: {
        enabled: true,
        level: 'info', // debug, info, warn, error
        file: 'cloud-sync-manager.log',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
    }
};

// 日志管理器
class LogManager {
    constructor(config) {
        this.config = config;
        this.logFile = path.join(__dirname, config.logging.file);
        this.ensureLogDirectory();
    }
    
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
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
        
        // 控制台输出
        const consoleColors = {
            debug: '\x1b[36m', // 青色
            info: '\x1b[32m',  // 绿色
            warn: '\x1b[33m',  // 黄色
            error: '\x1b[31m'  // 红色
        };
        const resetColor = '\x1b[0m';
        
        const color = consoleColors[level] || '';
        console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${resetColor}`);
        
        // 文件日志
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.logFile, logLine);
            this.rotateLogsIfNeeded();
        } catch (error) {
            console.error('日志写入失败:', error.message);
        }
    }
    
    rotateLogsIfNeeded() {
        try {
            const stats = fs.statSync(this.logFile);
            if (stats.size > this.config.logging.maxSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedFile = `${this.logFile}.${timestamp}`;
                fs.renameSync(this.logFile, rotatedFile);
                
                // 清理旧日志文件
                const logDir = path.dirname(this.logFile);
                const logFiles = fs.readdirSync(logDir)
                    .filter(file => file.startsWith(path.basename(this.logFile)))
                    .sort()
                    .reverse();
                
                if (logFiles.length > this.config.logging.maxFiles) {
                    const filesToDelete = logFiles.slice(this.config.logging.maxFiles);
                    filesToDelete.forEach(file => {
                        fs.unlinkSync(path.join(logDir, file));
                    });
                }
            }
        } catch (error) {
            // 忽略日志轮转错误
        }
    }
    
    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
}

// 文件管理器
class FileManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.fileChecksums = new Map();
    }
    
    // 计算文件校验和
    calculateChecksum(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return null;
            }
            
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            this.logger.error(`计算文件校验和失败: ${filePath}`, { error: error.message });
            return null;
        }
    }
    
    // 获取文件信息
    getFileInfo(fileName) {
        const filePath = path.join(__dirname, fileName);
        
        if (!fs.existsSync(filePath)) {
            return {
                exists: false,
                fileName,
                path: filePath
            };
        }
        
        const stats = fs.statSync(filePath);
        const checksum = this.calculateChecksum(filePath);
        
        return {
            exists: true,
            fileName,
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
            checksum,
            relativePath: fileName
        };
    }
    
    // 检查文件变化
    checkFileChanges() {
        const changes = [];
        
        this.config.syncFiles.forEach(fileName => {
            const fileInfo = this.getFileInfo(fileName);
            const currentChecksum = fileInfo.checksum;
            const previousChecksum = this.fileChecksums.get(fileName);
            
            if (currentChecksum && currentChecksum !== previousChecksum) {
                changes.push({
                    fileName,
                    action: previousChecksum ? 'modified' : 'new',
                    previousChecksum,
                    currentChecksum,
                    fileInfo
                });
                
                this.fileChecksums.set(fileName, currentChecksum);
            }
        });
        
        return changes;
    }
    
    // 压缩文件内容
    compressContent(content) {
        try {
            // 简单的内容压缩 (实际项目中可使用zlib)
            return content; // 暂时返回原始内容
        } catch (error) {
            this.logger.error('文件压缩失败', { error: error.message });
            return content;
        }
    }
}

// 云存储客户端
class CloudStorageClient {
    constructor(config, logger) {
        this.config = config.cloudStorage;
        this.logger = logger;
    }
    
    // 模拟云存储上传 (实际项目中集成真实API)
    async uploadToCloud(fileName, fileContent, metadata = {}) {
        return new Promise((resolve) => {
            // 模拟上传延迟
            setTimeout(() => {
                const uploadResult = {
                    success: true,
                    fileName,
                    size: fileContent.length,
                    metadata,
                    cloudUrl: `https://${this.config.bucket}.${this.config.provider}.com/${fileName}`,
                    timestamp: new Date().toISOString(),
                    simulated: true // 标记为模拟上传
                };
                
                this.logger.info(`文件上传完成 (模拟): ${fileName}`, {
                    size: fileContent.length,
                    cloudUrl: uploadResult.cloudUrl
                });
                
                resolve(uploadResult);
            }, 1000); // 1秒模拟延迟
        });
    }
    
    // 验证云存储配置
    validateConfiguration() {
        const required = ['provider', 'bucket'];
        const missing = required.filter(key => !this.config[key]);
        
        if (missing.length > 0) {
            return {
                valid: false,
                message: `缺少必需配置: ${missing.join(', ')}`,
                missing
            };
        }
        
        return {
            valid: true,
            message: '云存储配置有效',
            config: this.config
        };
    }
}

// 同步管理器
class SyncManager {
    constructor(config, logger, fileManager, cloudClient) {
        this.config = config;
        this.logger = logger;
        this.fileManager = fileManager;
        this.cloudClient = cloudClient;
        this.syncHistory = [];
        this.isSyncing = false;
    }
    
    // 执行同步
    async performSync(options = {}) {
        if (this.isSyncing) {
            this.logger.warn('同步已在进行中，跳过本次同步');
            return { success: false, message: '同步已在进行中' };
        }
        
        this.isSyncing = true;
        const syncStart = Date.now();
        
        try {
            this.logger.info('开始文件同步');
            
            // 检查文件变化
            const changes = this.fileManager.checkFileChanges();
            
            if (changes.length === 0 && !options.force) {
                this.logger.info('无文件变化，跳过同步');
                return { success: true, message: '无文件变化' };
            }
            
            this.logger.info(`检测到 ${changes.length} 个文件变化`);
            
            // 执行文件同步
            const syncResults = [];
            
            for (const change of changes) {
                try {
                    const result = await this.syncFile(change);
                    syncResults.push(result);
                } catch (error) {
                    this.logger.error(`文件同步失败: ${change.fileName}`, { error: error.message });
                    syncResults.push({
                        success: false,
                        fileName: change.fileName,
                        error: error.message
                    });
                }
            }
            
            // 生成同步报告
            const syncReport = this.generateSyncReport(syncResults, Date.now() - syncStart);
            
            this.logger.info('文件同步完成', {
                duration: `${syncReport.duration}ms`,
                successful: syncReport.successful,
                failed: syncReport.failed
            });
            
            // 保存同步历史
            this.syncHistory.push(syncReport);
            if (this.syncHistory.length > 100) {
                this.syncHistory = this.syncHistory.slice(-100);
            }
            
            return syncReport;
            
        } catch (error) {
            this.logger.error('同步过程中出错', { error: error.message });
            return {
                success: false,
                message: error.message,
                error: error.message
            };
        } finally {
            this.isSyncing = false;
        }
    }
    
    // 同步单个文件
    async syncFile(change) {
        const { fileName, fileInfo } = change;
        
        this.logger.info(`开始同步文件: ${fileName}`, {
            size: fileInfo.size,
            modified: fileInfo.modified
        });
        
        // 读取文件内容
        const fileContent = fs.readFileSync(fileInfo.path);
        
        // 压缩内容 (如果启用)
        const contentToUpload = this.config.syncSettings.compression 
            ? this.fileManager.compressContent(fileContent)
            : fileContent;
        
        // 上传到云存储
        const uploadResult = await this.cloudClient.uploadToCloud(
            fileName,
            contentToUpload,
            {
                originalSize: fileInfo.size,
                checksum: fileInfo.checksum,
                compressed: this.config.syncSettings.compression
            }
        );
        
        return {
            success: uploadResult.success,
            fileName,
            size: fileInfo.size,
            cloudUrl: uploadResult.cloudUrl,
            timestamp: uploadResult.timestamp
        };
    }
    
    // 生成同步报告
    generateSyncReport(results, duration) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        return {
            timestamp: new Date().toISOString(),
            duration,
            totalFiles: results.length,
            successful: successful.length,
            failed: failed.length,
            results,
            successfulFiles: successful.map(r => ({
                fileName: r.fileName,
                size: r.size,
                cloudUrl: r.cloudUrl,
                timestamp: r.timestamp
            })),
            failedFiles: failed.map(r => ({
                fileName: r.fileName,
                error: r.error
            }))
        };
    }
    
    // 获取同步状态
    getSyncStatus() {
        const lastSync = this.syncHistory.length > 0 ? this.syncHistory[this.syncHistory.length - 1] : null;
        const fileStatuses = this.config.syncFiles.map(fileName => {
            const fileInfo = this.fileManager.getFileInfo(fileName);
            const checksum = fileInfo.checksum;
            const lastChecksum = this.fileManager.fileChecksums.get(fileName);
            
            return {
                fileName,
                exists: fileInfo.exists,
                size: fileInfo.size,
                modified: fileInfo.modified,
                checksum,
                changed: checksum !== lastChecksum,
                cloudUrl: checksum ? `https://${this.config.cloudStorage.bucket}.${this.config.cloudStorage.provider}.com/${fileName}` : null
            };
        });
        
        return {
            timestamp: new Date().toISOString(),
            isSyncing: this.isSyncing,
            autoSync: this.config.syncSettings.autoSync,
            syncInterval: this.config.syncSettings.syncInterval,
            lastSync: lastSync,
            totalSyncs: this.syncHistory.length,
            cloudStorage: this.config.cloudStorage,
            files: fileStatuses
        };
    }
    
    // 获取同步历史
    getSyncHistory(limit = 10) {
        return this.syncHistory.slice(-limit).reverse();
    }
}

// 主管理器
class CloudSyncManager {
    constructor(config) {
        this.config = config;
        this.logger = new LogManager(config);
        this.fileManager = new FileManager(config, this.logger);
        this.cloudClient = new CloudStorageClient(config, this.logger);
        this.syncManager = new SyncManager(config, this.logger, this.fileManager, this.cloudClient);
    }
    
    // 显示系统状态
    showSystemStatus() {
        const status = this.syncManager.getSyncStatus();
        const configValidation = this.cloudClient.validateConfiguration();
        
        console.log('\n🌟 GoldWord 云同步管理系统');
        console.log('=' .repeat(60));
        
        console.log('\n📊 系统状态:');
        console.log(`   时间: ${status.timestamp}`);
        console.log(`   同步状态: ${status.isSyncing ? '🔄 同步中' : '✅ 就绪'}`);
        console.log(`   自动同步: ${status.autoSync ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`   同步间隔: ${status.syncInterval}ms`);
        console.log(`   总同步次数: ${status.totalSyncs}`);
        
        console.log('\n☁️  云存储配置:');
        console.log(`   提供商: ${status.cloudStorage.provider}`);
        console.log(`   存储桶: ${status.cloudStorage.bucket}`);
        console.log(`   配置状态: ${configValidation.valid ? '✅ 有效' : '❌ 无效'}`);
        
        if (!configValidation.valid) {
            console.log(`   错误: ${configValidation.message}`);
        }
        
        console.log('\n📁 文件状态:');
        status.files.forEach(file => {
            const statusIcon = file.exists ? '✅' : '❌';
            const changeIcon = file.changed ? '🔄' : '➖';
            console.log(`   ${statusIcon} ${file.fileName} ${changeIcon} ${file.size || 0} bytes`);
        });
        
        console.log('\n' + '=' .repeat(60));
    }
    
    // 执行同步
    async performSync(options = {}) {
        console.log('\n🔄 开始执行文件同步...\n');
        
        const result = await this.syncManager.performSync(options);
        
        if (result.success) {
            console.log('✅ 同步完成！');
            console.log(`   耗时: ${result.duration}ms`);
            console.log(`   总文件: ${result.totalFiles}`);
            console.log(`   成功: ${result.successful}`);
            console.log(`   失败: ${result.failed}`);
            
            if (result.successfulFiles && result.successfulFiles.length > 0) {
                console.log('\n🌐 云存储URL:');
                result.successfulFiles.forEach(file => {
                    console.log(`   - ${file.fileName}: ${file.cloudUrl}`);
                });
            }
        } else {
            console.log('❌ 同步失败！');
            console.log(`   错误: ${result.message}`);
        }
        
        return result;
    }
    
    // 显示同步历史
    showSyncHistory(limit = 5) {
        const history = this.syncManager.getSyncHistory(limit);
        
        console.log('\n📈 最近同步历史:');
        console.log('=' .repeat(60));
        
        if (history.length === 0) {
            console.log('   暂无同步记录');
            return;
        }
        
        history.forEach((sync, index) => {
            console.log(`\n${index + 1}. ${sync.timestamp}`);
            console.log(`   耗时: ${sync.duration}ms`);
            console.log(`   文件: ${sync.totalFiles} (成功: ${sync.successful}, 失败: ${sync.failed})`);
            
            if (sync.successfulFiles.length > 0) {
                console.log(`   成功文件: ${sync.successfulFiles.map(f => f.fileName).join(', ')}`);
            }
            
            if (sync.failedFiles.length > 0) {
                console.log(`   失败文件: ${sync.failedFiles.map(f => f.fileName).join(', ')}`);
            }
        });
        
        console.log('\n' + '=' .repeat(60));
    }
    
    // 生成详细报告
    generateDetailedReport() {
        const status = this.syncManager.getSyncStatus();
        const history = this.syncManager.getSyncHistory(50);
        
        const report = {
            timestamp: new Date().toISOString(),
            systemStatus: status,
            syncHistory: history,
            statistics: {
                totalSyncs: history.length,
                successfulSyncs: history.filter(h => h.failed === 0).length,
                failedSyncs: history.filter(h => h.failed > 0).length,
                averageDuration: history.length > 0 
                    ? Math.round(history.reduce((sum, h) => sum + h.duration, 0) / history.length)
                    : 0,
                totalFilesSynced: history.reduce((sum, h) => sum + h.totalFiles, 0),
                totalSuccessfulFiles: history.reduce((sum, h) => sum + h.successful, 0),
                totalFailedFiles: history.reduce((sum, h) => sum + h.failed, 0)
            }
        };
        
        return report;
    }
    
    // 保存报告到文件
    saveReport(report) {
        const reportFile = path.join(__dirname, 'cloud-sync-detailed-report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        this.logger.info(`详细报告已保存: ${reportFile}`);
        return reportFile;
    }
}

// 命令行界面
class CLI {
    constructor(manager) {
        this.manager = manager;
        this.commands = {
            'status': '显示系统状态',
            'sync': '执行文件同步',
            'history': '显示同步历史',
            'report': '生成详细报告',
            'help': '显示帮助信息',
            'exit': '退出程序'
        };
    }
    
    async run() {
        console.log('\n🌟 GoldWord 云同步管理器');
        console.log('=' .repeat(60));
        console.log('\n可用命令:');
        Object.entries(this.commands).forEach(([cmd, desc]) => {
            console.log(`   ${cmd.padEnd(10)} - ${desc}`);
        });
        console.log('\n' + '=' .repeat(60));
        
        // 显示初始状态
        this.manager.showSystemStatus();
        
        // 如果启用自动同步，立即执行一次
        if (this.manager.config.syncSettings.autoSync) {
            console.log('\n🔄 启动自动同步...');
            await this.manager.performSync();
        }
        
        // 生成并保存初始报告
        const report = this.manager.generateDetailedReport();
        const reportFile = this.manager.saveReport(report);
        console.log(`\n📄 初始报告已生成: ${reportFile}`);
        
        console.log('\n✅ 云同步系统启动完成！');
        console.log('\n💡 提示: 使用命令行参数运行特定功能');
        console.log('   例如: node cloud-sync-manager.js sync');
    }
    
    async executeCommand(command, args = []) {
        switch (command) {
            case 'status':
                this.manager.showSystemStatus();
                break;
                
            case 'sync':
                await this.manager.performSync({ force: args.includes('--force') });
                break;
                
            case 'history':
                const limit = parseInt(args[0]) || 10;
                this.manager.showSyncHistory(limit);
                break;
                
            case 'report':
                const report = this.manager.generateDetailedReport();
                const reportFile = this.manager.saveReport(report);
                console.log(`\n📄 报告已生成: ${reportFile}`);
                break;
                
            case 'help':
                console.log('\n可用命令:');
                Object.entries(this.commands).forEach(([cmd, desc]) => {
                    console.log(`   ${cmd.padEnd(10)} - ${desc}`);
                });
                break;
                
            default:
                console.log(`未知命令: ${command}`);
                console.log('使用 "help" 查看可用命令');
        }
    }
}

// 主函数
async function main() {
    const manager = new CloudSyncManager(CONFIG);
    const cli = new CLI(manager);
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command) {
        // 执行特定命令
        await cli.executeCommand(command, args.slice(1));
    } else {
        // 运行完整CLI
        await cli.run();
    }
}

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    process.exit(1);
});

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('程序执行失败:', error);
        process.exit(1);
    });
}

module.exports = { CloudSyncManager, SyncManager, FileManager };
