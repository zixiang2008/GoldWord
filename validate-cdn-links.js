#!/usr/bin/env node
/**
 * GoldWord CDN 404错误解决方案验证工具
 * 验证所有链接和重定向逻辑
 */

const https = require('https');
const http = require('http');

// 测试配置
const TEST_CONFIG = {
    production: {
        baseUrl: 'https://caishen.us.kg',
        expectedStatus: 404 // 当前预期状态
    },
    local: {
        baseUrl: 'http://localhost:8080',
        expectedStatus: 200
    },
    githubPages: {
        baseUrl: 'https://zixiang2008.github.io/GoldWord',
        expectedStatus: 200
    }
};

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

// HTTP请求函数
function makeRequest(url, method = 'GET') {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            timeout: 10000
        };
        
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (res) => {
            resolve({
                status: res.statusCode,
                headers: res.headers,
                url: url
            });
        });
        
        req.on('error', (error) => {
            resolve({
                status: 'ERROR',
                error: error.message,
                url: url
            });
        });
        
        req.on('timeout', () => {
            resolve({
                status: 'TIMEOUT',
                url: url
            });
        });
        
        req.end();
    });
}

// 测试URL
async function testUrl(url, expectedStatus, description) {
    log(`正在测试: ${description}`, 'info');
    log(`URL: ${url}`, 'info');
    
    const result = await makeRequest(url);
    
    if (result.status === expectedStatus) {
        log(`✅ 测试通过: ${result.status}`, 'success');
    } else {
        log(`❌ 测试失败: 期望 ${expectedStatus}, 实际 ${result.status}`, 'error');
        if (result.error) {
            log(`   错误: ${result.error}`, 'error');
        }
    }
    
    if (result.headers?.location) {
        log(`   重定向到: ${result.headers.location}`, 'info');
    }
    
    return result;
}

