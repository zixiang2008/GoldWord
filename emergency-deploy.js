#!/usr/bin/env node

/**
 * GoldWord 紧急部署解决方案
 * 解决Netlify 404错误的最终部署方案
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 部署配置
const DEPLOYMENT_CONFIG = {
  siteName: 'caishen.us.kg',
  deployFiles: [
    { name: 'app-cdn.html', required: true, description: 'CDN下载主页面' },
    { name: '404.html', required: true, description: '404错误页面' },
    { name: '_redirects', required: true, description: '重定向配置' },
    { name: 'netlify.toml', required: true, description: 'Netlify配置' },
    { name: 'cdn-links-generated.json', required: true, description: 'CDN链接映射' },
    { name: 'cdn-mapping-config.json', required: false, description: 'CDN映射配置' },
    { name: 'index.html', required: false, description: '主页文件' }
  ],
  targetUrls: [
    'https://caishen.us.kg/app-cdn.html',
    'https://www.caishen.us.kg/app-cdn.html',
    'https://caishen.us.kg/downloads-cdn.html'
  ]
};

/**
 * 创建部署包
 */
function createDeploymentPackage() {
  console.log('📦 创建紧急部署包...\n');
  
  const deploymentPackage = {
    timestamp: new Date().toISOString(),
    site: DEPLOYMENT_CONFIG.siteName,
    files: {},
    status: 'ready'
  };
  
  let totalSize = 0;
  let missingFiles = [];
  
  DEPLOYMENT_CONFIG.deployFiles.forEach(fileConfig => {
    const { name, required, description } = fileConfig;
    const filePath = path.join(__dirname, name);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        
        deploymentPackage.files[name] = {
          content,
          size: stats.size,
          description,
          encoding: 'utf8'
        };
        
        totalSize += stats.size;
        console.log(`✅ ${name} (${stats.size} bytes) - ${description}`);
        
      } catch (error) {
        console.log(`❌ ${name} - 读取失败: ${error.message}`);
        if (required) missingFiles.push(name);
      }
    } else {
      console.log(`${required ? '❌' : '⚠️'} ${name} - 文件不存在${required ? ' (必需)' : ' (可选)'}`);
      if (required) missingFiles.push(name);
    }
  });
  
  deploymentPackage.totalFiles = Object.keys(deploymentPackage.files).length;
  deploymentPackage.totalSize = totalSize;
  deploymentPackage.missingFiles = missingFiles;
  
  console.log(`\n📊 部署包统计:`);
  console.log(`   文件总数: ${deploymentPackage.totalFiles}/${DEPLOYMENT_CONFIG.deployFiles.length}`);
  console.log(`   总大小: ${totalSize} bytes`);
  console.log(`   缺失文件: ${missingFiles.length} 个`);
  
  if (missingFiles.length > 0) {
    console.log(`   缺失: ${missingFiles.join(', ')}`);
  }
  
  return deploymentPackage;
}

/**
 * 生成Netlify拖拽部署HTML
 */
