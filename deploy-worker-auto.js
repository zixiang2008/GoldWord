#!/usr/bin/env node
/**
 * CloudFlare Worker自动配置脚本
 * 为GoldWord项目创建和配置CDN Worker
 */

const https = require('https');
const fs = require('fs');

// 配置
const CONFIG = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    domain: 'caishen.us.kg',
    bucketName: 'goldword-downloads',
    workerName: 'goldword-cdn-worker'
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

// API请求函数
function makeApiRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`API错误: ${res.statusCode} - ${parsed.errors?.[0]?.message || responseData}`));
                    }
                } catch (e) {
                    reject(new Error(`解析响应失败: ${e.message}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setHeader('User-Agent', 'GoldWord-Worker-Deploy/1.0');
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 生成Worker脚本
function generateWorkerScript() {
    return `
// GoldWord CDN Worker脚本
// 处理文件下载请求和缓存

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  
  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 处理下载请求 - 版本1.0.2
  if (url.pathname.startsWith('/1.0.2/')) {
    return handleFileRequest(request, url.pathname.substring(1), corsHeaders)
  }
  
  // 处理下载请求 - 版本1.0.3
  if (url.pathname.startsWith('/1.0.3/')) {
    return handleFileRequest(request, url.pathname.substring(1), corsHeaders)
  }
  
  // 处理下载页面请求
  if (url.pathname === '/app-cdn.html') {
    return handleDownloadPage(request, corsHeaders)
  }
  
  // 处理根路径请求
  if (url.pathname === '/' || url.pathname === '') {
    return Response.redirect('https://' + url.hostname + '/app-cdn.html', 301)
  }
  
  return new Response('Not Found', { status: 404 })
}

async function handleFileRequest(request, filePath, corsHeaders) {
  try {
    // 从R2存储桶获取文件
    const object = await cdn_bucket.get(filePath)
    
    if (object === null) {
      return new Response('文件未找到', { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }
    
    // 设置响应头
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cache-Control', 'public, max-age=31536000')
    headers.set('CDN-Cache-Control', 'public, max-age=31536000')
    headers.set('Content-Disposition', \`attachment; filename="\${filePath.split('/').pop()}"\`)
    
    // 添加安全头
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-XSS-Protection', '1; mode=block')
    
    return new Response(object.body, {
      headers,
    })
    
  } catch (error) {
    return new Response(\`服务器错误: \${error.message}\`, { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }
}

async function handleDownloadPage(request, corsHeaders) {
  // 可以返回简单的下载页面或重定向到GitHub Pages
  const html = \`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoldWord下载中心</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 40px; background: #f5f5f5; 
            display: flex; justify-content: center; align-items: center; min-height: 100vh;
        }
        .container { 
            background: white; padding: 40px; border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 600px;
        }
        h1 { color: #007aff; margin-bottom: 20px; }
        .links { margin-top: 30px; }
        .link-btn { 
            display: inline-block; margin: 10px; padding: 12px 24px; 
            background: #007aff; color: white; text-decoration: none; 
            border-radius: 8px; transition: background 0.3s;
        }
        .link-btn:hover { background: #0056b3; }
        .version { font-size: 14px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 GoldWord CDN下载中心</h1>
        <p>文件通过CloudFlare CDN全球加速，提供更快的下载速度。</p>
        <div class="links">
            <a href="/1.0.3/GoldWord-1.0.3.dmg" class="link-btn">macOS版 (1.0.3)</a>
            <a href="/1.0.3/GoldWord-1.0.3.exe" class="link-btn">Windows版 (1.0.3)</a>
            <a href="/1.0.3/GoldWord-1.0.3.AppImage" class="link-btn">Linux版 (1.0.3)</a>
        </div>
        <div class="links">
            <a href="/1.0.2/GoldWord-1.0.2.dmg" class="link-btn">macOS版 (1.0.2)</a>
            <a href="/1.0.2/GoldWord-1.0.2.exe" class="link-btn">Windows版 (1.0.2)</a>
            <a href="/1.0.2/GoldWord-1.0.2.AppImage" class="link-btn">Linux版 (1.0.2)</a>
        </div>
        <div class="version">
            <p>💡 提示：使用最新的1.0.3版本获得最佳体验</p>
            <p>📱 支持平台：macOS (Intel/Apple Silicon)、Windows、Linux</p>
        </div>
    </div>
</body>
</html>
\`
  
  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
`;
}

// 创建Worker脚本文件
function createWorkerScriptFile() {
    const script = generateWorkerScript();
    fs.writeFileSync('goldword-cdn-worker.js', script);
    log('✅ Worker脚本已保存到: goldword-cdn-worker.js', 'success');
}

// 创建Worker
async function createWorker() {
    log(`正在创建Worker: ${CONFIG.workerName}`, 'info');
    
    try {
        const options = {
            hostname: 'api.cloudflare.com',
            path: `/client/v4/accounts/${CONFIG.accountId}/workers/scripts/${CONFIG.workerName}`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${CONFIG.apiToken}`,
                'Content-Type': 'application/javascript'
            }
        };
        
        const script = generateWorkerScript();
        const response = await makeApiRequest(options, script);
        
        log(`✅ Worker创建成功: ${CONFIG.workerName}`, 'success');
        return response.result;
    } catch (error) {
        log(`❌ Worker创建失败: ${error.message}`, 'error');
        throw error;
    }
}

// 配置Worker路由
async function configureWorkerRoutes(workerId) {
    log('正在配置Worker路由...', 'info');
    
    const routes = [
        `${CONFIG.domain}/1.0.2/*`,
        `${CONFIG.domain}/1.0.3/*`,
        `${CONFIG.domain}/app-cdn.html`
    ];
    
    try {
        for (const route of routes) {
            const options = {
                hostname: 'api.cloudflare.com',
                path: `/client/v4/accounts/${CONFIG.accountId}/workers/scripts/${CONFIG.workerName}/routes`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.apiToken}`,
                    'Content-Type': 'application/json'
                }
            };
            
            const data = {
                pattern: route,
                script: CONFIG.workerName
            };
            
            await makeApiRequest(options, data);
            log(`✅ 路由配置成功: ${route}`, 'success');
        }
        
        return true;
    } catch (error) {
        log(`❌ 路由配置失败: ${error.message}`, 'error');
        throw error;
    }
}

// 绑定R2存储桶到Worker
async function bindR2BucketToWorker() {
    log(`正在绑定R2存储桶到Worker: ${CONFIG.bucketName}`, 'info');
    
    try {
        // 创建R2绑定
        const options = {
            hostname: 'api.cloudflare.com',
            path: `/client/v4/accounts/${CONFIG.accountId}/workers/scripts/${CONFIG.workerName}/bindings`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${CONFIG.apiToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        const bindings = [
            {
                name: 'cdn_bucket',
                type: 'r2_bucket',
                bucket_name: CONFIG.bucketName
            }
        ];
        
        await makeApiRequest(options, { bindings });
        log('✅ R2存储桶绑定成功', 'success');
        return true;
    } catch (error) {
        log(`❌ R2存储桶绑定失败: ${error.message}`, 'error');
        throw error;
    }
}

// 生成部署配置
function generateDeploymentConfig() {
    const config = {
        workerName: CONFIG.workerName,
        bucketName: CONFIG.bucketName,
        domain: CONFIG.domain,
        routes: [
            `${CONFIG.domain}/1.0.2/*`,
            `${CONFIG.domain}/1.0.3/*`,
            `${CONFIG.domain}/app-cdn.html`
        ],
        environmentVariables: {
            ACCOUNT_ID: CONFIG.accountId,
            BUCKET_NAME: CONFIG.bucketName
        }
    };
    
    fs.writeFileSync('worker-deployment-config.json', JSON.stringify(config, null, 2));
    log('✅ 部署配置已保存到: worker-deployment-config.json', 'success');
    
    return config;
}

// 运行完整Worker部署流程
async function deployWorker() {
    log('🚀 开始CloudFlare Worker自动部署流程', 'info');
    log('=' .repeat(60), 'info');
    
    try {
        // 检查必要的环境变量
        if (!CONFIG.accountId || !CONFIG.apiToken) {
            throw new Error('缺少必要的环境变量: CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN');
        }
        
        // 1. 创建Worker脚本文件
        createWorkerScriptFile();
        
        // 2. 创建Worker
        const worker = await createWorker();
        
        // 3. 配置Worker路由
        await configureWorkerRoutes(worker.id);
        
        // 4. 绑定R2存储桶
        await bindR2BucketToWorker();
        
        // 5. 生成部署配置
        const deploymentConfig = generateDeploymentConfig();
        
        // 完成总结
        log('=' .repeat(60), 'info');
        log('🎉 CloudFlare Worker自动部署完成！', 'success');
        
        log('\n📋 部署信息:', 'info');
        log(`   Worker名称: ${CONFIG.workerName}`, 'info');
        log(`   存储桶名称: ${CONFIG.bucketName}`, 'info');
        log(`   域名: ${CONFIG.domain}`, 'info');
        
        log('\n🔗 路由配置:', 'info');
        deploymentConfig.routes.forEach(route => {
            log(`   ${route}`, 'info');
        });
        
        log('\n🧪 测试链接:', 'info');
        log('   https://caishen.us.kg/1.0.3/GoldWord-1.0.3.dmg', 'info');
        log('   https://caishen.us.kg/1.0.2/GoldWord-1.0.2.dmg', 'info');
        log('   https://caishen.us.kg/app-cdn.html', 'info');
        
        log('\n⚠️  重要提醒:', 'warning');
        log('   1. 确保R2存储桶已创建并包含必要的文件', 'info');
        log('   2. 在CloudFlare控制台验证Worker运行状态', 'info');
        log('   3. 测试所有下载链接是否正常工作', 'info');
        
    } catch (error) {
        log(`❌ Worker部署失败: ${error.message}`, 'error');
        process.exit(1);
    }
}

// 如果直接运行
if (require.main === module) {
    deployWorker().catch(error => {
        log(`❌ 未处理的错误: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    deployWorker,
    generateWorkerScript,
    createWorker,
    configureWorkerRoutes
};