#!/usr/bin/env node

/**
 * CloudFlare API 令牌配置助手（中文版）
 * 专为中文界面用户设计的交互式指导
 */

const readline = require('readline');
const https = require('https');

class ChineseAPITokenHelper {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🎯 CloudFlare API 令牌配置助手（中文版）');
        console.log('=============================================');
        console.log('本助手将指导你完成中文界面下的API令牌创建\n');

        await this.showChineseInstructions();
        await this.guideChineseProcess();
        await this.testChineseToken();
        
        this.rl.close();
    }

    async showChineseInstructions() {
        console.log('📋 中文界面操作说明:');
        console.log('1. 登录后点击右上角头像 → "我的个人资料"');
        console.log('2. 点击 "API 令牌" 标签页');
        console.log('3. 点击 "创建令牌" 按钮');
        console.log('4. 选择 "自定义令牌"');
        console.log('');
        console.log('⚠️  注意: 中文界面和英文界面功能完全相同');
        console.log('    只是显示语言不同，请放心操作');
        console.log('');
        
        await this.askQuestion('按回车继续...');
    }

    async guideChineseProcess() {
        console.log('\n📝 中文界面步骤1: 进入API令牌页面');
        console.log('1. 访问: https://dash.cloudflare.com/profile/api-tokens');
        console.log('2. 点击 "创建令牌" 按钮');
        console.log('3. 界面显示为中文，但位置相同');
        console.log('');
        console.log('💡 提示: 如果页面是英文，可以在右上角切换语言');
        console.log('');
        
        await this.askQuestion('完成后按回车继续...');

        console.log('\n⚙️ 中文界面步骤2: 权限配置（重要！）');
        console.log('在中文界面下，权限名称显示为:');
        console.log('');
        console.log('【区域权限】');
        console.log('  - 区域:读取 (Zone:Read)');
        console.log('  - 区域:编辑 (Zone:Edit)');
        console.log('');
        console.log('【账户权限】');
        console.log('  - 账户:读取 (Account:Read)');
        console.log('');
        console.log('【R2存储权限】');
        console.log('  - R2:读取 (R2:Read)');
        console.log('  - R2:写入 (R2:Write)');
        console.log('');
        console.log('🔍 查找技巧: 在权限下拉框中输入中文关键词');
        console.log('   输入"区域"快速找到Zone权限');
        console.log('   输入"账户"找到Account权限');
        console.log('   输入"R2"找到R2存储权限');
        
        await this.askQuestion('配置完成后按回车继续...');

        console.log('\n🌍 中文界面步骤3: 资源范围设置');
        console.log('中文界面下的资源范围选项:');
        console.log('');
        console.log('【区域资源】');
        console.log('  - 包含所有区域 (Include All zones)');
        console.log('');
        console.log('【账户资源】');
        console.log('  - 包含所有账户 (Include All accounts)');
        console.log('');
        console.log('【R2资源】');
        console.log('  - 包含所有存储桶 (Include All buckets)');
        console.log('');
        console.log('✅ 确保选择正确的资源范围');
        
        await this.askQuestion('完成后按回车继续...');

        console.log('\n⏰ 中文界面步骤4: 创建令牌');
        console.log('1. 点击 "继续查看摘要"');
        console.log('2. 确认权限配置正确');
        console.log('3. 点击 "创建令牌"');
        console.log('4. ⚠️ 立即复制保存令牌！（只显示一次）');
        console.log('');
        console.log('💾 保存建议:');
        console.log('   - 临时使用: 复制到剪贴板');
        console.log('   - 长期保存: 添加到环境变量');
        console.log('   - 安全存储: 使用密码管理器');
        
        const token = await this.askQuestion('输入你的API令牌: ');
        
        if (token && token.length > 20) {
            console.log('\n✅ API令牌已接收！');
            console.log('正在验证令牌有效性...');
            
            // 保存到环境变量建议
            console.log('\n💾 环境变量设置:');
            console.log('临时使用:');
            console.log('  export CLOUDFLARE_API_TOKEN="' + token + '"');
            console.log('');
            console.log('永久保存 (Linux/Mac):');
            console.log('  echo \'export CLOUDFLARE_API_TOKEN="' + token + '"\' >> ~/.bashrc');
            console.log('  source ~/.bashrc');
            console.log('');
            console.log('永久保存 (Mac zsh):');
            console.log('  echo \'export CLOUDFLARE_API_TOKEN="' + token + '"\' >> ~/.zshrc');
            console.log('  source ~/.zshrc');
            
            this.token = token;
        } else {
            console.log('\n❌ 令牌格式不正确，请重新创建');
        }
    }

    async testChineseToken() {
        if (!this.token) {
            console.log('没有令牌需要测试');
            return;
        }

        console.log('\n🧪 测试中文界面创建的API令牌...');
        
        try {
            const response = await this.verifyToken(this.token);
            
            if (response.success) {
                console.log('✅ 令牌验证成功！');
                console.log('📧 令牌状态: ' + response.result.status);
                
                // 获取用户信息
                const userInfo = await this.getUserInfo(this.token);
                if (userInfo.success) {
                    console.log('👤 用户邮箱: ' + userInfo.result.email);
                    console.log('🏢 账户ID: ' + userInfo.result.id);
                }
                
                console.log('\n🎉 中文界面配置完成！');
                console.log('现在你可以运行自动化部署程序:');
                console.log('  node deploy-cdn.js');
                console.log('');
                console.log('📚 相关文档:');
                console.log('  - CLOUDFLARE_CDN_SETUP.md: 部署指南');
                console.log('  - API_SECURITY_GUIDE.md: 安全指南');
                
            } else {
                console.log('❌ 令牌验证失败: ' + JSON.stringify(response.errors));
                this.showChineseTroubleshooting();
            }
            
        } catch (error) {
            console.log('❌ 测试失败: ' + error.message);
            this.showChineseTroubleshooting();
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

    showChineseTroubleshooting() {
        console.log('\n🔧 中文界面故障排除:');
        console.log('');
        console.log('1. 检查令牌格式:');
        console.log('   - 应为32位以上的字符串');
        console.log('   - 不应包含空格或特殊字符');
        console.log('');
        console.log('2. 检查中文界面权限设置:');
        console.log('   - 区域:读取 ✅');
        console.log('   - 区域:编辑 ✅');
        console.log('   - 账户:读取 ✅');
        console.log('   - R2:读取 ✅');
        console.log('   - R2:写入 ✅');
        console.log('');
        console.log('3. 检查资源范围:');
        console.log('   - 包含所有区域 ✅');
        console.log('   - 包含所有账户 ✅');
        console.log('   - 包含所有存储桶 ✅');
        console.log('');
        console.log('4. 重新创建令牌:');
        console.log('   - 如果令牌无效或权限不足');
        console.log('   - 按照之前的指导重新创建');
        console.log('');
        console.log('5. 语言切换:');
        console.log('   - 如需要可切换为英文界面');
        console.log('   - 右上角头像 → Account → Language');
    }

    askQuestion(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer);
            });
        });
    }
}

// 运行中文助手
if (require.main === module) {
    const helper = new ChineseAPITokenHelper();
    helper.start().catch(console.error);
}

module.exports = ChineseAPITokenHelper;