function generateNetlifyDropHTML(deploymentPackage) {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoldWord 紧急部署 - Netlify拖拽部署</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .emergency-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            color: #856404;
        }
        
        .emergency-notice h3 {
            margin-bottom: 10px;
            color: #d63031;
        }
        
        .steps {
            margin: 30px 0;
        }
        
        .step {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
        }
        
        .step h4 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.2em;
        }
        
        .step p {
            color: #666;
            line-height: 1.6;
        }
        
        .files-list {
            background: #f1f3f4;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .files-list h4 {
            color: #333;
            margin-bottom: 15px;
        }
        
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: white;
            border-radius: 5px;
            border: 1px solid #e1e5e9;
        }
        
        .file-name {
            font-weight: 500;
            color: #333;
        }
        
        .file-size {
            color: #666;
            font-size: 0.9em;
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 500;
        }
        
        .status.ready {
            background: #d4edda;
            color: #155724;
        }
        
        .status.missing {
            background: #f8d7da;
            color: #721c24;
        }
        
        .netlify-link {
            text-align: center;
            margin: 30px 0;
        }
        
        .netlify-button {
            display: inline-block;
            background: #00ad9f;
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1.1em;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 173, 159, 0.3);
        }
        
        .netlify-button:hover {
            background: #009688;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 173, 159, 0.4);
        }
        
        .alternative-methods {
            background: #e8f4f8;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .alternative-methods h4 {
            color: #2c5282;
            margin-bottom: 15px;
        }
        
        .method {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            border: 1px solid #bee5eb;
        }
        
        .method h5 {
            color: #333;
            margin-bottom: 8px;
        }
        
        .method p {
            color: #666;
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 10px;
            margin: 10px 0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
            color: #495057;
            overflow-x: auto;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 GoldWord 紧急部署</h1>
            <p>解决 Netlify 404 错误的完整部署方案</p>
        </div>
        
        <div class="emergency-notice">
            <h3>⚠️ 紧急通知</h3>
            <p>检测到生产环境存在 404 错误。请立即按照以下步骤进行部署修复。</p>
        </div>
        
        <div class="steps">
            <div class="step">
                <h4>步骤 1: 准备部署文件</h4>
                <p>以下文件已准备就绪，需要部署到 Netlify:</p>
                <div class="files-list">
                    <h4>📁 部署文件清单</h4>
                    ${Object.entries(deploymentPackage.files).map(([name, file]) => `
                        <div class="file-item">
                            <span class="file-name">${name}</span>
                            <span class="file-size">${file.size} bytes</span>
                            <span class="status ready">就绪</span>
                        </div>
                    `).join('')}
                    
                    ${deploymentPackage.missingFiles.length > 0 ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e5e9;">
                            <h5 style="color: #d63031; margin-bottom: 10px;">缺失文件:</h5>
                            ${deploymentPackage.missingFiles.map(name => `
                                <div class="file-item">
                                    <span class="file-name">${name}</span>
                                    <span class="status missing">缺失</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="step">
                <h4>步骤 2: 访问 Netlify 控制台</h4>
                <p>点击下面的按钮访问 Netlify 控制台，选择您的站点进行部署:</p>
                <div class="netlify-link">
                    <a href="https://app.netlify.com" target="_blank" class="netlify-button">
                        🚀 访问 Netlify 控制台
                    </a>
                </div>
            </div>
            
            <div class="step">
                <h4>步骤 3: 执行部署</h4>
                <p>在 Netlify 控制台中:</p>
                <ol style="margin-left: 20px; color: #666;">
                    <li>找到您的站点 (caishen.us.kg)</li>
                    <li>进入 "Deploys" 页面</li>
                    <li>点击 "Trigger deploy" → "Deploy site"</li>
                    <li>等待部署完成 (通常需要 1-2 分钟)</li>
                </ol>
            </div>
            
            <div class="step">
                <h4>步骤 4: 验证部署</h4>
                <p>部署完成后，请访问以下链接进行验证:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <div style="margin: 10px 0;"><strong>主页面:</strong> <a href="https://caishen.us.kg/app-cdn.html" target="_blank" style="color: #667eea;">https://caishen.us.kg/app-cdn.html</a></div>
                    <div style="margin: 10px 0;"><strong>重定向测试:</strong> <a href="https://caishen.us.kg/downloads-cdn.html" target="_blank" style="color: #667eea;">https://caishen.us.kg/downloads-cdn.html</a></div>
                    <div style="margin: 10px 0;"><strong>404页面:</strong> <a href="https://caishen.us.kg/404.html" target="_blank" style="color: #667eea;">https://caishen.us.kg/404.html</a></div>
                </div>
            </div>
        </div>
        
        <div class="alternative-methods">
            <h4>🔧 替代部署方法</h4>
            
            <div class="method">
                <h5>方法 A: Git 部署</h5>
                <p>如果您已连接 Git 仓库，推送更改将自动触发部署:</p>
                <div class="code-block">git add . && git commit -m "Deploy GoldWord CDN files" && git push origin main</div>
            </div>
            
            <div class="method">
                <h5>方法 B: 拖拽部署</h5>
                <p>在 Netlify 控制台中，可以直接拖拽文件到部署区域进行快速部署。</p>
            </div>
            
            <div class="method">
                <h5>方法 C: Netlify CLI</h5>
                <p>如果已配置 Netlify CLI，可以使用命令行部署:</p>
                <div class="code-block">npx netlify deploy --prod --dir=.</div>
            </div>
        </div>
        
        <div class="footer">
            <p>部署时间: ${deploymentPackage.timestamp}</p>
            <p>如果问题仍然存在，请检查 Netlify 部署日志或联系技术支持。</p>
        </div>
    </div>
</body>
</html>`;

  const htmlFile = 'emergency-deployment.html';
  fs.writeFileSync(htmlFile, htmlContent);
  
  console.log(`✅ 紧急部署指南已生成: ${htmlFile}`);
  console.log(`📖 请在浏览器中打开 ${htmlFile} 查看详细部署步骤`);
  
  return htmlFile;
}

/**
 * 测试当前URL状态
 */
async function testCurrentUrls() {
  console.log('\n🔍 测试当前URL状态...\n');
  
  for (const url of DEPLOYMENT_CONFIG.targetUrls) {
    console.log(`测试: ${url}`);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            url: url
          });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('超时'));
        });
      });
      
      console.log(`   状态: ${response.status}`);
      if (response.status === 404) {
        console.log(`   ❌ 404错误 - 需要部署`);
      } else if (response.status === 301 || response.status === 302) {
        console.log(`   ↻ 重定向到: ${response.headers.location}`);
      } else if (response.status === 200) {
        console.log(`   ✅ 正常访问`);
      } else {
        console.log(`   ⚠️  其他状态: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * 创建部署摘要
 */
function createDeploymentSummary(deploymentPackage) {
  const summary = {
    timestamp: new Date().toISOString(),
    site: DEPLOYMENT_CONFIG.siteName,
    deploymentPackage: {
      totalFiles: deploymentPackage.totalFiles,
      totalSize: deploymentPackage.totalSize,
      missingFiles: deploymentPackage.missingFiles,
      files: Object.keys(deploymentPackage.files)
    },
    status: deploymentPackage.missingFiles.length === 0 ? 'ready' : 'incomplete',
    nextSteps: [
      '访问Netlify控制台: https://app.netlify.com',
      `找到站点: ${DEPLOYMENT_CONFIG.siteName}`,
      '进入"Deploys"页面',
      '点击"Trigger deploy" → "Deploy site"',
      '等待部署完成',
      '验证部署结果'
    ],
    verificationUrls: DEPLOYMENT_CONFIG.targetUrls
  };
  
  fs.writeFileSync('emergency-deployment-summary.json', JSON.stringify(summary, null, 2));
  console.log('✅ 部署摘要已保存: emergency-deployment-summary.json');
  
  return summary;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚨 GoldWord 紧急部署解决方案');
  console.log('=' .repeat(60));
  console.log(`生成时间: ${new Date().toLocaleString()}`);
  console.log(`目标站点: ${DEPLOYMENT_CONFIG.siteName}`);
  console.log('');
  
  // 测试当前状态
  await testCurrentUrls();
  
  // 创建部署包
  const deploymentPackage = createDeploymentPackage();
  
  if (deploymentPackage.missingFiles.length > 0) {
    console.log('\n⚠️  警告: 存在缺失的必需文件');
    console.log('请先确保所有文件都已创建完成。');
  }
  
  // 生成紧急部署指南
  const guideFile = generateNetlifyDropHTML(deploymentPackage);
  
  // 创建部署摘要
  const summary = createDeploymentSummary(deploymentPackage);
  
  console.log('\n🎯 下一步行动:');
  console.log('1. 打开浏览器访问: https://app.netlify.com');
  console.log('2. 找到您的站点并执行部署');
  console.log('3. 部署完成后验证URL访问');
  console.log('4. 如果问题仍然存在，请查看部署日志');
  
  console.log('\n📋 部署准备状态:');
  console.log(`${deploymentPackage.missingFiles.length === 0 ? '✅' : '⚠️'} 文件准备: ${deploymentPackage.totalFiles}/${DEPLOYMENT_CONFIG.deployFiles.length}`);
  console.log(`✅ 部署指南: ${guideFile}`);
  console.log(`✅ 部署摘要: emergency-deployment-summary.json`);
  
  console.log('\n🚀 请立即执行部署以解决404错误！');
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}