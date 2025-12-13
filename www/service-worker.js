// 缓存名称和版本（提升版本以强制客户端清理旧缓存与激活新策略）
const CACHE_NAME = 'goldword-cache-v4';

// 需要缓存的资源列表（不缓存 index.html，避免页面更新被旧缓存拦截）
// 将 /debug.html 纳入预缓存，确保在离线或网络波动时可直接打开调试页
const urlsToCache = [
    '/',
    '/db.js',
    '/app.js',
    '/ui.js',
    '/manifest.json',
    '/debug.html'
];

// 安装Service Worker并缓存资源（强制跳过等待，尽快激活新版）
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                console.log('缓存已打开');
                try {
                    await cache.addAll(urlsToCache);
                } catch (err) {
                    console.error('缓存预加载失败，忽略错误并继续激活', err);
                }
            })
    );
});

// 激活Service Worker并清理旧缓存（立刻接管所有客户端）
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const req = event.request;

  // 对页面导航使用网络优先策略，且在网络失败时优先匹配对应请求（如 /debug.html）
  // 若没有精确缓存，再回退到 /index.html
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then(m => m || caches.match('/index.html')))
    );
    return;
  }

  // 其他静态资源使用缓存优先策略
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // 仅缓存基本类型成功响应
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      });
    }).catch(() => {
      console.log('网络请求失败且缓存中没有匹配项');
    })
  );
});
