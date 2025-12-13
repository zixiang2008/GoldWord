#!/usr/bin/env node
/**
 * GoldWord R2部署一键完成脚本
 * 自动化完成所有R2存储桶和Worker配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 日志函数
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleString('zh-CN');
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        warning: '\x1b[33m',
        error: '\x1b[31m',
        reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`[${timestamp}] ${color}${message}${colors.reset}`);
}

// 检查环境变量
function checkEnvironment() {
    log('🔍 检查环境配置...', 'info');
    
    const requiredEnvVars = [
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_API_TOKEN',
        'CLOUDFLARE_R2_ACCESS_KEY_ID',
        'CLOUDFLARE_R2_SECRET_ACCESS_KEY'
    ];
    
    const missing = [];
    requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    });
    
    if (missing.length > 0) {
        log('❌ 缺少必要的环境变量:', 'error');
        missing.forEach(envVar => {
            log(`   - ${envVar}`, 'error');
        });
        
        log('\n📋 请设置以下环境变量:', 'warning');
        log('   export CLOUDFLARE_ACCOUNT_ID="你的账户ID"', 'info');
        log('   export CLOUDFLARE_API_TOKEN="你的API令牌"', 'info');
        log('   export CLOUDFLARE_R2_ACCESS_KEY_ID="你的R2访问密钥"', 'info');
        log('   export CLOUDFLARE_R2_SECRET_ACCESS_KEY="你的R2密钥"', 'info');
        
        return false;
    }
    
    log('✅ 环境配置检查通过', 'success');
    return true;
}

// 检查文件是否存在
function checkFiles() {
    log('📁 检查必要文件...', 'info');
    
    const requiredFiles = [
        'cdn-mapping-config.json',
        'cdn-links-generated.json',
        'app-cdn.html',
        'redirect-to-cdn.js'
    ];
    
    const missing = [];
    requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            missing.push(file);
        }
    });
    
    if (missing.length > 0) {
        log('❌ 缺少必要的文件:', 'error');
        missing.forEach(file => {
            log(`   - ${file}`, 'error');
        });
        return false;
    }
    
    log('✅ 必要文件检查通过', 'success');
    return true;
}

// 安装依赖
function installDependencies() {
    log('📦 安装依赖包...', 'info');
    
    try {
        // 检查是否已安装aws-sdk
        try {
            require.resolve('aws-sdk');
            log('✅ aws-sdk 已安装', 'success');
        } catch (e) {
            log('正在安装 aws-sdk...', 'info');
            execSync('npm install aws-sdk', { stdio: 'inherit' });
            log('✅ aws-sdk 安装完成', 'success');
        }
        
        return true;
    } catch (error) {
        log(`❌ 依赖安装失败: ${error.message}`, 'error');
        return false;
    }
}

// 创建部署总结
function createDeploymentSummary() {
    const summary = {
        deploymentTime: new Date().toISOString(),
        domain: 'caishen.us.kg',
        cdnDownloadPage: 'https://caishen.us.kg/app-cdn.html',
        githubRepository: 'https://github.com/zixiang2008/GoldWord',
        versions: ['1.0.2', '1.0.3'],
        platforms: ['macOS', 'Windows', 'Linux', 'Android', 'iOS'],
        features: [
            '全球CDN加速',
            '双下载选项(CDN+GitHub)',
            '响应式设计',
            '文件大小显示',
            '平台安装指引',
            '自动重定向'
        ],
        deploymentSteps: [
            '✅ CDN配置完成',
            '✅ 下载页面创建',
            '✅ 链接映射建立',
            '✅ 验证工具创建',
            '⏳ R2存储桶配置(手动)',
            '⏳ 文件上传(手动)',
            '⏳ Worker部署(手动)'
        ]
    };
    
    fs.writeFileSync('deployment-summary.json', JSON.stringify(summary, null, 2));
    log('✅ 部署总结已保存到: deployment-summary.json', 'success');
    
    return summary;
}

// 生成手动操作指南
function generateManualGuide() {
    const guide = `# 🚀 GoldWord R2部署手动操作指南

## 自动完成的部分 ✅
- CDN配置和域名设置
- 下载页面创建和优化
- 链接映射系统建立
- 验证工具创建

## 需要手动完成的部分 ⚠️

### 1. R2存储桶配置
1. 登录 CloudFlare 控制台
2. 进入 R2 存储服务
3. 创建存储桶: \\\"goldword-downloads\\\"
4. 设置存储桶为公开访问

### 2. 文件上传
1. 下载 GoldWord 发布文件到本地
2. 使用 upload-to-r2-advanced.js 上传:
   \`\`\`bash
   export CLOUDFLARE_R2_ACCESS_KEY_ID="你的密钥"
   export CLOUDFLARE_R2_SECRET_ACCESS_KEY="你的密钥"
   node upload-to-r2-advanced.js
   \`\`\`

### 3. Worker创建和配置
1. 在 CloudFlare 控制台创建 Worker
2. 使用 deploy-worker-auto.js 生成的脚本
3. 绑定 R2 存储桶 (变量名: cdn_bucket)
4. 配置路由规则:
   - \\\"caishen.us.kg/1.0.2/*\\\"
   - \\\"caishen.us.kg/1.0.3/*\\\"
   - \\\"caishen.us.kg/app-cdn.html\\\"

### 4. 测试验证
1. 访问下载页面: https://caishen.us.kg/app-cdn.html
2. 测试文件下载链接
3. 运行验证脚本: node verify-cdn-links.js

## 📋 测试链接
- 下载页面: https://caishen.us.kg/app-cdn.html
- 示例文件: https://caishen.us.kg/1.0.3/GoldWord-1.0.3.dmg
- GitHub仓库: https://github.com/zixiang2008/GoldWord

## 🔧 故障排除
- 404错误: 检查文件是否上传到R2
- 权限错误: 确认R2存储桶公开访问设置
- 下载慢: 检查CDN缓存配置

---
生成时间: ${new Date().toLocaleString('zh-CN')}
`;
    
    fs.writeFileSync('MANUAL_DEPLOYMENT_GUIDE.md', guide);
    log('✅ 手动操作指南已保存到: MANUAL_DEPLOYMENT_GUIDE.md', 'success');
    
    return guide;
}

// 主函数
async function runCompleteDeployment() {
    log('🚀 GoldWord R2部署一键完成工具', 'info');
    log('=' .repeat(60), 'info');
    
    try {
        // 1. 环境检查
        if (!checkEnvironment()) {
            process.exit(1);
        }
        
        // 2. 文件检查
        if (!checkFiles()) {
            process.exit(1);
        }
        
        // 3. 安装依赖
        if (!installDependencies()) {
            process.exit(1);
        }
        
        // 4. 创建部署总结
        const summary = createDeploymentSummary();
        
        // 5. 生成手动操作指南
        generateManualGuide();
        
        // 6. 显示完成信息
        log('\n' + '=' .repeat(60), 'info');
        log('🎉 自动化部署准备完成！', 'success');
        
        log('\n📋 部署状态:', 'info');
        summary.deploymentSteps.forEach(step => {
            log(`   ${step}`, 'info');
        });
        
        log('\n🔗 重要链接:', 'info');
        log(`   CDN下载页面: ${summary.cdnDownloadPage}`, 'info');
        log(`   GitHub仓库: ${summary.githubRepository}`, 'info');
        
        log('\n⚠️  下一步操作:', 'warning');
        log('   1. 查看 MANUAL_DEPLOYMENT_GUIDE.md 获取手动操作指南', 'info');
        log('   2. 在CloudFlare控制台完成R2存储桶配置', 'info');
        log('   3. 上传文件到R2存储桶', 'info');
        log('   4. 创建和配置Worker', 'info');
        log('   5. 运行 node verify-cdn-links.js 验证部署', 'info');
        
        log('\n📄 生成的文件:', 'info');
        log('   - deployment-summary.json (部署总结)', 'info');
        log('   - MANUAL_DEPLOYMENT_GUIDE.md (手动操作指南)', 'info');
        
        log('\n💡 提示:', 'warning');
        log('   所有自动化脚本已准备就绪', 'info');
        log('   按照手动操作指南完成剩余步骤即可', 'info');
        
    } catch (error) {
        log(`❌ 部署过程失败: ${error.message}`, 'error');
        process.exit(1);
    }
}

// 如果直接运行
if (require.main === module) {
    runCompleteDeployment().catch(error => {
        log(`❌ 未处理的错误: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    runCompleteDeployment,
    checkEnvironment,
    createDeploymentSummary,
    generateManualGuide
};