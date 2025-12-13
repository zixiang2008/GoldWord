#!/usr/bin/env node

/**
 * 部署后验证脚本
 * 验证Netlify部署是否成功
 */

const https = require('https');

const TEST_URLS = [
  'https://caishen.us.kg/app-cdn.html',
  'https://www.caishen.us.kg/app-cdn.html',
  'https://caishen.us.kg/downloads-cdn.html'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        location: res.headers.location,
        success: res.statusCode === 200 || res.statusCode === 301
      });
    });
    
    req.on('error', (error) => {
      resolve({ url, status: 'error', error: error.message, success: false });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ url, status: 'timeout', success: false });
    });
  });
}

async function verifyDeployment() {
  console.log('🔍 验证Netlify部署结果...\n');
  
  const results = [];
  for (const url of TEST_URLS) {
    const result = await testUrl(url);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.url}`);
      console.log(`   状态: ${result.status}${result.location ? ' → ' + result.location : ''}`);
    } else {
      console.log(`❌ ${result.url}`);
      console.log(`   问题: ${result.status}${result.error ? ' - ' + result.error : ''}`);
    }
    console.log('');
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`📊 验证结果: ${successCount}/${totalCount} 通过`);
  
  if (successCount === totalCount) {
    console.log('🎉 部署验证成功！所有URL正常访问。');
  } else {
    console.log('⚠️  部分验证失败，请检查部署状态。');
  }
  
  return results;
}

verifyDeployment().catch(console.error);
