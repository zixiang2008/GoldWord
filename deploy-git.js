#!/usr/bin/env node

/**
 * GoldWord Git部署脚本
 * 用于通过Git推送到Netlify触发自动部署
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 执行Git命令
 */
function execGit(command) {
  try {
    console.log(`📝 执行: ${command}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return result;
  } catch (error) {
    console.log(`❌ Git命令失败: ${command}`);
    console.log(`错误: ${error.message}`);
    return null;
  }
}

/**
 * 检查Git状态
 */
function checkGitStatus() {
  console.log('🔍 检查Git状态...');
  
  const status = execGit('git status --porcelain');
  if (status === null) {
    console.log('❌ 无法获取Git状态');
    return false;
  }
  
  if (status.trim() === '') {
    console.log('✅ 工作目录干净，没有需要提交的更改');
    return true;
  }
  
  console.log('📋 检测到更改的文件:');
  status.split('\n').forEach(line => {
    if (line.trim()) {
      console.log(`   ${line}`);
    }
  });
  
  return true;
}

/**
 * 添加文件到Git
 */
function addFiles() {
  console.log('\n📁 添加部署文件到Git...');
  
  const files = [
    'app-cdn.html',
    '404.html',
    '_redirects',
    'netlify.toml',
    'cdn-links-generated.json',
    'cdn-mapping-config.json',
    'deploy-summary.json',
    'DEPLOYMENT_INSTRUCTIONS.md'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const result = execGit(`git add "${file}"`);
      if (result !== null) {
        console.log(`✅ 已添加: ${file}`);
      } else {
        console.log(`⚠️  添加失败: ${file}`);
      }
    } else {
      console.log(`⚠️  文件不存在: ${file}`);
    }
  });
  
  return true;
}

/**
 * 提交更改
 */
function commitChanges() {
  console.log('\n💾 提交更改...');
  
  const commitMessage = `Deploy GoldWord CDN files - ${new Date().toISOString()}`;
  const result = execGit(`git commit -m "${commitMessage}"`);
  
  if (result !== null) {
    console.log('✅ 提交成功');
    console.log(`   提交信息: ${commitMessage}`);
    return true;
  } else {
    console.log('❌ 提交失败');
    return false;
  }
}

/**
 * 推送到远程仓库
 */
function pushToRemote() {
  console.log('\n🚀 推送到远程仓库...');
  
  // 检查远程仓库
  const remotes = execGit('git remote -v');
  if (remotes === null || remotes.trim() === '') {
    console.log('❌ 没有找到远程仓库');
    console.log('   请先添加远程仓库: git remote add origin <your-repo-url>');
    return false;
  }
  
  console.log('📡 远程仓库信息:');
  remotes.split('\n').forEach(line => {
    if (line.trim()) {
      console.log(`   ${line}`);
    }
  });
  
  // 推送到main分支
  const result = execGit('git push origin main');
  if (result !== null) {
    console.log('✅ 推送成功！');
    console.log('   Netlify将自动检测到更改并重新部署');
    return true;
  }
  
  // 尝试master分支
  const result2 = execGit('git push origin master');
  if (result2 !== null) {
    console.log('✅ 推送成功（master分支）！');
    console.log('   Netlify将自动检测到更改并重新部署');
    return true;
  }
  
  console.log('❌ 推送失败');
  return false;
}

/**
 * 验证部署结果
 */
function verifyDeployment() {
  console.log('\n🧪 验证部署结果...');
  
  const urls = [
    'https://caishen.us.kg/app-cdn.html',
    'https://caishen.us.kg/downloads-cdn.html',
    'https://caishen.us.kg/'
  ];
  
  console.log('🔗 需要验证的URL:');
  urls.forEach(url => {
    console.log(`   ${url}`);
  });
  
  console.log('\n⏰ 部署通常需要1-2分钟完成');
  console.log('   请稍后访问上述链接验证部署结果');
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 GoldWord Git部署工具');
  console.log('='.repeat(50));
  console.log(`部署时间: ${new Date().toLocaleString()}`);
  console.log('');
  
  // 检查Git状态
  if (!checkGitStatus()) {
    console.log('\n❌ Git状态检查失败');
    return;
  }
  
  // 添加文件
  if (!addFiles()) {
    console.log('\n❌ 文件添加失败');
    return;
  }
  
  // 提交更改
  if (!commitChanges()) {
    console.log('\n❌ 提交失败');
    return;
  }
  
  // 推送到远程
  if (!pushToRemote()) {
    console.log('\n❌ 推送失败');
    return;
  }
  
  // 验证部署
  verifyDeployment();
  
  console.log('\n✅ Git部署流程完成！');
  console.log('Netlify将自动检测到更改并开始部署过程。');
}

// 运行主函数
if (require.main === module) {
  main();
}