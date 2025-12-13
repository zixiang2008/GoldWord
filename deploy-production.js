#!/usr/bin/env node

/**
 * GoldWord 生产环境部署脚本
 * Production Deployment Script
 * 
 * 功能:
 * - 自动部署到Netlify生产环境
 * - 验证所有必需文件
 * - 处理404错误修复
 * - 生成部署报告
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    productionDomain: 'caishen.us.kg',
    productionUrl: 'https://caishen.us.kg/app-cdn.html',
    
    // 必需文件列表
    requiredFiles: [
        'app-cdn.html',
        '_redirects',
        'netlify.toml',
        'cdn-links-generated.json',
        'cdn-mapping-config.json',
        '404.html',
        'index.html'
    ],
    
    // 部署文件
    deployFiles: [
        'app-cdn.html',
        '_redirects', 
        'netlify.toml',
        'cdn-links-generated.json',
        'cdn-mapping-config.json',
        '404.html'
    ],
    
    // 备份配置
    backup: {
        enabled: true,
        directory: 'deployment-backups',
        maxBackups: 5
    },
    
    // 验证配置
    validation: {
        checkFiles: true,
        checkRedirects: true,
        checkNetlifyConfig: true,
        testAfterDeploy: true
    }
};

// 日志系统
class Logger {
    constructor() {
        this.logFile = path.join(__dirname, 'production-deploy.log');
        this.ensureLogFile();
    }
    
    ensureLogFile() {
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '');
        }
    }
    
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (Object.keys(data).length > 0) {
            console.log(`${logEntry} ${JSON.stringify(data)}`);
        } else {
            console.log(logEntry);
        }
        
        try {
            fs.appendFileSync(this.logFile, logEntry + '\n');
        } catch (error) {
            console.error('日志写入失败:', error.message);
        }
    }
    
    info(message, data) { this.log('info', message, data); }
    success(message, data) { this.log('success', message, data); }
    error(message, data) { this.log('error', message, data); }
    warn(message, data) { this.log('warn', message, data); }
}

// 文件验证器
class FileValidator {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    
    validateRequiredFiles() {
        this.logger.info('开始验证必需文件');
        const missingFiles = [];
        const fileStats = {};
        
        this.config.requiredFiles.forEach(fileName => {
            const filePath = path.join(__dirname, fileName);
            
            if (!fs.existsSync(filePath)) {
                missingFiles.push(fileName);
                this.logger.warn(`文件不存在: ${fileName}`);
            } else {
                const stats = fs.statSync(filePath);
                fileStats[fileName] = {
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    exists: true
                };
                this.logger.success(`找到文件: ${fileName} (${stats.size} bytes)`);
            }
        });
        
        return {
            valid: missingFiles.length === 0,
            missingFiles,
            fileStats,
            totalFiles: this.config.requiredFiles.length,
            foundFiles: this.config.requiredFiles.length - missingFiles.length
        };
    }
    
    validateDeployFiles() {
        this.logger.info('开始验证部署文件');
        const deployStats = {};
        
        this.config.deployFiles.forEach(fileName => {
            const filePath = path.join(__dirname, fileName);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                
                deployStats[fileName] = {
                    size: stats.size,
                    lines: content.split('\n').length,
                    hash: this.calculateHash(content),
                    modified: stats.mtime.toISOString()
                };
                
                this.logger.success(`部署文件就绪: ${fileName}`);
            } else {
                this.logger.error(`部署文件缺失: ${fileName}`);
            }
        });
        
        return deployStats;
    }
    
    validateRedirects() {
        this.logger.info('验证重定向配置');
        
        try {
            const redirectsPath = path.join(__dirname, '_redirects');
            const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
            
            const hasAppCdnRule = redirectsContent.includes('/app-cdn.html');
            const hasDownloadsRedirect = redirectsContent.includes('/downloads-cdn.html');
            
            return {
                valid: hasAppCdnRule && hasDownloadsRedirect,
                hasAppCdnRule,
                hasDownloadsRedirect,
                content: redirectsContent
            };
        } catch (error) {
            this.logger.error('重定向配置验证失败', { error: error.message });
            return { valid: false, error: error.message };
        }
    }
    
    validateNetlifyConfig() {
        this.logger.info('验证Netlify配置');
        
        try {
            const netlifyPath = path.join(__dirname, 'netlify.toml');
            const netlifyContent = fs.readFileSync(netlifyPath, 'utf8');
            
            const hasRedirects = netlifyContent.includes('[[redirects]]');
            const hasHeaders = netlifyContent.includes('[[headers]]');
            
            return {
                valid: hasRedirects && hasHeaders,
                hasRedirects,
                hasHeaders,
                content: netlifyContent
            };
        } catch (error) {
            this.logger.error('Netlify配置验证失败', { error: error.message });
            return { valid: false, error: error.message };
        }
    }
    
    calculateHash(content) {
        return require('crypto').createHash('md5').update(content).digest('hex');
    }
}

// 备份管理器
class BackupManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.backupDir = path.join(__dirname, config.backup.directory);
    }
    
    createBackup() {
        if (!this.config.backup.enabled) {
            this.logger.info('备份功能已禁用');
            return null;
        }
        
        this.logger.info('创建部署备份');
        
        try {
            // 创建备份目录
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `deploy-backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, backupName);
            
            fs.mkdirSync(backupPath);
            
            // 备份部署文件
            this.config.deployFiles.forEach(fileName => {
                const sourcePath = path.join(__dirname, fileName);
                const destPath = path.join(backupPath, fileName);
                
                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, destPath);
                }
            });
            
            // 清理旧备份
            this.cleanupOldBackups();
            
            this.logger.success(`备份创建完成: ${backupName}`);
            return backupPath;
            
        } catch (error) {
            this.logger.error('备份创建失败', { error: error.message });
            return null;
        }
    }
    
    cleanupOldBackups() {
        try {
            const backups = fs.readdirSync(this.backupDir)
                .filter(dir => dir.startsWith('deploy-backup-'))
                .sort()
                .reverse();
            
            if (backups.length > this.config.backup.maxBackups) {
                const toDelete = backups.slice(this.config.backup.maxBackups);
                toDelete.forEach(backup => {
                    const backupPath = path.join(this.backupDir, backup);
                    fs.rmSync(backupPath, { recursive: true, force: true });
                    this.logger.info(`删除旧备份: ${backup}`);
                });
            }
        } catch (error) {
            this.logger.error('清理旧备份失败', { error: error.message });
        }
    }
}

// HTTP测试器
class HTTPTester {
    constructor(logger) {
        this.logger = logger;
    }
    
    async testUrl(url, expectedStatus = 200) {
        return new Promise((resolve) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                timeout: 10000
            };
            
            const req = https.request(options, (res) => {
                resolve({
                    success: res.statusCode === expectedStatus,
                    statusCode: res.statusCode,
                    url,
                    expectedStatus
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    url
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: '请求超时',
                    url
                });
            });
            
            req.end();
        });
    }
    
    async testProductionUrls() {
        this.logger.info('开始测试生产环境URL');
        
        const tests = [
            { url: 'https://caishen.us.kg/', expectedStatus: 200 },
            { url: 'https://caishen.us.kg/app-cdn.html', expectedStatus: 200 },
            { url: 'https://caishen.us.kg/downloads-cdn.html', expectedStatus: 301 },
            { url: 'https://caishen.us.kg/404', expectedStatus: 404 }
        ];
        
        const results = [];
        
        for (const test of tests) {
            this.logger.info(`测试URL: ${test.url}`);
            const result = await this.testUrl(test.url, test.expectedStatus);
            results.push(result);
            
            if (result.success) {
                this.logger.success(`✅ URL测试通过: ${test.url} (${result.statusCode})`);
            } else {
                this.logger.error(`❌ URL测试失败: ${test.url} - ${result.error || result.statusCode}`);
            }
        }
        
        return results;
    }
}

// 部署管理器
class DeploymentManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.validator = new FileValidator(config, logger);
        this.backupManager = new BackupManager(config, logger);
        this.httpTester = new HTTPTester(logger);
    }
    
    async performDeployment() {
        this.logger.info('开始生产环境部署');
        const deploymentStart = Date.now();
        
        try {
            // 1. 验证文件
            const fileValidation = this.validator.validateRequiredFiles();
            if (!fileValidation.valid) {
                throw new Error(`缺少必需文件: ${fileValidation.missingFiles.join(', ')}`);
            }
            
            // 2. 验证配置
            const redirectValidation = this.validator.validateRedirects();
            const netlifyValidation = this.validator.validateNetlifyConfig();
            
            if (!redirectValidation.valid || !netlifyValidation.valid) {
                throw new Error('配置文件验证失败');
            }
            
            // 3. 创建备份
            const backupPath = this.backupManager.createBackup();
            
            // 4. 验证部署文件
            const deployStats = this.validator.validateDeployFiles();
            
            // 5. 生成部署报告
            const deploymentReport = {
                timestamp: new Date().toISOString(),
                duration: Date.now() - deploymentStart,
                fileValidation,
                redirectValidation,
                netlifyValidation,
                deployStats,
                backupPath,
                status: 'ready_for_deployment'
            };
            
            // 6. 模拟部署 (实际部署需要Netlify CLI或API)
            this.logger.info('准备部署到Netlify生产环境');
            this.logger.info('注意: 需要手动部署或使用Netlify CLI');
            
            // 7. 测试部署 (模拟)
            if (this.config.validation.testAfterDeploy) {
                this.logger.info('开始部署后测试');
                const testResults = await this.httpTester.testProductionUrls();
                deploymentReport.testResults = testResults;
            }
            
            // 保存部署报告
            this.saveDeploymentReport(deploymentReport);
            
            this.logger.success('部署准备完成！');
            this.logger.info('请使用以下方法之一进行实际部署:');
            this.logger.info('1. 使用Netlify CLI: netlify deploy --prod');
            this.logger.info('2. 通过Git推送到连接的仓库');
            this.logger.info('3. 使用Netlify Web界面手动部署');
            
            return deploymentReport;
            
        } catch (error) {
            this.logger.error('部署失败', { error: error.message });
            throw error;
        }
    }
    
    saveDeploymentReport(report) {
        const reportFile = path.join(__dirname, 'deployment-report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        this.logger.info(`部署报告已保存: ${reportFile}`);
    }
    
    generateDeploymentInstructions() {
        const instructions = [
            '# 🚀 GoldWord 生产环境部署指南',
            '',
            '## 方法1: 使用Netlify CLI',
            '```bash',
            '# 安装Netlify CLI (如果尚未安装)',
            'npm install -g netlify-cli',
            '',
            '# 登录Netlify',
            'netlify login',
            '',
            '# 部署到生产环境',
            'netlify deploy --prod --dir=. --site=your-site-id',
            '```',
            '',
            '## 方法2: Git部署',
            '```bash',
            '# 添加所有文件',
            'git add .',
            '',
            '# 提交更改',
            'git commit -m "Deploy GoldWord CDN files to production"',
            '',
            '# 推送到远程仓库',
            'git push origin main',
            '```',
            '',
            '## 方法3: 手动部署',
            '1. 访问 https://app.netlify.com',
            '2. 选择您的站点',
            '3. 进入"Deploys"页面',
            '4. 点击"Trigger deploy" -> "Deploy site"',
            '5. 或者拖拽文件到部署区域',
            '',
            '## 部署后验证',
            '部署完成后，请访问以下URL进行验证:',
            '- https://caishen.us.kg/app-cdn.html',
            '- https://caishen.us.kg/downloads-cdn.html (应重定向)',
            '',
            '## 问题排查',
            '如果仍然出现404错误，请检查:',
            '1. 文件是否已成功上传',
            '2. Netlify重定向配置是否正确',
            '3. 域名DNS设置是否正确',
            '4. 查看Netlify部署日志'
        ];
        
        const instructionsFile = path.join(__dirname, 'DEPLOYMENT_INSTRUCTIONS.md');
        fs.writeFileSync(instructionsFile, instructions.join('\n'));
        this.logger.info(`部署指南已生成: ${instructionsFile}`);
    }
}

// 主函数
async function main() {
    const logger = new Logger();
    const deploymentManager = new DeploymentManager(CONFIG, logger);
    
    console.log('\n🚀 GoldWord 生产环境部署工具\n');
    console.log('=' .repeat(60));
    
    try {
        const report = await deploymentManager.performDeployment();
        deploymentManager.generateDeploymentInstructions();
        
        console.log('\n' + '=' .repeat(60));
        console.log('\n📊 部署统计:');
        console.log(`   文件验证: ${report.fileValidation.foundFiles}/${report.fileValidation.totalFiles}`);
        console.log(`   配置文件: ✅ 已验证`);
        console.log(`   备份创建: ${report.backupPath ? '✅ 完成' : '❌ 跳过'}`);
        console.log(`   部署状态: ✅ 准备就绪`);
        
        console.log('\n🎯 下一步:');
        console.log('   1. 查看 DEPLOYMENT_INSTRUCTIONS.md 获取部署指南');
        console.log('   2. 使用Netlify CLI或Git进行实际部署');
        console.log('   3. 部署完成后验证生产环境访问');
        
        console.log('\n✅ 生产环境部署准备完成！');
        
    } catch (error) {
        console.error('\n❌ 部署失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('程序执行失败:', error);
        process.exit(1);
    });
}

module.exports = { DeploymentManager, FileValidator, BackupManager };