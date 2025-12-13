# CloudFlare API 令牌获取详细步骤

## 📋 步骤概览

### 1. 登录CloudFlare账户
- 访问 https://dash.cloudflare.com/login
- 输入邮箱和密码登录

### 2. 进入API令牌页面
- 点击右上角头像 → "My Profile"
- 点击 "API Tokens" 标签页
- 点击 "Create Token" 按钮

### 3. 选择令牌模板
- 选择 "Custom token" (自定义令牌)
- 不要使用预设模板，需要精确权限控制

### 4. 配置权限 (重要)

#### 区域权限 (Zone)
```
Zone:Read      - 读取区域信息
Zone:Edit      - 编辑区域设置
```

#### 账户权限 (Account)  
```
Account:Read   - 读取账户信息
```

#### R2存储权限 (R2)
```
R2:Read        - 读取R2存储
R2:Write       - 写入R2存储
```

### 5. 资源范围设置
- **Zone Resources**: 选择 "Include All zones" (包含所有区域)
- **Account Resources**: 选择 "Include All accounts" (包含所有账户)
- **R2 Resources**: 选择 "Include All buckets" (包含所有存储桶)

### 6. 其他设置
- **TTL**: 可以设置为1年或永不过期
- **IP Address Filtering**: 可以留空
- **Account Role**: 保持默认

### 7. 创建令牌
- 点击 "Continue to summary"
- 确认权限配置正确
- 点击 "Create Token"

### 8. 保存令牌
⚠️ **重要**: 令牌只会显示一次，请立即复制保存！

## 🔑 令牌格式示例
```
your_api_token_here_32_characters_long
```

## 🛡️ 安全建议

1. **立即保存**: 创建后立即复制到安全的地方
2. **环境变量**: 使用环境变量存储，不要硬编码在代码中
3. **定期轮换**: 建议每6-12个月更换一次令牌
4. **最小权限**: 只授予必要的权限
5. **监控使用**: 定期检查API调用日志

## ⚠️ 常见问题

### Q: 令牌创建失败
A: 检查是否有足够的账户权限，可能需要主账户授权

### Q: 显示 "Access denied"
A: 权限配置不正确，重新创建令牌并检查权限设置

### Q: 令牌过期了
A: 重新创建新的令牌，更新到环境变量中

### Q: 可以创建多个令牌吗？
A: 可以，建议为不同用途创建不同的令牌

## 🧪 测试令牌

创建完成后，可以使用以下命令测试：

```bash
# 设置环境变量
export CLOUDFLARE_API_TOKEN="your_token_here"

# 运行测试
node -e "
const https = require('https');
const options = {
  hostname: 'api.cloudflare.com',
  path: '/client/v4/user/tokens/verify',
  headers: { 'Authorization': 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN }
};
https.get(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log(result.success ? '✅ 令牌有效' : '❌ 令牌无效');
  });
});
"
```

## 📚 下一步

获取API令牌后，你可以：
1. 运行自动化部署脚本
2. 配置CDN加速
3. 上传下载文件
4. 测试全球访问速度

记住：API令牌是连接你的程序和CloudFlare服务的钥匙，请妥善保管！