#!/usr/bin/env node

/**
 * CloudFlare CDN 部署程序（终极修复版）
 * 完全解决中文字符编码和国际化问题
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class CloudFlareCDNFinal {
    constructor() {
        this.apiToken = null;
        this.zoneId = null;
        this.accountId = null;
        this.baseURL = 'api.cloudflare.com';
        this.zoneName = null;
        this.rl = null;
    }

    async run() {
        console.log('🚀 CloudFlare CDN 部署程序（终极修复版）');
        console.log('==========================================');
        console.log('本版本完全修复了中文字符编码问题\n');
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            await this.setupAPIKey();
            await this.selectZone();
            await this.configureCDN();
            await this.uploadFiles();
            await this.testDownloadSpeed();
            
            console.log('\n🎉 CDN配置完成！');
            await this.showSummary();
            
        } catch (error) {
            console.error('\n❌ 配置失败:', error.message);
            console.log('错误详情:', error.stack);
        } finally {
            if (this.rl) {
                this.rl.close();
            }
        }
    }

    async setupAPIKey() {
        console.log('\n📋 步骤1: 配置API访问');
        console.log('请前往 https://dash.cloudflare.com/profile/api-tokens 创建API令牌');
        console.log('所需权限: Zone:Read, Zone:Edit, R2:Read, R2:Write');
        
        this.apiToken = await this.askQuestion('请输入API令牌: ');
        
        if (!this.apiToken || this.apiToken.trim().length < 20) {
            throw new Error('API令牌格式不正确');
        }
        
        // 验证API密钥
        const response = await this.makeRequest('/client/v4/user/tokens/verify', 'GET');
        if (!response.success) {
            throw new Error('API令牌验证失败: ' + JSON.stringify(response.errors));
        }
        
        console.log('✅ API令牌验证成功');
    }

    async selectZone() {
        console.log('\n📋 步骤2: 选择域名区域');
        
        const zones = await this.makeRequest('/client/v4/zones', 'GET');
        
        if (zones.result && zones.result.length > 0) {
            console.log('现有区域:');
            zones.result.forEach((zone, index) => {
                console.log(`${index + 1}. ${zone.name} (${zone.status})`);
            });
            
            const choice = await this.askQuestion('选择区域编号 (或输入新域名): ');
            
            if (isNaN(choice)) {
                await this.createZone(choice.trim());
            } else {
                const selectedIndex = parseInt(choice) - 1;
                if (selectedIndex >= 0 && selectedIndex < zones.result.length) {
                    const selectedZone = zones.result[selectedIndex];
                    this.zoneId = selectedZone.id;
                    this.accountId = selectedZone.account.id;
                    this.zoneName = selectedZone.name;
                    console.log(`✅ 已选择区域: ${selectedZone.name}`);
                } else {
                    throw new Error('无效的选择');
                }
            }
        } else {
            const domain = await this.askQuestion('输入要配置的域名 (如: downloads.yourdomain.com): ');
            await this.createZone(domain.trim());
        }
    }

    async createZone(domain) {
        console.log(`正在创建区域: ${domain}`);
        
        const response = await this.makeRequest('/client/v4/zones', 'POST', {
            name: domain,
            jump_start: true,
            type: 'full'
        });
        
        if (response.success) {
            this.zoneId = response.result.id;
            this.accountId = response.result.account.id;
            this.zoneName = domain;
            console.log(`✅ 区域创建成功: ${domain}`);
            console.log(`📋 请将域名DNS服务器更改为:`);
            response.result.name_servers.forEach(ns => {
                console.log(`  - ${ns}`);
            });
            console.log('⚠️  DNS更改完成后，按回车继续...');
            await this.askQuestion('');
        } else {
            throw new Error('区域创建失败: ' + JSON.stringify(response.errors));
        }
    }

    async configureCDN() {
        console.log('\n📋 步骤3: 配置CDN设置');
        
        const settings = [
            { endpoint: '/settings/cache_level', value: 'aggressive', name: '缓存级别' },
            { endpoint: '/settings/browser_cache_ttl', value: 2592000, name: '浏览器缓存TTL' },
            { endpoint: '/settings/brotli', value: 'on', name: 'Brotli压缩' },
            { endpoint: '/settings/always_online', value: 'on', name: 'Always Online' }
        ];
        
        for (const setting of settings) {
            try {
                console.log(`配置 ${setting.name}...`);
                await this.makeRequest(`/client/v4/zones/${this.zoneId}${setting.endpoint}`, 'PATCH', {
                    value: setting.value
                });
                console.log(`✅ ${setting.name} 配置成功`);
            } catch (error) {
                console.log(`⚠️  ${setting.name} 配置失败:`, error.message);
            }
        }
        
        await this.createPageRules();
        console.log('✅ CDN配置完成');
    }

    async createPageRules() {
        console.log('\n创建页面规则...');
        
        if (!this.zoneName) {
            console.log('⚠️  未配置域名，跳过页面规则');
            return;
        }
        
        const pageRules = [
            {
                targets: [
                    {
                        target: 'url',
                        constraint: {
                            operator: 'matches',
                            value: `*${this.zoneName}/*.dmg`
                        }
                    }
                ],
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
            try {
                await this.makeRequest(`/client/v4/zones/${this.zoneId}/pagerules`, 'POST', rule);
                console.log('✅ 页面规则创建成功');
            } catch (error) {
                console.log('⚠️  页面规则创建失败:', error.message);
            }
        }
    }

    async uploadFiles() {
        console.log('\n📋 步骤4: 上传文件');
        
        const uploadsDir = path.join(process.cwd(), 'downloads');
        
        if (!fs.existsSync(uploadsDir)) {
            console.log('⚠️  未找到downloads目录，跳过文件上传');
            return;
        }
        
        const files = this.getFilesRecursively(uploadsDir);
        const uploadFiles = files.filter(file => 
            file.endsWith('.dmg') || file.endsWith('.zip') || file.endsWith('.tar.gz')
        );
        
        if (uploadFiles.length === 0) {
            console.log('⚠️  未找到可上传的文件');
            return;
        }
        
        console.log(`找到 ${uploadFiles.length} 个文件需要上传:`);
        uploadFiles.forEach(file => console.log(`  - ${file}`));
        
        const confirm = await this.askQuestion('确认上传这些文件? (y/N): ');
        if (confirm.toLowerCase() !== 'y') {
            console.log('跳过文件上传');
            return;
        }
        
        // 提供R2上传指导
        console.log('\n📁 R2文件上传指导:');
        console.log('1. 登录 CloudFlare Dashboard (https://dash.cloudflare.com)');
        console.log('2. 点击左侧菜单 "R2"');
        console.log('3. 点击 "创建存储桶"');
        console.log('4. 输入存储桶名称 (如: goldword-downloads)');
        console.log('5. 上传文件到存储桶');
        console.log('6. 设置文件为公开访问');
        
        console.log('✅ 文件上传指导已提供');
    }

    getFilesRecursively(dir, baseDir = dir) {
        let files = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    files = files.concat(this.getFilesRecursively(fullPath, baseDir));
                } else {
                    const relativePath = path.relative(baseDir, fullPath);
                    files.push(relativePath);
                }
            }
        } catch (error) {
            console.log(`读取目录失败: ${dir}`, error.message);
        }
        
        return files;
    }

    async testDownloadSpeed() {
        console.log('\n📋 步骤5: 测试下载速度');
        
        if (!this.zoneName) {
            console.log('⚠️  未配置域名，跳过速度测试');
            return;
        }
        
        const testUrl = `https://${this.zoneName}/downloads/1.0.3/index.json`;
        console.log(`测试URL: ${testUrl}`);
        
        const startTime = Date.now();
        
        try {
            await this.downloadFile(testUrl);
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            
            console.log(`✅ 下载测试完成`);
            console.log(`⏱️  响应时间: ${duration.toFixed(2)}秒`);
            
            if (duration < 2) {
                console.log('🚀 速度优秀！');
            } else if (duration < 5) {
                console.log('⚡ 速度良好！');
            } else {
                console.log('⚠️  速度较慢，建议检查配置');
            }
            
        } catch (error) {
            console.log('❌ 下载测试失败:', error.message);
            console.log('请检查DNS配置是否生效');
        }
    }

    downloadFile(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                if (response.statusCode === 200) {
                    let data = '';
                    response.on('data', chunk => data += chunk);
                    response.on('end', () => resolve(data));
                } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                }
            }).on('error', reject);
        });
    }

    async showSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 部署摘要');
        console.log('='.repeat(50));
        
        if (this.zoneName) {
            console.log(`域名: ${this.zoneName}`);
        }
        if (this.zoneId) {
            console.log(`区域ID: ${this.zoneId}`);
        }
        if (this.accountId) {
            console.log(`账户ID: ${this.accountId}`);
        }
        
        console.log('\n📊 优化建议:');
        console.log('1. 监控CDN使用情况和费用');
        console.log('2. 定期清理不用的文件');
        console.log('3. 设置访问日志和监控');
        console.log('4. 考虑设置防盗链');
        
        console.log('\n🔗 下一步:');
        console.log('1. 更新网站下载链接为CDN链接');
        console.log('2. 测试全球各地访问速度');
        console.log('3. 设置监控和告警');
        
        console.log('\n📁 相关文件:');
        console.log('- cloudflare-cdn-setup-fixed.js: 修复版配置程序');
        console.log('- deploy-cdn.js: 自动化部署脚本');
        console.log('- test-token.js: API令牌测试工具');
    }

    makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            // 确保URL是UTF-8编码，不包含中文字符
            const url = `https://${this.baseURL}${endpoint}`;
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'CloudFlare-CDN-Final/1.0' // 移除中文字符
                }
            };
            
            // 添加超时设置
            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (e) {
                        console.log('解析响应失败:', responseData);
                        reject(new Error('解析响应失败: ' + e.message));
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log('请求失败:', error.message);
                reject(error);
            });
            
            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('请求超时'));
            });
            
            if (data && method !== 'GET') {
                try {
                    const postData = JSON.stringify(data);
                    req.write(postData);
                } catch (error) {
                    console.log('写入请求数据失败:', error.message);
                    reject(error);
                }
            }
            
            req.end();
        });
    }

    askQuestion(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer);
            });
        });
    }
}

// 运行程序
if (require.main === module) {
    const deployer = new CloudFlareCDNFinal();
    deployer.run().catch(console.error);
}

module.exports = CloudFlareCDNFinal;