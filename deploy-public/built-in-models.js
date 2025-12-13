// 打包版共享内置模型列表与标签渲染器（与根目录版本保持一致）
window.BUILT_IN_MODELS_LIST = [
    'https://api.apiyi.com/v1/chat/completions,gpt-4o,OpenAI 最强多模态旗舰，支持图像输入,收费',
    'https://api.apiyi.com/v1/chat/completions,gpt-4o-mini,轻量高效，性价比最高,收费',
    'https://api.apiyi.com/v1/chat/completions,gpt-5-chat-latest,实验性下一代模型（预览）,收费',
    'https://api.apiyi.com/v1/chat/completions,gpt-3.5-turbo,经典对话模型，稳定可靠,收费',
    'https://api.apiyi.com/v1/chat/completions,claude-3.5-sonnet,Anthropic 高智能推理,收费',
    'https://api.apiyi.com/v1/chat/completions,claude-sonnet-4-20250514,Anthropic 未来版本（预发布）,收费',
    'https://api.apiyi.com/v1/chat/completions,claude-opus-4-1-20250805,Anthropic 旗舰 Opus 级,收费',
    'https://api.apiyi.com/v1/chat/completions,gemini-1.5-pro,Google 超长上下文（1M+ tokens）,收费',
    'https://api.apiyi.com/v1/chat/completions,gemini-1.5-flash,Google 极速响应,收费',
    'https://api.apiyi.com/v1/chat/completions,gemini-2.5-pro,Google 下一代 Pro（预览）,收费',
    'https://api.apiyi.com/v1/chat/completions,grok-4-0709,xAI 最强模型，实时世界知识,收费',
    'https://api.apiyi.com/v1/chat/completions,grok-3,xAI 高效推理模型,收费',
    'https://api.apiyi.com/v1/chat/completions,deepseek-r1,国产高性能开源模型,收费',
    'https://api.apiyi.com/v1/chat/completions,deepseek-v3,DeepSeek 最新版本,收费',
    'https://api.apiyi.com/v1/chat/completions,qwen-max-latest,阿里千问最强性能版,收费',
    'https://api.apiyi.com/v1/chat/completions,qwen-plus-latest,阿里千问性能均衡版,收费',
    'https://api.apiyi.com/v1/chat/completions,qwen-turbo-latest,阿里千问极速响应版,收费',
    'https://api.apiyi.com/v1/chat/completions,moonshot-v1-8k,Kimi 8K 上下文,收费',
    'https://api.apiyi.com/v1/chat/completions,moonshot-v1-32k,Kimi 长文本专业版,收费',
];

window.renderModelOptionLabel = function(line) {
    try {
        const [api, model, desc, paid] = String(line || '').split(',');
        const m = (model || '').trim();
        const d = (desc || '').trim();
        const p = (paid || '').trim();
        return `${m} By API易 - ${d}${p ? ` [${p}]` : ''}`;
    } catch (_) {
        return String(line || '');
    }
};

// 统一的预置模型详情帮助文案渲染函数（与根目录版本保持一致）
window.renderModelHelpHtml = function(line) {
    try {
        const [api, model, desc, paid] = String(line || '').split(',');
        const a = (api || '').trim();
        const m = (model || '').trim();
        const d = (desc || '').trim();
        const p = (paid || '').trim();
        const baseUrl = a.replace(/\/?v1\/?chat\/?completions\/?$/i, '').replace(/\/$/, '');
        const endpoint = baseUrl + '/v1/chat/completions';
        const docs = 'https://docs.apiyi.com/api-manual';
        const rateNote = '速率限制因套餐与账户不同，请参考平台文档；批量增强建议并发 3–5、加入重试与指数退避。';
        const curl = [
            'curl -X POST "' + endpoint + '" \\\n+ -H "Content-Type: application/json" \\\n+ -H "Authorization: Bearer sk_..." \\\n+ -d \'' + JSON.stringify({
                model: m || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Hello' }
                ]
            }, null, 2).replace(/\\n/g, '\n') + '\''
        ].join('');
        const fetchSnippet = [
            'fetch("' + endpoint + '", {',
            '  method: "POST",',
            '  headers: {',
            '    "Content-Type": "application/json",',
            '    "Authorization": "Bearer sk_..."',
            '  },',
            '  body: JSON.stringify({',
            '    model: "' + (m || 'gpt-4o-mini') + '",',
            '    messages: [',
            '      { role: "system", content: "You are a helpful assistant." },',
            '      { role: "user", content: "Hello" }',
            '    ]',
            '  })',
            '}).then(r => r.json()).then(console.log).catch(console.error);'
        ].join('\n');
        return [
            'API: <code>' + a + '</code>',
            '模型: <code>' + m + '</code>',
            '说明: ' + d,
            '是否收费: ' + p,
            '基础URL: <code>' + baseUrl + '</code>',
            '端点: <code>' + endpoint + '</code>',
            '文档：<a href="' + docs + '" target="_blank">' + docs + '</a>',
            '<div style="margin-top:6px; font-size:12px; color:#555;">' + rateNote + '</div>',
            '<div style="margin-top:8px;">示例（curl）:</div>',
            '<pre style="white-space:pre-wrap; background:#f7f7f8; padding:8px; border-radius:6px; overflow:auto;"><code>' + curl + '</code></pre>',
            '<div style="margin-top:6px;">示例（fetch）:</div>',
            '<pre style="white-space:pre-wrap; background:#f7f7f8; padding:8px; border-radius:6px; overflow:auto;"><code>' + fetchSnippet + '</code></pre>'
        ].join('<br/>');
    } catch (_) {
        return String(line || '');
    }
};
