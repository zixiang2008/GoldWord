// 自动重定向到CDN下载页面
(function() {
    const currentUrl = window.location.href;
    const isDownloadsPage = currentUrl.includes('/downloads.html') || currentUrl.includes('/app/downloads.html');
    const isCdnPage = currentUrl.includes('/app-cdn.html');
    
    // 如果当前页面是原始下载页面且不是CDN页面，则重定向
    if (isDownloadsPage && !isCdnPage) {
        const baseUrl = currentUrl.split('/downloads.html')[0];
        const cdnUrl = baseUrl + '/app-cdn.html';
        console.log('🚀 正在重定向到CDN加速下载页面...');
        window.location.replace(cdnUrl);
    }
})();