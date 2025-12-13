# R2存储桶配置完成指南

## 🎯 问题总结
caishen.us.kg 域名已被其他服务使用，无法用于Worker绑定。需要创建新的Worker子域名。

## ✅ 解决方案

### 1️⃣ 创建新的Worker
- **Worker名称**: `goldword-downloads`
- **访问地址**: https://dash.cloudflare.com/workers
- **操作步骤**:
  1. 点击"创建服务"
  2. 选择"创建Worker" 
  3. 输入名称: `goldword-downloads`
  4. 点击"部署"

### 2️⃣ 配置Worker代码
使用以下代码替换默认代码：

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

### 3️⃣ 绑定R2存储桶
在Worker设置中：
- 点击"设置"标签
- 找到"R2存储桶绑定"
- 点击"添加绑定"
- 变量名: `GOLDWORD_DOWNLOADS`
- 存储桶: `goldword-downloads`
- 点击"保存"

### 4️⃣ 获取Worker子域名
部署后，您将获得类似这样的子域名：
`goldword-downloads.{your-account}.workers.dev`

### 5️⃣ 上传文件到R2
访问 https://dash.cloudflare.com/r2：
- 创建存储桶: `goldword-downloads`
- 上传downloads文件夹中的所有文件
- 保持文件夹结构（1.0.2/, 1.0.3/）

### 6️⃣ 更新下载页面
我已经为您创建了新的下载页面文件：
- `app-worker.html` - 使用Worker子域名的版本

需要修改其中的Worker子域名：
```javascript
const WORKER_SUBDOMAIN = '您的实际worker子域名';
```

## 📋 文件清单
需要上传的文件：
```
downloads/1.0.2/
├── goldword-android-1.0.2.apk (18.33 MB)
├── goldword-android-pad-1.0.2.apk (10.1 MB)
├── goldword-android-phone-1.0.2.apk (13.66 MB)
├── goldword-ios-1.0.2.ipa (1.1 MB)
├── goldword-ipad-1.0.2.ipa (1.1 MB)
├── goldword-mac-1.0.2.dmg (12.77 MB)
├── goldword-mac-1.0.2.zip (13.54 MB)
├── goldword-web-1.0.2.zip (407.59 KB)
└── goldword-win-setup-1.0.2.exe (8.8 MB)

downloads/1.0.3/
├── goldword-android-pad-1.0.3.apk (10.1 MB)
├── goldword-android-phone-1.0.3.apk (13.66 MB)
├── goldword-ipad-1.0.3.ipa (1.1 MB)
├── goldword-mac-1.0.3.app.zip (225.96 MB)
├── goldword-mac-1.0.3.dmg (230.29 MB)
├── goldword-mac-1.0.3.zip (225.96 MB)
├── goldword-win-setup-1.0.3.exe (8.8 MB)
└── goldword-win-setup-1.0.3.zip (667.99 MB)
```

## 🧪 测试验证
完成配置后，测试以下链接：
- Worker测试: `{your-worker-subdomain}/1.0.3/goldword-mac-1.0.3.dmg`
- 下载页面: `app-worker.html`（本地测试）或部署后的版本

## 📝 注意事项
1. **域名冲突**: caishen.us.kg已被使用，必须使用Worker子域名
2. **文件大小**: 最大文件667MB，确保R2存储桶有足够空间
3. **缓存设置**: Worker代码已设置1年缓存，提升下载速度
4. **CORS支持**: 已添加跨域支持，方便从不同域名访问

## 🎯 完成后的效果
- ✅ 全球CDN加速下载
- ✅ 支持所有平台版本
- ✅ 自动版本管理
- ✅ 下载统计功能
- ✅ 备用GitHub链接

完成以上步骤后，您的GoldWord下载中心就正式部署完成了！