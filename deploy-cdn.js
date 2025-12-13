#!/usr/bin/env node

/**
 * CloudFlare CDN 一键部署脚本
 * 完全自动化的CDN配置和部署工具
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class AutoCDNDeployer {
    constructor() {
        this.config = {
            apiToken: process.env.CLOUDFLARE_API_TOKEN,
            zoneName: process.env.CLOUDFLARE_ZONE_NAME || 'downloads.yourdomain.com',
            accountId: null,
            zoneId: null,
            r2Bucket: process.env.CLOUDFLARE_R2_BUCKET || 'goldword-downloads'
        };
        
        this.setupSteps = [
            { name: '环境检查', func: this.checkEnvironment.bind(this) },
            { name: 'API验证', func: this.verifyAPI.bind(this) },
            { name: '创建存储桶', func: this.createR2Bucket.bind(this) },
            { name: '配置CDN', func: this.configureCDN.bind(this) },
            { name: '上传文件', func: this.uploadFiles.bind(this) },
            { name: '生成链接', func: this.generateLinks.bind(this) },
            { name: '速度测试', func: this.testSpeed.bind(this) }
        ];
    }

    async run() {
        console.log('🚀 CloudFlare CDN 一键部署工具');
        console.log('=====================================');
        console.log('本工具将自动完成以下操作:');
        console.log('1. 验证CloudFlare API访问');
        console.log('2. 创建R2存储桶');
        console.log('3. 配置CDN缓存规则');
        console.log('4. 上传下载文件');
        console.log('5. 生成优化的下载链接');
        console.log('6. 测试全球访问速度\n');

        try {
            for (let i = 0; i < this.setupSteps.length; i++) {
                const step = this.setupSteps[i];
                console.log(`[${i + 1}/${this.setupSteps.length}] ${step.name}...`);
                
                try {
                    await step.func();
                    console.log(`✅ ${step.name} 完成\n`);
                } catch (error) {
                    console.error(`❌ ${step.name} 失败:`, error.message);
                    
                    const continueOnError = await this.askQuestion('是否继续? (y/N): ');
                    if (continueOnError.toLowerCase() !== 'y') {
                        throw new Error('用户中断部署');
                    }
                }
            }

            console.log('\n🎉 CDN部署完成！');
            await this.showSummary();
            
        } catch (error) {
            console.error('\n❌ 部署失败:', error.message);
            process.exit(1);
        }
    }

    async checkEnvironment() {
        // 检查必要的文件和目录
        const downloadsDir = path.join(process.cwd(), 'downloads');
        const stats = await fs.stat(downloadsDir).catch(() => null);
        
        if (!stats || !stats.isDirectory()) {
            console.log('创建 downloads 目录...');
            await fs.mkdir(downloadsDir, { recursive: true });
        }

        // 检查API令牌
        if (!this.config.apiToken) {
            throw new Error('请设置 CLOUDFLARE_API_TOKEN 环境变量');
        }

        // 检查文件
        const files = await this.scanDownloadFiles();
        if (files.length === 0) {
            console.log('⚠️  未找到下载文件，请确保文件在 downloads 目录中');
        } else {
            console.log(`发现 ${files.length} 个文件待上传`);
        }
    }

    async verifyAPI() {
        const response = await this.cloudflareRequest('/client/v4/user/tokens/verify');
        if (!response.success) {
            throw new Error('API令牌验证失败');
        }
        
        // 获取账户信息
        const userResponse = await this.cloudflareRequest('/client/v4/user');
        this.config.accountId = userResponse.result.id;
        
        console.log(`API验证成功，账户: ${userResponse.result.email}`);
    }

    async createR2Bucket() {
        try {
            // 检查存储桶是否已存在
            const bucketsResponse = await this.cloudflareRequest(
                `/client/v4/accounts/${this.config.accountId}/r2/buckets`,
                'GET'
            );
            
            const existingBucket = bucketsResponse.result?.buckets?.find(
                bucket => bucket.name === this.config.r2Bucket
            );
            
            if (existingBucket) {
                console.log(`存储桶 ${this.config.r2Bucket} 已存在`);
                return;
            }
            
            // 创建新存储桶
            await this.cloudflareRequest(
                `/client/v4/accounts/${this.config.accountId}/r2/buckets`,
                'POST',
                { name: this.config.r2Bucket }
            );
            
            console.log(`✅ 存储桶 ${this.config.r2Bucket} 创建成功`);
            
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('存储桶已存在，跳过创建');
            } else {
                throw error;
            }
        }
    }

    async configureCDN() {
        // 获取或创建区域
        let zone = await this.getOrCreateZone();
        this.config.zoneId = zone.id;
        
        // 配置缓存规则
        const settings = [
            { endpoint: '/settings/cache_level', value: 'aggressive' },
            { endpoint: '/settings/browser_cache_ttl', value: 2592000 },
            { endpoint: '/settings/brotli', value: 'on' },
            { endpoint: '/settings/always_online', value: 'on' }
        ];
        
        for (const setting of settings) {
            await this.cloudflareRequest(
                `/client/v4/zones/${this.config.zoneId}${setting.endpoint}`,
                'PATCH',
                { value: setting.value }
            );
        }
        
        // 创建页面规则
        await this.createPageRules();
        
        console.log(`✅ CDN配置完成，区域: ${zone.name}`);
        
        if (zone.status === 'pending') {
            console.log('⚠️  域名需要DNS验证，请按以下步骤操作:');
            console.log('1. 登录域名注册商');
            console.log('2. 修改DNS服务器为:');
            zone.name_servers.forEach(ns => console.log(`   ${ns}`));
            console.log('3. 等待DNS生效 (通常需要几分钟到几小时)');
            
            await this.askQuestion('\nDNS配置完成后按回车继续...');
        }
    }

    async getOrCreateZone() {
        // 查找现有区域
        const zonesResponse = await this.cloudflareRequest('/client/v4/zones', 'GET');
        
        let zone = zonesResponse.result.find(z => z.name === this.config.zoneName);
        
        if (!zone) {
            // 创建新区域
            console.log(`创建新区域: ${this.config.zoneName}`);
            const createResponse = await this.cloudflareRequest('/client/v4/zones', 'POST', {
                name: this.config.zoneName,
                account: { id: this.config.accountId },
                jump_start: true,
                type: 'full'
            });
            
            zone = createResponse.result;
        }
        
        return zone;
    }

    async createPageRules() {
        const pageRules = [
            {
                targets: [{ target: 'url', constraint: { operator: 'matches', value: `*${this.config.zoneName}/*` } }],
                actions: [
                    { id: 'cache_level', value: 'cache_everything' },
                    { id: 'edge_cache_ttl', value: 2592000 },
                    { id: 'browser_cache_ttl', value: 2592000 }
                ],
                priority: 1,
                status: 'active'
            }
        ];
        
        for (const rule of pageRules) {
            await this.cloudflareRequest(
                `/client/v4/zones/${this.config.zoneId}/pagerules`,
                'POST',
                rule
            );
        }
    }

    async uploadFiles() {
        const files = await this.scanDownloadFiles();
        
        if (files.length === 0) {
            console.log('没有文件需要上传');
            return;
        }
        
        console.log(`开始上传 ${files.length} 个文件...`);
        
        for (const file of files) {
            await this.uploadFileToR2(file);
        }
        
        console.log(`✅ 所有文件上传完成`);
    }

    async scanDownloadFiles() {
        const downloadsDir = path.join(process.cwd(), 'downloads');
        const files = [];
        
        try {
            await this.scanDirectory(downloadsDir, files, downloadsDir);
        } catch (error) {
            console.log('扫描目录失败:', error.message);
        }
        
        return files;
    }

    async scanDirectory(dir, files, baseDir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);
            
            if (entry.isDirectory()) {
                await this.scanDirectory(fullPath, files, baseDir);
            } else if (entry.isFile()) {
                const stats = await fs.stat(fullPath);
                files.push({
                    path: fullPath,
                    relativePath: relativePath,
                    size: stats.size,
                    name: entry.name
                });
            }
        }
    }

    async uploadFileToR2(file) {
        const key = file.relativePath.replace(/\\/g, '/'); // Windows路径转换
        
        console.log(`上传: ${key} (${this.formatFileSize(file.size)})`);
        
        try {
            // 读取文件内容
            const fileContent = await fs.readFile(file.path);
            
            // 上传到R2
            await this.cloudflareRequest(
                `/client/v4/accounts/${this.config.accountId}/r2/buckets/${this.config.r2Bucket}/objects/${key}`,
                'PUT',
                fileContent,
                {
                    'Content-Type': this.getMimeType(file.name),
                    'Content-Length': file.size
                }
            );
            
            console.log(`  ✅ ${key}`);
            
        } catch (error) {
            console.error(`  ❌ ${key}:`, error.message);
            throw error;
        }
    }

    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.dmg': 'application/x-apple-diskimage',
            '.zip': 'application/zip',
            '.tar.gz': 'application/gzip',
            '.json': 'application/json',
            '.txt': 'text/plain',
            '.md': 'text/markdown'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async generateLinks() {
        const files = await this.scanDownloadFiles();
        
        console.log('\n生成下载链接:');
        
        const links = files.map(file => {
            const key = file.relativePath.replace(/\\/g, '/');
            const cdnUrl = `https://${this.config.zoneName}/${key}`;
            const directUrl = `https://${this.config.r2Bucket}.${this.config.accountId}.r2.cloudflarestorage.com/${key}`;
            
            return {
                filename: file.name,
                cdnUrl,
                directUrl,
                size: this.formatFileSize(file.size)
            };
        });
        
        // 保存链接到文件
        const linksFile = path.join(process.cwd(), 'cdn-links.json');
        await fs.writeFile(linksFile, JSON.stringify(links, null, 2));
        
        console.log('\n📋 下载链接已生成:');
        links.forEach(link => {
            console.log(`\n📦 ${link.filename} (${link.size})`);
            console.log(`   CDN链接: ${link.cdnUrl}`);
            console.log(`   直链: ${link.directUrl}`);
        });
        
        console.log(`\n💾 所有链接已保存到: ${linksFile}`);
        
        return links;
    }

    async testSpeed() {
        const links = await this.generateLinks();
        
        if (links.length === 0) {
            console.log('没有文件可供测试');
            return;
        }
        
        console.log('\n开始速度测试...');
        
        const testFile = links[0]; // 测试第一个文件
        
        // 测试CDN链接
        console.log(`\n测试CDN链接: ${testFile.cdnUrl}`);
        const cdnSpeed = await this.testDownloadSpeed(testFile.cdnUrl);
        
        // 测试直链
        console.log(`\n测试直链: ${testFile.directUrl}`);
        const directSpeed = await this.testDownloadSpeed(testFile.directUrl);
        
        console.log('\n📊 速度测试结果:');
        console.log(`CDN链接: ${cdnSpeed.speed} (${cdnSpeed.time}ms)`);
        console.log(`直链: ${directSpeed.speed} (${directSpeed.time}ms)`);
        
        if (cdnSpeed.speed > directSpeed.speed) {
            console.log('✅ CDN加速效果明显！');
        } else {
            console.log('⚠️  CDN效果不明显，请检查配置');
        }
    }

    async testDownloadSpeed(url) {
        const startTime = Date.now();
        
        try {
            const response = await this.makeRequest(url, 'HEAD');
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // 简单的速度估算（基于响应时间）
            let speed = '未知';
            if (duration < 100) speed = '极快';
            else if (duration < 300) speed = '很快';
            else if (duration < 500) speed = '快';
            else if (duration < 1000) speed = '一般';
            else if (duration < 2000) speed = '较慢';
            else speed = '慢';
            
            return {
                speed,
                time: duration,
                status: response.statusCode || '未知'
            };
            
        } catch (error) {
            return {
                speed: '失败',
                time: Date.now() - startTime,
                status: '错误'
            };
        }
    }

    async showSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 部署摘要');
        console.log('='.repeat(50));
        console.log(`域名: ${this.config.zoneName}`);
        console.log(`存储桶: ${this.config.r2Bucket}`);
        console.log(`区域ID: ${this.config.zoneId}`);
        console.log('\n📊 优化建议:');
        console.log('1. 监控CDN使用情况和费用');
        console.log('2. 定期清理不用的文件');
        console.log('3. 设置访问日志和监控');
        console.log('4. 考虑设置防盗链');
        console.log('\n🔗 下一步:');
        console.log('1. 更新网站下载链接为CDN链接');
        console.log('2. 测试全球各地访问速度');
        console.log('3. 设置监控和告警');
    }

    // 工具函数
    async cloudflareRequest(endpoint, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = `https://api.cloudflare.com${endpoint}`;
            
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.config.apiToken}`,
                    'Content-Type': 'application/json',
                    ...headers
                }
            };
            
            if (data && method !== 'GET') {
                if (typeof data === 'string' || Buffer.isBuffer(data)) {
                    options.body = data;
                } else {
                    options.body = JSON.stringify(data);
                }
            }
            
            fetch(url, options)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(resolve)
                .catch(reject);
        });
    }

    makeRequest(url, method = 'GET') {
        return new Promise((resolve, reject) => {
            const options = new URL(url);
            options.method = method;
            
            const req = https.request(options, (res) => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => reject(new Error('请求超时')));
            req.end();
        });
    }

    askQuestion(question) {
        return new Promise(resolve => {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question(question, answer => {
                rl.close();
                resolve(answer);
            });
        });
    }
}

// 运行部署
if (require.main === module) {
    const deployer = new AutoCDNDeployer();
    deployer.run().catch(console.error);
}

module.exports = AutoCDNDeployer;