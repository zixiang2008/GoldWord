#!/usr/bin/env node

/**
 * CloudFlare API 令牌测试工具
 * 快速验证令牌是否有效
 */

const https = require('https');

class TokenTester {
    constructor() {
        this.token = process.env.CLOUDFLARE_API_TOKEN;
    }

    async run() {
        console.log('🔍 CloudFlare API 令牌测试工具');
        console.log('=====================================');

        if (!this.token) {
            console.log('❌ 未找到 CLOUDFLARE_API_TOKEN 环境变量');
            console.log('请设置环境变量: export CLOUDFLARE_API_TOKEN="your_token_here"');
            return;
        }

        console.log('🧪 开始测试API令牌...\n');

        try {
            // 测试1: 验证令牌有效性
            console.log('测试1: 令牌有效性验证');
            const tokenValid = await this.testTokenValidity();
            
            if (!tokenValid.success) {
                console.log('❌ 令牌无效或已过期');
                return;
            }
            console.log('✅ 令牌有效');

            // 测试2: 获取用户信息
            console.log('\n测试2: 获取用户信息');
            const userInfo = await this.getUserInfo();
            if (userInfo.success) {
                console.log('✅ 用户信息获取成功');
                console.log(`   邮箱: ${userInfo.result.email}`);
                console.log(`   账户ID: ${userInfo.result.id}`);
            }

            // 测试3: 检查权限
            console.log('\n测试3: 权限检查');
            const permissions = await this.checkPermissions();
            this.displayPermissions(permissions);

            // 测试4: 获取区域列表
            console.log('\n测试4: 区域列表访问');
            const zones = await this.getZones();
            if (zones.success) {
                console.log(`✅ 区域访问正常，找到 ${zones.result.length} 个区域`);
                zones.result.slice(0, 3).forEach(zone => {
                    console.log(`   - ${zone.name} (${zone.status})`);
                });
                if (zones.result.length > 3) {
                    console.log(`   ... 还有 ${zones.result.length - 3} 个区域`);
                }
            }

            // 测试5: R2存储访问
            console.log('\n测试5: R2存储访问');
            const r2Access = await this.testR2Access();
            if (r2Access.success) {
                console.log('✅ R2存储访问正常');
            } else {
                console.log('⚠️  R2存储访问受限，可能需要额外权限');
            }

            console.log('\n🎉 测试完成！');
            console.log('\n📊 总结:');
            console.log('你的API令牌配置正确，可以正常使用自动化部署程序。');
            console.log('现在可以运行: node deploy-cdn.js');

        } catch (error) {
            console.log('\n❌ 测试失败:', error.message);
            this.showTroubleshootingTips();
        }
    }

    async testTokenValidity() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.cloudflare.com',
                path: '/client/v4/user/tokens/verify',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'CloudFlare-Token-Tester/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('解析响应失败'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => reject(new Error('请求超时')));
            req.end();
        });
    }

    async getUserInfo() {
        return this.makeAPIRequest('/client/v4/user');
    }

    async checkPermissions() {
        const tokenInfo = await this.makeAPIRequest('/client/v4/user/tokens/verify');
        return tokenInfo.result || {};
    }

    async getZones() {
        return this.makeAPIRequest('/client/v4/zones?per_page=10');
    }

    async testR2Access() {
        try {
            // 首先获取账户ID
            const userInfo = await this.getUserInfo();
            if (!userInfo.success) {
                return { success: false, error: '无法获取用户信息' };
            }

            const accountId = userInfo.result.id;
            
            // 尝试获取R2存储桶列表
            return await this.makeAPIRequest(`/client/v4/accounts/${accountId}/r2/buckets`);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    makeAPIRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.cloudflare.com',
                path: endpoint,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'CloudFlare-Token-Tester/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        reject(new Error('解析响应失败'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(15000, () => reject(new Error('请求超时')));
            req.end();
        });
    }

    displayPermissions(permissions) {
        if (!permissions.permissions) {
            console.log('⚠️  无法获取详细权限信息');
            return;
        }

        const perms = permissions.permissions;
        console.log('✅ 已配置的权限:');
        
        perms.forEach(perm => {
            console.log(`   - ${perm.resource}:`);
            perm.scopes.forEach(scope => {
                console.log(`     * ${scope}`);
            });
        });

        // 检查关键权限
        const hasZoneRead = perms.some(p => p.resource === 'com.cloudflare.api.account.zone' && p.scopes.includes('read'));
        const hasZoneEdit = perms.some(p => p.resource === 'com.cloudflare.api.account.zone' && p.scopes.includes('edit'));
        const hasR2Write = perms.some(p => p.resource === 'com.cloudflare.api.account.r2' && p.scopes.includes('write'));

        console.log('\n🔍 关键权限检查:');
        console.log(`   区域读取: ${hasZoneRead ? '✅' : '❌'}`);
        console.log(`   区域编辑: ${hasZoneEdit ? '✅' : '❌'}`);
        console.log(`   R2写入: ${hasR2Write ? '✅' : '❌'}`);

        if (!hasZoneRead || !hasZoneEdit || !hasR2Write) {
            console.log('\n⚠️  警告: 缺少关键权限，某些功能可能无法使用');
        }
    }

    showTroubleshootingTips() {
        console.log('\n🔧 故障排除建议:');
        console.log('');
        console.log('1. 检查令牌格式是否正确');
        console.log('   - 应为32位以上的字符串');
        console.log('   - 不应包含空格或特殊字符');
        console.log('');
        console.log('2. 检查令牌权限设置');
        console.log('   - 确保包含 Zone:Read, Zone:Edit');
        console.log('   - 确保包含 R2:Read, R2:Write');
        console.log('');
        console.log('3. 检查令牌状态');
        console.log('   - 登录 CloudFlare 控制台');
        console.log('   - 查看 API Tokens 页面');
        console.log('   - 确认令牌状态为 Active');
        console.log('');
        console.log('4. 重新创建令牌');
        console.log('   - 如果令牌过期或权限不足');
        console.log('   - 按照之前的指导重新创建');
        console.log('');
        console.log('5. 网络连接检查');
        console.log('   - 确保能访问 api.cloudflare.com');
        console.log('   - 检查防火墙或代理设置');
    }
}

// 运行测试
if (require.main === module) {
    const tester = new TokenTester();
    tester.run().catch(console.error);
}

module.exports = TokenTester;