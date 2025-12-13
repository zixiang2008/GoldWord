#!/usr/bin/env node

/**
 * Netlify直接部署包创建器
 * 创建可以直接上传到Netlify的部署文件包
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 部署文件列表
const DEPLOY_FILES = [
  'app-cdn.html',
  '404.html',
  '_redirects',
  'netlify.toml',
  'cdn-links-generated.json',
  'cdn-mapping-config.json'
];

/**
 * 创建部署包
 */
function createDeploymentPackage() {
  console.log('📦 创建Netlify部署包...\n');
  
  const deployPackage = {
    timestamp: new Date().toISOString(),
    files: {},
    totalSize: 0,
    fileCount: 0
  };
  
  // 创建部署目录
  const deployDir = 'netlify-deploy-package';
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir);
  }
  
  DEPLOY_FILES.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const targetPath = path.join(deployDir, file);
    
    if (fs.existsSync(sourcePath)) {
      try {
        // 复制文件到部署目录
        const content = fs.readFileSync(sourcePath);
        const targetDirname = path.dirname(targetPath);
        if (!fs.existsSync(targetDirname)) {
          fs.mkdirSync(targetDirname, { recursive: true });
        }
        fs.writeFileSync(targetPath, content);
        
        const stats = fs.statSync(sourcePath);
        deployPackage.files[file] = {
          size: stats.size,
          status: 'copied'
        };
        
        deployPackage.totalSize += stats.size;
        deployPackage.fileCount++;
        
        console.log(`✅ ${file} (${stats.size} bytes) -> ${targetPath}`);
        
      } catch (error) {
        console.log(`❌ ${file} - 复制失败: ${error.message}`);
        deployPackage.files[file] = {
          size: 0,
          status: 'error',
          error: error.message
        };
      }
    } else {
      console.log(`⚠️  ${file} - 文件不存在`);
      deployPackage.files[file] = {
        size: 0,
        status: 'missing'
      };
    }
  });

  // 复制 downloads 元数据文件
  try {
    const downloadsRoot = path.join(__dirname, 'downloads');
    const latestPath = path.join(downloadsRoot, 'latest.json');
    if (fs.existsSync(latestPath)) {
      const latestContent = fs.readFileSync(latestPath);
      const latestTarget = path.join(deployDir, 'downloads', 'latest.json');
      const latestTargetDir = path.dirname(latestTarget);
      if (!fs.existsSync(latestTargetDir)) {
        fs.mkdirSync(latestTargetDir, { recursive: true });
      }
      fs.writeFileSync(latestTarget, latestContent);
      const latestStats = fs.statSync(latestPath);
      deployPackage.files['downloads/latest.json'] = { size: latestStats.size, status: 'copied' };
      deployPackage.totalSize += latestStats.size;
      deployPackage.fileCount++;
      console.log(`✅ downloads/latest.json (${latestStats.size} bytes) -> ${latestTarget}`);

      let latestVersion = null;
      try { latestVersion = JSON.parse(latestContent.toString()).latest; } catch (_) {}
      if (latestVersion) {
        const indexPath = path.join(downloadsRoot, latestVersion, 'index.json');
        if (fs.existsSync(indexPath)) {
          const indexContent = fs.readFileSync(indexPath);
          const indexTarget = path.join(deployDir, 'downloads', latestVersion, 'index.json');
          const indexTargetDir = path.dirname(indexTarget);
          if (!fs.existsSync(indexTargetDir)) {
            fs.mkdirSync(indexTargetDir, { recursive: true });
          }
          fs.writeFileSync(indexTarget, indexContent);
          const indexStats = fs.statSync(indexPath);
          deployPackage.files[`downloads/${latestVersion}/index.json`] = { size: indexStats.size, status: 'copied' };
          deployPackage.totalSize += indexStats.size;
          deployPackage.fileCount++;
          console.log(`✅ downloads/${latestVersion}/index.json (${indexStats.size} bytes) -> ${indexTarget}`);

          // 复制构建产物到根版本目录，以匹配 /<version>/* 链接
          try {
            const versionSrcDir = path.join(downloadsRoot, latestVersion);
            const versionTargetDir = path.join(deployDir, latestVersion);
            if (fs.existsSync(versionSrcDir)) {
              if (!fs.existsSync(versionTargetDir)) fs.mkdirSync(versionTargetDir, { recursive: true });
              const binFiles = fs.readdirSync(versionSrcDir).filter(f => /\.(apk|ipa|dmg|zip|exe)$/i.test(f));
              for (const f of binFiles) {
                const src = path.join(versionSrcDir, f);
                const dest = path.join(versionTargetDir, f);
                fs.copyFileSync(src, dest);
                const st = fs.statSync(src);
                deployPackage.files[`${latestVersion}/${f}`] = { size: st.size, status: 'copied' };
                deployPackage.totalSize += st.size;
                deployPackage.fileCount++;
                console.log(`✅ ${latestVersion}/${f} (${st.size} bytes) -> ${dest}`);
              }
            }
          } catch (err) {
            console.log(`⚠️  复制版本二进制失败: ${err.message}`);
          }
        } else {
          console.log(`⚠️  downloads/${latestVersion}/index.json - 文件不存在`);
          deployPackage.files[`downloads/${latestVersion}/index.json`] = { size: 0, status: 'missing' };
        }
      }
    } else {
      console.log('⚠️  downloads/latest.json - 文件不存在');
      deployPackage.files['downloads/latest.json'] = { size: 0, status: 'missing' };
    }
  } catch (e) {
    console.log(`❌ 复制 downloads 元数据失败: ${e.message}`);
  }
  
  // 保存部署包信息
  const packageInfoPath = path.join(deployDir, 'deploy-package-info.json');
  fs.writeFileSync(packageInfoPath, JSON.stringify(deployPackage, null, 2));
  
  console.log(`\n📊 部署包统计:`);
  console.log(`   文件总数: ${deployPackage.fileCount}/${DEPLOY_FILES.length}`);
  console.log(`   总大小: ${deployPackage.totalSize} bytes`);
  console.log(`   部署目录: ${deployDir}/`);
  
  return { deployPackage, deployDir };
}

