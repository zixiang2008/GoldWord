# CloudFlare CDN 自动化部署指南

## 🚀 一键部署脚本

我已经为你创建了完整的CloudFlare CDN自动化部署程序，包含以下文件：

### 📁 文件说明

1. **`cloudflare-cdn-setup.js`** - 交互式配置向导
2. **`deploy-cdn.js`** - 完全自动化部署脚本  
3. **`deploy-cdn.sh`** - 一键部署Shell脚本
4. **`package-cdn.json`** - 项目依赖配置

## 📋 使用步骤

### 方法1：一键部署（推荐）

```bash
# 给脚本添加执行权限
chmod +x deploy-cdn.sh

# 运行一键部署
./deploy-cdn.sh
```

### 方法2：手动部署

```bash
# 设置环境变量
export CLOUDFLARE_API_TOKEN="你的API令牌"
export CLOUDFLARE_ZONE_NAME="downloads.yourdomain.com"

# 运行自动化部署
node deploy-cdn.js
```

### 方法3：交互式配置

```bash
# 运行交互式配置向导
node cloudflare-cdn-setup.js
```

## 🔑 获取API令牌

1. 访问 [CloudFlare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 "Create Token"
3. 选择 "Custom token"
4. 设置权限：
   - **Zone**: Read, Edit
   - **Account**: Read  
   - **R2**: Read, Write
5. 包含所有资源
6. 创建令牌并保存

## 📊 自动化功能

✅ **自动验证API访问**  
✅ **创建R2存储桶**  
✅ **配置CDN缓存规则**  
✅ **上传下载文件**  
✅ **生成优化链接**  
✅ **全球速度测试**  
✅ **生成部署报告**  

## 🎯 配置优化

程序会自动配置：
- **缓存级别**: 激进缓存
- **压缩**: Brotli压缩
- **TTL**: 30天缓存
- **页面规则**: 下载文件优化
- **全球分发**: 自动选择最优节点

## 📈 监控建议

部署完成后：
1. **监控流量使用情况**
2. **设置费用告警**  
3. **定期检查下载速度**
4. **查看访问日志**

## 🛠️ 故障排除

### 常见问题

**Q: API令牌验证失败**
A: 检查令牌权限是否正确，确保包含所有必要权限

**Q: 域名DNS配置失败**  
A: 手动在域名注册商处修改DNS服务器

**Q: 文件上传失败**
A: 检查文件路径和权限，确保R2存储桶已创建

**Q: 速度测试失败**
A: 等待DNS生效，通常需要几分钟到几小时

### 日志文件

部署日志保存在 `logs/` 目录：
```
logs/cdn-deploy-YYYYMMDD-HHMMSS.log
```

## 📚 高级配置

### 自定义域名
```bash
export CLOUDFLARE_ZONE_NAME="cdn.yourdomain.com"
```

### 自定义存储桶
```bash
export CLOUDFLARE_R2_BUCKET="my-downloads"
```

### 批量文件上传
将所有下载文件放入 `downloads/` 目录，程序会自动递归上传

## 🎉 部署完成

部署成功后，你会得到：
- **CDN下载链接** - 全球加速访问
- **速度测试报告** - 验证加速效果  
- **配置文件** - 便于后续维护
- **监控建议** - 最佳实践指南

---

**注意**: 首次部署需要人工设置API令牌和域名，后续可以完全自动化运行。