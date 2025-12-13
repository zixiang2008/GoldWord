#!/usr/bin/env node

/**
 * 最终部署确认和状态检查
 * 确认Netlify拖拽部署完成并验证结果
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 检查配置
const DEPLOYMENT_CONFIG = {
  siteUrl: 'https://caishen.us.kg',
  targetUrls: [
    'https://caishen.us.kg/app-cdn.html',
    'https://www.caishen.us.kg/app-cdn.html',
    'https://caishen.us.kg/downloads-cdn.html',
    'https://caishen.us.kg/404.html'
  ],
  deployPackageDir: 'netlify-deploy-package',
  expectedFiles: [
    'app-cdn.html',
    '404.html',
    '_redirects',
    'netlify.toml',
    'cdn-links-generated.json',
    'cdn-mapping-config.json'
  ]
};

/**
 * 检查部署包完整性
 */
function checkDeployPackage() {
  console.log('📦 检查部署包完整性...\n');
  
  const deployDir = path.join(__dirname, DEPLOYMENT_CONFIG.deployPackageDir);
  
  if (!fs.existsSync(deployDir)) {
    console.log(`❌ 部署目录不存在: ${DEPLOYMENT_CONFIG.deployPackageDir}`);
    return false;
  }
  
  let foundFiles = 0;
  let totalSize = 0;
  
  DEPLOYMENT_CONFIG.expectedFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      foundFiles++;
      totalSize += stats.size;
      console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${file} - 缺失`);
    }
  });
  
  console.log(`\n📊 部署包状态: ${foundFiles}/${DEPLOYMENT_CONFIG.expectedFiles.length} 文件`);
  console.log(`📏 总大小: ${totalSize} bytes`);
  
  return foundFiles === DEPLOYMENT_CONFIG.expectedFiles.length;
}

/**
 * 测试URL状态
 */
function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n🧪 测试: ${url}`);
    
    const req = https.get(url, (res) => {
      const result = {
        url,
        status: res.statusCode,
        headers: res.headers,
        timestamp: new Date().toISOString(),
        success: false
      };
      
      // 判断成功标准
      if (res.statusCode === 200) {
        result.success = true;
        result.message = '✅ 正常访问';
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        result.success = true;
        result.message = `↻ 重定向到: ${res.headers.location}`;
      } else if (res.statusCode === 404) {
        result.message = '❌ 404错误 - 页面未找到';
      } else {
        result.message = `⚠️  状态码: ${res.statusCode}`;
      }
      
      console.log(`   ${result.message}`);
      resolve(result);
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 请求失败: ${error.message}`);
      resolve({
        url,
        status: 'error',
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      });
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`   ⏰ 请求超时`);
      resolve({
        url,
        status: 'timeout',
        success: false,
        timestamp: new Date().toISOString()
      });
    });
  });
}

/**
 * 测试所有URL
 */
async function testAllUrls() {
  console.log('🌐 开始测试生产环境URL...\n');
  
  const results = [];
  
  for (const url of DEPLOYMENT_CONFIG.targetUrls) {
    const result = await testUrl(url);
    results.push(result);
    
    // 延迟测试避免过载
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * 生成部署报告
 */
function generateDeploymentReport(results) {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const has404Errors = results.some(r => r.status === 404);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalCount,
      success: successCount,
      failed: totalCount - successCount,
      successRate: Math.round((successCount / totalCount) * 100),
      has404Errors,
      status: has404Errors ? 'needs_deployment' : 'deployment_successful'
    },
    details: results,
    recommendations: []
  };
  
  // 生成建议
  if (has404Errors) {
    report.recommendations.push('检测到404错误，需要重新部署文件');
    report.recommendations.push('确保所有文件已正确上传到Netlify');
    report.recommendations.push('等待1-2分钟让CDN缓存更新');
  } else if (successCount === totalCount) {
    report.recommendations.push('🎉 部署验证成功！所有URL正常访问');
    report.recommendations.push('建议清除浏览器缓存后再次测试');
  } else {
    report.recommendations.push('部分URL访问异常，检查具体错误');
    report.recommendations.push('查看Netlify部署日志获取详细信息');
  }
  
  return report;
}

/**
 * 显示最终部署指导
 */
function showFinalDeploymentGuide(report) {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 最终部署指导');
  console.log('='.repeat(60));
  
  if (report.summary.has404Errors) {
    console.log('\n⚠️  检测到404错误，需要重新部署：');
    console.log('1. 访问 https://app.netlify.com');
    console.log('2. 找到 caishen.us.kg 站点');
    console.log('3. 进入 Deploys 页面');
    console.log('4. 拖拽以下文件重新部署：');
    DEPLOYMENT_CONFIG.expectedFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('5. 等待部署完成（1-2分钟）');
    console.log('6. 再次运行验证脚本');
  } else {
    console.log('\n✅ 部署验证通过！');
    console.log('建议执行以下操作：');
    console.log('1. 清除浏览器缓存');
    console.log('2. 使用无痕模式测试');
    console.log('3. 分享给用户确认修复');
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🎯 Netlify最终部署确认和状态检查');
  console.log('='.repeat(60));
  console.log(`检查时间: ${new Date().toLocaleString()}`);
  console.log(`目标站点: ${DEPLOYMENT_CONFIG.siteUrl}`);
  console.log('');
  
  // 1. 检查部署包
  const packageReady = checkDeployPackage();
  
  if (!packageReady) {
    console.log('\n❌ 部署包不完整，请先完成文件准备');
    console.log('确保 netlify-deploy-package/ 目录包含所有必要文件');
    return;
  }
  
  console.log('\n✅ 部署包已准备就绪');
  console.log('下一步：执行Netlify拖拽部署');
  
  // 2. 测试当前状态
  console.log('\n' + '='.repeat(60));
  console.log('🔍 测试当前生产环境状态');
  console.log('='.repeat(60));
  
  const results = await testAllUrls();
  
  // 3. 生成报告
  const report = generateDeploymentReport(results);
  
  // 4. 显示结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 部署状态报告');
  console.log('='.repeat(60));
  console.log(`总测试数: ${report.summary.total}`);
  console.log(`成功: ${report.summary.success}`);
  console.log(`失败: ${report.summary.failed}`);
  console.log(`成功率: ${report.summary.successRate}%`);
  console.log(`404错误: ${report.summary.has404Errors ? '是' : '否'}`);
  
  // 5. 显示建议
  console.log('\n💡 建议:');
  report.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });
  
  // 6. 显示最终指导
  showFinalDeploymentGuide(report);
  
  // 7. 保存报告
  const reportPath = 'final-deployment-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 详细报告已保存: ${reportPath}`);
  
  // 8. 总结
  console.log('\n' + '='.repeat(60));
  if (report.summary.has404Errors) {
    console.log('⚠️  需要执行Netlify拖拽部署以修复404错误');
    console.log('请访问 https://app.netlify.com 完成部署');
  } else {
    console.log('🎉 部署验证成功！生产环境正常访问');
  }
  console.log('='.repeat(60));
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}