# 🔧 GoldWord R2部署环境变量配置指南

## 所需环境变量

### 1. CloudFlare账户信息
```bash
export CLOUDFLARE_ACCOUNT_ID="你的CloudFlare账户ID"
export CLOUDFLARE_API_TOKEN="你的CloudFlare API令牌"
```

**获取方式:**
- 登录 CloudFlare 控制台
- 点击右上角头像 → "My Profile"
- 在左侧菜单选择 "API Tokens"
- 创建新的 API Token (需要包含 Account:Read, R2:Edit, Workers Scripts:Edit 权限)
- 账户ID在右侧 "Account ID" 区域可以找到

### 2. R2存储桶访问密钥
```bash
export CLOUDFLARE_R2_ACCESS_KEY_ID="你的R2访问密钥ID"
export CLOUDFLARE_R2_SECRET_ACCESS_KEY="你的R2密钥"
```

**获取方式:**
- 在 CloudFlare 控制台进入 R2 服务
- 点击 "Manage R2 API Tokens"
- 创建新的 API Token (需要包含 R2:Edit 权限)
- 保存生成的 Access Key ID 和 Secret Access Key

### 3. R2端点配置 (可选)
```bash
export CLOUDFLARE_R2_ENDPOINT="https://你的账户ID.r2.cloudflarestorage.com"
```

**注意:** 如果不设置，脚本会自动生成端点地址

## 🚀 快速配置命令

### 临时配置 (当前会话有效)
```bash
# 设置所有必要的环境变量
export CLOUDFLARE_ACCOUNT_ID="替换为你的账户ID"
export CLOUDFLARE_API_TOKEN="替换为你的API令牌"
export CLOUDFLARE_R2_ACCESS_KEY_ID="替换为你的R2访问密钥"
export CLOUDFLARE_R2_SECRET_ACCESS_KEY="替换为你的R2密钥"

# 验证配置
echo "账户ID: $CLOUDFLARE_ACCOUNT_ID"
echo "API令牌已设置: $([ -n "$CLOUDFLARE_API_TOKEN" ] && echo "是" || echo "否")"
echo "R2访问密钥已设置: $([ -n "$CLOUDFLARE_R2_ACCESS_KEY_ID" ] && echo "是" || echo "否")"
```

### 永久配置 (添加到 ~/.bashrc 或 ~/.zshrc)
```bash
# 编辑配置文件
nano ~/.bashrc  # 或 ~/.zshrc

# 添加以下内容
export CLOUDFLARE_ACCOUNT_ID="你的账户ID"
export CLOUDFLARE_API_TOKEN="你的API令牌"
export CLOUDFLARE_R2_ACCESS_KEY_ID="你的R2访问密钥"
export CLOUDFLARE_R2_SECRET_ACCESS_KEY="你的R2密钥"

# 保存并重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

## 📋 验证环境变量

运行以下命令验证环境变量是否正确设置：
```bash
# 检查所有必要的环境变量
node -e "
const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'];
const missing = required.filter(env => !process.env[env]);
if (missing.length > 0) {
  console.log('❌ 缺少环境变量:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ 所有环境变量已正确设置');
}
"
```

## 🎯 完成R2部署

设置好环境变量后，运行以下命令完成部署：
```bash
# 1. 运行一键部署脚本
node complete-r2-deployment.js

# 2. 上传文件到R2存储桶
node upload-to-r2-advanced.js

# 3. 验证部署结果
node verify-cdn-links.js
```

## ⚠️ 安全提醒

1. **保护你的API密钥**: 不要将密钥提交到代码仓库
2. **使用环境变量**: 避免在代码中硬编码密钥
3. **定期轮换**: 建议定期更换API令牌
4. **权限最小化**: 只给予必要的权限
5. **监控使用**: 在CloudFlare控制台监控API使用情况

## 🔍 故障排除

### 问题: "缺少环境变量"
**解决方案**: 确保所有4个必要的环境变量都已正确设置

### 问题: "API令牌无效"
**解决方案**: 
- 检查令牌是否过期
- 确认令牌有足够的权限
- 重新创建新的API令牌

### 问题: "R2访问被拒绝"
**解决方案**:
- 确认R2服务已启用
- 检查访问密钥是否正确
- 确认存储桶名称是否正确

---
生成时间: $(date +"%Y-%m-%d %H:%M:%S")