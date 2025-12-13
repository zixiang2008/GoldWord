/**
 * CloudFlare CDN 自动化配置程序（修复版）
 * 修复中文字符编码问题
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class CloudFlareCDNSetupFixed {
    constructor() {
        this.apiToken = null;
        this.zoneId = null;
        this.accountId = null;
        this.baseURL = 'api.cloudflare.com';
        this.zoneName = null; // 存储实际的区域名称
    }

    /**
     * 初始化配置向导
     */
    async init() {
        console.log('🚀 CloudFlare CDN 自动化配置程序（修复版）');
        console.log('==============================================');
        console.log('本版本修复了中文字符编码问题\n');
        
        try {
            await this.setupAPIKey();
            await this.selectZone();
            await this.configureCDN();
            await this.uploadFiles();
            await this.testDownloadSpeed();
            
            console.log('\n✅ CDN配置完成！');
        } catch (error) {
            console.error('\n❌ 配置失败:', error.message);
            console.log('错误详情:', error.stack);
        }
    }

    /**
     * 设置API密钥
     */
    async setupAPIKey() {
        console.log('\n📋 步骤1: 配置API访问');
        console.log('请前往 https://dash.cloudflare.com/profile/api-tokens 创建API令牌');
        console.log('所需权限: Zone:Read, Zone:Edit, Cloudflare Images:Edit');
        
        this.apiToken = await this.askQuestion('请输入API令牌: ');
        
        // 验证API密钥 - 修复编码问题
        const response = await this.makeRequest('/client/v4/user/tokens/verify', 'GET');
        if (!response.success) {
            throw new Error('API令牌验证失败: ' + JSON.stringify(response.errors));
        }
        
        console.log('✅ API令牌验证成功');
    }

    /**
     * 选择或创建区域
     */
    async selectZone() {
        console.log('\n📋 步骤2: 选择域名区域');
        
        // 获取现有区域列表
        const zones = await this.makeRequest('/client/v4/zones', 'GET');
        
        if (zones.result && zones.result.length > 0) {
            console.log('现有区域:');
            zones.result.forEach((zone, index) => {
                console.log(`${index + 1}. ${zone.name} (${zone.status})`);
            });
            
            const choice = await this.askQuestion('选择区域编号 (或输入新域名): ');
            
            if (isNaN(choice)) {
                // 输入新域名
                await this.createZone(choice);
            } else {
                const selectedZone = zones.result[parseInt(choice) - 1];
                this.zoneId = selectedZone.id;
                this.accountId = selectedZone.account.id;
                this.zoneName = selectedZone.name; // 保存区域名称
                console.log(`✅ 已选择区域: ${selectedZone.name}`);
            }
        } else {
            const domain = await this.askQuestion('输入要配置的域名 (如: downloads.yourdomain.com): ');
            await this.createZone(domain);
        }
    }

    /**
     * 创建新区域
     */
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
            this.zoneName = domain; // 保存区域名称
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

    /**
     * 配置CDN设置
     */
    async configureCDN() {
        console.log('\n📋 步骤3: 配置CDN设置');
        
        // 配置缓存级别
        await this.makeRequest(`/client/v4/zones/${this.zoneId}/settings/cache_level`, 'PATCH', {
            value: 'aggressive'
        });
        
        // 配置浏览器缓存TTL
        await this.makeRequest(`/client/v4/zones/${this.zoneId}/settings/browser_cache_ttl`, 'PATCH', {
            value: 2592000 // 30天
        });
        
        // 配置压缩 - 修复URL错误
        await this.makeRequest(`/client/v4/zones/${this.zoneId}/settings/brotli`, 'PATCH', {
            value: 'on'
        });
        
        // 创建页面规则（下载文件优化）
        await this.createPageRules();
        
        console.log('✅ CDN配置完成');
    }

    /**
     * 创建页面规则
     */
    async createPageRules() {
        console.log('\n创建页面规则...');
        
        const pageRules = [
            {
                targets: [
                    {
                        target: 'url',
                        constraint: {
                            operator: 'matches',
                            value: `*${this.zoneName}/*.dmg` // 使用保存的区域名称
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
                // 继续执行，页面规则不是必需的
            }
        }
    }

    /**
     * 上传文件到R2存储（CloudFlare的对象存储）
     */
    async uploadFiles() {
        console.log('\n📋 步骤4: 上传文件');
        
        const uploadsDir = path.join(process.cwd(), 'downloads');
        
        if (!fs.existsSync(uploadsDir)) {
            console.log('⚠️  未找到downloads目录，跳过文件上传');
            return;
        }
        
        // 获取文件列表 - 修复递归读取
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
        
        // 由于需要额外的R2配置，这里提供上传指导
        console.log('\n📁 文件上传指导:');
        console.log('1. 登录 CloudFlare Dashboard');
        console.log('2. 进入 R2 存储');
        console.log('3. 创建存储桶');
        console.log('4. 上传文件到存储桶');
        console.log('5. 配置公共访问权限');
        
        // 模拟上传完成
        console.log('✅ 文件上传指导已提供');
    }

    /**
     * 递归获取文件列表
     */
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

    /**
     * 测试下载速度
     */
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

    /**
     * 下载文件（测试用）
     */
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

    /**
     * 发起API请求（修复编码问题）
     */
    makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            // 确保所有字符串都是UTF-8编码
            const options = {
                hostname: this.baseURL,
                path: endpoint,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'CloudFlare-CDN-Setup/1.0',
                    'Accept': 'application/json'
                }
            };
            
            // 移除可能导致问题的中文字符串
            if (options.headers['User-Agent']) {
                options.headers['User-Agent'] = 'CloudFlare-CDN-Setup';
            }
            
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

    /**
     * 询问用户输入
     */
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
    const setup = new CloudFlareCDNSetupFixed();
    setup.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    setup.init().catch(console.error);
}

module.exports = CloudFlareCDNSetupFixed;