#!/usr/bin/env node
/**
 * GoldWord R2文件上传工具
 * 使用S3兼容API上传文件到CloudFlare R2
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// R2配置
const R2_CONFIG = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
    bucketName: 'goldword-downloads',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || ''
};

// 要上传的文件列表
const FILES_TO_UPLOAD = [
    // 版本 1.0.2 文件
    { localPath: 'GoldWord-1.0.2.dmg', r2Path: '1.0.2/GoldWord-1.0.2.dmg', version: '1.0.2' },
    { localPath: 'GoldWord-1.0.2-arm64.dmg', r2Path: '1.0.2/GoldWord-1.0.2-arm64.dmg', version: '1.0.2' },
    { localPath: 'GoldWord-1.0.2.exe', r2Path: '1.0.2/GoldWord-1.0.2.exe', version: '1.0.2' },
    { localPath: 'GoldWord-1.0.2-arm64.exe', r2Path: '1.0.2/GoldWord-1.0.2-arm64.exe', version: '1.0.2' },
    { localPath: 'GoldWord-1.0.2.AppImage', r2Path: '1.0.2/GoldWord-1.0.2.AppImage', version: '1.0.2' },
    { localPath: 'GoldWord-1.0.2-arm64.AppImage', r2Path: '1.0.2/GoldWord-1.0.2-arm64.AppImage', version: '1.0.2' },
    // 版本 1.0.3 文件
    { localPath: 'GoldWord-1.0.3.dmg', r2Path: '1.0.3/GoldWord-1.0.3.dmg', version: '1.0.3' },
    { localPath: 'GoldWord-1.0.3-arm64.dmg', r2Path: '1.0.3/GoldWord-1.0.3-arm64.dmg', version: '1.0.3' },
    { localPath: 'GoldWord-1.0.3.exe', r2Path: '1.0.3/GoldWord-1.0.3.exe', version: '1.0.3' },
    { localPath: 'GoldWord-1.0.3-arm64.exe', r2Path: '1.0.3/GoldWord-1.0.3-arm64.exe', version: '1.0.3' },
    { localPath: 'GoldWord-1.0.3.AppImage', r2Path: '1.0.3/GoldWord-1.0.3.AppImage', version: '1.0.3' },
    { localPath: 'GoldWord-1.0.3-arm64.AppImage', r2Path: '1.0.3/GoldWord-1.0.3-arm64.AppImage', version: '1.0.3' }
];

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

// 获取文件MD5
function getFileMD5(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        
        stream.on('error', reject);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

// 获取文件大小
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 初始化S3客户端
function initS3Client() {
    if (!R2_CONFIG.endpoint) {
        R2_CONFIG.endpoint = `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`;
    }
    
    return new AWS.S3({
        endpoint: R2_CONFIG.endpoint,
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
        signatureVersion: 'v4',
        region: 'auto',
        s3ForcePathStyle: true
    });
}

// 检查存储桶是否存在
async function checkBucketExists(s3) {
    try {
        await s3.headBucket({ Bucket: R2_CONFIG.bucketName }).promise();
        log(`✅ 存储桶已存在: ${R2_CONFIG.bucketName}`, 'success');
        return true;
    } catch (error) {
        if (error.statusCode === 404) {
            log(`⚠️ 存储桶不存在: ${R2_CONFIG.bucketName}`, 'warning');
            return false;
        }
        throw error;
    }
}

// 创建存储桶
async function createBucket(s3) {
    try {
        log(`正在创建存储桶: ${R2_CONFIG.bucketName}`, 'info');
        await s3.createBucket({ Bucket: R2_CONFIG.bucketName }).promise();
        log(`✅ 存储桶创建成功: ${R2_CONFIG.bucketName}`, 'success');
        return true;
    } catch (error) {
        log(`❌ 创建存储桶失败: ${error.message}`, 'error');
        throw error;
    }
}

// 上传单个文件
async function uploadFile(s3, fileInfo) {
    const { localPath, r2Path, version } = fileInfo;
    
    try {
        // 检查本地文件是否存在
        if (!fs.existsSync(localPath)) {
            log(`⚠️ 文件不存在，跳过: ${localPath}`, 'warning');
            return { success: false, skipped: true, file: localPath };
        }
        
        const fileSize = getFileSize(localPath);
        const formattedSize = formatFileSize(fileSize);
        
        log(`正在上传: ${localPath} (${formattedSize}) -> ${r2Path}`, 'info');
        
        // 读取文件内容
        const fileContent = fs.readFileSync(localPath);
        
        // 获取文件MD5用于验证
        const fileMD5 = await getFileMD5(localPath);
        
        // 设置上传参数
        const uploadParams = {
            Bucket: R2_CONFIG.bucketName,
            Key: r2Path,
            Body: fileContent,
            ContentType: getContentType(localPath),
            ContentLength: fileSize,
            Metadata: {
                'original-md5': fileMD5,
                'upload-time': new Date().toISOString(),
                'version': version
            }
        };
        
        // 执行上传
        const result = await s3.upload(uploadParams).promise();
        
        log(`✅ 上传成功: ${r2Path}`, 'success');
        log(`   文件大小: ${formattedSize}, MD5: ${fileMD5}`, 'info');
        
        return {
            success: true,
            file: r2Path,
            size: fileSize,
            md5: fileMD5,
            location: result.Location
        };
        
    } catch (error) {
        log(`❌ 上传失败: ${r2Path} - ${error.message}`, 'error');
        return {
            success: false,
            file: r2Path,
            error: error.message
        };
    }
}

// 获取文件内容类型
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
        '.dmg': 'application/x-apple-diskimage',
        '.exe': 'application/x-msdownload',
        '.appimage': 'application/x-executable'
    };
    return contentTypes[ext] || 'application/octet-stream';
}

// 批量上传文件
async function uploadAllFiles() {
    log('🚀 开始批量上传文件到R2存储桶', 'info');
    log('=' .repeat(60), 'info');
    
    const s3 = initS3Client();
    
    try {
        // 检查存储桶
        const bucketExists = await checkBucketExists(s3);
        if (!bucketExists) {
            await createBucket(s3);
        }
        
        // 检查必要的环境变量
        if (!R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
            throw new Error('缺少必要的环境变量: CLOUDFLARE_R2_ACCESS_KEY_ID 和 CLOUDFLARE_R2_SECRET_ACCESS_KEY');
        }
        
        log(`📊 准备上传 ${FILES_TO_UPLOAD.length} 个文件`, 'info');
        
        // 按版本分组上传
        const versions = ['1.0.2', '1.0.3'];
        const results = { successful: 0, failed: 0, skipped: 0 };
        
        for (const version of versions) {
            const versionFiles = FILES_TO_UPLOAD.filter(f => f.version === version);
            log(`\n📦 开始上传版本 ${version} 文件 (${versionFiles.length}个)`, 'info');
            
            for (const fileInfo of versionFiles) {
                const result = await uploadFile(s3, fileInfo);
                
                if (result.success) {
                    results.successful++;
                } else if (result.skipped) {
                    results.skipped++;
                } else {
                    results.failed++;
                }
                
                // 上传间隔，避免API限制
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // 上传总结
        log('\n' + '=' .repeat(60), 'info');
        log('🎉 文件上传完成！', 'success');
        log(`📊 上传统计:`, 'info');
        log(`   ✅ 成功: ${results.successful}`, 'success');
        log(`   ⚠️  跳过: ${results.skipped}`, 'warning');
        log(`   ❌ 失败: ${results.failed}`, 'error');
        
        // 生成测试链接
        if (results.successful > 0) {
            log('\n🔗 测试链接:', 'info');
            const testFiles = FILES_TO_UPLOAD.filter(f => fs.existsSync(f.localPath)).slice(0, 3);
            testFiles.forEach(file => {
                const testUrl = `https://caishen.us.kg/${file.r2Path}`;
                log(`   ${testUrl}`, 'info');
            });
        }
        
        return results;
        
    } catch (error) {
        log(`❌ 上传过程失败: ${error.message}`, 'error');
        throw error;
    }
}

// 验证上传的文件
async function verifyUploads() {
    log('🔍 开始验证上传的文件', 'info');
    
    const s3 = initS3Client();
    
    try {
        const verificationResults = [];
        
        for (const fileInfo of FILES_TO_UPLOAD) {
            if (!fs.existsSync(fileInfo.localPath)) continue;
            
            try {
                const headResult = await s3.headObject({
                    Bucket: R2_CONFIG.bucketName,
                    Key: fileInfo.r2Path
                }).promise();
                
                const localMD5 = await getFileMD5(fileInfo.localPath);
                const uploadedMD5 = headResult.Metadata['original-md5'];
                
                const isValid = localMD5 === uploadedMD5;
                
                verificationResults.push({
                    file: fileInfo.r2Path,
                    valid: isValid,
                    localMD5,
                    uploadedMD5,
                    size: headResult.ContentLength
                });
                
                if (isValid) {
                    log(`✅ 验证通过: ${fileInfo.r2Path}`, 'success');
                } else {
                    log(`❌ 验证失败: ${fileInfo.r2Path} (MD5不匹配)`, 'error');
                }
                
            } catch (error) {
                log(`❌ 无法验证: ${fileInfo.r2Path} - ${error.message}`, 'error');
                verificationResults.push({
                    file: fileInfo.r2Path,
                    valid: false,
                    error: error.message
                });
            }
        }
        
        const validCount = verificationResults.filter(r => r.valid).length;
        const totalCount = verificationResults.length;
        
        log(`\n📊 验证结果: ${validCount}/${totalCount} 文件验证通过`, 'info');
        
        return verificationResults;
        
    } catch (error) {
        log(`❌ 验证过程失败: ${error.message}`, 'error');
        throw error;
    }
}

// 主函数
async function main() {
    try {
        // 上传文件
        await uploadAllFiles();
        
        // 验证上传
        await verifyUploads();
        
        log('\n🎉 R2文件上传和验证完成！', 'success');
        
    } catch (error) {
        log(`❌ 过程失败: ${error.message}`, 'error');
        process.exit(1);
    }
}

// 如果直接运行
if (require.main === module) {
    main();
}

module.exports = {
    uploadAllFiles,
    verifyUploads,
    initS3Client
};