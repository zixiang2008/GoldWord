#!/usr/bin/env node

/**
 * Netlify部署修复脚本
 * 解决Netlify部署404错误问题
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// 关键部署文件
const CRITICAL_FILES = [
  'app-cdn.html',
  '404.html', 
  '_redirects',
  'netlify.toml'
];

/**
 * 验证关键文件
 */
function validateCriticalFiles() {
  console.log('🔍 验证关键部署文件...\n');
  
  let allFilesExist = true;
  
  CRITICAL_FILES.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${file} - 文件不存在`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

/**
 * 检查Netlify配置
 */
function checkNetlifyConfig() {
  console.log('\n🔧 检查Netlify配置...\n');
  
  try {
    const configPath = path.join(__dirname, 'netlify.toml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // 检查是否有无限重定向
    const hasInfiniteRedirect = configContent.includes('from = "/app-cdn.html"') && 
                               configContent.includes('to = "/app-cdn.html"');
    
    if (hasInfiniteRedirect) {
      console.log('❌ 发现无限重定向配置错误！');
      console.log('   问题: app-cdn.html 重定向到自身');
      return false;
    }
    
    // 检查基本配置
    const hasBuildConfig = configContent.includes('[build]');
    const hasRedirects = configContent.includes('[[redirects]]');
    
    console.log(`✅ 基本配置: ${hasBuildConfig ? '存在' : '缺失'}`);
    console.log(`✅ 重定向配置: ${hasRedirects ? '存在' : '缺失'}`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ 读取配置文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 创建最小化Netlify配置
 */
function createMinimalNetlifyConfig() {
  console.log('\n📝 创建最小化Netlify配置...\n');
  
  const minimalConfig = `[build]
  publish = "."
  command = "echo 'Build completed'"

# 核心重定向规则
[[redirects]]
  from = "/downloads-cdn.html"
  to = "/app-cdn.html"
  status = 301

[[redirects]]
  from = "/downloads.html"
  to = "/app-cdn.html"
  status = 301

[[redirects]]
  from = "/download"
  to = "/app-cdn.html"
  status = 301

# 安全头部
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Cache-Control = "public, max-age=300"
`;

  try {
    fs.writeFileSync('netlify.toml', minimalConfig);
    console.log('✅ 最小化配置已创建');
    console.log('   - 移除了可能导致问题的复杂配置');
    console.log('   - 保留了核心重定向规则');
    console.log('   - 简化了头部设置');
    return true;
  } catch (error) {
    console.log(`❌ 创建配置文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试本地文件
 */
function testLocalFiles() {
  console.log('\n🧪 测试本地文件...\n');
  
  const testUrl = 'http://localhost:8080/app-cdn.html';
  console.log(`测试本地URL: ${testUrl}`);
  
  try {
    const response = require('child_process').execSync(`curl -s -o /dev/null -w "%{http_code}" ${testUrl}`, { encoding: 'utf8' });
    const statusCode = response.trim();
    
    if (statusCode === '200') {
      console.log(`✅ 本地文件正常访问 (状态码: ${statusCode})`);
      return true;
    } else {
      console.log(`⚠️  本地文件访问异常 (状态码: ${statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  本地服务器可能未运行`);
    console.log(`   错误: ${error.message}`);
    return false;
  }
}

/**
 * 生成部署包
 */
function createDeploymentPackage() {
  console.log('\n📦 生成部署包...\n');
  
  const deploymentFiles = {};
  
  CRITICAL_FILES.forEach(file => {
    try {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        
        deploymentFiles[file] = {
          content,
          size: stats.size,
          encoding: 'utf8'
        };
        
        console.log(`✅ ${file} (${stats.size} bytes)`);
      }
    } catch (error) {
      console.log(`❌ ${file} - 读取失败: ${error.message}`);
    }
  });
  
  return deploymentFiles;
}

/**
 * 创建Netlify拖拽部署指南
 */
function createNetlifyDropGuide(deploymentFiles) {
  const guideContent = `
🚀 Netlify 部署修复指南
==============================

📋 问题分析:
- 本地文件正常 (http://localhost:8080/app-cdn.html)
- Netlify 部署失败，返回 404 错误
- 可能原因: 配置文件错误或文件未正确上传

📦 部署文件清单:
${Object.entries(deploymentFiles).map(([file, info]) => 
  `✅ ${file} (${info.size} bytes)`
).join('\n')}

🔧 修复步骤:

1️⃣ 访问 Netlify 控制台
   网址: https://app.netlify.com

2️⃣ 找到您的站点
   站点名称: caishen.us.kg

3️⃣ 手动部署文件
   方法 A: 拖拽部署
   - 进入站点概览页面
   - 找到拖拽部署区域
   - 拖拽以下文件到指定区域:
     ${CRITICAL_FILES.map(f => `     - ${f}`).join('\n')}

   方法 B: 触发重新部署
   - 进入 "Deploys" 页面
   - 点击 "Trigger deploy" → "Deploy site"
   - 等待部署完成

4️⃣ 验证部署结果
   测试 URL: https://caishen.us.kg/app-cdn.html
   期望结果: 200 OK (不再是 404)

🎯 替代方案:
如果上述方法无效，请尝试:
- 检查域名 DNS 设置
- 验证 Netlify 站点配置
- 重新创建站点并重新部署

⏰ 部署通常需要 1-2 分钟完成
`;

  fs.writeFileSync('netlify-deployment-guide.txt', guideContent);
  console.log('✅ 部署指南已生成: netlify-deployment-guide.txt');
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 Netlify 部署修复工具');
  console.log('=' .repeat(50));
  console.log(`修复时间: ${new Date().toLocaleString()}`);
  console.log(`目标站点: caishen.us.kg`);
  console.log('');
  
  // 验证关键文件
  const filesValid = validateCriticalFiles();
  if (!filesValid) {
    console.log('\n❌ 关键文件缺失，无法继续修复');
    return;
  }
  
  // 检查Netlify配置
  const configValid = checkNetlifyConfig();
  if (!configValid) {
    console.log('\n⚠️  配置问题检测到，正在修复...');
    createMinimalNetlifyConfig();
  }
  
  // 测试本地文件
  testLocalFiles();
  
  // 生成部署包
  const deploymentFiles = createDeploymentPackage();
  
  // 创建部署指南
  createNetlifyDropGuide(deploymentFiles);
  
  console.log('\n🎯 修复建议:');
  console.log('1. 立即访问 https://app.netlify.com');
  console.log('2. 找到 caishen.us.kg 站点');
  console.log('3. 手动上传部署文件');
  console.log('4. 验证 https://caishen.us.kg/app-cdn.html');
  
  console.log('\n✅ 修复准备完成！');
  console.log('问题原因: Netlify配置错误或文件未正确部署');
  console.log('解决方案: 手动重新部署所有关键文件');
}

// 运行主函数
if (require.main === module) {
  main();
}