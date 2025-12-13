# 🔐 API令牌安全最佳实践

## ⚠️ 重要安全提醒

### 🚫 绝对不要做的事情

1. **不要硬编码在代码中**
   ```javascript
   // ❌ 错误做法
   const apiToken = "your_token_here_123456789";
   ```

2. **不要上传到GitHub等代码仓库**
   - 即使删除也能从历史记录中找到
   - 会被搜索引擎索引

3. **不要通过邮件或聊天工具发送**
   - 容易被截获
   - 可能被保存在服务器日志中

4. **不要分享给他人**
   - 每个令牌都代表你的账户权限
   - 他人可能滥用你的资源

### ✅ 正确的做法

#### 1. 使用环境变量
```bash
# Linux/Mac
export CLOUDFLARE_API_TOKEN="your_token_here"

# Windows
set CLOUDFLARE_API_TOKEN=your_token_here

# 在代码中使用
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
```

#### 2. 使用配置文件（添加到.gitignore）
```javascript
// config.js (添加到.gitignore)
module.exports = {
  apiToken: process.env.CLOUDFLARE_API_TOKEN || 'your_token_here'
};
```

#### 3. 使用.env文件
```bash
# .env文件 (添加到.gitignore)
CLOUDFLARE_API_TOKEN=your_token_here
```

```javascript
// 安装 dotenv: npm install dotenv
require('dotenv').config();
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
```

## 🔄 令牌管理策略

### 定期轮换
- **建议周期**: 每6-12个月更换一次
- **更换流程**:
  1. 创建新的令牌
  2. 更新环境变量
  3. 测试新令牌
  4. 删除旧令牌

### 权限最小化
- 只为令牌分配必要的权限
- 不同用途使用不同令牌
- 定期审查令牌权限

### 监控使用
- 定期检查API调用日志
- 设置异常告警
- 关注使用量变化

## 🛡️ 安全存储方案

### 开发环境
```bash
# ~/.bashrc 或 ~/.zshrc
export CLOUDFLARE_API_TOKEN="your_token_here"

# 重新加载配置
source ~/.bashrc
```

### 生产环境
1. **使用密钥管理服务**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager

2. **使用CI/CD环境变量**
   - GitHub Actions Secrets
   - GitLab CI/CD Variables
   - Jenkins Credentials

3. **使用配置管理服务**
   - HashiCorp Vault
   - Kubernetes Secrets

## 🚨 应急处理

### 令牌泄露怎么办？
1. **立即删除令牌**
   - 登录CloudFlare控制台
   - 找到对应的令牌
   - 立即删除

2. **检查账户活动**
   - 查看API调用日志
   - 检查资源使用情况
   - 确认是否有异常操作

3. **创建新令牌**
   - 使用新的安全存储方式
   - 更新所有相关服务
   - 测试新令牌

4. **加强安全措施**
   - 启用双因素认证
   - 定期审查权限
   - 设置监控告警

### 异常活动检测
- **API调用量激增**
- **来自异常IP的请求**
- **非工作时间的调用**
- **权限范围外的操作**

## 📊 监控建议

### 设置告警
```javascript
// 伪代码示例
if (apiCallsPerHour > normalThreshold * 2) {
  sendAlert('API调用量异常');
}

if (unusualIPAddresses.length > 0) {
  sendAlert('检测到异常IP访问');
}
```

### 定期检查
- **每周**: 检查API使用报告
- **每月**: 审查令牌权限
- **每季度**: 轮换令牌
- **每年**: 全面安全审计

## 🔧 工具推荐

### 本地开发
- **direnv**: 自动加载环境变量
- **aws-vault**: 安全存储AWS凭证（可借鉴思路）
- **1Password CLI**: 安全访问密钥

### 生产部署
- **Kubernetes Secrets**: 容器化环境密钥管理
- **Docker Secrets**: Docker Swarm密钥管理
- **Ansible Vault**: 自动化部署密钥管理

## 📚 参考资源

- [CloudFlare API Token Documentation](https://developers.cloudflare.com/api/tokens/)
- [OWASP API Security Guidelines](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

**记住**: API令牌就像你的数字身份证，一旦泄露可能被恶意使用。始终保持警惕，遵循最佳实践！