/**
 * 创建部署说明
 */
function createDeploymentInstructions(deployDir) {
  const instructions = `# Netlify 部署说明

## 📦 部署包内容
此目录包含所有需要部署到Netlify的文件，专门解决404错误问题。

## 🚀 部署步骤

### 方法1: 拖拽部署（推荐）
1. 访问 https://app.netlify.com
2. 找到您的站点 "caishen.us.kg"
3. 进入站点概览页面
4. 找到"拖拽部署"区域
5. 将此目录中的所有文件拖拽到部署区域
6. 等待部署完成

### 方法2: 手动文件上传
1. 访问 https://app.netlify.com
2. 进入您的站点
3. 点击"Deploys" → "Deploy site"
4. 选择"手动部署"
5. 逐个上传此目录中的文件

### 方法3: Git部署
如果这些文件来自Git仓库，推送更改将自动触发部署：
\`\`\`bash
git add .
git commit -m "Fix Netlify 404 error"
git push origin main
\`\`\`

## 📋 文件清单
${DEPLOY_FILES.map(file => {
  const filePath = path.join(deployDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return `- ✅ ${file} (${stats.size} bytes)`;
  } else {
    return `- ❌ ${file} (缺失)`;
  }
}).join('\n')}

## 🔍 验证部署
部署完成后，请访问以下URL验证：

1. **主页面**: https://caishen.us.kg/app-cdn.html
   - 期望：200 OK，显示下载页面

2. **重定向测试**: https://caishen.us.kg/downloads-cdn.html
   - 期望：301重定向到/app-cdn.html

3. **404页面**: https://caishen.us.kg/404.html
   - 期望：200 OK，显示自定义404页面

## ⚠️ 常见问题

**Q: 部署后仍然显示404？**
A: 请检查：
- 文件是否成功上传
- 等待1-2分钟让CDN生效
- 清除浏览器缓存

**Q: 重定向不工作？**
A: 检查_netlify.toml_文件是否正确上传

**Q: 样式显示异常？**
A: 确保所有相关文件都已上传，包括CSS和JS文件

## 🆘 技术支持
如果问题仍然存在：
1. 检查Netlify部署日志
2. 验证域名DNS设置
3. 联系Netlify支持团队

---
部署时间: ${new Date().toLocaleString()}
问题: Netlify 404错误修复
目标: 使 https://caishen.us.kg/app-cdn.html 正常访问
`;

  const instructionsPath = path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.md');
  fs.writeFileSync(instructionsPath, instructions);
  
  console.log(`✅ 部署说明已创建: ${instructionsPath}`);
}

/**
 * 创建快速部署脚本
 */