// 验证所有链接
async function validateAllLinks() {
    log('🔍 开始验证GoldWord CDN链接和重定向逻辑', 'info');
    log('=' .repeat(60), 'info');
    
    const testResults = {
        production: [],
        local: [],
        githubPages: []
    };
    
    // 测试生产环境 (当前状态)
    log('\n📊 生产环境测试 (当前状态)', 'warning');
    log('=' .repeat(40), 'warning');
    
    const prodTests = [
        { url: `${TEST_CONFIG.production.baseUrl}/app-cdn.html`, expected: 404, desc: '下载页面 (当前404)' },
        { url: `${TEST_CONFIG.production.baseUrl}/downloads.html`, expected: 301, desc: '旧下载页面重定向' },
        { url: `${TEST_CONFIG.production.baseUrl}/downloads-cdn.html`, expected: 301, desc: 'CDN下载页面重定向' }
    ];
    
    for (const test of prodTests) {
        const result = await testUrl(test.url, test.expected, test.desc);
        testResults.production.push(result);
    }
    
    // 测试本地服务器
    log('\n🖥️  本地服务器测试', 'info');
    log('=' .repeat(40), 'info');
    
    const localTests = [
        { url: `${TEST_CONFIG.local.baseUrl}/app-cdn.html`, expected: 200, desc: '下载页面' },
        { url: `${TEST_CONFIG.local.baseUrl}/1.0.3/GoldWord-1.0.3.dmg`, expected: 200, desc: 'macOS下载文件' },
        { url: `${TEST_CONFIG.local.baseUrl}/1.0.3/GoldWord-1.0.3.exe`, expected: 200, desc: 'Windows下载文件' },
        { url: `${TEST_CONFIG.local.baseUrl}/1.0.2/GoldWord-1.0.2.dmg`, expected: 200, desc: '旧版本macOS文件' }
    ];
    
    for (const test of localTests) {
        const result = await testUrl(test.url, test.expected, test.desc);
        testResults.local.push(result);
    }
    
    // 测试GitHub Pages (备用方案)
    log('\n🐙 GitHub Pages测试 (备用方案)', 'info');
    log('=' .repeat(40), 'info');
    
    const githubTests = [
        { url: `${TEST_CONFIG.githubPages.baseUrl}/app-cdn.html`, expected: 200, desc: 'GitHub Pages下载页面' },
        { url: `${TEST_CONFIG.githubPages.baseUrl}`, expected: 200, desc: 'GitHub Pages根目录' }
    ];
    
    for (const test of githubTests) {
        const result = await testUrl(test.url, test.expected, test.desc);
        testResults.githubPages.push(result);
    }
    
    // 生成测试报告
    log('\n📊 测试报告总结', 'info');
    log('=' .repeat(60), 'info');
    
    const allTests = [
        ...testResults.production,
        ...testResults.local,
        ...testResults.githubPages
    ];
    
    const passed = allTests.filter(r => r.status !== 'ERROR' && r.status !== 'TIMEOUT').length;
    const failed = allTests.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT').length;
    
    log(`总测试数: ${allTests.length}`, 'info');
    log(`✅ 成功: ${passed}`, 'success');
    log(`❌ 失败: ${failed}`, 'error');
    
    // 问题分析
    log('\n🔍 问题分析', 'warning');
    log('=' .repeat(40), 'warning');
    
    const prod404s = testResults.production.filter(r => r.status === 404);
    if (prod404s.length > 0) {
        log('发现404错误:', 'error');
        prod404s.forEach(r => {
            log(`   - ${r.url}`, 'error');
        });
        log('解决方案:', 'info');
        log('   1. 部署app-cdn.html到Netlify', 'info');
        log('   2. 配置Netlify重定向规则', 'info');
        log('   3. 考虑使用GitHub Pages作为备选方案', 'info');
    }
    
    // 本地服务器状态
    const localWorking = testResults.local.filter(r => r.status === 200).length;
    if (localWorking === testResults.local.length) {
        log('✅ 本地服务器运行正常', 'success');
    } else {
        log('⚠️  本地服务器有问题', 'warning');
    }
    
    // GitHub Pages可用性
    const githubWorking = testResults.githubPages.filter(r => r.status === 200).length;
    if (githubWorking > 0) {
        log('✅ GitHub Pages可用作备选方案', 'success');
    }
    
    // 提供解决方案
    log('\n💡 推荐解决方案', 'info');
    log('=' .repeat(40), 'info');
    
    if (prod404s.length > 0) {
        log('立即解决方案:', 'warning');
        log('1. 使用本地测试服务器验证功能:', 'info');
        log('   node test-local-server.js', 'info');
        log('   访问: http://localhost:8080/app-cdn.html', 'info');
        
        log('\n2. 部署到Netlify:', 'info');
        log('   - 将app-cdn.html添加到Git仓库', 'info');
        log('   - 推送代码触发Netlify自动部署', 'info');
        log('   - 验证部署后的链接', 'info');
        
        log('\n3. 配置Netlify重定向:', 'info');
        log('   - 创建 _redirects 文件', 'info');
        log('   - 添加重定向规则', 'info');
        log('   - 重新部署生效', 'info');
        
        log('\n4. 备选方案 - GitHub Pages:', 'info');
        log('   - 启用GitHub Pages功能', 'info');
        log('   - 配置自定义域名', 'info');
        log('   - 更新DNS指向GitHub Pages', 'info');
    }
    
    log('\n📋 验证命令:', 'info');
    log('   curl -I https://caishen.us.kg/app-cdn.html', 'info');
    log('   curl -I http://localhost:8080/app-cdn.html', 'info');
    log('   curl -I https://zixiang2008.github.io/GoldWord/app-cdn.html', 'info');
    
    return {
        total: allTests.length,
        passed,
        failed,
        production: testResults.production,
        local: testResults.local,
        githubPages: testResults.githubPages
    };
}

// 如果直接运行
if (require.main === module) {
    validateAllLinks().then(results => {
        if (results.failed > 0) {
            process.exit(1);
        }
    }).catch(error => {
        log(`❌ 验证过程失败: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    validateAllLinks,
    testUrl,
    makeRequest
};