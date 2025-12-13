#!/usr/bin/env node

/**
 * GoldWord CDN Production Deployment Script
 * 最终生产环境部署脚本
 * 
 * 功能:
 * - 验证所有文件完整性
 * - 检查重定向配置
 * - 验证本地服务器
 * - 生成部署报告
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
    productionUrl: 'https://caishen.us.kg/app-cdn.html',
    localUrl: 'http://localhost:8080/app-cdn.html',
    requiredFiles: [
        'app-cdn.html',
        '_redirects',
        'netlify.toml',
        'cdn-links-generated.json',
        'cdn-mapping-config.json'
    ],
    redirectRules: [
        { from: '/downloads-cdn.html', to: '/app-cdn.html', status: 301 },
        { from: '/downloads.html', to: '/app-cdn.html', status: 301 },
        { from: '/download', to: '/app-cdn.html', status: 301 }
    ]
};

// 日志系统
const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.log(`[ERROR] ${new Date().toISOString()} - ${msg}`),
    warning: (msg) => console.log(`[WARNING] ${new Date().toISOString()} - ${msg}`)
};

// 文件验证
function validateFiles() {
    logger.info('开始验证必需文件...');
    const missingFiles = [];
    
    CONFIG.requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            missingFiles.push(file);
        } else {
            logger.success(`✅ 找到文件: ${file}`);
        }
    });
    
    if (missingFiles.length > 0) {
        logger.error(`❌ 缺少以下文件: ${missingFiles.join(', ')}`);
        return false;
    }
    
    logger.success('所有必需文件验证通过！');
    return true;
}

// 重定向规则验证
function validateRedirects() {
    logger.info('开始验证重定向配置...');
    
    try {
        const redirectsContent = fs.readFileSync(path.join(__dirname, '_redirects'), 'utf8');
        const netlifyContent = fs.readFileSync(path.join(__dirname, 'netlify.toml'), 'utf8');
        
        // 检查关键重定向规则
        const hasAppCdnRule = redirectsContent.includes('/app-cdn.html');
        const hasDownloadsRedirect = redirectsContent.includes('/downloads-cdn.html');
        
        if (hasAppCdnRule && hasDownloadsRedirect) {
            logger.success('✅ 重定向配置验证通过！');
            return true;
        } else {
            logger.error('❌ 重定向配置不完整');
            return false;
        }
    } catch (error) {
        logger.error(`验证重定向配置时出错: ${error.message}`);
        return false;
    }
}

// 本地服务器验证
function validateLocalServer() {
    return new Promise((resolve) => {
        logger.info('开始验证本地服务器...');
        
        http.get(CONFIG.localUrl, (res) => {
            if (res.statusCode === 200) {
                logger.success('✅ 本地服务器正常运行！');
                resolve(true);
            } else {
                logger.error(`❌ 本地服务器返回状态码: ${res.statusCode}`);
                resolve(false);
            }
        }).on('error', (err) => {
            logger.error(`❌ 无法连接到本地服务器: ${err.message}`);
            resolve(false);
        });
    });
}

// 生产环境验证
function validateProduction() {
    return new Promise((resolve) => {
        logger.info('开始验证生产环境...');
        
        https.get(CONFIG.productionUrl, (res) => {
            if (res.statusCode === 200) {
                logger.success('✅ 生产环境可访问！');
                resolve(true);
            } else if (res.statusCode === 404) {
                logger.warning('⚠️  生产环境返回404，需要部署文件');
                resolve(false);
            } else {
                logger.warning(`⚠️  生产环境返回状态码: ${res.statusCode}`);
                resolve(false);
            }
        }).on('error', (err) => {
            logger.error(`❌ 无法连接到生产环境: ${err.message}`);
            resolve(false);
        });
    });
}

// 生成部署报告
function generateDeploymentReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        validationResults: results,
        deploymentStatus: results.production ? 'READY' : 'NEEDS_DEPLOYMENT',
        recommendations: []
    };
    
    if (!results.files) {
        report.recommendations.push('确保所有必需文件都存在');
    }
    
    if (!results.redirects) {
        report.recommendations.push('检查重定向配置文件');
    }
    
    if (!results.local) {
        report.recommendations.push('启动本地测试服务器');
    }
    
    if (!results.production) {
        report.recommendations.push('部署文件到生产环境');
    }
    
    const reportPath = path.join(__dirname, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    logger.success(`部署报告已生成: ${reportPath}`);
    return report;
}

// 主函数
async function main() {
    console.log('\n🚀 GoldWord CDN Production Deployment Validator\n');
    console.log('=' .repeat(50));
    
    const results = {
        files: validateFiles(),
        redirects: validateRedirects(),
        local: await validateLocalServer(),
        production: await validateProduction()
    };
    
    console.log('\n' + '=' .repeat(50));
    console.log('\n📊 验证结果总结:');
    console.log(`文件验证: ${results.files ? '✅' : '❌'}`);
    console.log(`重定向配置: ${results.redirects ? '✅' : '❌'}`);
    console.log(`本地服务器: ${results.local ? '✅' : '❌'}`);
    console.log(`生产环境: ${results.production ? '✅' : '❌'}`);
    
    const report = generateDeploymentReport(results);
    
    console.log('\n📋 部署建议:');
    report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
    });
    
    if (results.files && results.redirects && results.local) {
        console.log('\n🎉 系统已准备好部署到生产环境！');
        console.log(`📍 本地测试地址: ${CONFIG.localUrl}`);
        console.log(`🌐 生产环境地址: ${CONFIG.productionUrl}`);
    } else {
        console.log('\n⚠️  请先解决上述问题后再进行部署。');
    }
    
    console.log('\n' + '=' .repeat(50));
}

// 错误处理
process.on('uncaughtException', (error) => {
    logger.error(`未捕获的异常: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`未处理的Promise拒绝: ${reason}`);
    process.exit(1);
});

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        logger.error(`部署验证失败: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    validateFiles,
    validateRedirects,
    validateLocalServer,
    validateProduction,
    generateDeploymentReport
};