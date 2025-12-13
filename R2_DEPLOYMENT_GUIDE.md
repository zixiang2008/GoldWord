# R2存储桶部署指南

## 🎯 目标
完成CloudFlare R2存储桶的手动配置，将GoldWord下载文件上传到CDN。

## 📋 前提条件
- ✅ CloudFlare账户已配置
- ✅ CDN域名已设置 (caishen.us.kg)
- ✅ API令牌已验证
- ✅ 文件已准备好上传

## 🚀 步骤1: 创建R2存储桶

1. 登录 [CloudFlare Dashboard](https://dash.cloudflare.com)
2. 点击左侧菜单中的 **"R2"**
3. 点击 **"创建存储桶"** 按钮
4. 输入存储桶名称: `goldword-downloads`
5. 选择地区: **自动 (推荐)**
6. 点击 **"创建存储桶"**

## 📁 步骤2: 上传文件

### 需要上传的文件列表:
```
1.0.2/
├── goldword-mac-1.0.2.dmg (12.77 MB)
├── goldword-mac-1.0.2.zip (13.54 MB)
└── goldword-web-1.0.2.zip (407.59 KB)

1.0.3/
├── goldword-mac-1.0.3.app.zip (225.96 MB)
├── goldword-mac-1.0.3.dmg (230.29 MB)
├── goldword-mac-1.0.3.zip (225.96 MB)
└── goldword-win-setup-1.0.3.zip (667.99 MB)
```

### 上传方法:

#### 方法1: Web界面上传
1. 进入刚创建的 `goldword-downloads` 存储桶
2. 点击 **"上传文件"** 按钮
3. 选择文件并上传
4. 重复此过程上传所有文件

#### 方法2: 使用R2命令行工具 (推荐)
```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录CloudFlare
wrangler login

# 创建wrangler.toml配置文件
cat > wrangler.toml << EOF
name = "goldword-r2"
main = "index.js"
compatibility_date = "2023-12-01"

[[r2_buckets]]
binding = "GOLDWORD_DOWNLOADS"
bucket_name = "goldword-downloads"
EOF

# 上传整个目录
wrangler r2 object put goldword-downloads/1.0.2/goldword-mac-1.0.2.dmg --file ./downloads/1.0.2/goldword-mac-1.0.2.dmg
wrangler r2 object put goldword-downloads/1.0.2/goldword-mac-1.0.2.zip --file ./downloads/1.0.2/goldword-mac-1.0.2.zip
wrangler r2 object put goldword-downloads/1.0.2/goldword-web-1.0.2.zip --file ./downloads/1.0.2/goldword-web-1.0.2.zip

wrangler r2 object put goldword-downloads/1.0.3/goldword-mac-1.0.3.app.zip --file ./downloads/1.0.3/goldword-mac-1.0.3.app.zip
wrangler r2 object put goldword-downloads/1.0.3/goldword-mac-1.0.3.dmg --file ./downloads/1.0.3/goldword-mac-1.0.3.dmg
wrangler r2 object put goldword-downloads/1.0.3/goldword-mac-1.0.3.zip --file ./downloads/1.0.3/goldword-mac-1.0.3.zip
wrangler r2 object put goldword-downloads/1.0.3/goldword-win-setup-1.0.3.zip --file ./downloads/1.0.3/goldword-win-setup-1.0.3.zip
```

## 🔗 步骤3: 设置公共访问

### 创建R2 Worker
1. 在CloudFlare Dashboard中，点击 **"Workers & Pages"**
2. 点击 **"创建服务"**
3. 选择 **"创建Worker"**
4. 命名为 `goldword-r2-worker`
5. 点击 **"部署"**

### 配置Worker代码
替换Worker的默认代码为以下内容:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 移除开头的斜杠
    const key = path.startsWith('/') ? path.slice(1) : path;
    
    try {
      // 从R2获取对象
      const object = await env.GOLDWORD_DOWNLOADS.get(key);
      
      if (!object) {
        return new Response('File not found', { status: 404 });
      }
      
      // 设置响应头
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      
      // 根据文件类型设置Content-Type
      if (key.endsWith('.apk')) {
        headers.set('Content-Type', 'application/vnd.android.package-archive');
      } else if (key.endsWith('.ipa')) {
        headers.set('Content-Type', 'application/octet-stream');
      } else if (key.endsWith('.dmg')) {
        headers.set('Content-Type', 'application/x-apple-diskimage');
      } else if (key.endsWith('.zip')) {
        headers.set('Content-Type', 'application/zip');
      } else if (key.endsWith('.exe')) {
        headers.set('Content-Type', 'application/x-msdownload');
      }
      
      // 设置缓存头
      headers.set('Cache-Control', 'public, max-age=31536000'); // 1年缓存
      headers.set('Access-Control-Allow-Origin', '*');
      
      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
```

### 绑定R2存储桶
1. 在Worker设置页面，点击 **"设置"** 标签
2. 点击 **"变量"** 部分
3. 在 **"R2存储桶绑定"** 部分，点击 **"添加绑定"**
4. 设置:
   - 变量名: `GOLDWORD_DOWNLOADS`
   - R2存储桶: 选择 `goldword-downloads`
5. 点击 **"保存"**

## 🌐 步骤4: 配置自定义域

### 添加路由
1. 在Worker页面，点击 **"触发器"** 标签
2. 点击 **"添加域"** 或 **"添加路由"**
3. 添加以下路由:
   ```
   caishen.us.kg/1.0.2/*
   caishen.us.kg/1.0.3/*
   ```
4. 选择Worker: `goldword-r2-worker`
5. 点击 **"添加路由"**

## 🧪 步骤5: 测试部署

### 测试文件访问
```bash
# 测试1.0.3版本的Android平板APK
curl -I https://caishen.us.kg/1.0.3/goldword-android-pad-1.0.3.apk

# 测试1.0.3版本的macOS应用包
curl -I https://caishen.us.kg/1.0.3/goldword-mac-1.0.3.app.zip

# 测试1.0.2版本的Web包
curl -I https://caishen.us.kg/1.0.2/goldword-web-1.0.2.zip
```

### 预期响应
```
HTTP/2 200 
content-type: application/vnd.android.package-archive
content-length: 10586580
cache-control: public, max-age=31536000
etag: "xxxxxxxxxx"
```

## 🎯 步骤6: 验证完整功能

### 运行验证脚本
```bash
node verify-cdn-links.js
```

### 测试下载页面
访问: https://caishen.us.kg/app-cdn.html

## ⚠️ 常见问题解决

### 1. 404错误
- 检查文件是否已上传到正确的路径
- 验证Worker路由配置是否正确
- 确认R2存储桶绑定是否正确

### 2. 权限错误
- 确保R2存储桶设置为公开访问
- 检查Worker是否有访问R2的权限

### 3. 缓存问题
- 清除CloudFlare缓存
- 等待DNS传播（最多24小时）

## 📊 性能优化建议

1. **启用智能压缩**: 在CloudFlare设置中启用Brotli压缩
2. **设置缓存规则**: 为不同类型文件设置合适的缓存时间
3. **监控使用情况**: 使用CloudFlare Analytics监控下载量
4. **设置告警**: 配置异常流量告警

## 🎉 完成验证

部署完成后，运行以下命令验证所有功能:
```bash
# 验证所有链接
node verify-cdn-links.js

# 检查部署状态
node check-completion.js
```

所有测试通过后，您的CDN下载系统就完全部署完成了！