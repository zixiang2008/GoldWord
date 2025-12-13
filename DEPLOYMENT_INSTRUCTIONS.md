# 🚀 GoldWord 生产环境部署指南

## 方法1: 使用Netlify CLI
```bash
# 安装Netlify CLI (如果尚未安装)
npm install -g netlify-cli

# 登录Netlify
netlify login

# 部署到生产环境
netlify deploy --prod --dir=. --site=your-site-id
```

## 方法2: Git部署
```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "Deploy GoldWord CDN files to production"

# 推送到远程仓库
git push origin main
```

## 方法3: 手动部署
1. 访问 https://app.netlify.com
2. 选择您的站点
3. 进入"Deploys"页面
4. 点击"Trigger deploy" -> "Deploy site"
5. 或者拖拽文件到部署区域

## 部署后验证
部署完成后，请访问以下URL进行验证:
- https://caishen.us.kg/app-cdn.html
- https://caishen.us.kg/downloads-cdn.html (应重定向)

## 问题排查
如果仍然出现404错误，请检查:
1. 文件是否已成功上传
2. Netlify重定向配置是否正确
3. 域名DNS设置是否正确
4. 查看Netlify部署日志