(function (global) {
    'use strict';

    const DEFAULT_TIMEOUT_MS = 30000;

    function normalizeBaseUrl(input) {
        let base = String(input || '').trim().replace(/["'`\s]+/g, '').replace(/\/+$/, '');
        if (!base) throw new Error('API 基础地址为空');
        if (/^http:\/\//i.test(base) && !/^http:\/\/(localhost|127(?:\.\d+){3}|10(?:\.\d+){3}|192\.168(?:\.\d+){2})(?::\d+)?(?:\/|$)/i.test(base)) {
            base = base.replace(/^http:\/\//i, 'https://');
        }
        if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
        base = base.replace(/\/chat\/completions$/i, '').replace(/\/+$/, '');
        if (!/\/v1$/i.test(base)) base += '/v1';
        return base;
    }

    function endpoint(input) {
        return normalizeBaseUrl(input) + '/chat/completions';
    }

    function providerList(config) {
        const providers = [{
            name: 'primary',
            baseUrl: config.baseUrl,
            model: config.model,
            apiKey: config.apiKey
        }];
        if (config.fallbackEnabled && config.fallbackBaseUrl && config.fallbackModel) {
            providers.push({
                name: 'fallback',
                baseUrl: config.fallbackBaseUrl,
                model: config.fallbackModel,
                apiKey: config.fallbackApiKey || config.apiKey
            });
        }
        return providers;
    }

    async function chat(config, request, options) {
        const cfg = config || {};
        const timeoutMs = Math.min(120000, Math.max(3000, Number(cfg.timeoutMs) || DEFAULT_TIMEOUT_MS));
        const attempts = providerList(cfg);
        let lastError = null;

        for (const provider of attempts) {
            if (!provider.baseUrl || !provider.model || !provider.apiKey) continue;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(new Error('request timeout')), timeoutMs);
            try {
                const response = await fetch(endpoint(provider.baseUrl), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + provider.apiKey
                    },
                    body: JSON.stringify({ ...request, model: provider.model }),
                    signal: controller.signal
                });
                const raw = await response.text();
                if (!response.ok) {
                    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
                    const error = new Error(`HTTP ${response.status} ${response.statusText}: ${raw.slice(0, 300)}`);
                    error.retryable = retryable;
                    throw error;
                }
                let data;
                try { data = JSON.parse(raw); } catch (_) { throw new Error('API 返回的不是有效 JSON'); }
                if (options && options.rawResponse) return { data, provider: provider.name };
                return {
                    data,
                    provider: provider.name,
                    content: data?.choices?.[0]?.message?.content || ''
                };
            } catch (error) {
                lastError = error?.name === 'AbortError' ? new Error(`请求超时（${timeoutMs}ms）`) : error;
                if (provider.name === 'primary' && attempts.length > 1) continue;
            } finally {
                clearTimeout(timer);
            }
        }
        throw lastError || new Error('没有可用的 API 提供商；请填写地址、模型和本机 API Key');
    }

    global.GoldWordAPI = { chat, endpoint, normalizeBaseUrl, DEFAULT_TIMEOUT_MS };
})(window);
