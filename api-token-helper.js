#!/usr/bin/env node

/**
 * CloudFlare API 令牌配置助手
 * 交互式指导用户完成令牌创建
 */

const readline = require('readline');
const https = require('https');

class APITokenHelper {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🎯 CloudFlare API 令牌配置助手');
        console.log('=====================================');
        console.log('本助手将指导你完成API令牌的创建过程\n');

        await this.showPrerequisites();
        await this.guideThroughProcess();
        await this.testToken();
        
        this.rl.close();
    }

    async showPrerequisites() {
        console.log('📋 前置条件检查:');
        console.log('1. ✅ 已注册CloudFlare账户');
        console.log('2. ✅ 已登录CloudFlare控制台');
        console.log('3. ⏳ 准备创建API令牌\n');
        
        await this.askQuestion('按回车继续...');
    }

    async guideThroughProcess() {
        console.log('\n📝 步骤1: 进入API令牌页面');
        console.log('1. 访问: https://dash.cloudflare.com/profile/api-tokens');
        console.log('2. 点击 "Create Token" 按钮\n');
        
        await this.askQuestion('完成后按回车继续...');

        console.log('\n⚙️ 步骤2: 选择令牌类型');
        console.log('选择: "Custom token" (自定义令牌)\n');
        
        await this.askQuestion('完成后按回车继续...');

        console.log('\n🔐 步骤3: 配置权限 (重要!)');
        console.log('需要配置以下权限:');
        console.log('');
        console.log('【区域权限 (Zone)】');
        console.log('  - Zone:Read      (读取区域信息)');
        console.log('  - Zone:Edit      (编辑区域设置)');
        console.log('');
        console.log('【账户权限 (Account)】');
        console.log('  - Account:Read   (读取账户信息)');
        console.log('');
        console.log('【R2存储权限 (R2)】');
        console.log('  - R2:Read        (读取R2存储)');
        console.log('  - R2:Write       (写入R2存储)');
        console.log('');
        
        await this.askQuestion('配置完成后按回车继续...');

        console.log('\n🌍 步骤4: 配置资源范围');
        console.log('资源范围设置:');
        console.log('  - Zone Resources: Include All zones');
        console.log('  - Account Resources: Include All accounts');
        console.log('  - R2 Resources: Include All buckets');
        console.log('');
        
        await this.askQuestion('完成后按回车继续...');

        console.log('\n⏰ 步骤5: 其他设置');
        console.log('  - TTL: 可以设置为1年或永不过期');
        console.log('  - IP Address Filtering: 留空');
        console.log('  - Account Role: 保持默认');
        console.log('');
        
        await this.askQuestion('完成后按回车继续...');

        console.log('\n✅ 步骤6: 创建令牌');
        console.log('1. 点击 "Continue to summary"');
        console.log('2. 确认权限配置正确');
        console.log('3. 点击 "Create Token"');
        console.log('4. ⚠️ 立即复制保存令牌！（只显示一次）');
        console.log('');
        
        const token = await this.askQuestion('输入你的API令牌: ');
        
        if (token && token.length > 20) {
            console.log('\n✅ API令牌已接收！');
            console.log('正在验证令牌有效性...');
            
            // 保存到环境变量建议
            console.log('\n💾 保存建议:');
            console.log('临时使用: export CLOUDFLARE_API_TOKEN="' + token + '"');
            console.log('永久保存: 添加到 ~/.bashrc 或 ~/.zshrc');
            console.log('');
            
            this.token = token;
        } else {
            console.log('\n❌ 令牌格式不正确，请重新创建');
        }
    }

    async testToken() {
        if (!this.token) {
            console.log('没有令牌需要测试');
            return;
        }

        console.log('\n🧪 测试API令牌...');
        
        try {
            const response = await this.verifyToken(this.token);
            
            if (response.success) {
                console.log('✅ 令牌验证成功！');
                console.log('📧 账户邮箱: ' + response.result.status);
                
                // 获取用户信息
                const userInfo = await this.getUserInfo(this.token);
                if (userInfo.success) {
                    console.log('👤 用户名: ' + userInfo.result.email);
                    console.log('🏢 账户ID: ' + userInfo.result.id);
                }
                
                console.log('\n🎉 配置完成！');
                console.log('现在你可以运行: node deploy-cdn.js');
                
            } else {
                console.log('❌ 令牌验证失败: ' + JSON.stringify(response.errors));
            }
            
        } catch (error) {
            console.log('❌ 测试失败: ' + error.message);
        }
    }

    async verifyToken(token) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.cloudflare.com',
                path: '/client/v4/user/tokens/verify',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
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
                        reject(new Error('解析响应失败'));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    async getUserInfo(token) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.cloudflare.com',
                path: '/client/v4/user',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
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
                        reject(new Error('解析响应失败'));
                    }
                });
            });

            req.on('error', reject);
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

// 运行助手
if (require.main === module) {
    const helper = new APITokenHelper();
    helper.start().catch(console.error);
}

module.exports = APITokenHelper;