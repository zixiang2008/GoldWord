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