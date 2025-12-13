#!/usr/bin/env node

/**
 * Netlify最终部署脚本
 * 自动执行最终部署以解决404错误
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 部署配置
const DEPLOY_CONFIG = {
  siteUrl: 'https://caishen.us.kg',
  deployDir: 'netlify-deploy-package',
  files: [
    'app-cdn.html',
    '404.html',
    '_redirects',
    'netlify.toml',
    'cdn-links-generated.json',
    'cdn-mapping-config.json'
  ],
  testUrls: [
    'https://caishen.us.kg/app-cdn.html',
    'https://www.caishen.us.kg/app-cdn.html',
    'https://caishen.us.kg/downloads-cdn.html'
  ]
};

/**
 * 验证部署文件
 */
function validateDeployFiles() {
  console.log('🔍 验证部署文件...\n');
  
  const deployPath = path.join(__dirname, DEPLOY_CONFIG.deployDir);
  let validFiles = 0;
  
  if (!fs.existsSync(deployPath)) {
    console.log(`❌ 部署目录不存在: ${DEPLOY_CONFIG.deployDir}`);
    return false;
  }
  
  DEPLOY_CONFIG.files.forEach(file => {
    const filePath = path.join(deployPath, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${stats.size} bytes)`);
      validFiles++;
    } else {
      console.log(`❌ ${file} - 文件不存在`);
    }
  });
  
  console.log(`\n📊 文件验证: ${validFiles}/${DEPLOY_CONFIG.files.length}`);
  return validFiles === DEPLOY_CONFIG.files.length;
}

/**
 * 创建部署摘要
 */
function createDeploymentSummary() {
  const summary = {
    timestamp: new Date().toISOString(),
    site: DEPLOY_CONFIG.siteUrl,
    files: DEPLOY_CONFIG.files,
    status: 'ready_for_deployment',
    instructions: {
      netlify_console: 'https://app.netlify.com',
      site_name: 'caishen.us.kg',
      steps: [
        '访问Netlify控制台',
        '找到caishen.us.kg站点',
        '进入Deploys页面',
        '拖拽所有文件到部署区域',
        '等待部署完成'
      ]
    },
    verification_urls: DEPLOY_CONFIG.testUrls
  };
  
  const summaryPath = path.join(__dirname, 'final-deployment-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('✅ 部署摘要已创建: final-deployment-summary.json');
  return summary;
}

/**
 * 测试当前URL状态
 */
function testCurrentUrls() {
  console.log('\n🧪 测试当前URL状态...\n');
  
  return new Promise((resolve) => {
    let testCount = 0;
    let results = [];
    
    DEPLOY_CONFIG.testUrls.forEach((url, index) => {
      setTimeout(() => {
        console.log(`测试: ${url}`);
        
        const req = https.get(url, (res) => {
          const result = {
            url,
            status: res.statusCode,
            headers: res.headers,
            timestamp: new Date().toISOString()
          };
          
          results.push(result);
          
          if (res.statusCode === 404) {
            console.log(`   ❌ 404错误 - 需要部署修复`);
          } else if (res.statusCode === 200) {
            console.log(`   ✅ 200 OK - 正常访问`);
          } else if (res.statusCode === 301 || res.statusCode === 302) {
            console.log(`   ↻ ${res.statusCode} 重定向到: ${res.headers.location}`);
          } else {
            console.log(`   ⚠️  ${res.statusCode} - 其他状态`);
          }
          
          testCount++;
          if (testCount === DEPLOY_CONFIG.testUrls.length) {
            resolve(results);
          }
        });
        
        req.on('error', (error) => {
          console.log(`   ❌ 请求失败: ${error.message}`);
          results.push({ url, status: 'error', error: error.message });
          
          testCount++;
          if (testCount === DEPLOY_CONFIG.testUrls.length) {
            resolve(results);
          }
        });
        
        req.setTimeout(10000, () => {
          req.destroy();
          console.log(`   ⏰ 请求超时`);
          results.push({ url, status: 'timeout' });
          
          testCount++;
          if (testCount === DEPLOY_CONFIG.testUrls.length) {
            resolve(results);
          }
        });
        
      }, index * 1000); // 延迟测试避免过载
    });
  });
}

/**
 * 生成Netlify部署命令
 */
function generateNetlifyCommands() {
  console.log('\n📝 生成Netlify部署命令...\n');
  
  const commands = {
    manual_deployment: {
      description: '手动拖拽部署（推荐）',
      steps: [
        '1. 访问 https://app.netlify.com',
        '2. 找到 "caishen.us.kg" 站点',
        '3. 进入 "Deploys" 页面',
        '4. 拖拽以下文件到部署区域:',
        `   ${DEPLOY_CONFIG.files.map(f => `   - ${f}`).join('\n')}`,
        '5. 等待部署完成（1-2分钟）',
        '6. 验证部署结果'
      ]
    },
    
    trigger_deploy: {
      description: '触发重新部署',
      steps: [
        '1. 访问 https://app.netlify.com/sites/caishen.us.kg/deploys',
        '2. 点击 "Trigger deploy" → "Deploy site"',
        '3. 等待部署完成',
        '4. 验证结果'
      ]
    },
    
    git_deployment: {
      description: 'Git部署（如果已连接）',
      commands: [
        'cd netlify-deploy-package',
        'git add .',
        'git commit -m "Fix Netlify 404 error - final deployment"',
        'git push origin main'
      ]
    }
  };
  
  console.log('🎯 部署选项:');
  Object.entries(commands).forEach(([key, method]) => {
    console.log(`\n📋 ${method.description}:`);
    if (method.steps) {
      method.steps.forEach(step => console.log(`   ${step}`));
    }
    if (method.commands) {
      method.commands.forEach(cmd => console.log(`   $ ${cmd}`));
    }
  });
  
  return commands;
}

/**
 * 创建部署后验证脚本
 */
function createPostDeployVerification() {
  const verificationScript = `#!/usr/bin/env node

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
  console.log('🔍 验证Netlify部署结果...\\n');
  
  const results = [];
  for (const url of TEST_URLS) {
    const result = await testUrl(url);
    results.push(result);
    
    if (result.success) {
      console.log(\`✅ \${result.url}\`);
      console.log(\`   状态: \${result.status}\${result.location ? ' → ' + result.location : ''}\`);
    } else {
      console.log(\`❌ \${result.url}\`);
      console.log(\`   问题: \${result.status}\${result.error ? ' - ' + result.error : ''}\`);
    }
    console.log('');
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(\`📊 验证结果: \${successCount}/\${totalCount} 通过\`);
  
  if (successCount === totalCount) {
    console.log('🎉 部署验证成功！所有URL正常访问。');
  } else {
    console.log('⚠️  部分验证失败，请检查部署状态。');
  }
  
  return results;
}

verifyDeployment().catch(console.error);
`;

  const scriptPath = path.join(__dirname, 'verify-deployment-after-deploy.js');
  fs.writeFileSync(scriptPath, verificationScript);
  fs.chmodSync(scriptPath, '755');
  
  console.log('✅ 部署验证脚本已创建: verify-deployment-after-deploy.js');
  console.log('💡 部署完成后运行: node verify-deployment-after-deploy.js');
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Netlify最终部署脚本');
  console.log('=' .repeat(50));
  console.log(`部署时间: ${new Date().toLocaleString()}`);
  console.log(`目标站点: ${DEPLOY_CONFIG.siteUrl}`);
  console.log(`部署目录: ${DEPLOY_CONFIG.deployDir}`);
  console.log('');
  
  // 验证部署文件
  const filesValid = validateDeployFiles();
  if (!filesValid) {
    console.log('\n❌ 部署文件验证失败，请先确保所有文件就绪');
    return;
  }
  
  // 创建部署摘要
  const summary = createDeploymentSummary();
  
  // 测试当前状态
  const testResults = await testCurrentUrls();
  
  // 生成部署命令
  const commands = generateNetlifyCommands();
  
  // 创建部署后验证脚本
  createPostDeployVerification();
  
  console.log('\n🎯 立即执行部署:');
  console.log('1. 访问 https://app.netlify.com');
  console.log('2. 找到 caishen.us.kg 站点');
  console.log('3. 进入 Deploys 页面');
  console.log('4. 拖拽所有文件到部署区域');
  console.log('5. 等待1-2分钟完成部署');
  console.log('6. 运行验证脚本确认成功');
  
  console.log('\n✅ 最终部署准备完成！');
  console.log('🚀 请立即执行Netlify部署以解决404错误！');
  
  // 保存测试结果
  const resultsPath = path.join(__dirname, 'pre-deployment-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testResults,
    summary
  }, null, 2));
  
  console.log(`\n📊 测试结果已保存: ${resultsPath}`);
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}