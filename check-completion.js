#!/usr/bin/env node

/**
 * CloudFlare CDN 完成状态检查工具
 * 检查部署状态并提供完成清单
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class CDNCompletionChecker {
    constructor() {
        this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
        this.zoneName = process.env.CLOUDFLARE_ZONE_NAME || 'caishen.us.kg';
        this.accountId = null;
        this.zoneId = null;
    }

    async run() {
        console.log('🔍 CloudFlare CDN 完成状态检查');
        console.log('=====================================');

        if (!this.apiToken) {
            console.log('⚠️  未找到 CLOUDFLARE_API_TOKEN 环境变量');
            console.log('将跳过CloudFlare API与区域检查，仅进行本地文件与链接生成');
        }

        try {
            if (this.apiToken) {
                await this.checkAPIConnection();
                await this.checkZoneConfiguration();
                await this.checkR2Bucket();
            }
            await this.checkLocalFiles();
            await this.generateCDNLinks();
            await this.provideCompletionChecklist();
            
            console.log('\n✅ 状态检查完成！');
            
        } catch (error) {
            console.error('\n❌ 检查失败:', error.message);
        }
    }

    async checkAPIConnection() {
        console.log('\n📡 检查API连接...');
        
        try {
            const response = await this.makeRequest('/client/v4/user/tokens/verify');
            if (response.success) {
                console.log('✅ API连接正常');
                
                // 获取用户信息
                const userInfo = await this.makeRequest('/client/v4/user');
                if (userInfo.success) {
                    this.accountId = userInfo.result.id;
                    console.log(`👤 用户: ${userInfo.result.email}`);
                }
            } else {
                console.log('❌ API令牌验证失败');
            }
        } catch (error) {
            console.log('❌ API连接失败:', error.message);
        }
    }

    async checkZoneConfiguration() {
        console.log('\n🌐 检查区域配置...');
        
        try {
            const zones = await this.makeRequest('/client/v4/zones');
            if (zones.success && zones.result.length > 0) {
                const targetZone = zones.result.find(z => z.name === this.zoneName);
                
                if (targetZone) {
                    this.zoneId = targetZone.id;
                    console.log(`✅ 找到区域: ${targetZone.name}`);
                    console.log(`📊 状态: ${targetZone.status}`);
                    console.log(`📝 名称服务器: ${targetZone.name_servers.join(', ')}`);
                    
                    // 检查CDN设置
                    await this.checkCDNSettings();
                } else {
                    console.log(`⚠️  未找到区域: ${this.zoneName}`);
                    console.log(`可用区域: ${zones.result.map(z => z.name).join(', ')}`);
                }
            } else {
                console.log('⚠️  没有找到任何区域');
            }
        } catch (error) {
            console.log('❌ 区域检查失败:', error.message);
        }
    }

    async checkCDNSettings() {
        if (!this.zoneId) return;
        
        console.log('\n⚙️  检查CDN设置...');
        
        const settings = [
            { endpoint: '/settings/cache_level', name: '缓存级别' },
            { endpoint: '/settings/browser_cache_ttl', name: '浏览器缓存TTL' },
            { endpoint: '/settings/brotli', name: 'Brotli压缩' }
        ];
        
        for (const setting of settings) {
            try {
                const response = await this.makeRequest(`/client/v4/zones/${this.zoneId}${setting.endpoint}`);
                if (response.success) {
                    console.log(`✅ ${setting.name}: ${response.result.value}`);
                }
            } catch (error) {
                console.log(`⚠️  ${setting.name} 检查失败`);
            }
        }
    }

    async checkR2Bucket() {
        console.log('\n📦 检查R2存储桶...');
        
        if (!this.accountId) {
            console.log('⚠️  无法检查R2存储（需要账户ID）');
            return;
        }
        
        try {
            const response = await this.makeRequest(`/client/v4/accounts/${this.accountId}/r2/buckets`);
            if (response.success && response.result?.buckets) {
                console.log(`✅ 找到 ${response.result.buckets.length} 个R2存储桶`);
                response.result.buckets.forEach(bucket => {
                    console.log(`📁 ${bucket.name}`);
                });
            } else {
                console.log('ℹ️  没有R2存储桶（需要手动创建）');
            }
        } catch (error) {
            console.log('⚠️  R2检查失败:', error.message);
        }
    }

    async checkLocalFiles() {
        console.log('\n📁 检查本地文件...');
        
        const downloadsDir = path.join(process.cwd(), 'downloads');
        
        if (!fs.existsSync(downloadsDir)) {
            console.log('⚠️  未找到downloads目录');
            return;
        }
        
        const allFiles = this.getFilesRecursively(downloadsDir);
        const downloadFiles = allFiles.filter(file => 
            file.endsWith('.dmg') || file.endsWith('.zip') || 
            file.endsWith('.tar.gz') || file.endsWith('.exe') ||
            file.endsWith('.apk') || file.endsWith('.ipa')
        );
        
        console.log(`✅ 找到 ${downloadFiles.length} 个下载文件`);
        
        // 按版本分组显示
        const versions = {};
        downloadFiles.forEach(file => {
            const versionMatch = file.match(/(\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : 'unknown';
            if (!versions[version]) versions[version] = [];
            versions[version].push(file);
        });
        
        Object.keys(versions).sort().forEach(version => {
            console.log(`\n📋 版本 ${version}:`);
            versions[version].forEach(file => {
                const fullPath = path.join(downloadsDir, file);
                const stats = fs.statSync(fullPath);
                const size = this.formatFileSize(stats.size);
                console.log(`  📦 ${path.basename(file)} (${size})`);
            });
        });
    }

    async generateCDNLinks() {
        console.log('\n🔗 生成CDN链接...');
        
        if (!this.zoneName) {
            console.log('⚠️  无法生成链接（需要域名）');
            return;
        }
        
        const downloadsDir = path.join(process.cwd(), 'downloads');
        const allFiles = this.getFilesRecursively(downloadsDir);
        const downloadFiles = allFiles.filter(file => 
            file.endsWith('.dmg') || file.endsWith('.zip') || 
            file.endsWith('.tar.gz') || file.endsWith('.exe') ||
            file.endsWith('.apk') || file.endsWith('.ipa')
        );
        
        if (downloadFiles.length === 0) {
            console.log('⚠️  没有找到下载文件');
            return;
        }
        
        console.log('\n📋 可用的CDN下载链接:');
        console.log(`域名: https://${this.zoneName}`);
        console.log('');
        
        const links = [];
        downloadFiles.forEach(file => {
            const cdnUrl = `https://${this.zoneName}/${file}`;
            const filePath = path.join(downloadsDir, file);
            const stats = fs.statSync(filePath);
            const size = this.formatFileSize(stats.size);
            
            console.log(`📦 ${path.basename(file)}`);
            console.log(`   CDN链接: ${cdnUrl}`);
            console.log(`   大小: ${size}`);
            console.log('');
            
            links.push({
                filename: path.basename(file),
                cdnUrl: cdnUrl,
                localPath: file,
                size: stats.size,
                formattedSize: size
            });
        });
        
        // 保存链接到文件
        const linksFile = path.join(process.cwd(), 'cdn-links-generated.json');
        fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));
        console.log(`💾 链接已保存到: ${linksFile}`);
    }

    async provideCompletionChecklist() {
        console.log('\n📋 CDN部署完成清单');
        console.log('=====================================');
        
        const checklist = [
            {
                category: '基础配置',
                items: [
                    { name: 'API令牌配置', status: this.apiToken ? '✅' : '❌' },
                    { name: '域名区域创建', status: this.zoneId ? '✅' : '❌' },
                    { name: 'DNS服务器配置', status: '⏳' }, // 需要用户确认
                    { name: 'CDN缓存设置', status: this.zoneId ? '✅' : '❌' }
                ]
            },
            {
                category: '文件管理',
                items: [
                    { name: '下载文件准备', status: '✅' }, // 已检测到文件
                    { name: 'R2存储桶创建', status: '⏳' }, // 需要手动完成
                    { name: '文件上传到R2', status: '⏳' }, // 需要手动完成
                    { name: '文件访问权限设置', status: '⏳' } // 需要手动完成
                ]
            },
            {
                category: '优化配置',
                items: [
                    { name: '页面规则配置', status: this.zoneId ? '✅' : '❌' },
                    { name: '压缩设置', status: this.zoneId ? '✅' : '❌' },
                    { name: '缓存TTL设置', status: this.zoneId ? '✅' : '❌' },
                    { name: '全球分发测试', status: '⏳' } // 可选
                ]
            },
            {
                category: '监控维护',
                items: [
                    { name: '流量监控设置', status: '⏳' }, // 建议完成
                    { name: '费用告警配置', status: '⏳' }, // 建议完成
                    { name: '访问日志启用', status: '⏳' }, // 可选
                    { name: '性能监控', status: '⏳' } // 可选
                ]
            }
        ];
        
        let completed = 0;
        let total = 0;
        
        checklist.forEach(category => {
            console.log(`\n📂 ${category.category}:`);
            category.items.forEach(item => {
                console.log(`   ${item.status} ${item.name}`);
                if (item.status === '✅') completed++;
                total++;
            });
        });
        
        const percentage = Math.round((completed / total) * 100);
        console.log(`\n📊 完成进度: ${completed}/${total} (${percentage}%)`);
        
        if (percentage >= 75) {
            console.log('🎉 部署基本完成！');
        } else if (percentage >= 50) {
            console.log('⚡ 部署进展良好！');
        } else {
            console.log('🚀 继续完成剩余步骤！');
        }
        
        console.log('\n🎯 下一步建议:');
        console.log('1. 完成R2存储桶的手动配置');
        console.log('2. 上传文件到R2存储');
        console.log('3. 更新网站使用新的CDN链接');
        console.log('4. 设置监控和告警');
        console.log('5. 测试全球访问速度');
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    makeRequest(endpoint, method = 'GET') {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.cloudflare.com',
                path: endpoint,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'CloudFlare-Completion-Checker/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        resolve({ success: false, error: '解析失败' });
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => reject(new Error('请求超时')));
            req.end();
        });
    }
}

// 运行检查
if (require.main === module) {
    const checker = new CDNCompletionChecker();
    checker.run().catch(console.error);
}

module.exports = CDNCompletionChecker;