function createQuickDeployScript(deployDir) {
  const scriptContent = `#!/bin/bash

# Netlify快速部署脚本
# 用于快速上传文件到Netlify

echo "🚀 开始Netlify部署..."

# 检查文件是否存在
echo "📋 检查部署文件..."
for file in ${DEPLOY_FILES.join(' ')}; do
  if [ -f "$file" ]; then
    echo "✅ $file 存在"
  else
    echo "❌ $file 缺失"
  fi
done

echo ""
echo "📦 部署包已准备完成！"
echo "下一步:"
echo "1. 访问 https://app.netlify.com"
echo "2. 找到 caishen.us.kg 站点"
echo "3. 拖拽所有文件到部署区域"
echo ""
echo "验证URL:"
echo "- https://caishen.us.kg/app-cdn.html"
echo "- https://caishen.us.kg/downloads-cdn.html"
echo ""
echo "部署时间: $(date)"
`;

  const scriptPath = path.join(deployDir, 'deploy-to-netlify.sh');
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');
  
  console.log(`✅ 快速部署脚本已创建: ${scriptPath}`);
}

/**
 * 验证部署包
 */
function validateDeploymentPackage(deployDir) {
  console.log('\n🔍 验证部署包...\n');
  
  let validFiles = 0;
  let totalSize = 0;
  
  DEPLOY_FILES.forEach(file => {
    const filePath = path.join(deployDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      validFiles++;
      totalSize += stats.size;
      console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${file} - 文件不存在`);
    }
  });
  
  console.log(`\n📊 验证结果:`);
  console.log(`   有效文件: ${validFiles}/${DEPLOY_FILES.length}`);
  console.log(`   总大小: ${totalSize} bytes`);
  console.log(`   部署包目录: ${deployDir}/`);
  
  return validFiles === DEPLOY_FILES.length;
}

/**
 * 创建ZIP压缩包（可选）
 */
function createZipPackage(deployDir) {
  try {
    console.log('\n📦 创建ZIP压缩包...\n');
    
    // 简单的ZIP创建（使用Node.js原生功能模拟）
    const zipInfo = {
      type: 'deployment-package',
      timestamp: new Date().toISOString(),
      files: DEPLOY_FILES,
      directory: deployDir,
      instructions: '将此目录中的所有文件上传到Netlify'
    };
    
    const zipInfoPath = path.join(deployDir, 'package-info.json');
    fs.writeFileSync(zipInfoPath, JSON.stringify(zipInfo, null, 2));
    
    console.log(`✅ 包信息已保存: ${zipInfoPath}`);
    console.log('💡 提示: 您可以手动将此目录压缩为ZIP文件');
    
  } catch (error) {
    console.log(`⚠️  ZIP创建跳过: ${error.message}`);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('📦 Netlify部署包创建器');
  console.log('=' .repeat(50));
  console.log(`创建时间: ${new Date().toLocaleString()}`);
  console.log(`目标: 解决Netlify 404错误`);
  console.log('');
  
  // 创建部署包
  const { deployPackage, deployDir } = createDeploymentPackage();
  
  if (deployPackage.fileCount === 0) {
    console.log('\n❌ 没有文件可复制，无法创建部署包');
    return;
  }
  
  // 创建部署说明
  createDeploymentInstructions(deployDir);
  
  // 创建快速部署脚本
  createQuickDeployScript(deployDir);
  
  // 验证部署包
  const isValid = validateDeploymentPackage(deployDir);
  
  // 创建ZIP信息
  createZipPackage(deployDir);
  
  console.log('\n🎯 部署包创建完成！');
  console.log('');
  console.log('🚀 下一步行动:');
  console.log(`1. 打开目录: ${deployDir}/`);
  console.log('2. 阅读 DEPLOYMENT_INSTRUCTIONS.md');
  console.log('3. 按照说明上传到Netlify');
  console.log('4. 验证: https://caishen.us.kg/app-cdn.html');
  
  if (isValid) {
    console.log('\n✅ 所有文件就绪，可以立即部署！');
  } else {
    console.log('\n⚠️  部分文件缺失，请检查后再部署');
  }
  
  console.log('\n📁 部署包内容:');
  console.log(`   目录: ${deployDir}/`);
  console.log('   包含: 所有必要的部署文件 + 说明文档');
  console.log('   用途: 直接上传到Netlify解决404错误');
}

// 运行主函数
if (require.main === module) {
  main();
}
