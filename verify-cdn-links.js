#!/usr/bin/env node

/**
 * CDN链接验证工具
 * 验证所有GitHub发布文件是否已正确映射到CDN链接
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class CDNLinkVerifier {
    constructor() {
        this.results = {
            total: 0,
            success: 0,
            failed: 0,
            errors: []
        };
    }

    async checkUrl(url, timeout = 10000) {
        return new Promise((resolve) => {
            const options = {
                method: 'HEAD',
                timeout: timeout,
                headers: {
                    'User-Agent': 'GoldWord-CDN-Verifier/1.0'
                }
            };

            const req = https.request(url, options, (res) => {
                resolve({
                    url: url,
                    status: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    headers: res.headers
                });
            });

            req.on('error', (err) => {
                resolve({
                    url: url,
                    status: 0,
                    success: false,
                    error: err.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url: url,
                    status: 0,
                    success: false,
                    error: 'Timeout'
                });
            });

            req.end();
        });
    }

    async verifyCDNLinks() {
        console.log('🚀 开始验证CDN链接映射...\n');

        try {
            // 读取CDN映射配置
            const configPath = path.join(__dirname, 'cdn-mapping-config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            console.log(`📋 项目: ${config.project}`);
            console.log(`🔗 GitHub仓库: ${config.github_repository}`);
            console.log(`🌐 CDN域名: ${config.cdn_base_url}\n`);

            // 验证每个版本的文件
            for (const [version, versionData] of Object.entries(config.version_mapping)) {
                console.log(`📦 版本 ${version} (${versionData.release_date}):`);
                console.log(`   GitHub发布: ${versionData.github_release_url}`);
                console.log(`   CDN路径: ${versionData.cdn_version_path}\n`);

                for (const [filename, fileData] of Object.entries(versionData.files)) {
                    this.results.total++;

                    console.log(`   🔍 检查文件: ${filename}`);
                    console.log(`      类型: ${fileData.type}`);
                    console.log(`      大小: ${this.formatBytes(fileData.size)}`);
                    
                    // 检查GitHub链接
                    console.log(`      GitHub: ${fileData.github_url}`);
                    const githubResult = await this.checkUrl(fileData.github_url);
                    
                    if (githubResult.success) {
                        console.log(`      ✅ GitHub链接正常 (${githubResult.status})`);
                    } else {
                        console.log(`      ❌ GitHub链接失败: ${githubResult.error || githubResult.status}`);
                    }

                    // 检查CDN链接
                    console.log(`      CDN: ${fileData.cdn_url}`);
                    const cdnResult = await this.checkUrl(fileData.cdn_url);
                    
                    if (cdnResult.success) {
                        console.log(`      ✅ CDN链接正常 (${cdnResult.status})`);
                        this.results.success++;
                    } else {
                        console.log(`      ❌ CDN链接失败: ${cdnResult.error || cdnResult.status}`);
                        this.results.failed++;
                        this.results.errors.push({
                            file: filename,
                            version: version,
                            cdn_url: fileData.cdn_url,
                            error: cdnResult.error || cdnResult.status
                        });
                    }

                    console.log(''); // 空行分隔
                }
            }

            // 输出总结报告
            this.printSummary();

        } catch (error) {
            console.error('❌ 验证过程出错:', error.message);
            process.exit(1);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 CDN链接验证报告');
        console.log('='.repeat(60));
        console.log(`总文件数: ${this.results.total}`);
        console.log(`成功: ${this.results.success} (${((this.results.success/this.results.total)*100).toFixed(1)}%)`);
        console.log(`失败: ${this.results.failed} (${((this.results.failed/this.results.total)*100).toFixed(1)}%)`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ 失败的CDN链接:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.file} (v${error.version})`);
                console.log(`   URL: ${error.cdn_url}`);
                console.log(`   错误: ${error.error}`);
            });
            
            console.log('\n💡 建议:');
            console.log('1. 检查CDN配置是否正确');
            console.log('2. 确认文件是否已上传到R2存储桶');
            console.log('3. 验证DNS解析是否正常');
            console.log('4. 检查CloudFlare R2访问权限');
        } else {
            console.log('\n🎉 所有CDN链接验证成功！');
            console.log('✅ GitHub仓库与CDN加速已完美关联');
            console.log('🚀 全球用户现在可以享受高速下载体验了！');
        }
        
        console.log('\n🔗 快速访问:');
        console.log('CDN下载页面: https://caishen.us.kg/app-cdn.html');
        console.log('GitHub仓库: https://github.com/zixiang2008/GoldWord');
        console.log('='.repeat(60));
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const verifier = new CDNLinkVerifier();
    verifier.verifyCDNLinks().catch(error => {
        console.error('验证失败:', error);
        process.exit(1);
    });
}

module.exports = CDNLinkVerifier;