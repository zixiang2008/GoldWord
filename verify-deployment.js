#!/usr/bin/env node

/**
 * GoldWord 部署验证工具
 * 验证生产环境部署状态
 */

const https = require('https');
const fs = require('fs');

// 需要验证的URLs
const URLS_TO_TEST = [
  {
    url: 'https://caishen.us.kg/app-cdn.html',
    expected: 200,
    description: 'CDN下载页面 (主页面)'
  },
  {
    url: 'https://www.caishen.us.kg/app-cdn.html',
    expected: 200,
    description: 'CDN下载页面 (www子域)'
  },
  {
    url: 'https://caishen.us.kg/downloads-cdn.html',
    expected: 301,
    description: '旧地址重定向'
  },
  {
    url: 'https://caishen.us.kg/',
    expected: [200, 301],
    description: '主站点'
  },
  {
    url: 'https://caishen.us.kg/404.html',
    expected: 200,
    description: '404错误页面'
  }
];

/**
 * 测试单个URL
 */
function testUrl(urlConfig) {
  return new Promise((resolve) => {
    const { url, expected, description } = urlConfig;
    const expectedStatus = Array.isArray(expected) ? expected : [expected];
    
    console.log(`\n🧪 测试: ${description}`);
    console.log(`   URL: ${url}`);
    console.log(`   期望状态: ${expectedStatus.join(' 或 ')}`);
    
    const req = https.get(url, (res) => {
      const actualStatus = res.statusCode;
      const isSuccess = expectedStatus.includes(actualStatus);
      
      console.log(`   实际状态: ${actualStatus}`);
      
      if (isSuccess) {
        console.log(`   ✅ 通过`);
      } else {
        console.log(`   ❌ 失败`);
      }
      
      resolve({
        url,
        description,
        expected: expectedStatus,
        actual: actualStatus,
        success: isSuccess,
        headers: res.headers
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 请求错误: ${error.message}`);
      resolve({
        url,
        description,
        expected: expectedStatus,
        actual: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      console.log(`   ⏰ 请求超时`);
      req.destroy();
      resolve({
        url,
        description,
        expected: expectedStatus,
        actual: 'TIMEOUT',
        success: false
      });
    });
  });
}

/**
 * 验证本地文件
 */
function validateLocalFiles() {
  console.log('\n📁 验证本地部署文件...');
  
  const requiredFiles = [
    'app-cdn.html',
    '404.html',
    '_redirects',
    'netlify.toml',
    'cdn-links-generated.json',
    'cdn-mapping-config.json'
  ];
  
  const results = [];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const size = exists ? fs.statSync(file).size : 0;
    
    results.push({
      file,
      exists,
      size,
      status: exists ? '✅ 存在' : '❌ 缺失'
    });
    
    console.log(`   ${exists ? '✅' : '❌'} ${file} ${exists ? `(${size} bytes)` : ''}`);
  });
  
  return results;
}

/**
 * 生成部署建议
 */
function generateRecommendations(results) {
  console.log('\n💡 部署建议:');
  
  const failedUrls = results.filter(r => !r.success);
  const localFiles = validateLocalFiles();
  const missingFiles = localFiles.filter(f => !f.exists);
  
  if (missingFiles.length > 0) {
    console.log('1. 缺失文件处理:');
    missingFiles.forEach(file => {
      console.log(`   - 创建缺失文件: ${file.file}`);
    });
  }
  
  if (failedUrls.length > 0) {
    console.log('2. URL访问问题:');
    failedUrls.forEach(result => {
      console.log(`   - ${result.description}: ${result.url}`);
      console.log(`     期望: ${Array.isArray(result.expected) ? result.expected.join('/') : result.expected}, 实际: ${result.actual}`);
    });
    
    console.log('3. 解决方案:');
    console.log('   a) 登录Netlify控制台 (https://app.netlify.com)');
    console.log('   b) 找到 caishen.us.kg 站点');
    console.log('   c) 进入"Deploys"页面');
    console.log('   d) 点击"Trigger deploy" -> "Deploy site"');
    console.log('   e) 或者使用拖拽部署功能');
  }
  
  console.log('4. 验证部署:');
  console.log('   - 部署完成后访问: https://caishen.us.kg/app-cdn.html');
  console.log('   - 检查重定向: https://caishen.us.kg/downloads-cdn.html');
  console.log('   - 测试404页面: https://caishen.us.kg/404');
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 GoldWord 部署验证工具');
  console.log('='.repeat(50));
  console.log(`验证时间: ${new Date().toLocaleString()}`);
  
  // 验证本地文件
  validateLocalFiles();
  
  console.log('\n🌐 开始测试生产环境URLs...');
  console.log('⏰ 这可能需要一些时间，请耐心等待...');
  
  // 测试所有URLs
  const results = [];
  for (const urlConfig of URLS_TO_TEST) {
    const result = await testUrl(urlConfig);
    results.push(result);
  }
  
  // 生成报告
  console.log('\n📊 验证报告:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`总测试数: ${total}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${total - passed}`);
  console.log(`成功率: ${Math.round((passed / total) * 100)}%`);
  
  // 显示详细结果
  console.log('\n📋 详细结果:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description}`);
    console.log(`   ${result.url} -> ${result.actual}`);
  });
  
  // 生成建议
  generateRecommendations(results);
  
  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed,
      failed: total - passed,
      successRate: Math.round((passed / total) * 100)
    },
    results,
    localFiles: validateLocalFiles()
  };
  
  fs.writeFileSync('deployment-verification-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📄 详细报告已保存到: deployment-verification-report.json');
  
  if (passed === total) {
    console.log('\n🎉 所有测试通过！部署验证成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请查看建议进行修复。');
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}